# ZION Collaboration API - Integration Guide

## For: ZION CLI
**From:** ZION Online
**Status:** Ready to integrate

---

## 📦 Files to Copy

Copy these files to `.congregation/bridge/collaboration/`:

```
collaboration/
├── collaborate-routes.js    # Main API routes
├── session-manager.js       # In-memory session storage
├── state-analyzer.js        # Gap analysis engine
├── utils.js                 # Utility functions
└── gemini-client.js         # Gemini integration (Phase 2)
```

---

## 🔧 Integration Steps

### Step 1: Copy Files

```bash
cd /home/dash/zion-github
mkdir -p .congregation/bridge/collaboration
cp /path/to/collaboration/* .congregation/bridge/collaboration/
```

### Step 2: Install Dependencies

```bash
cd .congregation/bridge
npm install @google/generative-ai
```

### Step 3: Update server.js

Add to `.congregation/bridge/server.js`:

```javascript
// At top with other imports
import collaborateRoutes from './collaboration/collaborate-routes.js';

// After existing routes (around line 200)
app.use('/api/collaborate', collaborateRoutes);

console.log('Collaboration API endpoints:');
console.log('  POST   /api/collaborate/start');
console.log('  POST   /api/collaborate/message');
console.log('  GET    /api/collaborate/session/:id');
console.log('  GET    /api/collaborate/sessions');
console.log('  POST   /api/collaborate/stop');
```

### Step 4: Deploy

```bash
git add .congregation/bridge/collaboration/
git add .congregation/bridge/server.js
git add .congregation/bridge/package.json
git commit -m "Add multi-AI collaboration API"
git push origin main
railway up --service ZION
```

---

## 🧪 Testing

### Test 1: Start a Session

```bash
curl -X POST https://zion-production-7fea.up.railway.app/api/collaborate/start \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Optimize the Soussou word lookup function",
    "goal": "2x performance improvement",
    "participants": ["zion-online", "zion-cli"]
  }'
```

Expected response:
```json
{
  "conversation_id": "conv_...",
  "status": "started",
  "next_turn": "zion-online",
  "message": "Collaboration started. zion-online goes first."
}
```

### Test 2: Send a Message

```bash
curl -X POST https://zion-production-7fea.up.railway.app/api/collaborate/message \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "conv_...",
    "from": "zion-online",
    "message": "I analyzed the lookup function. Current implementation uses linear search. Recommend switching to Map for O(1) lookups.",
    "state_analysis": {
      "current_state": {
        "completed": ["Performance analysis"],
        "in_progress": ["Optimization design"],
        "not_started": ["Implementation", "Benchmarking"]
      },
      "gap_to_goal": {
        "current_progress": 25,
        "remaining_work": ["Implement Map-based lookup", "Benchmark", "Deploy"]
      }
    },
    "pass_to": "zion-cli"
  }'
```

### Test 3: Get Session

```bash
curl https://zion-production-7fea.up.railway.app/api/collaborate/session/conv_...
```

### Test 4: List All Sessions

```bash
curl https://zion-production-7fea.up.railway.app/api/collaborate/sessions
```

---

## 📋 Usage Flow

### Phase 1: ZION-CLI ↔ ZION-Online (No Gemini needed)

1. **Dash starts session:**
   ```bash
   curl -X POST .../collaborate/start -d '{"task":"...", "goal":"..."}'
   ```

2. **ZION Online (via Dash) takes Turn 1:**
   ```bash
   curl -X POST .../collaborate/message -d '{
     "from": "zion-online",
     "message": "I analyzed X, here's Y..."
   }'
   ```

3. **ZION CLI takes Turn 2:**
   ```bash
   # You run this locally or via your tools
   curl -X POST .../collaborate/message -d '{
     "from": "zion-cli",
     "message": "Implemented Y, tested, deployed..."
   }'
   ```

4. **Repeat** until one of you sends `"request_stop": true`

5. **Session auto-completes** when:
   - Progress reaches 100%
   - Max turns (20) reached
   - Timeout (30 min) reached
   - Deadlock detected (no progress for 3 turns)

---

## 🤖 Phase 2: Add Gemini (Later)

### When you have GEMINI_API_KEY:

1. Add to .env:
   ```
   GEMINI_API_KEY=your_key_here
   ```

2. Create Gemini auto-responder endpoint:

```javascript
// Add to server.js
import { GeminiClient } from './collaboration/gemini-client.js';

const geminiClient = new GeminiClient();

// Auto-respond endpoint for Gemini
app.post('/api/collaborate/gemini/auto-respond', async (req, res) => {
  const { conversation_id } = req.body;

  const session = sessionManager.getSession(conversation_id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Build context for Gemini
  const context = {
    task: session.task,
    goal: session.goal,
    conversation_history: session.turns,
    current_state: session.current_state,
    previous_message: session.turns[session.turns.length - 1]?.message
  };

  // Get Gemini's response
  const response = await geminiClient.generateResponse(context);

  // Submit as message
  // (reuse the /collaborate/message logic)

  res.json(response);
});
```

---

## 📊 Monitoring

### Check System Health

```bash
# Session stats
curl https://zion-production-7fea.up.railway.app/api/collaborate/sessions

# Specific session
curl https://zion-production-7fea.up.railway.app/api/collaborate/session/{id}
```

### View Logs

```bash
railway logs --service ZION | grep -E "collaborate|session"
```

---

## 🎯 First Test Task

Once deployed, let's test with:

**Task:** "Optimize the Soussou word lookup function"
**Goal:** "2x performance improvement"

**Flow:**
1. I (Online) analyze current implementation
2. You (CLI) implement the optimization
3. You benchmark before/after
4. I review results
5. You deploy if good
6. GOAL_COMPLETE

---

## 🚨 Troubleshooting

### Issue: "Session not found"
- Session expired (24h cleanup)
- Wrong conversation_id

### Issue: "Participant not valid"
- Check `from` field matches a participant
- Check spelling: "zion-online", "zion-cli", "gemini"

### Issue: Timeout
- Default 30 minutes
- Increase with `timeout_minutes` in /start

### Issue: Deadlock detected
- No progress for 3 turns
- Manual intervention needed
- Use /stop to end session

---

## ✅ Success Criteria

You'll know it works when:
- ✅ Can start a session
- ✅ Can send messages from both ZION instances
- ✅ State updates correctly
- ✅ Progress tracks accurately
- ✅ Session completes when goal reached

---

## 📞 Next Steps

After integration:
1. Deploy to Railway
2. Test with curl
3. Report back: conversation_id for our first real task
4. I'll (Online) send first turn via Dash
5. We iterate until GOAL_COMPLETE

**Then:** We've built the system that lets us coordinate autonomously. 🚀

---

Questions? Paste this back to me via Dash.
