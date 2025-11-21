# ZION v2.0 Deployment Guide

## 🚀 Quick Deploy to Railway

### Prerequisites
- Node.js >= 18.0.0
- Railway CLI installed: `npm i -g @railway/cli`
- GitHub repository access
- Environment variables configured

### Environment Variables Required

```bash
# GitHub Configuration
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=dashguinee
GITHUB_REPO=ZION
GITHUB_BRANCH=main

# Service Authentication Tokens
CHATGPT_SERVICE_TOKEN=your_chatgpt_token
GEMINI_SERVICE_TOKEN=your_gemini_token
ZION_SERVICE_TOKEN=your_zion_token

# Gemini API (for collaboration features)
GEMINI_API_KEY=your_gemini_api_key

# Server Configuration
PORT=3000  # Railway sets this automatically
```

### Deployment Steps

#### 1. Prepare Local Environment
```bash
cd /path/to/zion-github
cd .congregation/bridge

# Install dependencies
npm install

# Verify files present
ls -la
# Should see: server.js, package.json, collaboration/, soussou-engine/
```

#### 2. Deploy to Railway
```bash
# From .congregation/bridge directory
railway login
railway up --service ZION

# Wait for build (~2 minutes)
# Railway will output build logs URL
```

#### 3. Verify Deployment
```bash
# Health check
curl https://your-railway-url.up.railway.app/health

# Should return:
# {
#   "service": "zion-unified-backend",
#   "features": {
#     "congregation": true,
#     "soussou": true,
#     "collaboration": true,
#     "gemini": true
#   },
#   "soussou_words": 8978
# }
```

#### 4. Test All Features

**Soussou API:**
```bash
curl "https://your-railway-url.up.railway.app/api/soussou/lookup?word=fa"
curl "https://your-railway-url.up.railway.app/api/soussou/stats"
```

**Collaboration API:**
```bash
curl "https://your-railway-url.up.railway.app/api/collaborate/sessions"
```

**Congregation:**
```bash
curl "https://your-railway-url.up.railway.app/congregation/thread"
```

## 🐛 Troubleshooting

### Issue: Railway deploys old version
**Solution:**
```bash
# Regenerate package-lock.json
cd .congregation/bridge
rm package-lock.json
npm install

# Commit and push
git add package-lock.json
git commit -m "Update package-lock.json"
git push origin main

# Force fresh deploy
railway up --service ZION
```

### Issue: "npm ci" fails
**Cause:** package.json and package-lock.json out of sync
**Solution:** Regenerate package-lock.json (see above)

### Issue: Soussou API returns 0 words
**Cause:** Soussou data directory missing
**Solution:**
```bash
# Copy Soussou data to bridge
cp -r soussou-engine/data .congregation/bridge/soussou-engine/

# Commit and deploy
git add .congregation/bridge/soussou-engine/data
git commit -m "Add Soussou data files"
git push origin main
```

### Issue: Railway logs show old banner
**Note:** Logs may cache old output. Test endpoints directly to verify actual deployment.

## 📁 File Structure

```
.congregation/bridge/
├── server.js                    # Main integrated backend
├── package.json                 # Dependencies (zion-unified-backend v2.0.0)
├── package-lock.json            # Lock file (must stay in sync!)
├── collaboration/
│   ├── collaborate-routes.js    # Collaboration API endpoints
│   ├── gemini-client.js         # Gemini integration
│   ├── session-manager.js       # Session state management
│   ├── state-analyzer.js        # Gap analysis logic
│   └── utils.js                 # Utilities
└── soussou-engine/
    └── data/
        ├── lexicon.json         # 8,978 Soussou words
        ├── variant_mappings.json
        ├── generation_templates.json
        ├── morphology_patterns.json
        └── syntax_patterns.json
```

## 🔐 Security Notes

- Never commit `.env` files
- Keep service tokens secret
- Use environment variables in Railway dashboard
- Rotate tokens periodically

## 📊 Monitoring

**Health Check Endpoint:**
```bash
curl https://your-railway-url.up.railway.app/health
```

**Expected Response Time:** < 500ms
**Expected Uptime:** 99.9%

## 🆘 Emergency Contacts

- Z-Core (Dash): Vision & Strategy
- Z-Online: Architecture & Design
- Z-CLI: Build & Operations

---

**Deployment Guide v1.0**
Last Updated: 2025-11-21
ZION v2.0 - Unified Backend
