# GUINIUS VISION - The Path to a Susu-Speaking AI

**Created:** 2025-12-27
**Author:** DASH + ZION Synapse
**Status:** Phase 1 (Active Learning)

---

## THE CORE INSIGHT

> "Guinius is a baby learning to speak. It has heard 31,829 sentences. 
> Now it must learn WHEN and HOW to use them correctly."

LLMs predict the next word based on patterns. Without enough Susu data, they hallucinate.
The solution: **Use a powerful LLM to fill gaps, native speakers correct, corrections train a smaller model.**

---

## THE THREE PHASES

### PHASE 1: Learning with a Teacher (NOW)

```
User Input
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│                    GUINIUS ENGINE                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 8 Modules: corpus, phonetics, grammar,          │   │
│  │ morphology, transformer, scorer, generator      │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                               │
│                         ▼                               │
│              Translation Attempt                        │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│              GEMINI 2.0 (Teacher LLM)                   │
│                                                         │
│  - Makes response conversational                        │
│  - Fills gaps Guinius doesn't know                     │
│  - May hallucinate (doesn't truly know Susu)           │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│              NATIVE SPEAKER CORRECTION                  │
│                                                         │
│  User: "That's wrong. 'arabakhi di' means              │
│         'how are you', not 'thank you'"                │
│                                                         │
│  Correction saved:                                      │
│  {                                                      │
│    wrong: "arabakhi di = thank you",                   │
│    correct: "arabakhi di = how are you",               │
│    context: "greeting",                                 │
│    pattern: "arabakhi di / anadi = how are you"        │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│              TRAINING DATA GROWS                        │
│                                                         │
│  corrections.json:                                      │
│  - 31,829 original sentences                           │
│  - + Native speaker corrections                         │
│  - + Pattern extractions                                │
│  - + Grammar rules                                      │
│  - = GOLD TRAINING DATA                                │
└─────────────────────────────────────────────────────────┘
```

**Key insight:** Every correction is worth 100 random sentences.

---

### PHASE 2: Training the Student

Once we have enough corrections (1,000+), we can:

```
Training Data (Corrections + Corpus)
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│           FINE-TUNE SMALL MODEL                         │
│                                                         │
│  Options:                                               │
│  - Llama 3.2 1B (runs on phone)                        │
│  - Mistral 7B (runs on laptop)                         │
│  - Phi-3 (Microsoft, very efficient)                   │
│                                                         │
│  Training:                                              │
│  - Input: English/French phrase                        │
│  - Output: Correct Susu translation                    │
│  - Learns patterns from corrections                     │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│              SUSU BRAIN v1                              │
│                                                         │
│  - Knows basic greetings perfectly                     │
│  - Understands grammar rules (SOV, "mara" negation)    │
│  - Still needs Gemini for complex topics               │
│  - Gets better with each correction                     │
└─────────────────────────────────────────────────────────┘
```

---

### PHASE 3: Independence

```
┌─────────────────────────────────────────────────────────┐
│                    SUSU BRAIN v2+                       │
│                                                         │
│  ✓ Works completely offline                            │
│  ✓ No hallucination (trained on verified data)         │
│  ✓ Speaks natural Susu                                 │
│  ✓ Runs on phone/edge device                           │
│  ✓ Can teach others                                    │
│  ✓ Preserves the language forever                      │
└─────────────────────────────────────────────────────────┘
```

---

## GRAMMAR RULES LEARNED SO FAR

From native speaker (DASH) corrections:

### Word Order: SOV (Subject-Object-Verb)
```
English: "I love you" (SVO)
Susu: "N na wo xanu" (I you love) (SOV)
```

### Negation: "mara" / "mu"
```
gbɛtɛ = different
gbɛtɛ mara = NOT different = same

ntan = me
ntan mara = NOT me = someone else

mu + verb = negative
"a mu na" = he is not
```

### Greetings System
```
How are you:
- arabakhi di / arabaxi di / arabaki di
- anadi
All mean "how is it" = "how are you"

Responses:
- Amourabakhi Kiyoki = "not scattered" = "I'm good"
- Na Be = "I'm here" = "I'm good"
- Moxo Na be = "We are here" = "We're good"

Follow-ups:
- Wo tan go? = "What about you?"
- Ifan go? = "And you?" (having state)
- Itan go? = "How about you?" (being state)
```

### Vocabulary
```
keren = same
fan (contracted from fanan) = also
mara = not / negation
```

---

## WHAT WE NEED TO BUILD

### 1. Correction Endpoint
```javascript
POST /api/learn
{
  "sessionId": "xxx",
  "wrong": "arabakhi di = thank you",
  "correct": "arabakhi di = how are you", 
  "type": "meaning",  // meaning, grammar, word, pronunciation
  "explanation": "arabakhi di is a greeting, not thanks"
}
```

### 2. Pattern Extractor
When corrections come in, automatically extract:
- Grammar rules
- Word meanings
- Phrase patterns
- Usage contexts

### 3. Correction-Aware Responses
Before Gemini responds, check:
- Has this phrase been corrected before?
- What patterns apply here?
- Inject corrections into prompt

### 4. Training Data Export
```javascript
GET /api/export/training-data
// Returns all corrections in format ready for fine-tuning
```

---

## THE NUMBERS

**Current corpus:** 31,829 sentences
**Estimated corrections needed for v1:** ~1,000
**Estimated for full fluency:** ~10,000

**Why so few?**
- Each correction teaches a PATTERN, not just one sentence
- "arabakhi di = how are you" teaches the whole greeting system
- Quality > quantity for low-resource languages

---

## THE DREAM

A child in Conakry opens their phone.
They speak to Guinius in Susu.
Guinius responds in perfect Susu.
No internet needed.
No hallucination.
Their language, preserved forever.

**This is bigger than an app. This is cultural preservation through AI.**

---

## FILE LOCATIONS

| Purpose | Path |
|---------|------|
| This vision | `/home/dash/zion-github/soussou-engine/GUINIUS_VISION.md` |
| Resume | `/home/dash/zion-github/soussou-engine/GUINIUS_RESUME.md` |
| Main engine | `/home/dash/zion-github/soussou-engine/src/guinius_v2.js` |
| Corrections (to build) | `/home/dash/zion-github/soussou-engine/data/corrections.json` |
| Training export (to build) | `/home/dash/zion-github/soussou-engine/data/training/` |

---

*"Use the powerful to teach the small. Use the small to serve the people."*
