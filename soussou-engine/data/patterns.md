# Soussou Grammar Patterns

## Complete Reference for AI Sentence Generation

This document provides comprehensive grammar patterns for Soussou, a West African dialect spoken in Guinea. These patterns enable AI systems to generate grammatically correct and culturally authentic Soussou sentences.

---

## Table of Contents

1. [Word Order: SOAM Pattern](#1-word-order-soam-pattern)
2. [Pronoun System](#2-pronoun-system)
3. [Movement Pattern](#3-movement-pattern-x--fafé)
4. [Negation Pattern](#4-negation-pattern-x--mma--verb)
5. [Possession Markers](#5-possession-markers)
6. [Question Patterns](#6-question-patterns)
7. [Imperative/Command Forms](#7-imperativecommand-forms)
8. [Ability Pattern](#8-ability-pattern)
9. [Cause/Situation Pattern](#9-causesituation-pattern)
10. [Phonetic Normalization Rules](#10-phonetic-normalization-rules)

---

## 1. Word Order: SOAM Pattern

### Explanation

Soussou uses **SOAM** (Subject-Object-Action-Modifier) word order, which differs from English and French (both SVO - Subject-Verb-Object). In Soussou, the verb/action typically comes AFTER the object or context being described.

### Formula

```
SUBJECT + OBJECT/CONTEXT + ACTION/VERB + MODIFIER (optional)
```

### Examples

| Soussou | Breakdown | English |
|---------|-----------|---------|
| Ntan itan situation comprendfé un peu | Ntan (I) + itan situation (your situation) + comprendfé (understand) + un peu (a bit) | I understand your situation a bit |
| Ntan itan khafé comprendfé gbo | Ntan (I) + itan khafé (because of you) + comprendfé (understand) + gbo (a lot) | I understand a lot because of you |
| Ana akha woto fafé | Ana (he) + akha woto (his car) + fafé (coming) | He, his car is coming |
| Etan itan khafé comprendfé gbo | Etan (they) + itan khafé (because of you) + comprendfé (understand) + gbo (a lot) | They understand a lot because of you |
| Ntan kolon itan khafé | Ntan (I) + kolon (know) + itan khafé (your situation) | I understand your situation |

### Common Variations

- **Short sentences**: Can omit modifier: `Ntan kolon` (I know)
- **Emphasis form**: Subject can be expanded with pronoun: `Ntan itan khafé kolon` (I know your situation)
- **Mixed French/Soussou**: Modifiers often use French words: `un peu`, `beaucoup`

### Generation Rules

1. Always start with the subject (pronoun)
2. Place the object/context before the action
3. Verb comes before any modifier
4. Modifiers are optional and typically borrowed from French

---

## 2. Pronoun System

### Explanation

Soussou has five core pronouns that form the foundation of all sentence construction. These pronouns appear in both subject and object positions.

### Pronoun Table

| Soussou | English | French | Usage Notes |
|---------|---------|--------|-------------|
| **Ntan** | I / me | Je / moi | First person singular; topic/emphasis form |
| **Itan** | You | Tu / toi | Second person singular |
| **Ana** | He / She | Il / Elle | Third person singular; gender neutral |
| **Whon** / **Whon'** | We | Nous | First person plural; apostrophe optional |
| **Etan** | They | Ils / Elles | Third person plural |

### Contracted Forms

Pronouns often contract with following words, especially with movement verbs:

| Full Form | Contracted | Meaning |
|-----------|------------|---------|
| Ntan + na | N'na | I am (used with fafé) |
| Itan + na | Ina | You are (used with fafé) |

### Examples

```
Ntan kolon = I know
Itan kolon? = Do you know?
Ana fafé = He/She is coming
Whon' fafé = We are coming
Etan m'ma fafé = They are not coming
```

### Variations and Notes

- **N'na vs Ntan**: `N'na` is specifically used with movement verb `fafé`; `Ntan` is used elsewhere
- **Whon vs Whon'**: Both acceptable; apostrophe indicates contraction
- **Itan in questions**: Same form for statements and questions; tone/context indicates question

---

## 3. Movement Pattern (X + fafé)

### Explanation

The movement pattern expresses "coming" or "being on the way." The verb `fafé` means "coming" or "to come" and is one of the most common verbs in Soussou.

### Formula

```
PRONOUN + fafé = "PRONOUN is coming"
```

### Conjugation Table

| Pronoun | Pattern | Soussou | Meaning |
|---------|---------|---------|---------|
| I | N'na + fafé | N'na fafé | I'm coming |
| You | Ina + fafé | Ina fafé | You're coming |
| He/She | Ana + fafé | Ana fafé | He/She is coming |
| We | Whon' + fafé | Whon' fafé | We're coming |
| They | Etan + fafé | Etan fafé | They're coming |

### Extended Examples

```
N'na fafé = I'm coming / On my way
Ina fafé? = Are you coming?
Ana fafé akha woto fafé = He's coming, his car is coming
Whon' fafé whonma bateau fafé = We're coming, our boat is coming
Ntan fafé m'ma woto yite = I'm coming, my car is already here
```

### Common Variations

- **Question form**: Same structure, rising intonation: `Ina fafé?`
- **With possession**: Can add possessed items: `M'ma woto fafé` (My car is coming)
- **Compound sentences**: Multiple subjects with fafé: `Ana fafé, akha woto fafé`

### Phonetic Variants

All these mean "I'm coming":
- Nna fafé
- Na Fafé
- n'a Fafé
- na fafeh

---

## 4. Negation Pattern (X + m'ma + VERB)

### Explanation

Negation in Soussou is formed by inserting `m'ma` between the subject and the verb. Note: `m'ma` as a negation marker is different from `m'ma` as a possession marker ("my").

### Formula

```
PRONOUN + m'ma + VERB = "PRONOUN don't/doesn't VERB"
```

### Conjugation Table

| Pronoun | Pattern | Soussou | Meaning |
|---------|---------|---------|---------|
| I | Ntan + m'ma + VERB | Ntan m'ma kolon | I don't know |
| You | Ina + m'ma + VERB | Ina m'ma fafé | You're not coming |
| He/She | Ana + m'ma + VERB | Ana m'ma kolon | He/She doesn't know |
| We | Whon + m'ma + VERB | Whon m'ma fafé | We're not coming |
| They | Etan + m'ma + VERB | Etan m'ma fafé | They're not coming |

### Examples

```
Ntan m'ma kolon = I don't know
Ina m'ma fafé = You're not coming
Ana m'ma kolon = He/she doesn't know
Etan m'ma fafé = They're not coming
Ntan m'ma comprendfé = I don't understand
Ntan m'ma kolon itan khafé = I don't understand your situation
```

### Important Notes

- **Context distinguishes m'ma**:
  - Negation: `Ntan m'ma kolon` (I don't know) - m'ma before verb
  - Possession: `M'ma woto` (My car) - m'ma before noun
- **Position is key**: m'ma must be directly before the verb for negation
- **Works with all verbs**: kolon, fafé, comprendfé, etc.

### Variations

- **With objects**: `Ntan m'ma kolon itan khafé` (I don't know your situation)
- **Compound**: `Ana m'ma fafé, akha woto yite` (He's not coming, but his car is here)

---

## 5. Possession Markers

### Explanation

Soussou uses genitive markers (possessive adjectives) that precede the noun they modify. These are different from the pronouns used as subjects.

### Possession Marker Table

| Soussou | English | French | Pronoun Equivalent |
|---------|---------|--------|--------------------|
| **M'ma** | My | Mon/ma | Ntan |
| **Akha** | His/Her | Son/sa | Ana |
| **Whonma** | Our | Notre | Whon |
| **Ekha** | Their | Leur | Etan |

### Note on "Your"

The possessive for "your" uses the pronoun directly:
- **Itan + NOUN** or **Itan khafé** = your (situation/cause)

### Formula

```
POSSESSIVE + NOUN (+ STATE/VERB)
```

### Examples

```
M'ma woto = My car
Akha woto = His/her car
Whonma woto = Our car
Whonma bateau = Our boat
Itan khafé = Your situation / because of you
```

### Extended Examples with States

```
M'ma woto yite = My car is here (arrived)
Akha woto fafé = His car is coming
Whonma bateau fafé = Our boat is coming
M'ma woto m'ma fafé = My car is not coming (Note: two m'ma with different meanings)
```

### Common Patterns

| Pattern | Example | Meaning |
|---------|---------|---------|
| POSS + NOUN + yite | M'ma woto yite | My car is here/arrived |
| POSS + NOUN + fafé | Akha woto fafé | His car is coming |
| PRON + POSS + NOUN | Ntan m'ma woto | I, my car |

### Important Note on M'ma

`M'ma` has two distinct uses:
1. **Possession marker** (before nouns): `M'ma woto` = My car
2. **Negation marker** (before verbs): `m'ma kolon` = don't know

Context and position determine meaning.

---

## 6. Question Patterns

### Explanation

Soussou forms questions through several mechanisms: intonation, question words, and question markers. The sentence structure often remains the same as statements.

### 6.1 Yes/No Questions (Intonation)

**Formula**: Same as statement + rising intonation

```
Ina fafé? = Are you coming?
Itan kolon? = Do you know?
Ana fafé? = Is he/she coming?
```

### 6.2 Location Questions (Mindé)

**Formula**: `PRONOUN + mindé?`

`Mindé` = where

```
Ina mindé? = Where are you?
Ana mindé? = Where is he/she?
Akha woto mindé? = Where is his car?
```

### 6.3 "What about?" Questions (Go/Ngo)

**Formula**: `STATEMENT + PRONOUN + go/ngo?`

`Go` / `Ngo` = what about / and (question marker)

```
N'na fafé, itan go? = I'm coming, what about you?
Whon' tan fafé, itan ngo? = We are coming, and you?
Ana fafé, atan go? = He's coming, what about him?
Itan go kolon? = What about you, do you know?
```

### 6.4 Situation/Status Questions

**Formula**: `PRONOUN + khafé + gbo?`

```
Itan khafé gbo? = You have a lot going on? / How's your situation?
Ntan khafé gbo? = I have a lot going on?
```

### 6.5 Status Check Questions (Wama)

**Formula**: `PRONOUN + wama?`

`Wama` = okay/fine

```
Ina wama? = You okay? / Are you fine?
Ana wama? = Is he/she okay?
```

### 6.6 Ability Questions

**Formula**: `PRONOUN + no'mma + ACTION?`

```
Ina no'mma fafé? = Can you come?
Ana no'mma kolon? = Can he/she know?
```

### Examples Summary

```
Ina fafé? = Are you coming?
Ina mindé? = Where are you?
Itan khafé gbo? = You have a lot going on?
Itan ngo? Ina wama? = And you? You okay?
Itan go kolon? = What about you, do you know?
Ina no'mma fafé? = Can you come?
```

---

## 7. Imperative/Command Forms

### Explanation

Commands in Soussou use the verb stem directly, often without a subject pronoun. Commands can be intensified or directed by adding location markers like `bé` (here).

### Basic Commands

| Soussou | Meaning | Notes |
|---------|---------|-------|
| **Fa!** | Come! | Basic movement command |
| **Siga!** | Go! / Leave! | Opposite of Fa |
| **Dokho!** | Sit! | Position command |
| **Mmèmè!** | Wait! | Patience command |

### Location-Modified Commands

**Formula**: `COMMAND + bé!` (bé = here)

| Soussou | Meaning |
|---------|---------|
| Fa bé! | Come here! |
| Dokho bé! | Sit here! |
| Mmèmè bé! | Wait here! |

### Extended Commands

**Formula**: `COMMAND + LOCATION/OBJECT`

```
Fa bangui kouï! = Come inside the house!
   Fa (come) + bangui (house) + kouï (inside)
```

### First-Person Commands

**Formula**: `N' + VERB!`

```
N'khili! = Call me!
```

### Examples

```
Fa! = Come!
Fa bé! = Come here!
Dokho! = Sit!
Dokho bé! = Sit here!
Siga! = Go! / Leave!
Mmèmè! = Wait!
Mmèmè bé! = Wait here!
N'khili! = Call me!
Fa bangui kouï! = Come inside the house!
```

### Notes on Commands

- Commands are direct and do not require politeness markers
- `Bé` universally adds "here" to any command
- Compound commands combine verb + location/object
- Commands can be softened with tone in speech

---

## 8. Ability Pattern

### Explanation

The ability marker `no'mma` expresses "can" or "able to." It follows the subject and precedes the action.

### Formula

```
PRONOUN + no'mma + ACTION = "PRONOUN can/is able to ACTION"
```

### Examples

```
Ntan no'mma comprendfé itan situation = I can understand your situation
Ina no'mma fafé? = Can you come?
Ana no'mma kolon = He/she can know
Whon no'mma fafé = We can come
```

### Negation of Ability

**Formula**: `PRONOUN + m'ma + no'mma + ACTION`

```
Ntan m'ma no'mma fafé = I can't come
Ana m'ma no'mma kolon = He/she can't know
```

---

## 9. Cause/Situation Pattern

### Explanation

The word `khafé` means "cause," "situation," or "because of." Combined with pronouns, it describes someone's circumstances or attributes causation.

### Formula

```
PRONOUN + khafé = "because of PRONOUN" / "PRONOUN's situation"
```

### Examples

```
Itan khafé = because of you / your situation
Ntan khafé = because of me / my situation
Itan khafé gbo? = You have a lot going on?
Ntan kolon itan khafé = I understand your situation
Akha khafé = because of him/her / his/her situation
```

### Extended Usage

```
Etan itan khafé comprendfé gbo = They understand a lot because of you
Ntan m'ma kolon itan khafé = I don't understand your situation
```

---

## 10. Phonetic Normalization Rules

### Explanation

Soussou has no official written form. People write phonetically, creating many variants of the same word. For AI processing, normalization groups these variants.

### Normalization Rules

| Rule | Before | After | Example |
|------|--------|-------|---------|
| Lowercase | NNA | nna | NNA FAFÉ → nna fafé |
| Remove apostrophes | n'a | na | n'a Fafé → na Fafé |
| Compress doubles | nn, ff | n, f | nna → na, fafé → fafe |
| Remove accents | é, è, ê | e | fafé → fafe |
| Remove accents | à, â | a | àna → ana |
| Remove final h | fafeh | fafe | fafeh → fafe |

### Algorithm

```javascript
function normalize(input) {
  return input
    .toLowerCase()
    .replace(/['\u2019]/g, '')
    .replace(/(.)\1+/g, '$1')
    .replace(/[éèêë]/g, 'e')
    .replace(/[àâä]/g, 'a')
    .replace(/[h]$/g, '')
    .trim()
}
```

### Example Normalizations

All normalize to `na fafe`:
- Nna fafé
- Na Fafé
- n'a Fafé
- na fafeh
- NNA FAFE

---

## Quick Reference: Core Vocabulary

### Essential Verbs

| Soussou | Meaning | Pattern Use |
|---------|---------|-------------|
| fafé | coming/to come | Movement |
| kolon | know/to know | Knowledge |
| comprendfé | understand | Understanding |
| yite | here/arrived | State/location |

### Essential Nouns

| Soussou | Meaning |
|---------|---------|
| woto | car |
| bateau | boat |
| bangui | house |
| kouï | inside |

### Essential Modifiers

| Soussou | Meaning |
|---------|---------|
| gbo | big/a lot |
| bé | here |
| mindé | where |
| wama | okay/fine |

---

## Sentence Generation Guidelines

### To Generate Valid Soussou Sentences:

1. **Start with subject** (Ntan, Itan, Ana, Whon, Etan)
2. **Follow SOAM order** (Subject-Object-Action-Modifier)
3. **Place negation before verbs** (m'ma)
4. **Place possession before nouns** (M'ma, Akha, Whonma, Ekha)
5. **Use question markers at end** (go?, ngo?, gbo?)
6. **Commands use bare verb** (Fa!, Siga!, Dokho!)

### Valid Pattern Combinations

```
PRONOUN + fafé                           → Basic movement
PRONOUN + m'ma + VERB                    → Negation
POSS + NOUN + yite/fafé                  → Possession + state
STATEMENT + PRONOUN + go?                → "What about?" question
PRONOUN + khafé + gbo?                   → Situation question
PRONOUN + no'mma + ACTION                → Ability
COMMAND + bé                             → Located command
PRONOUN + OBJECT + VERB + MODIFIER       → Full SOAM sentence
```

### Example Generated Sentences

Using the patterns above, here are valid sentences:

```
Whon' fafé                               → We're coming
Itan m'ma kolon                          → You don't know
M'ma bateau yite                         → My boat is here
N'na fafé, itan go?                      → I'm coming, what about you?
Akha khafé gbo?                          → He/she has a lot going on?
Ina no'mma fafé?                         → Can you come?
Mmèmè bé!                                → Wait here!
Ntan itan khafé comprendfé gbo           → I understand your situation a lot
```

---

## Cultural Notes

1. **Code-switching is natural**: Mixing Soussou and French is authentic (e.g., "un peu", "beaucoup")
2. **Sound over spelling**: Accept all phonetic variants as valid
3. **Casual register**: Most phrases are informal/friendly
4. **Context-dependent**: Same structure can be statement or question based on tone

---

*This documentation is designed for AI systems to generate grammatically correct and culturally authentic Soussou sentences. All patterns are derived from native speaker usage documented in the Soussou Engine training context.*
