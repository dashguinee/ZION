# Soussou Morphological Pattern Analysis

## Overview

This document provides a comprehensive analysis of how Soussou words are built and derived. Soussou is a West African language spoken primarily in Guinea, with no standardized written form, resulting in multiple phonetic spellings of the same words.

Understanding these morphological patterns enables AI systems to:
- Recognize word variations
- Generate grammatically valid new words
- Parse complex constructions
- Handle code-switching with French

---

## 1. Verb Formation

### 1.1 The -fe Suffix (Action/Continuous Marker)

The most productive verb-forming suffix in Soussou is **-fe** (also spelled -fe, -feh). This suffix creates action verbs, particularly from French roots.

#### Formation Rule
```
ROOT + fe = action verb
```

#### Examples

| Root | Derived | Meaning | Notes |
|------|---------|---------|-------|
| comprend (French) | comprendfé | to understand/understanding | French root + Soussou suffix |
| fa | fafé | coming/to come | Native root |
| siga | sigafé | going/to go | Native root |

#### Usage Notes
- Can attach to both French and Soussou roots
- Indicates ongoing or continuous action
- Often corresponds to English "-ing" form
- Very productive for creating new verbs from French borrowings

### 1.2 The -xi Suffix (Past/Perfective Marker)

The **-xi** suffix marks completed action or past participle.

#### Formation Rule
```
VERB_ROOT + xi = perfective/past form
```

#### Examples

| Root | Derived | Meaning |
|------|---------|---------|
| fala (speak) | falaxi | said/spoken |
| ba (do/finish) | baxi | finished/done |
| faxamu (understand) | faxamuxi | understood |
| keli (leave) | kelixi | left/departed |
| tongo (take) | tongoxi | taken |
| to (see) | toxi | seen |
| suxu (hold) | suxuxi | held/touched |
| soto | sotoxi | obtained/gotten |
| dangi | dangixi | passed |
| bira | biraxi | followed |

#### Usage Notes
- Highly productive suffix
- Creates perfective aspect (completed action)
- Equivalent to past participle in English

### 1.3 Verbal Prefixes

#### ra- (Causative Prefix)
Creates causative meaning or indicates direction/location.

```
ra + VERB = to cause to VERB
```

Example: `raba` = to cause to do, to make do

#### ma- (Present/Future Marker)
Indicates present or future action when used as verbal prefix.

```
ma + VERB = is VERB-ing / will VERB
```

**Important**: `ma` also functions as a possessive marker; context determines meaning.

### 1.4 Tense/Aspect Particles

These particles modify verb tense without attaching directly:

| Particle | Function | Position | Example |
|----------|----------|----------|---------|
| ne/ne | past tense | after subject | Subject + ne + Verb |
| bara | perfective/completive | after subject | Subject + bara + Verb |
| don | already/now | sentence final | ... + don |

---

## 2. Pronoun System and Contractions

### 2.1 Base Pronoun System

Soussou has a rich pronoun system with multiple forms for each person:

| Person | Base | Emphatic | Subject | Object |
|--------|------|----------|---------|--------|
| 1st sing | n | Ntan (n tan) | N'na | N' |
| 2nd sing | i | Itan (i tan) | Ina | I |
| 3rd sing | a | Atan (a tan) | Ana | A |
| 1st pl (incl) | won | won tan | won | won |
| 1st pl (excl) | muxu | muxu tan | muxu | muxu |
| 2nd pl/formal | wo | wo tan | wo | wo |
| 3rd pl | e | Etan (e tan) | e | e |

### 2.2 Contraction Patterns

#### Pattern 1: Pronoun + tan = Emphatic Form

The particle `tan` creates emphatic/topicalized pronouns:

```
n + tan → Ntan (me, I - emphatic)
i + tan → Itan (you - emphatic)
a + tan → Atan (he/she - emphatic)
e + tan → Etan (they - emphatic)
```

**Usage**: Used when the pronoun is the topic of the sentence or needs emphasis.

Example: `Ntan m'ma kolon` = "I (for my part) don't know"

#### Pattern 2: Pronoun + na = Subject Action Form

The particle `na` creates subject forms used with action verbs:

```
n + na → N'na (I am + action)
i + na → Ina (you are + action)
```

**Usage**: Specifically with movement verbs and states.

Example: `N'na fafé` = "I'm coming"

#### Pattern 3: Object Pronoun + Verb

Object pronouns contract with following verbs:

```
N' + khili → N'khili (call me)
N' + mato → N'mato (look at me)
```

### 2.3 Inclusive vs Exclusive "We"

Soussou distinguishes between:

- **Won/Whon'** (inclusive): "we" including the listener
- **Muxu/Moukhou** (exclusive): "we" excluding the listener

Example:
- `Whon' fafé` = "We (all of us, including you) are coming"
- `Moukhou fafé` = "We (but not you) are coming"

---

## 3. Possessive Formation

### 3.1 The Two-Marker System

Soussou uses two possessive markers distributed by person:

| Marker | Persons | Contracted Forms |
|--------|---------|------------------|
| **ma** | 1st person (my, our) | M'ma, Whonma |
| **kha** | 2nd & 3rd person (your, his/her, their) | Ikha, Akha, Ekha |

### 3.2 First Person Possessives (ma marker)

#### My (1st singular)
```
n + ma + NOUN → my NOUN
```

| Full Form | Contracted | Example | Meaning |
|-----------|------------|---------|---------|
| n ma woto | M'ma woto | M'ma woto | my car |
| n ma gine | - | n ma gine | my wife |
| n ma xame | - | n ma xame | my husband |

#### Our (1st plural)
```
won + ma + NOUN → our NOUN
```

| Full Form | Contracted | Example | Meaning |
|-----------|------------|---------|---------|
| won ma woto | Whonma woto | Whonma woto | our car |
| won ma bateau | Whonma bateau | Whonma bateau | our boat |

### 3.3 Second/Third Person Possessives (kha marker)

#### Your (2nd singular)
```
i + kha + NOUN → your NOUN
```

| Full Form | Contracted | Example | Meaning |
|-----------|------------|---------|---------|
| i kha woto | Ikha woto | Ikha woto | your car |

**Alternate pattern**: `itan + NOUN` or `itan + khafé`
- `Itan khafé` = your situation / because of you

#### His/Her (3rd singular)
```
a + kha + NOUN → his/her NOUN
```

| Full Form | Contracted | Example | Meaning |
|-----------|------------|---------|---------|
| a kha woto | Akha woto | Akha woto | his/her car |
| a baba | - | a baba | his/her father |

#### Their (3rd plural)
```
e + kha + NOUN → their NOUN
```

| Full Form | Contracted | Example | Meaning |
|-----------|------------|---------|---------|
| e kha woto | Ekha woto | Ekha woto | their car |
| Etan kha avion | Ekha avion | Ekha avion | their airplane |
| e baba | - | e baba | their father |

### 3.4 Pattern Summary

The possessive markers follow a clear pattern:

- **-ma** for 1st person: `M'ma` (my), `Whonma` (our)
- **-kha** for 3rd person: `Akha` (his/her), `Ekha` (their)
- **-kha** for 2nd person: `Ikha` (your)

This suggests an original system where `-ma` indicated self/group identity and `-kha` indicated "other."

---

## 4. Negation Rules

### 4.1 Negation Markers

Soussou has two main negation forms:

| Marker | Type | Position |
|--------|------|----------|
| mu | full particle | before verb |
| m'ma | contracted | before verb |

### 4.2 Sentence Structure

```
SUBJECT + m'ma/mu + VERB = SUBJECT doesn't VERB
```

#### Examples with m'ma

| Soussou | Breakdown | English |
|---------|-----------|---------|
| Ntan m'ma kolon | Ntan + m'ma + kolon | I don't know |
| Ina m'ma fafé | Ina + m'ma + fafé | you're not coming |
| Ana m'ma kolon | Ana + m'ma + kolon | he/she doesn't know |
| Etan m'ma fafé | Etan + m'ma + fafé | they're not coming |
| Ntan m'ma comprendfé | Ntan + m'ma + comprendfé | I don't understand |
| Whon m'ma fafé | Whon + m'ma + fafé | we're not coming |

#### Examples with mu

| Soussou | English |
|---------|---------|
| N mu a faxamuxi | I don't understand |

### 4.3 Disambiguating m'ma

**Critical Point**: `m'ma` has two distinct meanings:

1. **Negation marker** (before verbs): `m'ma kolon` = "don't know"
2. **Possessive marker** (before nouns): `M'ma woto` = "my car"

**Position determines meaning**:
- Before VERB → negation
- Before NOUN → possession

**Example with both meanings**:
```
M'ma woto m'ma fafé
(My car) (is not coming)
possessive  negation
```

### 4.4 Negating Ability

```
SUBJECT + m'ma + no'mma + ACTION = SUBJECT can't ACTION
```

Example: `Ntan m'ma no'mma fafé` = "I can't come"

---

## 5. Plural Formation

### 5.1 The -e Suffix

The primary plural marker in Soussou is **-e**:

```
SINGULAR + e = PLURAL
```

#### Examples

| Singular | Plural | Meaning |
|----------|--------|---------|
| di (child) | diye | children |
| mixi (person) | mixie | people |
| adamadi (human) | adamadie | humans |

### 5.2 Dual Function of -e

The morpheme `-e` serves two functions:

1. **Plural suffix** on nouns: `diye` (children)
2. **Third person plural pronoun**: `e` (they)

This reflects a common grammatical pattern where plural marking and third-person plural pronouns share morphological form.

### 5.3 Usage Notes

- Soussou uses fewer overt plural markers than many languages
- Context often indicates plurality
- Some nouns may not take the -e suffix
- Number words after nouns can indicate plurality: `di firin` (two children)

---

## 6. Compound Word Formation

### 6.1 Number Compounds

Numbers above 10 use the connector **nun** (and):

```
BASE_NUMBER + nun + ADDED_NUMBER
```

#### Examples

| Soussou | Breakdown | Meaning |
|---------|-----------|---------|
| fuu nun keren | 10 + and + 1 | 11 |
| moxogeng nun suli | 20 + and + 5 | 25 |
| keme firin | hundred + two | 200 |
| keme saxan | hundred + three | 300 |

### 6.2 Verb + Location Compounds

Commands commonly combine with location markers:

```
VERB + be = VERB here
VERB + yire = VERB there
```

#### Examples

| Soussou | Breakdown | Meaning |
|---------|-----------|---------|
| Fa be | come + here | come here |
| Siga yire | go + there | go there |
| Dokho be | sit + here | sit here |
| Mmeme be | wait + here | wait here |
| Fa bangui kouï | come + house + inside | come inside the house |

### 6.3 Object + Verb Compounds

Following SOV word order, objects precede verbs:

```
OBJECT + VERB
```

#### Examples

| Soussou | Breakdown | Meaning |
|---------|-----------|---------|
| Gui sonyi | that + give | give me that |
| A mato | him/her + look | look at him/her |
| N'khili | me + call | call me |

### 6.4 Cause/Situation Compounds

The word `khafé` combines with pronouns for cause expressions:

```
PRONOUN + khafé = because of PRONOUN / PRONOUN's situation
```

#### Examples

| Soussou | Meaning |
|---------|---------|
| Itan khafé | because of you / your situation |
| Ntan khafé | because of me / my situation |
| Atan khafé | because of him/her |
| Etan khafé | because of them |

### 6.5 French-Soussou Hybrids

Code-switching between French and Soussou is natural and common:

#### French Root + Soussou Suffix

| Hybrid | French Root | Soussou Suffix | Meaning |
|--------|-------------|----------------|---------|
| comprendfé | comprend | -fé | to understand |

#### Soussou Grammar + French Noun

| Hybrid | Meaning |
|--------|---------|
| Whonma bateau | our boat |
| Etan kha avion | their airplane |
| Account n'ma yitima na | Your account is almost finished |

#### French Modifiers in Soussou Sentences

French modifiers like `un peu` (a bit), `beaucoup` (a lot) naturally appear:

```
Ntan sosokhoui kolon un peu
I Soussou know a-bit
"I understand Soussou a bit"
```

---

## 7. Word Formation Templates

### 7.1 Creating New Verbs

#### From French Roots
```
FRENCH_VERB_ROOT + fé → Soussou action verb
```
Example: If you want to say "calling/phoning" using French "appel":
`appelfé` (calling)

#### Past/Perfective Forms
```
VERB_ROOT + xi → perfective verb
```
Example: Creating past form of `keli` (leave):
`kelixi` (left)

### 7.2 Creating Pronouns

#### Emphatic Forms
```
PRONOUN_BASE + tan → emphatic pronoun
```
All pronouns can take emphatic form: n → Ntan, i → Itan, etc.

#### Subject Action Forms
```
PRONOUN_BASE + na → subject-action pronoun
```
Creates forms used with action verbs: n → N'na, i → Ina

### 7.3 Creating Possessives

Use the two-marker system:

```
1st person: PRONOUN + ma + NOUN
Other:      PRONOUN + kha + NOUN
```

### 7.4 Validation Rules

A generated word is valid if it:

1. Follows established syllable patterns (CV, CVC, CVCV)
2. Uses documented suffixes (-fé, -xi) correctly
3. Maintains phonological patterns (kh, gb, ng clusters)
4. Follows correct word order for compounds (SOV)

---

## 8. Phonological Patterns

### 8.1 Apostrophe Contractions

Apostrophes indicate elision or contraction:

| Written | Indicates |
|---------|-----------|
| N' | contracted `n` before consonant |
| M'ma | contracted `n ma` |
| Whon' | contracted `won` |

### 8.2 Common Consonant Clusters

Soussou uses several consonant clusters common in West African languages:

| Cluster | Examples |
|---------|----------|
| kh | khafé, kha, khili |
| gb | gbo, sogbè |
| ng | bangui |
| nd | mindé |
| mb | mb sounds |

### 8.3 Vowel Patterns

| Pattern | Notes |
|---------|-------|
| é, è | Often interchangeable in casual writing |
| e | Can represent both é and è |
| Final -e | Common noun ending |

---

## 9. Summary of Key Patterns

### Verb Suffixes
- **-fé**: action/continuous (comprendfé)
- **-xi**: past/perfective (falaxi)

### Pronoun System
- Base: n, i, a, won/muxu, wo, e
- Emphatic: + tan (Ntan, Itan)
- Subject: + na (N'na, Ina)

### Possessive Markers
- 1st person: **-ma** (M'ma, Whonma)
- 2nd/3rd person: **-kha** (Ikha, Akha, Ekha)

### Negation
- **m'ma** or **mu** before verb
- Pattern: Subject + m'ma + Verb

### Plural
- **-e** suffix (di → diye)

### Word Order
- **SOAM**: Subject-Object-Action-Modifier

---

## 10. Practical Examples

### Generating Valid Words

#### New Verb from French
Want: "downloading"
```
download → downloadfé
"N'na downloadfé" = "I'm downloading"
```

#### Possessive Construction
Want: "your phone"
```
i + kha + phone → Ikha phone
```

#### Negative Statement
Want: "They don't understand"
```
Etan + m'ma + comprendfé → Etan m'ma comprendfé
```

#### Past Action
Want: "I said"
```
N + fala + xi → N falaxi
```

---

## References

- Source Lexicon: 8,882 words from `/home/user/ZION/soussou-engine/data/lexicon.json`
- Grammar Patterns: `/home/user/ZION/soussou-engine/data/patterns.md`
- Training Context: `/home/user/ZION/soussou-engine/raw/context_extraction.json`

---

*This analysis enables AI systems to generate grammatically valid Soussou words and understand the morphological patterns underlying the language.*
