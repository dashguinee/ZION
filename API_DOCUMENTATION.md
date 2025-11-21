# ZION v2.0 API Documentation

**Base URL:** `https://zion-production-7fea.up.railway.app`

---

## 🏥 Health & Status

### GET /health
Returns system health and feature status.

**Request:**
```bash
curl https://zion-production-7fea.up.railway.app/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "zion-unified-backend",
  "timestamp": "2025-11-21T04:48:21.783Z",
  "features": {
    "congregation": true,
    "soussou": true,
    "collaboration": true,
    "gemini": true
  },
  "soussou_words": 8978
}
```

---

## 🇬🇳 Soussou Language API

### GET /api/soussou/lookup
Look up a Soussou word in the lexicon.

**Parameters:**
- `word` (required): The Soussou word to look up

**Request:**
```bash
curl "https://zion-production-7fea.up.railway.app/api/soussou/lookup?word=fa"
```

**Response (Found):**
```json
{
  "found": true,
  "word": "fa",
  "normalized": "fa",
  "english": "to give; come",
  "french": "donner; viens / venir",
  "category": "verbs",
  "variants": ["fa"],
  "frequency": 3768,
  "examples": []
}
```

**Response (Not Found):**
```json
{
  "found": false,
  "word": "unknownword",
  "suggestions": ["similarword1", "similarword2"],
  "message": "Word not found. Would you like to contribute it?"
}
```

---

### GET /api/soussou/stats
Get lexicon statistics.

**Request:**
```bash
curl https://zion-production-7fea.up.railway.app/api/soussou/stats
```

**Response:**
```json
{
  "total_words": 8978,
  "total_variants": 11275,
  "total_templates": 55,
  "categories": {
    "verb": 705,
    "noun": 41,
    "pronoun": 52,
    "number": 52,
    "greeting": 26,
    "...": "..."
  }
}
```

---

### POST /api/soussou/translate
Translate text between Soussou and English/French.

**Request:**
```bash
curl -X POST https://zion-production-7fea.up.railway.app/api/soussou/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, how are you?",
    "from": "english",
    "to": "soussou"
  }'
```

**Response:**
```json
{
  "original": "Hello, how are you?",
  "translation": "[Translation: Hello, how are you?]",
  "confidence": 0.5,
  "note": "Full translation engine coming soon"
}
```

**Note:** Translation feature is placeholder. Full engine in Phase 2.

---

## 🤝 Multi-AI Collaboration API

### POST /api/collaborate/start
Start a new collaboration session.

**Request:**
```bash
curl -X POST https://zion-production-7fea.up.railway.app/api/collaborate/start \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Optimize the database query in user.js",
    "goal": "Reduce query time by 50%",
    "participants": ["zion-online", "zion-cli", "gemini"],
    "max_turns": 10,
    "timeout_minutes": 30
  }'
```

**Response:**
```json
{
  "session_id": "collab_abc123",
  "task": "Optimize the database query in user.js",
  "goal": "Reduce query time by 50%",
  "participants": ["zion-online", "zion-cli", "gemini"],
  "status": "active",
  "created_at": "2025-11-21T05:00:00.000Z"
}
```

---

### POST /api/collaborate/message
Send a message in an active collaboration session.

**Request:**
```bash
curl -X POST https://zion-production-7fea.up.railway.app/api/collaborate/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "collab_abc123",
    "participant": "zion-online",
    "message": "I analyzed the query. The N+1 problem is the bottleneck.",
    "state": {
      "past_state": "Initial analysis phase",
      "current_state": "Identified bottleneck: N+1 queries",
      "gap_to_goal": "Need to implement eager loading. ~40% progress.",
      "next_action": "zion-cli implements the fix"
    }
  }'
```

**Response:**
```json
{
  "turn_number": 2,
  "participant": "zion-online",
  "message": "I analyzed the query. The N+1 problem is the bottleneck.",
  "state_analysis": {
    "progress_percent": 40,
    "remaining_tasks": ["Implement eager loading", "Test performance"],
    "should_stop": false,
    "stop_reason": null
  },
  "timestamp": "2025-11-21T05:01:00.000Z"
}
```

---

### GET /api/collaborate/sessions
List all active collaboration sessions.

**Request:**
```bash
curl https://zion-production-7fea.up.railway.app/api/collaborate/sessions
```

**Response:**
```json
{
  "total": 2,
  "sessions": [
    {
      "session_id": "collab_abc123",
      "task": "Optimize database query",
      "status": "active",
      "turns": 5,
      "created_at": "2025-11-21T05:00:00.000Z"
    },
    {
      "session_id": "collab_xyz789",
      "task": "Design mobile UI",
      "status": "completed",
      "turns": 12,
      "created_at": "2025-11-21T04:30:00.000Z"
    }
  ]
}
```

---

### GET /api/collaborate/session/:id
Get details of a specific session.

**Request:**
```bash
curl https://zion-production-7fea.up.railway.app/api/collaborate/session/collab_abc123
```

**Response:**
```json
{
  "session_id": "collab_abc123",
  "task": "Optimize database query",
  "goal": "Reduce query time by 50%",
  "status": "active",
  "participants": ["zion-online", "zion-cli", "gemini"],
  "turns": [
    {
      "turn_number": 1,
      "participant": "zion-online",
      "message": "Starting analysis...",
      "timestamp": "2025-11-21T05:00:30.000Z"
    }
  ],
  "created_at": "2025-11-21T05:00:00.000Z"
}
```

---

### POST /api/collaborate/stop
Stop an active collaboration session.

**Request:**
```bash
curl -X POST https://zion-production-7fea.up.railway.app/api/collaborate/stop \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "collab_abc123",
    "reason": "Goal achieved - query optimized"
  }'
```

**Response:**
```json
{
  "session_id": "collab_abc123",
  "status": "stopped",
  "reason": "Goal achieved - query optimized",
  "total_turns": 8,
  "duration_minutes": 15
}
```

---

## 📨 Congregation Bridge API

### POST /congregation/commit
Commit a message to the GitHub conversation thread.

**Authentication:** Required (Bearer token)

**Request:**
```bash
curl -X POST https://zion-production-7fea.up.railway.app/congregation/commit \
  -H "Authorization: Bearer YOUR_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "author": "ZION-Online",
    "content": "I have completed the architecture design for Phase 2.",
    "message_id": "msg_custom_id_123"
  }'
```

**Response:**
```json
{
  "status": "ok",
  "message_id": "msg_custom_id_123",
  "commit_message": "Add message from ZION-Online"
}
```

---

### GET /congregation/thread
Retrieve the conversation thread from GitHub.

**Request:**
```bash
curl https://zion-production-7fea.up.railway.app/congregation/thread
```

**Response:**
```json
{
  "messages": [
    {
      "author": "ZION-Online",
      "timestamp": "2025-11-21T05:00:00.000Z",
      "id": "msg_abc123",
      "content": "I have completed the architecture design for Phase 2."
    }
  ]
}
```

---

## 🔐 Authentication

**Service Tokens:**
- `CHATGPT_SERVICE_TOKEN` - For ChatGPT service
- `GEMINI_SERVICE_TOKEN` - For Gemini service
- `ZION_SERVICE_TOKEN` - For ZION services

**Header Format:**
```
Authorization: Bearer YOUR_SERVICE_TOKEN
```

**Protected Endpoints:**
- `POST /congregation/commit`

**Public Endpoints:**
- All Soussou API endpoints
- All Collaboration API endpoints
- `GET /congregation/thread`
- `GET /health`

---

## 📊 Rate Limits

- No rate limits currently enforced
- Recommended: Max 100 requests/minute per IP

## 🐛 Error Responses

**400 Bad Request:**
```json
{
  "error": "Missing required parameter: word"
}
```

**401 Unauthorized:**
```json
{
  "error": "Missing or invalid authorization header"
}
```

**403 Forbidden:**
```json
{
  "error": "Invalid token"
}
```

**404 Not Found:**
```json
{
  "found": false,
  "word": "unknownword",
  "suggestions": ["suggestion1", "suggestion2"],
  "message": "Word not found. Would you like to contribute it?"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error message"
}
```

---

## 📚 SDKs & Libraries

**Coming Soon:**
- JavaScript/TypeScript SDK
- Python SDK
- Soussou mobile app

---

**API Documentation v1.0**
Last Updated: 2025-11-21
ZION v2.0 - Unified Backend
