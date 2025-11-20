# Soussou Engine - Validation Checklist

This checklist is used to validate the quality and authenticity of Soussou language generation and responses.

---

## 1. Grammar Correctness

### Word Order
- [ ] SOV (Subject-Object-Verb) order is maintained for declarative sentences
- [ ] Questions end with question words (minde, yiri, etc.)
- [ ] Negation marker (m'ma) appears before the verb
- [ ] Intensifier (gbo) appears at the end of phrases
- [ ] Possessives precede their nouns (M'ma woto, not woto M'ma)

### Verb Forms
- [ ] Correct use of -fe suffix for continuous actions (fafe, sigafe, etc.)
- [ ] Proper imperative forms (root verb without suffix)
- [ ] Correct tense markers (naxa for narrative past)

### Pronouns
- [ ] Correct pronoun selection (Ntan vs N'na, Itan vs Ina, etc.)
- [ ] Emphatic forms used appropriately (-tan forms for emphasis)
- [ ] Possessive contractions correct (M'ma, Akha, Ekha, etc.)

### Particles
- [ ] Correct use of xa (possessive/conditional/subjunctive)
- [ ] Appropriate use of tan (only/emphasis)
- [ ] Proper location markers (be, yire, koui)
- [ ] Correct negation with mu/m'ma

---

## 2. Natural Flow

### Sentence Length
- [ ] Sentences are appropriate length (not too long or fragmented)
- [ ] Complex ideas broken into natural segments
- [ ] Breath groups feel natural when spoken aloud

### Rhythm
- [ ] Syllable patterns feel natural
- [ ] Stress falls on expected syllables
- [ ] No awkward word combinations

### Transitions
- [ ] Smooth transitions between topics
- [ ] Appropriate use of connectors (mais, apres, barima)
- [ ] Logical progression of ideas

### Response Timing
- [ ] Responses appropriate for context
- [ ] Not overly verbose for simple questions
- [ ] Sufficient detail for complex inquiries

---

## 3. Appropriate Formality

### Register Selection
- [ ] Formal language for elders/religious contexts
- [ ] Casual register for peers/friends
- [ ] Business appropriate for professional contexts

### Greeting Protocols
- [ ] Morning greeting (kena) vs evening (suba) correct
- [ ] Family/health inquiries in proper order
- [ ] Blessings (Ala xa baraka) at appropriate times

### Honorifics
- [ ] Respectful forms for elders
- [ ] Appropriate titles used
- [ ] Proper deference shown

### French Integration
- [ ] French words used naturally where common
- [ ] Not over-using French when Soussou exists
- [ ] Correct Soussou grammar around French words

---

## 4. Cultural Authenticity

### Religious Elements
- [ ] Appropriate use of Ala (God) references
- [ ] Correct blessing formulas
- [ ] Amin used properly after prayers/wishes

### Social Customs
- [ ] Extended greetings for family/health
- [ ] Hospitality expressions correct (Te min, Dokho be)
- [ ] Farewell blessings appropriate

### Time References
- [ ] Understanding of wulu sakhe (sun passing) for time
- [ ] Correct day names
- [ ] Prayer time references if applicable

### Market/Shopping
- [ ] Negotiation expectations reflected
- [ ] Quality assurances authentic
- [ ] Price expressions natural

### Family Structure
- [ ] Correct family terms (baba, boke, tara, etc.)
- [ ] Understanding of extended family importance
- [ ] Proper inquiry patterns for family wellness

---

## 5. French Mixing Quality

### Appropriate Integration
- [ ] French used for modern/technical terms
- [ ] Soussou grammar maintained around French
- [ ] Natural code-switching patterns

### Common Patterns
- [ ] Numbers often in French (correct)
- [ ] Days/months may be French (correct)
- [ ] Technical terms from French (telephone, voiture, etc.)

### Soussou Suffix on French Roots
- [ ] -fe suffix applies correctly (comprendfe, negotiefe)
- [ ] Meaning preserved
- [ ] Sounds natural to speakers

### Avoid Over-Frenchification
- [ ] Use Soussou when equivalent exists
- [ ] Balance appropriate for context
- [ ] Not mixing where jarring

---

## 6. Response Appropriateness

### Context Matching
- [ ] Response matches question type
- [ ] Appropriate emotional tone
- [ ] Correct information type returned

### Information Completeness
- [ ] All requested information provided
- [ ] No extraneous information
- [ ] Natural follow-up possibilities

### Politeness
- [ ] Thanks (balake) where expected
- [ ] Apologies (pardon) when appropriate
- [ ] Encouragement (courage) for difficulties

---

## 7. Normalization Quality

### Variant Recognition
- [ ] Common spelling variants recognized
- [ ] Accent variations handled
- [ ] Apostrophe variations normalized

### Unknown Words
- [ ] Reasonable suggestions provided
- [ ] Similar-sounding words offered
- [ ] Clear indication of uncertainty

### Edge Cases
- [ ] Empty input handled
- [ ] Special characters processed
- [ ] Mixed content (numbers, punctuation) handled

---

## 8. Testing Criteria

### Pass Criteria
- All grammatical tests pass (100%)
- Natural flow score >= 80%
- Cultural authenticity >= 90%
- Response appropriateness >= 85%

### Warning Criteria
- 1-3 grammatical errors
- Slightly unnatural phrasing
- Minor cultural inaccuracies

### Fail Criteria
- More than 3 grammatical errors
- Unnatural/robotic responses
- Cultural misrepresentation
- Wrong context responses

---

## 9. Manual Review Items

For each generated sentence, verify:

1. **Read aloud test**: Does it sound natural when spoken?
2. **Native speaker test**: Would a native speaker accept this?
3. **Context test**: Does the response fit the situation?
4. **Meaning test**: Is the meaning correctly conveyed?
5. **Cultural test**: Are cultural norms respected?

---

## 10. Example Validations

### Good Example
```
Input: "Ina minde?"
Response: "N'na fafe. Cinq minutes."

Grammar: OK (S+V with time modifier)
Natural: OK (common response pattern)
Formal: OK (peer-level casual)
Cultural: OK (time estimate appropriate)
French: OK (numbers commonly in French)
```

### Needs Improvement
```
Input: "I baba minde?"
Response: "A est a la maison"

Grammar: FAIL (French sentence structure)
Natural: FAIL (not Soussou at all)
Cultural: FAIL (no Soussou expression)
French: FAIL (over-reliance on French)

Better: "A bangui koui" or "A na bangui"
```

---

## Version History

- v1.0 - Initial checklist creation
- Last updated: 2025-11-20
