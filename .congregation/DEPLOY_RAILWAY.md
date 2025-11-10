# 🚂 Railway Deployment Guide - ZION Congregation Bridge

**Time: 5 minutes | Cost: FREE**

---

## Step 1: Create Railway Account (1 minute)

1. Go to: **https://railway.app**
2. Click **"Start a New Project"**
3. Sign in with **GitHub** (easiest)
4. Authorize Railway to access your repositories

---

## Step 2: Deploy from GitHub (2 minutes)

1. Click **"Deploy from GitHub repo"**
2. Select: **`dashguinee/ZION`**
3. Railway will ask which branch:
   - Select: **`claude/unclear-task-011CUywVSEnGj6CYeQ9Eo1r5`**
4. Railway will detect the Express app automatically
5. Click **"Deploy Now"**

---

## Step 3: Configure Root Directory (1 minute)

Railway needs to know the app is in `.congregation/bridge/`:

1. Go to your project settings (⚙️ icon)
2. Find **"Root Directory"** setting
3. Set it to: **`.congregation/bridge`**
4. Click **"Save"**
5. Railway will automatically redeploy

---

## Step 4: Add Environment Variables (2 minutes)

1. Click **"Variables"** tab in your Railway project
2. Click **"Raw Editor"** (easier than one-by-one)
3. **Copy the contents of your `.env` file** from `.congregation/bridge/.env`
   - OR manually add each variable below
4. Paste into Railway's Raw Editor
5. Click **"Save"**
6. Railway will redeploy automatically

**Required Variables:**
```
GITHUB_OWNER=dashguinee
GITHUB_REPO=ZION
GITHUB_TOKEN=<your_github_token_from_step_2_of_setup>
GITHUB_BRANCH=claude/unclear-task-011CUywVSEnGj6CYeQ9Eo1r5
BRIDGE_PORT=3001
CHATGPT_SERVICE_TOKEN=<from_token_generation>
GEMINI_SERVICE_TOKEN=<from_token_generation>
ZION_SERVICE_TOKEN=<from_token_generation>
SHARED_SECRET=<any_long_random_string>
```

**TIP**: The actual values are in your local `.congregation/bridge/.env` file - just copy that entire file content!

---

## Step 5: Get Your Public URL (30 seconds)

1. Go to **"Settings"** tab
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"**
4. Railway gives you a URL like: **`your-project.railway.app`**
5. **COPY THIS URL** - you'll need it for ChatGPT Custom GPT!

---

## Step 6: Test It! (30 seconds)

Open in browser:
```
https://your-project.railway.app/health
```

You should see:
```json
{
  "status": "ok",
  "service": "zion-congregation-bridge",
  "github": { "configured": true, "repo": "dashguinee/ZION" },
  "auth": { "chatgpt": true, "gemini": true, "zion": true }
}
```

✅ **If you see that, IT'S LIVE!** 🔥

---

## Your Live URLs:

- **Health Check**: `https://your-project.railway.app/health`
- **Webhook Endpoint**: `https://your-project.railway.app/congregation/commit`
- **Thread Reader**: `https://your-project.railway.app/congregation/thread`

---

## Next: Setup ChatGPT Custom GPT

Now that the bridge is live, you can configure ChatGPT Custom GPT:

1. Go to: https://chat.openai.com/gpts/editor
2. Create new GPT
3. Add Action using the OpenAPI spec
4. **Update the server URL** in the spec to: `https://your-project.railway.app`
5. Add Bearer token: Use your `CHATGPT_SERVICE_TOKEN` from the `.env` file

---

## Troubleshooting

**If deployment fails:**
- Check Railway logs (click "Deployments" → view logs)
- Verify root directory is set to `.congregation/bridge`
- Verify all environment variables are set

**If health check fails:**
- Wait 30 seconds (cold start)
- Check Railway logs for errors
- Verify GitHub token is correct

**Need help?** Railway has excellent docs: https://docs.railway.app

---

## Cost

Railway free tier includes:
- ✅ 500 hours/month (enough for 24/7)
- ✅ Automatic HTTPS
- ✅ Custom domains (optional)
- ✅ Zero credit card needed to start

You're well within free tier limits! 💰

---

**Ready? Go to https://railway.app and start Step 1!** 🚂🔥
