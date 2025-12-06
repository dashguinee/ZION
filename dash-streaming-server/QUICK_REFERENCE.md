# DASH WebTV Backend - Quick Reference

## Health Checks

```bash
# Basic health
curl http://localhost:3001/api/health

# Detailed diagnostics
curl http://localhost:3001/api/health/detailed

# Kubernetes probes
curl http://localhost:3001/api/health/ready
curl http://localhost:3001/api/health/live
```

## Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Streaming (`/api/stream`, `/api/live`) | 10 requests | 1 minute |
| Admin (`/api/admin`) | 30 requests | 15 minutes |
| General API | 100 requests | 15 minutes |
| Health checks | Unlimited | - |

## Timeouts

| Endpoint | Timeout |
|----------|---------|
| `/api/health` | 5 seconds |
| `/api/stream` | 30 seconds |
| `/api/live` | 60 seconds |
| `/api/admin` | 10 seconds |
| Other APIs | 10 seconds |

## File Locking

```javascript
import { withFileLock } from './src/utils/file-lock.js';

// Wrap any file operation
await withFileLock('/path/to/file.json', async () => {
  // Your read/write operations here
  const data = JSON.parse(fs.readFileSync(file));
  data.modified = true;
  fs.writeFileSync(file, JSON.stringify(data));
});
```

## Sessions

```javascript
import sessionService from './src/services/session.service.js';

// Create session
const sessionId = sessionService.create('username', { ip: req.ip });

// Validate session
const session = sessionService.validate(sessionId);
if (!session) {
  return res.status(401).json({ error: 'Invalid session' });
}

// Refresh session
sessionService.refresh(sessionId);

// Destroy session
sessionService.destroy(sessionId);

// Get stats
const stats = sessionService.getStats();
// { total: 50, active: 45, expired: 5, uniqueUsers: 30 }
```

## CORS Origins

**Development**:
- http://localhost:3000
- http://localhost:5173
- http://localhost:5174

**Production**:
- https://dash-webtv.vercel.app
- https://dash-webtv-admin.vercel.app
- Custom: Set `FRONTEND_URL` env var

## Environment Variables

```bash
# .env
ADMIN_API_KEY=your-secure-key-here
NODE_ENV=production
FRONTEND_URL=https://custom-domain.com
LOG_LEVEL=info
```

## Startup

```bash
# Development
npm run dev

# Production
npm start

# Check logs
tail -f logs/app.log
```

## Monitoring

```javascript
// Get file lock stats
import { getLockStats } from './src/utils/file-lock.js';
console.log(getLockStats());

// Get session stats
import sessionService from './src/services/session.service.js';
console.log(sessionService.getStats());
```

## Testing

```bash
# Test rate limiting (should get 429 after limit)
for i in {1..15}; do curl http://localhost:3001/api/stream/vod/123 & done

# Test health endpoint
curl http://localhost:3001/api/health | jq .

# Test timeout (should timeout after 10s)
curl --max-time 15 http://localhost:3001/api/admin/stats

# Test CORS
curl -H "Origin: https://evil.com" http://localhost:3001/api/health
```

## Common Issues

### Rate Limited (429)
Wait for rate limit window to expire, or increase limits in `src/index.js`

### Request Timeout (408)
Increase timeout in `src/index.js` or optimize endpoint performance

### CORS Error
Add origin to `corsOptions.origin` array in `src/index.js`

### Session Lost
Check `data/sessions.json` exists and is writable

### File Lock Deadlock
Check `getLockStats()` - if locks > 10, investigate hung operations
