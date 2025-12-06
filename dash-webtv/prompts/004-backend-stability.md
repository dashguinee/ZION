# Meta-Prompt: Backend Stability and API Completeness for DASH WebTV

## Context
You are fixing backend stability issues and completing missing API functionality for DASH WebTV. The audit found empty endpoints, race conditions, and missing features.

## Project Location
- Backend: `/home/dash/zion-github/dash-streaming-server/`
- Entry: `src/index.js`
- Routes: `src/routes/*.js`
- Services: `src/services/*.js`

## Tasks

### 1. Fix Empty Admin Endpoint (CRITICAL)
**File**: `/home/dash/zion-github/dash-streaming-server/src/routes/admin.js` lines 253-256
**Issue**: `/api/admin/access/:username` returns undefined
**Fix**: Implement the endpoint properly
```javascript
router.get('/access/:username', requireAdmin, async (req, res) => {
  try {
    const { username } = req.params;
    const user = await userService.getByUsername(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const accessInfo = {
      username: user.username,
      tier: user.tier,
      package: user.package,
      walletBalance: user.walletBalance,
      status: user.status,
      canStream: user.status === 'active' && user.walletBalance > 0,
      categories: user.package?.categories || []
    };
    res.json(accessInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Fix JSON File Race Conditions (HIGH)
**Files**: All services that read/write JSON files
**Issue**: Concurrent requests can corrupt data files
**Fix**: Implement file locking
```javascript
// Create src/utils/file-lock.js
const locks = new Map();

async function withFileLock(filePath, operation) {
  while (locks.get(filePath)) {
    await new Promise(r => setTimeout(r, 10));
  }
  locks.set(filePath, true);
  try {
    return await operation();
  } finally {
    locks.delete(filePath);
  }
}

// Usage in services:
async function saveUser(user) {
  return withFileLock('users.json', async () => {
    const users = await readUsers();
    users[user.id] = user;
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    return user;
  });
}
```

### 3. Implement Session Persistence (HIGH)
**Issue**: In-memory session store loses all sessions on restart
**Fix**:
```javascript
// src/services/session.service.js
const SESSION_FILE = path.join(__dirname, '../../data/sessions.json');

class SessionService {
  constructor() {
    this.sessions = this.loadSessions();
    // Auto-save every minute
    setInterval(() => this.saveSessions(), 60000);
    // Clean expired sessions every hour
    setInterval(() => this.cleanExpired(), 3600000);
  }

  loadSessions() {
    try {
      return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    } catch {
      return {};
    }
  }

  saveSessions() {
    fs.writeFileSync(SESSION_FILE, JSON.stringify(this.sessions, null, 2));
  }

  create(userId) {
    const sessionId = crypto.randomUUID();
    this.sessions[sessionId] = {
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    this.saveSessions();
    return sessionId;
  }

  validate(sessionId) {
    const session = this.sessions[sessionId];
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      delete this.sessions[sessionId];
      return null;
    }
    return session;
  }

  cleanExpired() {
    const now = Date.now();
    for (const [id, session] of Object.entries(this.sessions)) {
      if (now > session.expiresAt) {
        delete this.sessions[id];
      }
    }
    this.saveSessions();
  }
}
```

### 4. Enforce Rate Limiting (HIGH)
**Issue**: Rate limiting configured but not enforced
**Fix**: Apply rate limiter middleware to all routes
```javascript
// src/middleware/rate-limit.js
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const streamLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 stream requests per minute
  message: { error: 'Stream rate limit exceeded' }
});

// In index.js:
app.use('/api/', apiLimiter);
app.use('/api/stream', streamLimiter);
app.use('/api/live', streamLimiter);
```

### 5. Add Request Timeouts (HIGH)
**Issue**: No timeouts on streaming endpoints - requests can hang forever
**Fix**:
```javascript
// src/middleware/timeout.js
const timeout = require('connect-timeout');

function haltOnTimedout(req, res, next) {
  if (!req.timedout) next();
}

// In index.js:
app.use('/api/stream', timeout('30s'), haltOnTimedout);
app.use('/api/live', timeout('60s'), haltOnTimedout);
app.use('/api/', timeout('10s'), haltOnTimedout);
```

### 6. Reduce Cache TTL (MEDIUM)
**Issue**: 30-day cache TTL is excessive for content that changes
**Fix**: Implement tiered caching
```javascript
const CACHE_TTL = {
  content_list: 6 * 60 * 60 * 1000,    // 6 hours for content lists
  stream_url: 5 * 60 * 1000,            // 5 minutes for stream URLs
  user_data: 60 * 1000,                 // 1 minute for user data
  health_status: 15 * 60 * 1000         // 15 minutes for health
};
```

### 7. Tighten CORS Configuration (MEDIUM)
**Issue**: CORS wildcard everywhere
**Fix**:
```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://dash-webtv.vercel.app', 'https://your-domain.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
  credentials: true
};

app.use(cors(corsOptions));
```

### 8. Create Health Check Endpoint (NEW)
**Add**: `/api/health` endpoint for monitoring
```javascript
router.get('/', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {
      database: await checkDataFiles(),
      starshare: await checkStarshareConnection(),
      ffmpeg: await checkFfmpeg()
    }
  };

  const allHealthy = Object.values(health.checks).every(c => c.status === 'ok');
  res.status(allHealthy ? 200 : 503).json(health);
});

async function checkDataFiles() {
  try {
    await fs.access(path.join(__dirname, '../../data/users.json'));
    return { status: 'ok' };
  } catch {
    return { status: 'error', message: 'Data files not accessible' };
  }
}
```

### 9. Add API Documentation Endpoint (MEDIUM)
**Add**: OpenAPI/Swagger documentation
```javascript
// For now, create simple JSON documentation
router.get('/docs', (req, res) => {
  res.json({
    name: 'DASH WebTV API',
    version: '1.0.0',
    endpoints: [
      { method: 'GET', path: '/api/health', description: 'Health check' },
      { method: 'POST', path: '/api/packages/create', description: 'Create user package' },
      { method: 'GET', path: '/api/wallet/:userId', description: 'Get wallet balance' },
      // ... document all endpoints
    ]
  });
});
```

## Implementation Order
1. Fix empty admin endpoint (quick fix)
2. Add file locking utility
3. Implement session persistence
4. Apply rate limiting
5. Add timeouts
6. Tighten CORS
7. Create health endpoint
8. Adjust cache TTLs
9. Add API docs

## Files to Create
- `src/utils/file-lock.js` - File locking utility
- `src/services/session.service.js` - Persistent sessions
- `src/middleware/timeout.js` - Request timeouts
- `data/sessions.json` - Session storage

## Success Criteria
- [ ] All endpoints return proper responses (no undefined)
- [ ] Concurrent file writes don't corrupt data
- [ ] Sessions survive server restart
- [ ] Rate limiting active (test with rapid requests)
- [ ] Hung requests timeout after configured duration
- [ ] Health endpoint reports accurate status
- [ ] CORS only allows expected origins in production

## Testing Commands
```bash
# Test rate limiting
for i in {1..20}; do curl -s http://localhost:3001/api/health & done

# Test session persistence
# 1. Login, get session
# 2. Restart server
# 3. Verify session still valid

# Test file locking
# 1. Send 10 concurrent package creation requests
# 2. Verify data file not corrupted

# Test timeout
curl --max-time 5 http://localhost:3001/api/stream/slow-endpoint
```

## DO NOT
- Do not add a database (keep JSON files for now)
- Do not change API response formats
- Do not modify frontend code
- Do not add new dependencies without checking existing ones first

## Output
When complete, provide:
1. List of files created/modified
2. New middleware applied to which routes
3. Test results for each fix
4. Any remaining stability concerns
