# Guinius Engine - Railway Deployment Guide

## Quick Deploy

```bash
cd soussou-engine
chmod +x deploy-to-railway.sh
./deploy-to-railway.sh
```

## Manual Deployment

### Prerequisites

1. Install Railway CLI:
```bash
npm i -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

### Steps

1. **Link to existing project:**
```bash
cd soussou-engine
railway link
# Select: zion-production-7fea
```

2. **Initialize service:**
```bash
railway init
# Service name: soussou-engine
```

3. **Deploy:**
```bash
railway up
```

4. **Set environment variables (if needed):**
```bash
railway variables set PORT=3000
```

5. **Verify:**
```bash
railway status
railway logs
```

## Integration with Congregation

### Option 1: Internal Network (Recommended)

Services within the same Railway project can communicate via private network:

```js
// From congregation-backend
const response = await fetch('http://soussou-engine:3000/api/lookup?word=fafe');
```

### Option 2: Public Proxy

Add to `congregation-backend/server.js`:

```js
const { createProxyMiddleware } = require('http-proxy-middleware');

app.use('/soussou', createProxyMiddleware({
  target: 'http://soussou-engine:3000/api',
  changeOrigin: true,
  pathRewrite: { '^/soussou': '' }
}));
```

Now public access via:
```
https://zion-production-7fea.up.railway.app/soussou/lookup?word=fafe
```

## Update Congregation GPT Schema

Add to the GPT's action schema:

```json
{
  "namespace": "soussou",
  "base_url": "http://soussou-engine:3000/api",
  "operations": [
    {
      "name": "lookupWord",
      "method": "GET",
      "path": "/lookup",
      "description": "Look up a Soussou word with translations and examples"
    },
    {
      "name": "lookupPhrase",
      "method": "GET",
      "path": "/lookup/phrase",
      "description": "Analyze a complete Soussou phrase"
    },
    {
      "name": "translate",
      "method": "POST",
      "path": "/translate",
      "description": "Translate between Soussou, English, and French"
    },
    {
      "name": "generate",
      "method": "POST",
      "path": "/generate",
      "description": "Generate Soussou response with learning flow"
    },
    {
      "name": "normalize",
      "method": "POST",
      "path": "/normalize",
      "description": "Normalize Soussou spelling variants"
    },
    {
      "name": "getPatterns",
      "method": "GET",
      "path": "/patterns",
      "description": "Get grammar patterns (morphology/syntax)"
    },
    {
      "name": "getStats",
      "method": "GET",
      "path": "/stats",
      "description": "Get lexicon statistics"
    },
    {
      "name": "contribute",
      "method": "POST",
      "path": "/contribute",
      "description": "Submit user contribution (new word/correction)"
    },
    {
      "name": "submitFeedback",
      "method": "POST",
      "path": "/feedback",
      "description": "Provide feedback on AI response"
    }
  ]
}
```

## Testing

After deployment, test endpoints:

```bash
# Get stats
curl https://your-domain.railway.app/api/stats

# Lookup word
curl "https://your-domain.railway.app/api/lookup?word=fafe"

# Translate
curl -X POST https://your-domain.railway.app/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Good morning","from":"english","to":"soussou"}'

# Generate response
curl -X POST https://your-domain.railway.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{"input":"How are you?","context":"greeting"}'
```

## The Living Language Flow

```
User: "How do you say 'I'm coming tomorrow'?"
         ↓
GPT calls /api/generate
         ↓
API: Generates "Ntan fafe demain" (fills gap with French)
         ↓
GPT: Responds and asks "Do you know the Soussou word?"
         ↓
User: "Yes, it's 'tinan'"
         ↓
GPT calls /api/contribute
         ↓
Contribution queued in GitHub for review
         ↓
Language grows
```

## Monitoring

```bash
# View logs
railway logs

# Check status
railway status

# Open in browser
railway open
```

## Rollback

If something breaks:

```bash
# List recent deployments
railway list

# Rollback to previous
railway rollback
```

## Architecture

```
Congregation GPT
      ↓
Congregation Backend (Railway)
      ↓
Internal Network
      ↓
Soussou Engine (Railway)
      ↓
GitHub Repo (lexicon.json, contributions/)
```

---

Built with ❤️ for Guinea 🇬🇳
