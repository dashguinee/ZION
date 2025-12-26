# GUINIUS AI - Project Resume

**Last Updated:** 2025-12-27
**Status:** PRODUCTION DEPLOYED
**Version:** 2.1.0 FULL

---

## WHAT IS GUINIUS

Guinius is the **world's first AI that speaks Susu (Soussou)** - a language spoken by ~2 million people in Guinea, Sierra Leone, and Guinea-Bissau. It combines a 31,829 sentence corpus with Gemini 2.0 Flash for conversational AI.

---

## LIVE URLS

| Service | URL |
|---------|-----|
| **Frontend (PWA)** | https://soussou-ai.vercel.app |
| **Backend API** | https://soussou-api.vercel.app |
| **Health Check** | https://soussou-api.vercel.app/api/health |

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│            React + Vite + TypeScript + Tailwind v4              │
│                   soussou-ai.vercel.app                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API                                │
│               Vercel Serverless (api/index.js)                  │
│                  soussou-api.vercel.app                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              GUINIUS v2.1.0 FULL ENGINE                 │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │ 8 INTEGRATED MODULES:                                   │   │
│   │ ✅ sentenceGenerator     - SOV grammar-aware generation │   │
│   │ ✅ translationTransformer - SOV reordering, pronouns    │   │
│   │ ✅ qualityScorer         - Multi-candidate scoring      │   │
│   │ ✅ grammarExtractor      - Pattern detection            │   │
│   │ ✅ morphologyAnalyzer    - Word breakdown               │   │
│   │ ✅ phoneticMapper        - Variant matching (ɔ/o, ɛ/e)  │   │
│   │ ✅ fallbackSystem        - French bridge + gaps         │   │
│   │ ✅ conversationModule    - Context tracking             │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    GEMINI 2.0 FLASH                     │   │
│   │              Conversational AI Enhancement              │   │
│   │           API Key: AIzaSyC0GIOy... (in code)            │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## CORPUS STATS

| Metric | Count |
|--------|-------|
| **Total Sentences** | 31,829 |
| **English Words** | 4,388 |
| **Susu Words** | 4,114 |
| **Sources** | Bible (30,966), Conversational (901), SMOL (863), Gatitos (4,000), Lexicon (404) |

---

## API ENDPOINTS

### GET /api/health
Returns system status and all module states.

### POST /api/translate
```json
{
  "text": "I love you",
  "from": "auto",
  "to": "sus"
}
```

### POST /api/chat
```json
{
  "message": "How do I say hello?",
  "sessionId": "optional-session-id",
  "mode": "learn"
}
```

---

## KEY FILES

| File | Purpose |
|------|---------|
| `/api/index.js` | Vercel serverless entry point |
| `/api/package.json` | Dependencies for Vercel (CRITICAL for Gemini) |
| `/src/guinius_v2.js` | Main translation engine with all 8 modules |
| `/src/translation_transformer.js` | SOV reordering, pronoun simplification |
| `/src/quality_scorer.js` | Multi-candidate scoring |
| `/src/grammar_extractor.js` | Pattern detection |
| `/src/morphology_analyzer.js` | Word breakdown |
| `/src/phonetic_mapper.js` | Variant matching |
| `/src/sentence_generator.js` | Grammar-aware generation |
| `/src/sentence_matcher.js` | Corpus matching |
| `/vercel.json` | Vercel deployment config |

---

## TRANSLATION PIPELINE (v2.1.0)

```
1. INPUT RECEIVED
   │
2. PRE-PROCESSING
   ├── Morphology Analysis (for Susu input)
   ├── Grammar Pattern Extraction
   └── Phonetic Variants Generation
   │
3. CANDIDATE GENERATION
   ├── Exact Corpus Match (confidence: 100%)
   ├── Phonetic Variant Match (confidence: 90%)
   ├── Fuzzy Corpus Match (confidence: 70-90%)
   └── Grammar-Aware Generation (confidence: 50-70%)
   │
4. QUALITY SCORING
   └── Pick best from all candidates using:
       - Method priority
       - Confidence score
       - Quality metrics
   │
5. POST-PROCESSING
   └── Translation Transformer
       - Pronoun simplification
       - SOV reordering
       - Tense marker insertion
   │
6. FALLBACK (if no candidates)
   ├── Google Translate
   ├── French Bridge
   └── Gap Recording
   │
7. OUTPUT + GEMINI ENHANCEMENT
   └── Conversational response with suggestions
```

---

## SUSU LANGUAGE NOTES

- **Word Order:** SOV (Subject-Object-Verb) - "N na wo xanu" = "I love you" (literally: I you love)
- **Tonal:** Yes, with nasalization
- **Key Particles:**
  - `na` = linking verb (is)
  - `naxa` = narrative past tense
  - `bara` = completed aspect
  - `mu` = negation
- **Common Greetings:**
  - "Inou wali!" = Hello!
  - "Tana ma seni?" = How are you?
  - "Tana fanyi" = I'm fine
  - "I ni ke" = Thank you

---

## FRONTEND DETAILS

**Location:** `/home/dash/zion-github/soussou-app/frontend/`
**Deployed:** https://soussou-ai.vercel.app

**Tech Stack:**
- React 18 + TypeScript
- Vite 6
- Tailwind CSS v4 (uses `@import "tailwindcss"` + `@theme` directive)
- Guinea flag colors: Red #CE1126, Yellow #FCD116, Green #009460

**Key Features:**
- Chat interface with AI responses
- Translation mode
- Voice input (configured for Whisper, needs OpenAI key)
- Mobile-responsive PWA

---

## GEMINI CONFIGURATION

```javascript
// In api/index.js
const GEMINI_API_KEY = 'AIzaSyC0GIOyUh3FHlb3gRW7boj8YMPmz1cOIBM';
gemini = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.7,
    topP: 0.9,
    maxOutputTokens: 500
  }
});
```

**System Prompt:** Guinius is configured to:
- SPEAK Susu naturally, not just translate
- Start responses with Susu phrases
- Explain in user's language (EN/FR)
- Provide pronunciation tips
- Suggest related phrases

---

## WHAT'S WORKING

✅ Full 8-module translation pipeline
✅ 31,829 sentence corpus matching
✅ Gemini 2.0 Flash conversational AI
✅ French and English support
✅ Phonetic variant matching
✅ Quality scoring for best translation
✅ SOV grammar-aware generation
✅ Production deployment on Vercel

---

## KNOWN ISSUES / TODO

1. **JSON Parse Errors:** Some Gemini responses fail JSON parsing (fallback in place)
2. **Voice Input:** Whisper API configured but needs OpenAI key
3. **Offline Mode:** PWA structure exists but offline caching not implemented
4. **User Contributions:** Gap recording works but no UI for submissions

---

## HOW TO CONTINUE

1. **Load this resume:** Read `/home/dash/zion-github/soussou-engine/GUINIUS_RESUME.md`
2. **Check health:** `curl https://soussou-api.vercel.app/api/health`
3. **Test locally:** `node -e "const g = require('./src/guinius_v2'); g.translate('hello').then(console.log)"`
4. **Deploy:** `npx vercel --prod --yes` then alias to `soussou-api.vercel.app`

---

## GIT REPOS

- **Engine:** `/home/dash/zion-github/soussou-engine/` (part of ZION monorepo)
- **Frontend:** `/home/dash/zion-github/soussou-app/frontend/`
- **Remote:** github.com/dashguinee/ZION

---

*This is GUINIUS - The first AI that speaks Susu. A priceless gift to Guinea.*
