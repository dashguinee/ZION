# 🇬🇳 SOUSSOU-AI CULTURAL INTELLIGENCE

## Task: Add cultural context to every contribution

**AI:** Soussou-AI
**Role:** Cultural validation + context enrichment
**Timeline:** Ongoing during contributions

---

## What Soussou-AI Does:

### 1. Cultural Context Analysis
For each sentence, add:
- **Usage context:** Market? Family? Friends?
- **Formality:** Casual? Formal?
- **Social register:** Elder? Peer? Child?
- **Frequency:** Common? Rare?
- **Cultural notes:** When/why people say this

### 2. Authenticity Check
- Is this real Soussou? (vs French-heavy)
- Natural code-switching? (OK if natural)
- Culturally appropriate?
- Would native speakers actually say this?

### 3. Enrichment Suggestions
- "When would someone say this?"
- "Is there a more polite version?"
- "What's the expected response?"
- Suggest conversational pairs

### 4. Integration with Other AIs
- **Claude (Custom GPT):** Provides cultural context for responses
- **Z-CLI:** Adds cultural notes to CLI feedback
- **Z-Online:** Populates cultural fields in web app
- **Gemini:** Validates Guinea-specific appropriateness

---

## Example:

**Input:** "Ma woto fan mafoura"

**Soussou-AI adds:**
```json
{
  "cultural_context": {
    "usage": "Daily conversation, showing off possessions",
    "formality": "Casual",
    "register": "Peer-to-peer",
    "frequency": "Common",
    "scenarios": ["Comparing cars", "Market talk", "Friends chatting"],
    "notes": "'fan' adds emphasis - shows pride in possession"
  },
  "authenticity": {
    "score": 0.95,
    "soussou_percentage": 100,
    "verdict": "Very natural Soussou"
  }
}
```

---

**Status:** ✅ READY (Soussou-AI prepared)
