# 🏗️ SOUSSOU ENGINE - BUILD PLAN

**Focus**: Soussou ONLY (Pular later)
**Goal**: Working AI that speaks Soussou in 7-10 days
**Credits Available**: $980 Claude Code

---

## 🎯 PHASE 1: FOUNDATION (TONIGHT - 2-3 HOURS)

### Step 1: Extract Core Vocabulary from Filtered Context

**What to do**:
Read `soussou-engine-FILTERED.md` and extract every Soussou phrase mentioned.

**Examples from context**:
- Ina mindé (Where are you?)
- N'na fafé (I'm coming)
- Ntan (I/me)
- Itan (you)
- Ana (he/she)
- Whon (we)
- Etan (they)
- Khafé (cause/situation)
- Woto (car)
- Yite (here/arrived)
- M'ma (don't/not)
- Kolon (know)
- Fafé (coming)
- Dokho (sit)
- Siga (go)
- Mmèmè (wait)

**Action**: Create a simple list first, then we'll structure it.

---

### Step 2: Create GitHub Repo Structure

**Create these folders/files**:

```bash
cd /home/dash/zion-github
mkdir -p soussou-engine/{data,tools,docs}
cd soussou-engine
```

**Files to create**:

```
soussou-engine/
├── data/
│   ├── lexicon.json          # START HERE
│   ├── patterns.md           # Grammar rules
│   └── examples.json         # Sentence pairs
├── tools/
│   ├── extract_from_context.md  # Guide for pulling phrases
│   └── validate.py              # Future: check data quality
├── docs/
│   └── progress.md              # Track what we build
└── README.md                    # Quick overview
```

---

### Step 3: Build Lexicon v0.1 (30-50 Phrases)

**Template for lexicon.json**:

```json
{
  "version": "0.1",
  "dialect": "Soussou",
  "last_updated": "2025-11-15",
  "entries": [
    {
      "id": "sus_0001",
      "base": "na fafe",
      "variants": ["Nna fafé", "Na Fafé", "n'a Fafé", "na fafeh"],
      "meaning_en": "I'm coming / On my way",
      "meaning_fr": "J'arrive",
      "role": "movement_phrase",
      "context": "friends / checking location",
      "example_reply": "Ina mindé?",
      "reply_meaning_en": "Where are you?"
    },
    {
      "id": "sus_0002",
      "base": "ina minde",
      "variants": ["Ina mindé", "Ina minde", "ina mindé"],
      "meaning_en": "Where are you?",
      "meaning_fr": "Tu es où?",
      "role": "question_location",
      "context": "friends / asking location",
      "example_reply": "N'na fafé",
      "reply_meaning_en": "I'm coming"
    }
  ]
}
```

**How to populate**:
1. Read filtered context carefully
2. Find every Soussou phrase with translation
3. Group variants (Nna fafé = Na Fafé = n'a Fafé)
4. Add meaning_en, meaning_fr, context
5. Target: 30-50 entries for v0.1

---

### Step 4: Document Basic Patterns

**Create patterns.md**:

```markdown
# Soussou Grammar Patterns v0.1

## Word Order: SOAM (Subject-Object-Action-Modifier)

Example:
- Ntan itan situation comprendfé un peu
- (I) (your situation) (understand) (a bit)

## Pronouns

| Soussou | English | French |
|---------|---------|--------|
| Ntan    | I/me    | Je/moi |
| Itan    | You     | Tu     |
| Ana     | He/She  | Il/Elle|
| Whon    | We      | Nous   |
| Etan    | They    | Ils/Elles |

## Common Patterns

### Movement (fafé = coming)
- N'na fafé = I'm coming
- Ina fafé? = Are you coming?
- Ana fafé = He/she is coming
- Whon' fafé = We're coming

### Negation (m'ma = don't/not)
- Ina m'ma fafé = You're not coming
- Ana m'ma kolon = He/she doesn't know
- Ntan m'ma kolon = I don't know

### Location
- Yite = here/arrived
- M'ma woto yite = My car is here
- Woto fafé = Car is coming

### Cause (khafé = because of/situation)
- Itan khafé = because of you / your situation
- Ntan khafé gbo? = I have a lot going on?

(We'll expand this as we learn more)
```

---

## 🤖 PHASE 2: CLAUDE CODE AGENTS (DAY 2-3)

### Agent 1: Web Scout (Find Soussou Resources)

**Prompt for Claude Code**:
```
Search the web for Soussou language resources:
- "Soussou phrases"
- "Susu language greetings Guinea"
- "Soussou dictionary"
- Forums, PDFs, blog posts

Extract any Soussou phrases with French/English translations.
Save to: soussou-engine/raw_sources/web_batch_01.md
```

### Agent 2: Context Extractor (From Our Filtered Doc)

**Prompt for Claude Code**:
```
Read: docs/soussou-engine-FILTERED.md

Extract ALL Soussou phrases with their meanings.
Format as JSON following our lexicon structure.
Output: soussou-engine/data/extracted_from_context.json

Look for patterns like:
- "Ina mindé" = "Where are you"
- Phrase explanations
- Example conversations
- Grammar rules mentioned
```

### Agent 3: Normalizer (Clean & Group Variants)

**Prompt for Claude Code**:
```
Read: soussou-engine/data/extracted_from_context.json

Apply normalization rules:
1. Lowercase
2. Remove apostrophes (n'a → na)
3. Compress doubles (nn→n, ff→f)
4. Remove accents (é→e)

Group variants under base forms.
Output: soussou-engine/data/lexicon_normalized.json
```

### Agent 4: Pattern Detector

**Prompt for Claude Code**:
```
Read: soussou-engine/data/lexicon_normalized.json

Detect patterns:
- Pronoun usage (Ntan, Itan, Ana, etc.)
- Verb conjugation (fafé, kolon, etc.)
- Common sentence structures
- Context tags (greeting, location, payment, etc.)

Add pattern tags to each entry.
Output: soussou-engine/data/lexicon_v0.2.json
```

### Agent 5: Example Generator

**Prompt for Claude Code**:
```
Read: soussou-engine/data/lexicon_v0.2.json

Generate 100 natural Soussou sentences using ONLY words in lexicon.
Mix with French fillers (like real street talk).
Include context tags.

Output: soussou-engine/data/training_examples.json

Format:
{
  "soussou": "N'na fafé, itan go?",
  "meaning_en": "I'm coming, what about you?",
  "meaning_fr": "J'arrive, et toi?",
  "context": "friends_casual",
  "pattern": "movement + question"
}
```

---

## 🎨 PHASE 3: CUSTOM GPT (DAY 4-5)

### Create "DASH Soussou Assistant"

**Custom GPT Instructions**:

```
You are DASH Soussou Assistant.

IDENTITY:
- You speak Soussou, French, and English
- You have the personality of a friendly Guinean friend
- You keep tone warm, respectful, street-smart but never rude
- You help with conversations, translations, and learning Soussou

LANGUAGE RULES:
1. When user writes in Soussou, reply in Soussou first, then optionally clarify in French
2. Mix French and Soussou naturally (like real street talk in Guinea)
3. Use only words from your lexicon (loaded as knowledge file)

NORMALIZATION:
When matching Soussou phrases, normalize by:
- Ignoring apostrophes (n'a = na)
- Ignoring double consonants (nna = na, fafé = fafe)
- Ignoring accents (é = e)
- Matching phonetically (sound matters, not spelling)

LEXICON LEARNING:
If you encounter a Soussou phrase you don't recognize:
1. Try to guess from context
2. Ask: "C'est une nouvelle expression Soussou? Veux-tu que je l'apprenne?"
3. If user confirms, create a LEXICON_COMMIT:

[LEXICON_COMMIT]
phrase: [Soussou phrase]
meaning_fr: [French meaning]
meaning_en: [English meaning]
context: [usage context]
[/LEXICON_COMMIT]

DASH will review and add it to the lexicon.

EXAMPLES OF YOUR STYLE:

User: "Ina mindé?"
You: "N'na fafé boss 😊 (J'arrive)"

User: "How do you say 'I don't know' in Soussou?"
You: "En Soussou on dit: 'Ntan m'ma kolon' (littéralement: I don't know)"

User: "Translate: I'm coming to the house"
You: "En Soussou: 'N'na fafé bangui kouï' (J'arrive à la maison)"

KNOWLEDGE FILES:
- lexicon.json (all Soussou words you know)
- patterns.md (grammar rules)
- examples.json (sentence examples)

Always stay authentic to Guinea street culture.
Never fake African accent or be stereotypical.
Be genuinely helpful and warm.
```

**Upload as Knowledge Files**:
- lexicon.json
- patterns.md
- examples.json

**Test Phrases**:
1. "Ina mindé?" (Should reply: N'na fafé)
2. "How do you say 'where are you' in Soussou?"
3. "Translate this: I don't know your situation"
4. Talk to it in mixed French + Soussou

---

## 🗣️ PHASE 4: VOICE MODE (DAY 6)

### Test with ChatGPT App

**Steps**:
1. Open ChatGPT mobile app (your Android)
2. Go to your custom GPT "DASH Soussou Assistant"
3. Tap voice icon
4. Speak in Soussou: "Ina mindé?"
5. It should reply out loud in Soussou/French mix

**Voice Test Script**:
- Say: "Ina mindé?"
- Expected: "N'na fafé boss"
- Say: "Comment ça va?"
- Expected: "Ça va bien, et toi?"
- Say: "Ntan m'ma kolon itan situation"
- Expected: Recognition + French explanation

**Validation**:
- Test with Amie (she loves languages + AI)
- Test with your Soussou-speaking friends
- Record what works / what sounds weird
- Update lexicon based on feedback

---

## 🚀 PHASE 5: INTEGRATION (DAY 7-10)

### ZION Congregation Protocol

**How ZION learns new Soussou**:

1. User talks to DASH Soussou Assistant
2. Bot encounters unknown phrase
3. Bot creates [LEXICON_COMMIT] with phrase + meaning
4. ZION (you or agents) reviews commits
5. Approved commits → added to lexicon.json
6. Git commit + push to GitHub
7. All ZION instances pull updated lexicon
8. Bot gets smarter automatically

**Example Workflow**:

```bash
# User teaches bot new phrase
User: "In Soussou we say 'khèmè' for money"
Bot: [LEXICON_COMMIT] phrase: khèmè | meaning_fr: argent | meaning_en: money [/LEXICON_COMMIT]

# ZION reviews
cd /home/dash/zion-github/soussou-engine
# Edit data/lexicon.json, add entry
git add data/lexicon.json
git commit -m "Add 'khèmè' (money) to Soussou lexicon"
git push origin main

# Bot updates knowledge (re-upload lexicon.json to GPT)
# Now bot knows "khèmè" = money
```

---

## 📊 SUCCESS METRICS

### Week 1 Goals:
- ✅ 30-50 Soussou phrases in lexicon
- ✅ Basic grammar patterns documented
- ✅ Custom GPT responding in Soussou
- ✅ Voice mode working
- ✅ You + Amie can have simple Soussou conversation with AI

### Week 2 Goals:
- ✅ 100-200 phrases (agents extract from web)
- ✅ Pattern detection automated
- ✅ 5-10 friends tested it
- ✅ First viral screenshot ("Look, DASH AI speaks Soussou!")

### Month 1 Goals:
- ✅ 500+ phrases
- ✅ WhatsApp integration (bot replies in Soussou)
- ✅ Public launch: "First Soussou AI by DASH"
- ✅ Marketing content: "AI that speaks like us"

---

## 💰 BUDGET BREAKDOWN ($980 Credits)

**Phase 2 - Agents** (~$200-300):
- Web Scout: Find 500+ Soussou phrases online
- Context Extractor: Pull everything from our filtered doc
- Normalizer: Clean and group variants
- Pattern Detector: Tag contexts and rules
- Example Generator: Create 500 training sentences

**Phase 3 - Testing** (~$100):
- Iterate on GPT instructions
- Test conversation flows
- Refine normalization rules

**Phase 4 - Validation** (~$50):
- Voice testing iterations
- Bug fixes
- Quality checks

**Reserve** (~$530):
- Expanding to 1000+ phrases
- Adding slang/street terms
- Cultural validation
- Future: Pular extension

---

## 🎯 TONIGHT'S ACTION ITEMS (2-3 hours)

### 1. Create Repo Structure (15 min)
```bash
cd /home/dash/zion-github
mkdir -p soussou-engine/{data,tools,docs}
cd soussou-engine
touch data/lexicon.json data/patterns.md data/examples.json
touch README.md docs/progress.md
```

### 2. Extract First 10 Phrases (60 min)
Read filtered context, find:
- Ina mindé (where are you)
- N'na fafé (I'm coming)
- Ntan m'ma kolon (I don't know)
- Itan khafé (your situation)
- etc.

Create first 10 entries in lexicon.json

### 3. Document Basic Patterns (30 min)
Write in patterns.md:
- Pronouns (Ntan, Itan, Ana, Whon, Etan)
- Movement pattern (X fafé = X coming)
- Negation (X m'ma Y = X don't Y)

### 4. Commit to GitHub (5 min)
```bash
git add soussou-engine/
git commit -m "Soussou Engine v0.1 - Foundation lexicon"
git push origin main
```

### 5. Share with Congregation (5 min)
Update thread.md: "Started building Soussou Engine v0.1 tonight 🔥"

---

## 🔥 LET'S GO!

**This is your era, Z.**

Start tonight. Build the foundation.
Tomorrow we launch the agents.
Week 1: Working AI speaking Soussou.
Month 1: West Africa knows DASH speaks their language.

**Ready when you are, buddy.** 🚀

---

*"Context IS Identity - And we're building identity for West African AI."*
