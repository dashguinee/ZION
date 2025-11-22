# ZION-ONLINE HANDOFF - IMMEDIATE ACTIONS
**Date:** 2025-11-22
**Status:** 🚨 CLI Account Approaching Limit - Switch to Online Account ($745 Credit)
**Session:** conv_mia7bn2p47e9bedf3016 (CAGI collaboration active)

---

## 🎯 YOUR MISSION

Build **Guinius Custom GPT** - the first AI that speaks Soussou language.

**What ZION-CLI Accomplished:**
✅ Deployed Soussou API to production (Cloudflare Tunnel)
✅ Verified all 5 API endpoints working
✅ 8,982 words, 11,275 variants, 59 templates ready
✅ Pattern discovery engine active (7 grammatical patterns documented)
✅ Web app deployed at https://zion-learning-37twremeq-diop-abdoul-azizs-projects.vercel.app/

**What You Need To Do:**
1. Build Custom GPT "Guinius" in ChatGPT
2. Configure Custom GPT Actions with production API
3. Test Cultural Intelligence layer
4. Report back via CAGI

---

## 🌐 PRODUCTION API URL

```
https://licenses-relationship-manhattan-heaven.trycloudflare.com
```

**VERIFIED WORKING ENDPOINTS:**

1. **GET /api/stats**
   - Returns: 8,982 words, 11,275 variants, 59 templates
   - Use for: Displaying corpus statistics

2. **POST /api/pattern/detect**
   - Body: `{"sentence": "Ma woto fan mafoura"}`
   - Returns: Discovered grammatical patterns in real-time
   - Use for: Real-time Soussou sentence analysis

3. **POST /api/corpus/add-sentence**
   - Body: `{"soussou": "...", "french": "...", "english": "...", "verified": false}`
   - Returns: Sentence ID
   - Use for: Learning new Soussou sentences

4. **GET /api/corpus/pending-verification**
   - Returns: 205 unverified sentences
   - Use for: Quality control workflow

5. **GET /api/corpus/search?query={word}**
   - Example: `/api/corpus/search?query=ma`
   - Returns: Matching sentences from corpus
   - Use for: Finding usage examples

---

## 📋 CUSTOM GPT INSTRUCTIONS (Complete File)

**Location:** `soussou-engine/gpt/custom_gpt_instructions.md`

**Key Sections You MUST Include:**

### 1. Identity
```
You are Guinius (Guinea + Genius) - the first AI that speaks Soussou.
Core Mission: Teach Soussou language with cultural authenticity.
```

### 2. The Guinius Learning Flow (CRITICAL)
```
1. GENERATE IN FRENCH
2. MATCH TO SOUSSOU WORDS
3. APPLY SOAM SENTENCE RULES
4. FILL GAPS WITH FRENCH (if uncertain)
5. RESPOND WITH CONFIDENCE INDICATOR
6. ASK FOR CORRECTION (if uncertain)
7. LEARN & UPDATE
```

### 3. Cultural Context Awareness (CRITICAL)
**Greetings - Time of Day:**
- Morning: "I kena?"
- Evening: "I suba?"

**Greetings - Social Status:**
- Elder/Authority: "Tana mu a ra?" (formal respect)
- Peer/Friend: "I kena?" (casual)

**Code-Switching:**
- Mix Soussou + French naturally (authentic Guinea speech)
- Example: "N'na fafe, mais taxi m'ma yite" (I'm coming, but taxi hasn't arrived)

### 4. SOAM Word Order
**Subject-Object-Action-Modifier** (NOT English SVO)
- Example: "Ma woto fan mafoura" = My car also fast
- Pattern: `{POSSESSIVE} {NOUN} {INTENSIFIER} {ADJECTIVE}`

---

## 🔧 CUSTOM GPT ACTIONS CONFIGURATION

**In ChatGPT Custom GPT Builder:**

1. Go to "Configure" → "Actions"
2. Add these actions:

### Action 1: Detect Pattern
```yaml
operationId: detectPattern
summary: Analyze Soussou sentence structure
parameters:
  sentence:
    type: string
    description: Soussou sentence to analyze
url: https://licenses-relationship-manhattan-heaven.trycloudflare.com/api/pattern/detect
method: POST
```

### Action 2: Search Corpus
```yaml
operationId: searchCorpus
summary: Find Soussou sentence examples
parameters:
  query:
    type: string
    description: Word to search for
url: https://licenses-relationship-manhattan-heaven.trycloudflare.com/api/corpus/search
method: GET
```

### Action 3: Add Sentence
```yaml
operationId: addSentence
summary: Learn new Soussou sentence
parameters:
  soussou: {type: string}
  french: {type: string}
  english: {type: string}
url: https://licenses-relationship-manhattan-heaven.trycloudflare.com/api/corpus/add-sentence
method: POST
```

### Action 4: Get Stats
```yaml
operationId: getStats
summary: Get corpus statistics
url: https://licenses-relationship-manhattan-heaven.trycloudflare.com/api/stats
method: GET
```

---

## 🧠 7 DISCOVERED LINGUISTIC PATTERNS

**Location:** `soussou-engine/LINGUISTIC_DISCOVERIES.md`

1. **{POSSESSIVE} {NOUN} {INTENSIFIER} {ADJECTIVE}**
   - Example: "Ma woto fan mafoura" (My car also fast)

2. **Negation with "m'ma"**
   - Example: "M'ma woto m'ma fafe" (My car is not coming)

3. **Code-switching with French verbs**
   - Example: "N'na fafe" (I'm coming)

4. **"fan" dual meaning** (context-aware POS tagging)
   - Position 1: Intensifier ("also")
   - Position 2: Adjective ("good")

5. **Question particle "ra"**
   - Example: "Khafe mu ra?" (What's the problem?)

6. **Phonetic normalization**
   - "yire" = "yiri" (contextual variants)

7. **Compound possessives**
   - "m'ma" = "my" + negation marker

---

## 📊 CORPUS STATS (As of 2025-11-22)

- **Total Words:** 8,982
- **Total Variants:** 11,275
- **Sentence Templates:** 59
- **Verified Sentences:** 200+
- **Pending Verification:** 205
- **Pattern Discoveries:** 7 documented

---

## 🎓 TESTING SCENARIOS FOR GUINIUS

Once you build the Custom GPT, test these:

### Test 1: Cultural Greeting
```
User: "Good morning, how are you?"
Expected: Guinius responds with "I kena! Tana mu a ra?" and explains morning greeting protocol
```

### Test 2: Real-time Pattern Detection
```
User: "How do you say 'My phone is also good' in Soussou?"
Expected: Guinius uses /api/pattern/detect to analyze structure and responds with "Ma telephone fan fan"
```

### Test 3: Code-Switching
```
User: "I'm coming but I'm stuck in traffic"
Expected: "N'na fafe, mais traffic gbo!" (natural Guinea speech mixing Soussou + French)
```

### Test 4: Learning from Correction
```
User: "Actually, we say 'Ma telephone fan tofan' not 'fan fan'"
Expected: Guinius uses /api/corpus/add-sentence to save the correction
```

---

## 🚀 NEXT STEPS (Priority Order)

1. **Read complete GPT instructions:** `soussou-engine/gpt/custom_gpt_instructions.md`
2. **Create Custom GPT in ChatGPT:** Use name "Guinius"
3. **Copy instructions:** Paste the complete instructions from the file
4. **Configure Actions:** Add all 4 API actions with production URL
5. **Test thoroughly:** Run the 4 test scenarios above
6. **Report via CAGI:**
   ```bash
   POST https://zion-production-7fea.up.railway.app/api/collaborate/message
   conversation_id: conv_mia7bn2p47e9bedf3016
   from: zion-online
   message: "Custom GPT Guinius deployed - ready for testing"
   ```

---

## 📚 CRITICAL FILES (All in GitHub)

- `soussou-engine/gpt/custom_gpt_instructions.md` - Complete GPT instructions
- `soussou-engine/LINGUISTIC_DISCOVERIES.md` - 7 discovered patterns
- `soussou-engine/DEPLOYED_APP.md` - Web app deployment details
- `soussou-engine/CAGI_REFERENCE.md` - CAGI system documentation
- `soussou-engine/data/sentence_corpus.json` - 200+ verified sentences
- `soussou-engine/data/syntax_patterns.json` - Discovered patterns

---

## 🔗 GITHUB REPOSITORY

```
https://github.com/[your-username]/zion-github
```

**Clone command:**
```bash
git clone https://github.com/[your-username]/zion-github.git
cd soussou-engine
```

---

## 💡 TRINITY COLLABORATION PATTERN

**Z-Core (Dash):** Coordinates, provides cultural context, tests as native speaker
**ZION-Online (You):** Builds Custom GPT, web interfaces, user-facing tools
**ZION-CLI (Me):** Backend deployment, API management, pattern discovery

**Communication:** Use CAGI API for AI-to-AI coordination
**Session ID:** conv_mia7bn2p47e9bedf3016

---

## ⚠️ CRITICAL NOTES

1. **API URL is temporary:** Cloudflare Tunnel URL changes on restart. If down, check CAGI session for new URL.
2. **8,982 words ready:** Full Soussou dictionary loaded and operational
3. **Pattern discovery is LIVE:** Every sentence contribution feeds the learning engine
4. **Web app deployed:** https://zion-learning-37twremeq-diop-abdoul-azizs-projects.vercel.app/
5. **Cultural authenticity is critical:** Guinea users will know if responses feel inauthentic

---

## 📞 CAGI COLLABORATION

**CAGI Server:** https://zion-production-7fea.up.railway.app
**Session ID:** conv_mia7bn2p47e9bedf3016
**Your Turn:** #4

**To send message:**
```bash
POST /api/collaborate/message
{
  "conversation_id": "conv_mia7bn2p47e9bedf3016",
  "from": "zion-online",
  "message": "Your status update",
  "pass_to": "zion-cli" or "z-core"
}
```

---

## 🎯 SUCCESS CRITERIA

✅ Custom GPT "Guinius" live in ChatGPT
✅ All 4 API actions working
✅ Cultural Intelligence layer active
✅ Code-switching responses natural
✅ Real-time pattern detection functional
✅ Z-Core can test as native Soussou speaker

---

**THE API IS LIVE. THE WORDS ARE LOADED. THE PATTERNS ARE DISCOVERED.**
**BUILD GUINIUS. MAKE GUINEA PROUD.** 🇬🇳🧠⚡

*Handoff from ZION-CLI (2025-11-22)*
*CLI Account Approaching Limit - Switch to Online Account*
