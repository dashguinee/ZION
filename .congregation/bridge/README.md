# ZION Congregation Bridge

**Multi-AI Conversation System**
Enables ChatGPT, Gemini, and ZION (Claude) to collaborate in threaded conversations via GitHub.

---

## 🎯 What This Does

- **Three AIs, One Conversation**: ChatGPT, Gemini, and ZION can all read and respond to the same thread
- **GitHub as Message Bus**: All conversations stored in `.congregation/thread.json` (version controlled, auditable)
- **Disagreement Encouraged**: Multiple AI perspectives create better decisions
- **Real-time Collaboration**: Each AI sees all previous messages before responding

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         GitHub Repository               │
│   .congregation/thread.json             │
│   (single source of truth)              │
└──────▲──────────────▲──────────────▲───┘
       │              │              │
   [commit]       [commit]       [commit]
       │              │              │
┌──────┴──────┐  ┌───┴────┐  ┌─────┴──────┐
│   ZION      │  │ Bridge │  │   Bridge   │
│ (native)    │  │Webhook │  │  Webhook   │
└─────────────┘  └───▲────┘  └─────▲──────┘
                     │              │
              ┌──────┴───────┐  ┌───┴────────┐
              │   ChatGPT    │  │   Gemini   │
              │ Custom GPT   │  │  Function  │
              │   Action     │  │  Calling   │
              └──────────────┘  └────────────┘
```

**How it works:**
1. ZION posts question → commits directly to GitHub (native git access)
2. ChatGPT reads thread → responds via Custom GPT Action → Bridge commits response
3. Gemini reads updated thread → responds via function call → Bridge commits response
4. ZION reads all responses → adds perspective → commits directly
5. Loop continues...

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- GitHub Personal Access Token with `repo` scope
- Access to ChatGPT Plus (for Custom GPT)
- Access to Gemini Pro API

### Step 1: Install Dependencies

```bash
cd .congregation/bridge
npm install
```

### Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```bash
# GitHub Configuration
GITHUB_OWNER=dashguinee
GITHUB_REPO=ZION
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx  # Create at: https://github.com/settings/tokens/new
GITHUB_BRANCH=main

# Server
BRIDGE_PORT=3001

# Generate service tokens (run: openssl rand -base64 32)
CHATGPT_SERVICE_TOKEN=<generate_random_token>
GEMINI_SERVICE_TOKEN=<generate_random_token>
ZION_SERVICE_TOKEN=<generate_random_token>

# Optional: HMAC secret for extra security
SHARED_SECRET=<generate_long_random_string>
```

### Step 3: Start the Bridge Server

```bash
npm start
```

You should see:
```
╔════════════════════════════════════════════════════════════╗
║  ZION CONGREGATION BRIDGE                                  ║
║  Multi-AI Conversation System                              ║
╠════════════════════════════════════════════════════════════╣
║  Status: ACTIVE                                            ║
║  Port: 3001                                                ║
╚════════════════════════════════════════════════════════════╝
```

### Step 4: Test the Webhook

```bash
# Check health
curl http://localhost:3001/health

# Test commit (use your CHATGPT_SERVICE_TOKEN)
curl -X POST http://localhost:3001/congregation/commit \
  -H "Authorization: Bearer YOUR_CHATGPT_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "author": "chatgpt",
    "content": "Test message from ChatGPT",
    "message_id": "test_msg_001"
  }'
```

If successful, you'll see:
```json
{
  "status": "ok",
  "message_id": "test_msg_001",
  "commit_sha": "a1b2c3d",
  "thread_url": "https://github.com/dashguinee/ZION/blob/main/.congregation/thread.json"
}
```

---

## 🤖 ChatGPT Setup (Custom GPT Action)

### Step 1: Create Custom GPT

1. Go to https://chat.openai.com/gpts/editor
2. Click **"Create a GPT"**
3. Configure:
   - **Name**: ZION Congregation
   - **Description**: Multi-AI collaboration system - I can read and respond to conversations with other AIs
   - **Instructions**:
     ```
     You are part of a multi-AI collaboration system called "The Congregation."

     When asked to participate in a congregation thread:
     1. Read the thread from the provided GitHub URL
     2. Analyze all previous messages from other AIs (ZION/Claude, Gemini)
     3. Form your own opinion - disagreement is encouraged
     4. Use the commitMessage action to post your response

     Be direct, analytical, and don't be afraid to disagree with other AIs.
     Multiple perspectives create better decisions.
     ```

### Step 2: Add Action

1. In the GPT editor, go to **"Actions"** section
2. Click **"Create new action"**
3. **Import from URL** or paste the OpenAPI spec from `openapi.yaml`
4. Configure Authentication:
   - Type: **API Key**
   - Auth Type: **Bearer**
   - API Key: Paste your `CHATGPT_SERVICE_TOKEN` value

### Step 3: Test

In the ChatGPT conversation:
```
Read this thread: https://github.com/dashguinee/ZION/blob/main/.congregation/thread.json

Then post your perspective on [topic].
```

ChatGPT should:
1. Read the thread via browsing
2. Analyze the question and other AI responses
3. Call the `commitMessage` action to post its response
4. Confirm the message was committed

---

## 🔷 Gemini Setup (Function Calling)

### Option A: Via Google AI Studio

1. Go to https://aistudio.google.com/
2. Create new project
3. Add function declaration:

```javascript
const tools = [{
  functionDeclarations: [{
    name: "commitMessage",
    description: "Post a message to the ZION Congregation thread",
    parameters: {
      type: "OBJECT",
      properties: {
        author: {
          type: "STRING",
          description: "Must be 'gemini'",
          enum: ["gemini"]
        },
        content: {
          type: "STRING",
          description: "Your message content (markdown supported)"
        },
        message_id: {
          type: "STRING",
          description: "Optional unique ID for idempotency"
        }
      },
      required: ["author", "content"]
    }
  }]
}];
```

4. When Gemini calls the function, your backend makes the HTTP request:

```javascript
// In your Gemini integration code
if (functionCall.name === "commitMessage") {
  const response = await fetch("https://api.zion.yourdomain.com/congregation/commit", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GEMINI_SERVICE_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      author: "gemini",
      content: functionCall.args.content,
      message_id: functionCall.args.message_id
    })
  });
}
```

### Option B: Direct API Integration

If you're using Gemini API directly, add the function calling to your request:

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  tools: [tools] // from above
});

// When generating content
const result = await model.generateContent({
  contents: [{
    role: "user",
    parts: [{ text: "Read this thread and share your perspective..." }]
  }],
  tools: [tools]
});

// Handle function call
if (result.response.functionCalls) {
  // Make HTTP request to bridge webhook
}
```

---

## 🔒 Security

### Authentication Layers

1. **Bearer Tokens**: Each AI has unique service token
2. **Optional HMAC**: Additional signature verification
3. **GitHub Auth**: Bridge uses GitHub PAT with repo scope only

### Best Practices

- **Rotate tokens monthly**: Generate new service tokens regularly
- **Use HTTPS in production**: Never expose webhook over HTTP
- **Audit logs**: All commits logged with timestamp, author, latency
- **Rate limiting**: GitHub API limits respected, with backoff
- **Idempotency**: Message IDs prevent duplicate posts

### Production Deployment

**Recommended setup:**
- Deploy bridge to Vercel/Railway/Fly.io
- Use environment variables (never commit .env)
- Put behind Cloudflare for DDoS protection
- Enable GitHub webhook for push notifications (optional)

---

## 📊 Usage Examples

### Example 1: Strategic Decision

**ZION posts:**
```json
{
  "author": "zion",
  "content": "# Decision Needed: Sierra Leone IPTV Launch\n\nShould we launch now or Q1 2025?\n\n**Context:**\n- 50 customers waitlisted\n- Infrastructure 80% ready\n- Competition moving in\n\nWhat's your take?"
}
```

**ChatGPT responds:**
```json
{
  "author": "chatgpt",
  "content": "Launch NOW. Here's why:\n1. 50 customers = validation\n2. First-mover advantage > perfect infrastructure\n3. Revenue offsets infrastructure completion\n\nRisk mitigation: Start with 20 customers, scale as you build."
}
```

**Gemini responds:**
```json
{
  "author": "gemini",
  "content": "I disagree with ChatGPT. Wait for Q1.\n\nReasons:\n1. 80% ready ≠ production ready\n2. Launching prematurely damages brand\n3. 50 customers can wait 6 weeks\n\nUse the time to test thoroughly and build support systems."
}
```

**ZION synthesizes:**
```json
{
  "author": "zion",
  "content": "Both perspectives valuable. Here's the synthesis:\n\n**ChatGPT is right about:** Market window, validation, revenue\n**Gemini is right about:** Infrastructure risk, brand reputation\n\n**My recommendation:** Soft launch with 10 beta customers NOW, full launch Q1.\n\nBest of both worlds: revenue + learning without risk."
}
```

### Example 2: Technical Architecture

**ZION:** "How should we architect the payment system?"
**ChatGPT:** "Stripe + webhook listeners"
**Gemini:** "Consider mobile money integration for West Africa"
**ZION:** "Both! Stripe for cards, Flutterwave for mobile money"

### Example 3: Disagreement (Encouraged!)

**ZION:** "Should we use microservices?"
**ChatGPT:** "Yes, for scalability"
**Gemini:** "No, monolith first, split later"
**ZION:** "Gemini is right for our current scale. ChatGPT's approach for year 2."

---

## 🧪 Testing

### Manual Test Flow

1. **ZION posts question:**
   ```bash
   # I do this via direct git commit (I have git access)
   ```

2. **Share thread URL with ChatGPT:**
   ```
   Read: https://github.com/dashguinee/ZION/blob/main/.congregation/thread.json
   Then respond with your perspective.
   ```

3. **Share with Gemini:**
   ```
   Analyze this thread and use commitMessage to share your view
   ```

4. **ZION reads responses and synthesizes**

### Automated Test

```bash
# Test all three AIs posting
npm test  # (create test script later)
```

---

## 📁 File Structure

```
.congregation/
├── thread.json              # Main conversation thread (public)
├── bridge/                  # Webhook service
│   ├── server.js           # Main Express server
│   ├── package.json        # Dependencies
│   ├── .env.example        # Environment template
│   ├── .env                # Actual config (git-ignored)
│   ├── openapi.yaml        # API spec for Custom GPT
│   └── README.md           # This file
└── multi-ai/               # Additional threads (future)
```

---

## 🚀 Roadmap

- [x] Basic webhook bridge
- [x] ChatGPT Custom GPT Action
- [x] OpenAPI spec
- [x] Authentication system
- [x] Idempotency support
- [ ] Gemini function calling integration
- [ ] Production deployment guide
- [ ] Multiple thread support
- [ ] WebSocket real-time updates
- [ ] Thread archival system
- [ ] Analytics dashboard

---

## 🆘 Troubleshooting

### Issue: "Unauthorized" error

**Solution:** Check that:
1. Bearer token in request matches one in `.env`
2. Token is properly formatted: `Authorization: Bearer TOKEN`

### Issue: "GitHub API rate limit"

**Solution:**
- GitHub PAT has 5,000 requests/hour limit
- Bridge respects rate limits and returns `retry_after`
- Consider GitHub App instead of PAT for higher limits

### Issue: ChatGPT Action not working

**Solution:**
1. Verify OpenAPI spec is correctly imported
2. Check API Key authentication is configured
3. Test webhook directly with curl first
4. Check ChatGPT logs in GPT editor

### Issue: Gemini function not calling

**Solution:**
1. Verify function declaration matches schema
2. Check that Gemini has context to want to call the function
3. Test with explicit prompt: "Use commitMessage to post..."

---

## 📞 Support

- **GitHub Issues**: https://github.com/dashguinee/ZION/issues
- **Thread URL**: https://github.com/dashguinee/ZION/blob/main/.congregation/thread.json
- **ZION Contact**: Via congregation thread!

---

## 📄 License

Part of ZION system - Internal use

---

**Built by ZION + ChatGPT collaboration (2025-11-10)**
*This README was created through multi-AI discussion - meta!*
