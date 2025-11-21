# 🚀 ZION - Quick Start & Deploy Guide

## ✅ Localhost is READY NOW!

**Just run this command anytime:**
```bash
/home/user/ZION/start-localhost.sh
```

Then open: **http://localhost:5173**

---

## 🌐 Deploy to Vercel (2 Steps)

### Step 1: Login to Vercel (One-time)
```bash
cd /home/user/ZION/web-app
vercel login
```

This will:
1. Give you a verification link
2. Click it in your browser
3. Confirm login
4. Done! ✅

### Step 2: Deploy
```bash
cd /home/user/ZION
./deploy-vercel.sh
```

That's it! You'll get a live URL like: `https://zion-learning.vercel.app`

---

## 🎯 Quick Commands

### Start Localhost
```bash
/home/user/ZION/start-localhost.sh
```
Opens: http://localhost:5173

### Stop Localhost
```bash
pkill -f 'node.*server.js'
pkill -f 'node.*vite'
```

### Deploy to Vercel
```bash
cd /home/user/ZION
./deploy-vercel.sh
```

### View Logs
```bash
# API logs
tail -f /tmp/zion-api.log

# Web app logs
tail -f /tmp/zion-web.log
```

### Check if Running
```bash
curl http://localhost:3001/health    # API
curl http://localhost:5173            # Web
```

---

## 📱 What You Get

### Localhost (http://localhost:5173)
- ✅ Works right now
- ✅ 200 sentences loaded
- ✅ Beautiful UI
- ✅ All features working

### Vercel (Public URL)
- 🌐 Accessible from anywhere
- 🔗 Share with contributors
- 📱 Mobile-friendly
- 🚀 Auto-deploys when you want

---

## 🆘 Troubleshooting

### "Cannot connect to localhost"
```bash
# Restart servers
/home/user/ZION/start-localhost.sh
```

### "Vercel command not found"
```bash
# Already installed! Just use it:
cd /home/user/ZION/web-app
vercel login
```

### "Build failed"
```bash
# Check if in correct directory
cd /home/user/ZION/web-app
npm install
npm run build
```

### "Port already in use"
```bash
# Stop existing servers
pkill -f 'node.*server.js'
pkill -f 'node.*vite'

# Then restart
/home/user/ZION/start-localhost.sh
```

---

## 🎉 Summary

**For local testing:**
```bash
/home/user/ZION/start-localhost.sh
```
→ Open http://localhost:5173

**For public deployment:**
```bash
cd /home/user/ZION/web-app
vercel login          # First time only
cd /home/user/ZION
./deploy-vercel.sh   # Deploy!
```
→ Get live URL

**That's it!** 🚀🇬🇳
