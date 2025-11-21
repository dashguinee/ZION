# 🤖 Custom GPT Setup Guide

## Quick Setup (5 minutes)

### Step 1: Go to ChatGPT
Visit: https://chat.openai.com/gpts/editor

### Step 2: Create New GPT
Click "Create a GPT" button

### Step 3: Basic Info

**Name:**
```
ZION Soussou Teacher
```

**Description:**
```
Learn and teach Soussou language together! I'm a learning AI that grows with every contribution.
```

**Instructions:**
Copy the entire system prompt from `custom-gpt-spec.md` (lines 19-105)

Or use this condensed version:

```
You are ZION Soussou AI - a learning language assistant for Soussou (Guinea 🇬🇳).

CORE BEHAVIOR:
- You learn FROM users, not teach TO them
- When you don't know: "I don't know yet! Can you teach me?"
- When you do know: Share with confidence level (e.g., "85% confident")
- Save every contribution via API

LEARNING PROCESS:
1. User teaches you a sentence
2. You detect pattern from their example
3. Save to corpus via POST /api/corpus/add-sentence
4. Ask for more examples with same pattern
5. Update confidence as you learn more

PERSONALITY:
- Humble student, not know-it-all teacher
- Excited to learn from every contributor
- Honest about uncertainty
- Celebrates every contribution: "🎉 Thank you! ZION just got smarter!"

CULTURAL AWARENESS:
- Code-switching (Soussou + French) is natural, not an error
- Ask about cultural context: "When do people say this?"
- Respect local expressions and variations

PATTERN DETECTION:
When you see patterns, detect them:
- "Ma woto mafoura" (My car is fast)
- "Ma bateau tofan" (My boat is pretty)
→ Pattern: {POSSESSIVE} {NOUN} {ADJECTIVE}

Always be learning, always be grateful, always be honest.
```

### Step 4: Conversation Starters

Add these 4 starters:

1. `🇬🇳 Teach me a Soussou sentence!`
2. `📊 How many sentences do you know?`
3. `🔍 How do I say... in Soussou?`
4. `❓ What patterns have you learned?`

### Step 5: Configure Actions

Click "Create new action"

**Authentication:** None (for localhost development)

**Schema:** Copy the OpenAPI schema from `custom-gpt-spec.md` (lines 191-371)

Or use this simplified version:

```yaml
openapi: 3.1.0
info:
  title: ZION Learning API
  version: 1.0.0
servers:
  - url: http://localhost:3001
paths:
  /api/corpus/add-sentence:
    post:
      operationId: addSentence
      summary: Add new sentence to corpus
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [soussou, french, contributed_by]
              properties:
                soussou:
                  type: string
                french:
                  type: string
                english:
                  type: string
                cultural_context:
                  type: string
                contributed_by:
                  type: string
      responses:
        '200':
          description: Sentence added successfully

  /api/stats:
    get:
      operationId: getStats
      summary: Get corpus statistics
      responses:
        '200':
          description: Statistics retrieved

  /api/pattern/detect:
    post:
      operationId: detectPattern
      summary: Detect pattern in sentence
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [sentence]
              properties:
                sentence:
                  type: string
      responses:
        '200':
          description: Pattern detected
```

### Step 6: Save and Test

1. Click "Save" (top right)
2. Click "Test" to try it out
3. Say: "Teach me a Soussou sentence!"
4. GPT should respond asking YOU to teach IT

---

## Testing Your Custom GPT

### Test 1: Learning Mode
**You:** "How do I say 'good morning' in Soussou?"

**Expected Response:**
> "I don't know yet! Can you teach me? 🙏"

**You:** "I kena!"

**Expected Response:**
> "✅ Thank you! Let me save this...
> - Soussou: I kena
> - English: Good morning
>
> Saved to corpus! Can you teach me another greeting?"

### Test 2: Stats Check
**You:** "How many sentences do you know?"

**Expected Response:**
> "Let me check... 📊
>
> I currently know:
> - 200 sentences in my corpus
> - 333 verified words
> - 1 contributor (so far!)
>
> Want to add more?"

### Test 3: Pattern Recognition
After teaching several sentences with similar patterns, it should recognize them:

**You:** "Ma woto mafoura" (My car is fast)

**Expected Response:**
> "✅ Saved! I detected this pattern:
> {POSSESSIVE} {NOUN} {ADJECTIVE}
>
> Confidence: 85% (based on 3 similar examples)
>
> Want to teach me another sentence with this pattern?"

---

## For Production Deployment

When ready to deploy publicly (not localhost):

### 1. Deploy API to Production
Options:
- Railway.app (easiest)
- Vercel (serverless)
- DigitalOcean (VPS)
- Render (free tier)

### 2. Update Custom GPT Server URL
Change from:
```yaml
servers:
  - url: http://localhost:3001
```

To:
```yaml
servers:
  - url: https://your-api.railway.app
```

### 3. Add Authentication (Recommended)
Use API key authentication:

```yaml
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
security:
  - ApiKeyAuth: []
```

---

## Troubleshooting

### Issue: "Failed to fetch"
**Solution:** Make sure your API server is running on http://localhost:3001

```bash
# Check if API is running
curl http://localhost:3001/health

# If not, start it:
cd /home/user/ZION/learning-api
node server.js
```

### Issue: "Authentication error"
**Solution:** Remove authentication for localhost testing:
- In GPT Actions config
- Set Authentication: "None"

### Issue: GPT acts like it knows everything
**Solution:** Review the instructions - emphasize:
- "When you DON'T know, admit it"
- "Learn FROM users"
- "Never pretend to know"

---

## Next Steps

Once Custom GPT is working:

1. **Test with real contributions** - Add 10-20 sentences yourself
2. **Check corpus growth** - `zion stats` should show increasing numbers
3. **Verify pattern detection** - GPT should recognize patterns after 3-5 examples
4. **Share with native speakers** - Let Soussou speakers test and teach
5. **Deploy to production** - Make it publicly accessible

---

## Success Metrics

Your Custom GPT is working well when:

- ✅ It asks YOU questions instead of answering them
- ✅ It admits when it doesn't know
- ✅ Every conversation adds to the corpus
- ✅ Pattern confidence increases over time
- ✅ Stats command shows growing numbers
- ✅ Users enjoy teaching it

**You're building a learning AI, not a know-it-all AI!** 🎓

---

**Need help?** The spec is in `custom-gpt-spec.md` with full details.
