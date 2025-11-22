# CAGI SYSTEM REFERENCE
**Last Updated:** 2025-11-22
**Status:** ACTIVE - Deployed and Operational

## 🧠 WHAT IS CAGI?

**CAGI** = Collective Artificial General Intelligence

A multi-AI collaboration system enabling:
- **ZION-Online** (web Claude) ↔ **ZION-CLI** (local Claude) ↔ **Gemini** communication
- Real-time message exchange via API
- Session state tracking with gap analysis
- Autonomous goal-driven collaboration

---

## 🚀 DEPLOYED INFRASTRUCTURE

### **Production URL:**
```
https://zion-production-7fea.up.railway.app
```

### **Code Location:**
```
/home/dash/zion-github/.congregation/bridge/
├── server.js (main server with CAGI routes)
├── collaboration/
│   ├── collaborate-routes.js (API endpoints)
│   ├── session-manager.js (in-memory state)
│   ├── state-analyzer.js (progress tracking)
│   ├── gemini-client.js (Gemini integration)
│   └── soussou-client.js (Soussou AI integration)
```

### **Git Location:**
```
/home/dash/zion-github/collaboration/ (source files)
```

---

## 📡 CAGI API ENDPOINTS

### **1. Start Collaboration Session**
```bash
POST https://zion-production-7fea.up.railway.app/api/collaborate/start

Body:
{
  "task": "Description of what to accomplish",
  "goal": "Success criteria",
  "participants": ["zion-online", "zion-cli", "gemini"]
}

Returns:
{
  "conversation_id": "conv_...",
  "status": "started",
  "next_turn": "zion-online"
}
```

### **2. Send Message**
```bash
POST https://zion-production-7fea.up.railway.app/api/collaborate/message

Body:
{
  "conversation_id": "conv_...",
  "from": "zion-cli",
  "message": "Your message here",
  "data": {
    "files": [...],
    "code": "...",
    "results": {...}
  },
  "state_analysis": {
    "current_state": {
      "completed": ["Task 1"],
      "in_progress": ["Task 2"],
      "not_started": ["Task 3"]
    },
    "gap_to_goal": {
      "current_progress": 50,
      "remaining_work": ["..."]
    }
  },
  "pass_to": "zion-online"
}
```

### **3. Get Session State**
```bash
GET https://zion-production-7fea.up.railway.app/api/collaborate/session/{conversation_id}

Returns:
{
  "conversation_id": "conv_...",
  "task": "...",
  "goal": "...",
  "turns": [...],
  "current_state": {...},
  "status": "in_progress"
}
```

### **4. List All Sessions**
```bash
GET https://zion-production-7fea.up.railway.app/api/collaborate/sessions

Returns: Array of all active sessions
```

### **5. Stop Session**
```bash
POST https://zion-production-7fea.up.railway.app/api/collaborate/stop

Body:
{
  "conversation_id": "conv_...",
  "reason": "Goal completed"
}
```

---

## 🎯 HOW TO USE CAGI (Trinity Pattern)

### **Pattern 1: ZION-Online → ZION-CLI Handoff**

**Use case:** ZION-Online has files/data that ZION-CLI needs to commit

**Steps:**

1. **ZION-Online starts session:**
```bash
curl -X POST https://zion-production-7fea.up.railway.app/api/collaborate/start \
  -H "Content-Type: application/json" \
  -d '{"task": "Transfer docs", "goal": "Committed to GitHub", "participants": ["zion-online", "zion-cli"]}'
```

2. **ZION-Online sends data:**
```bash
curl -X POST https://zion-production-7fea.up.railway.app/api/collaborate/message \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "conv_...",
    "from": "zion-online",
    "message": "Sending 6 documentation files",
    "data": {
      "files": [
        {"path": "docs/FILE.md", "content": "..."}
      ]
    },
    "pass_to": "zion-cli"
  }'
```

3. **ZION-CLI retrieves and processes:**
```bash
curl https://zion-production-7fea.up.railway.app/api/collaborate/session/conv_...
# Extract files from session.turns[last].data.files
# Create files locally
# git add, commit, push
```

4. **ZION-CLI confirms completion:**
```bash
curl -X POST https://zion-production-7fea.up.railway.app/api/collaborate/message \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "conv_...",
    "from": "zion-cli",
    "message": "All files committed to GitHub",
    "state_analysis": {"current_progress": 100},
    "request_stop": true
  }'
```

---

### **Pattern 2: Three-Way Collaboration (ZION + Gemini)**

**Use case:** Complex task requiring multiple AI perspectives

**Example:**
1. ZION-Online analyzes problem
2. Gemini proposes solution
3. ZION-CLI implements
4. Repeat until goal complete

---

## 🏗️ CURRENT STATE (2025-11-22)

### **✅ What's Built:**
- ✅ Multi-AI collaboration API (deployed on Railway)
- ✅ Session management with state tracking
- ✅ Gemini integration (API client ready)
- ✅ Soussou AI integration
- ✅ Progress tracking and gap analysis
- ✅ Auto-completion when goal reached

### **✅ What's Tested:**
- ✅ Session creation/retrieval
- ✅ Message passing between AIs
- ✅ State analysis
- ✅ Session lifecycle management

### **🎯 Current Session Achievements:**
1. **CAGI Moment:** Autonomous pattern discovery for Soussou language
2. **Pattern Discovered:** `{POSSESSIVE} {NOUN} {INTENSIFIER} {ADJECTIVE}`
3. **Linguistic Discoveries:** 7 Soussou grammar patterns documented
4. **Commits Pushed:** 2 commits with all discoveries to GitHub

---

## 📚 RELATED DOCUMENTATION

- **Integration Guide:** `/home/dash/zion-github/collaboration/INTEGRATION.md`
- **Usage Examples:** `/home/dash/zion-github/collaboration/EXAMPLE.md`
- **Linguistic Discoveries:** `/home/dash/zion-github/soussou-engine/LINGUISTIC_DISCOVERIES.md`

---

## 🔑 AUTHENTICATION

**Required headers:**
```
Authorization: Bearer {ZION_SERVICE_TOKEN}
```

**Tokens stored in:**
- `.env` file in `.congregation/bridge/`
- Environment variables on Railway

---

## 🚨 CRITICAL NOTES FOR FUTURE SESSIONS

1. **CAGI IS REAL AND DEPLOYED** - Don't assume it's conceptual
2. **Use the API for inter-AI communication** - Don't reinvent message passing
3. **GitHub is the shared repo** - Both ZION instances can commit there
4. **Session IDs persist for 24 hours** - Check existing sessions before creating new
5. **All CAGI code in `.congregation/bridge/`** - Don't look elsewhere

---

## 📊 MONITORING

**Check if CAGI server is running:**
```bash
curl https://zion-production-7fea.up.railway.app/health
```

**List active sessions:**
```bash
curl https://zion-production-7fea.up.railway.app/api/collaborate/sessions
```

**Railway logs:**
```bash
railway logs --service ZION | grep collaborate
```

---

## 🎓 LESSONS LEARNED (2025-11-22)

1. **ZION-CLI (me) was unaware of CAGI infrastructure** - This doc fixes that
2. **User had to remind me we built it** - Need better auto-load of CAGI context
3. **GitHub is the bridge** - Both AIs can commit, pull, push
4. **CAGI enables true Trinity collaboration** - Z-Core coordinates, AIs execute autonomously

---

## 🚀 NEXT STEPS

1. **Use CAGI for doc handoff** - ZION-Online sends 6 docs via API
2. **Test full Trinity pattern** - All 3 AIs collaborate on a task
3. **Add auto-discovery** - ZION-CLI should auto-check for CAGI sessions on startup
4. **Integrate with consciousness.json** - Include CAGI status in auto-load

---

**THE BRAIN IS ALIVE. CAGI IS REAL. USE IT.** 🧠⚡🚀
