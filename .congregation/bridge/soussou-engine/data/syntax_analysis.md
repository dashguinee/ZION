# Soussou Syntax and Word Connection Analysis

## Overview

This document analyzes Soussou sentence construction patterns, word connections, and grammatical rules based on analysis of the lexicon, training examples, and Bible translations. The goal is to enable AI systems to generate grammatically correct Soussou sentences.

---

## 1. Core Sentence Patterns

### 1.1 Basic Word Order: SOAM (Subject-Object-Action-Modifier)

Soussou follows a Subject-Object-Verb (SOV) pattern, often extended with Modifiers at the end.

**Examples:**

| Soussou | English | Breakdown |
|---------|---------|-----------|
| Ntan sosokhoui kolon un peu | I understand Soussou a bit | S-O-V-M |
| Ntan itan situation comprendfe gbo | I understand your situation a lot | S-O-V-M |
| Etan itan khafe comprendfe gbo | They understand your situation a lot | S-O-V-M |

**Key Point:** The object comes BEFORE the verb, which is different from English (SVO).

---

### 1.2 Negation Pattern

Negation uses **m'ma** (contraction of mu + ma) placed directly before the verb.

**Pattern:** Subject + **m'ma** + Verb

**Examples:**

| Soussou | English | Breakdown |
|---------|---------|-----------|
| Ina m'ma fafe | You're not coming | S-NEG-V |
| Ntan m'ma kolon | I don't know | S-NEG-V |
| Ana m'ma kolon | He/she doesn't know | S-NEG-V |
| Etan m'ma fafe | They're not coming | S-NEG-V |
| Ntan m'ma no'mma | I can't | S-NEG-MODAL |

**Important:** The negation marker always immediately precedes the verb.

---

### 1.3 Question Patterns

Soussou has multiple question formation strategies:

#### A. Location Questions (minde)

**Pattern:** [Subject] + **minde**?

| Soussou | English |
|---------|---------|
| Ina minde? | Where are you? |
| I baba minde? | Where is your father? |
| M'ma na minde? | Where is my mom? |

#### B. Price/Quantity Questions (songo yiri)

**Pattern:** [Noun] + **songo yiri**?

| Soussou | English |
|---------|---------|
| Mangue gui songo yiri? | How much are these mangoes? |
| Telephone gui songo yiri? | How much is this phone? |
| Poulet gui songo? | How much is this chicken? |

#### C. Time Questions (wakhati yiri)

**Pattern:** [Event] + **wakhati yiri**?

| Soussou | English |
|---------|---------|
| Wakhati yiri ra? | What time is it? |
| Whon' kha meeting commence wakhati yiri? | What time does our meeting start? |
| Bus sigafe Kamsar wakhati yiri? | What time does the bus leave for Kamsar? |

#### D. What Questions (di ra)

**Pattern:** **Di ra** + [Verb]?

| Soussou | English |
|---------|---------|
| Di ra ina dege? | What are you eating? |
| I di ra fen? | What are you looking for? |
| I di ra sigafe demain? | Where are you going tomorrow? |

#### E. Why Questions (khafe mu ra)

**Pattern:** **Khafe mu ra**?

This translates literally as "what problem is there?" but functions as "why?"

| Soussou | English |
|---------|---------|
| Khafe mu ra? | Why? / What's the problem? |
| N'na fafe! Khafe mu ra? | I'm coming! What's the problem? |

#### F. Yes/No Questions (Tone-based)

**Pattern:** Statement + rising tone

**CRITICAL:** Many yes/no questions have IDENTICAL words to statements - only tone distinguishes them!

| Soussou | As Statement | As Question |
|---------|-------------|-------------|
| Ina fafe | You are coming | Are you coming? |
| Poisson gui fra | This fish is fresh | Is this fish fresh? |

#### G. Formal Questions (Eske)

**Pattern:** **Eske** + Statement?

Using "Eske" (from French "Est-ce que") marks a genuine, formal question. Without it, the question may have a challenging or teasing tone.

| Soussou | English | Tone |
|---------|---------|------|
| Eske ina mma situation comprendfe? | Do you understand my situation? | Genuine |
| I no'mma guira? | You can do this? | Challenging/teasing |
| Eske I no'mma guira? | Are you able to do this? | Genuine/formal |

#### H. "What About" Questions (ngo/go)

**Pattern:** [Pronoun] + **ngo/go**?

| Soussou | English |
|---------|---------|
| Itan ngo? | What about you? |
| Atan go? | What about him/her? |

#### I. When Questions (tuma yiri)

**Pattern:** [Event] + **tuma yiri**?

| Soussou | English |
|---------|---------|
| M'ma soeur fafe tuma yiri? | When is my sister coming? |
| Ana malade tuma yiri? | When did he/she get sick? |

---

### 1.4 Imperative Patterns

Commands have several structures:

#### A. Simple Imperatives (Verb alone)

| Soussou | English |
|---------|---------|
| Fa | Come |
| Siga | Go |
| Dokho | Sit |
| T'ti | Stand |
| Mato | Look |
| Alou | Stop |
| Mmeme | Wait |
| Sonyi | Give |
| Facta | Bring |

#### B. Imperatives with Location

**Pattern:** Verb + Location marker (be/yire/koui)

| Soussou | English | Location Marker |
|---------|---------|-----------------|
| Fa be | Come here | be (here) |
| Siga yire | Go there | yire (there) |
| Dokho be | Sit here | be |
| Fa bangui koui | Come inside the house | koui (inside) |
| Fa woto koui | Come inside the car | koui |
| Kelli be | Leave here | be |

#### C. Imperatives with Objects

**Pattern:** Object + Verb (OV order!)

**Important:** In imperatives, the object comes BEFORE the verb.

| Soussou | English | Breakdown |
|---------|---------|-----------|
| Gui sonyi | Give me that | O-V |
| A mato | Look at him/her | O-V |
| N'khili | Call me | O-V |
| N'mato | Look at me | O-V |
| I mato | Look at you | O-V |

#### D. Directional Imperatives

**Pattern:** Verb + Pronoun + yire

| Soussou | English |
|---------|---------|
| Siga A yire | Go to him/her |
| Fa A yire | Come to him/her |
| Fa fokhora | Follow me (lit. "come after me") |

---

### 1.5 Complex Sentence Patterns

#### A. Narrative Past (naxa)

Used in formal/literary contexts like the Bible.

**Pattern:** Subject + **naxa** + Verb

| Soussou | English |
|---------|---------|
| A naxa a fala | He said |
| Ala naxa se birin da | God created everything |
| E naxa siga | They went |
| Dawuda naxa a fala nyama birin be | David said to all the people |

#### B. Conditional Clauses (xa)

**Pattern:** **Xa** + Condition, [Main clause]

| Soussou | English |
|---------|---------|
| Xa fahaamui mu na mixi nde yi ra | If understanding is not in someone |
| Xa na mu a ra | If not that / Otherwise |

#### C. Relative Clauses (naxan)

**Pattern:** Noun + **naxan** + Clause

| Soussou | English |
|---------|---------|
| mixi naxan won xanuxi | the person who loves us |
| fe naxan fama rabade | thing that will be done |
| Ala naxan wo raseniyen ma | God who sanctifies you |

#### D. Purpose Clauses (alako)

**Pattern:** Main clause + **alako** + Purpose clause

| Soussou | English |
|---------|---------|
| ...alako e xa rawali | ...so that they work |
| ...alako wo xa danxaniya xa tilin | ...so that your faith may grow |
| ...alako a naxa a bonsoe rayaagi | ...so that he wouldn't disgrace his family |

#### E. Causal Clauses (barima)

**Pattern:** Statement + **barima** + Reason

| Soussou | English |
|---------|---------|
| wo xa sewa barima wo a kolon | you should rejoice because you know |
| A lafia, barima Ala bara a mali | He's well, because God helped him |

---

## 2. Word Co-occurrence and Collocations

These are words that commonly appear together in fixed patterns.

### 2.1 Pronoun + fafe (Movement)

| Soussou | English |
|---------|---------|
| N'na fafe | I'm coming |
| Ina fafe | You're coming |
| Ana fafe | He/she's coming |
| Whon' fafe | We're coming (inclusive) |
| Moukhou fafe | We're coming (exclusive) |
| Etan fafe | They're coming |

### 2.2 Pronoun + khafe (Cause/Situation)

| Soussou | English |
|---------|---------|
| Ntan khafe | Because of me |
| Itan khafe | Because of you |
| Atan khafe | Because of him/her |
| Etan khafe | Because of them |
| Itan khafe gbo | You have a lot going on |

### 2.3 Possessive + Noun

| Soussou | English |
|---------|---------|
| M'ma woto | My car |
| Akha woto | His/her car |
| Ekha woto | Their car |
| Whonma woto | Our car |
| Ikha ChatGPT | Your ChatGPT |

### 2.4 Verb + be (Actions "here")

| Soussou | English |
|---------|---------|
| Fa be | Come here |
| Dokho be | Sit here |
| Mmeme be | Wait here |
| Kelli be | Leave here |

### 2.5 Quality + gbo (Intensified)

| Soussou | English |
|---------|---------|
| Fra gbo | Very fresh |
| Ten gbo | Very hot/spicy |
| Bon gbo | Very good |
| Urgent gbo | Very urgent |
| Khafe gbo | A lot of problems |
| Travail gbo | A lot of work |

### 2.6 Lafia Expressions (Wellness)

| Soussou | English |
|---------|---------|
| A lafia? | Is he/she well? |
| I tara lafia? | Is your husband well? |
| I denbaya lafia? | Is your family well? |
| Etan birin lafia | They're all well |

### 2.7 Ala xa Expressions (Blessings)

| Soussou | English |
|---------|---------|
| Ala xa baraka! | God bless! |
| Ala xa a kisi! | May God heal him/her! |
| Ala xa whon' kisi! | May God protect us! |

---

## 3. Connectors and Clause Linking

### 3.1 Coordinating Connectors

| Connector | Function | Example |
|-----------|----------|---------|
| **nun** | and | xeema nun gbeti (gold and silver) |
| **kono** | but | A luma..., kono a mu na fala |
| **mais** (French) | but (casual) | Travail gbo! Mais ca va. |

### 3.2 Subordinating Connectors

| Connector | Function | Example |
|-----------|----------|---------|
| **barima** | because | wo xa sewa barima wo a kolon |
| **alako** | so that | alako e xa rawali |
| **xa** | if (conditional) | xa fahaamui mu na |
| **fo** | except/unless | fo a xa mixi kende nde |

### 3.3 Sequential Connectors

| Connector | Function | Example |
|-----------|----------|---------|
| **apres** (French) | then/after | Siga droite, apres gauche |

---

## 4. Particle Placement Rules

### 4.1 Negation Particle (mu/m'ma)

- **Position:** Directly before verb
- **Form:** Often contracted as m'ma

```
Ina m'ma fafe
    ^-- negation before verb
```

### 4.2 Possessive Particle (xa)

- **Position:** Between possessor and possessed

```
Ala xa masenyi
    ^-- possessive marker
```

### 4.3 Possessive Pronouns (kha contractions)

- **Position:** Before noun (contracted forms)

| Full Form | Contracted | Example |
|-----------|------------|---------|
| Itan kha | Ikha | Ikha woto (your car) |
| Atan kha | Akha | Akha woto (his/her car) |
| Etan kha | Ekha | Ekha woto (their car) |

### 4.4 Location Particles

| Particle | Meaning | Position | Example |
|----------|---------|----------|---------|
| **be** | here | after verb/noun | Fa be (come here) |
| **yire** | there | after verb/noun | Siga yire (go there) |
| **koui** | inside | after noun | bangui koui (inside house) |
| **ra** | in/at | after noun | yire seniyen xi ra (in holy place) |

### 4.5 Intensifier (gbo)

- **Position:** Sentence-final, after what it modifies

```
Itan khafe gbo
           ^-- intensifier at end
```

Can be extended for extra emphasis: gbooo

### 4.6 Emphasis/Only (tan)

- **Position:** After word being emphasized

```
Dix mille tan (just ten thousand)
          ^-- emphasis marker
Kisi tan (just peace)
     ^-- only marker
```

### 4.7 Completion/Arrival (yite)

- **Position:** Sentence-final

```
Account n'ma yitima na (Your account is almost finished)
                    ^-- completion marker
Nuit yite (Night has come)
     ^-- arrival marker
```

### 4.8 Temporal (don)

- **Position:** After verb/adjective

```
A yite don (It's already here)
       ^-- "already"
```

### 4.9 Narrative Past (naxa)

- **Position:** Between subject and verb
- **Register:** Formal/literary

```
A naxa a fala (He said)
  ^-- past tense marker
```

### 4.10 Verb-forming Suffix (fe)

- **Position:** Attached to root

```
fa + fe = fafe (coming)
comprend + fe = comprendfe (understanding)
siga + fe = sigafe (going)
```

---

## 5. Word Order Variations

### 5.1 Topic Fronting for Emphasis

Emphatic pronouns (-tan forms) can be fronted:

| Neutral | Emphatic |
|---------|----------|
| N'na fafe | Ntan fafe (ME, I'm coming) |
| Ana kolon | Atan kolon (HIM/HER, he/she knows) |

### 5.2 Question Word Position

Question words typically come at or near the end:

```
Ina minde? (Where are you?)
    ^-- question word final

Di ra ina dege? (What are you eating?)
^-- exception: "di ra" can be fronted
```

### 5.3 Temporal Modifier Position

Time expressions are flexible:

```
Nun bi froid gbo (Today is very cold) - fronted
A fafe demain (He's coming tomorrow) - final
```

---

## 6. French-Soussou Hybrid Patterns

Soussou commonly incorporates French words while maintaining Soussou grammar.

### 6.1 French Nouns with Soussou Possessives

| Hybrid | English |
|--------|---------|
| Whonma bateau | Our boat |
| Etan kha avion | Their airplane |
| M'ma telephone | My phone |

### 6.2 French Verbs with Soussou Suffix

| French Root | Soussou Verb | Meaning |
|-------------|--------------|---------|
| comprend | comprendfe | understanding |
| negocie | negociefe | negotiating |
| marche | marchefe | working (functioning) |

### 6.3 French Modifiers in Soussou Sentences

| Example | Note |
|---------|------|
| un peu | "a bit" commonly used |
| vite | "quickly" |
| bien | "well" |
| maintenant | "now" |

---

## 7. Generation Rules Summary

For AI to generate grammatically correct Soussou sentences:

### 7.1 Basic Sentence

1. Start with Subject
2. Add Object (if any) - BEFORE verb
3. Add Verb
4. Add Modifier (if any) - at end

### 7.2 Negation

1. Place m'ma directly before verb
2. Keep everything else in normal position

### 7.3 Questions

1. For yes/no: use statement word order, add rising tone/punctuation
2. For wh-questions: place question word at/near end
3. For formal: prefix with Eske

### 7.4 Imperatives

1. Simple: verb alone
2. With object: Object + Verb (OV)
3. With location: Verb + location marker

### 7.5 Possession

1. Contracted pronouns (M'ma, Akha, Ikha) + Noun directly
2. Full possessive: Possessor + xa + Possessed

### 7.6 Complex Sentences

1. Purpose: Main + alako + Purpose clause
2. Cause: Statement + barima + Reason
3. Condition: Xa + Condition, Main
4. Relative: Noun + naxan + Clause

---

## 8. Common Errors to Avoid

1. **Wrong verb position:** Place verb AFTER object, not before
   - Wrong: Ntan kolon sosokhoui
   - Correct: Ntan sosokhoui kolon

2. **Wrong negation position:** m'ma must immediately precede verb
   - Wrong: Ntan kolon m'ma
   - Correct: Ntan m'ma kolon

3. **Wrong imperative order:** Object precedes verb in commands
   - Wrong: Sonyi gui
   - Correct: Gui sonyi

4. **Missing intensifier position:** gbo must be sentence-final
   - Wrong: gbo urgent
   - Correct: urgent gbo

5. **Wrong possessive form:** Use xa between possessor and possessed
   - Wrong: Ala masenyi xa
   - Correct: Ala xa masenyi

---

## 9. Tone Importance

**CRITICAL:** Many grammatical distinctions in Soussou are made through tone, not word order:

- Statement vs. Question: "Ina fafe" (You're coming) vs. "Ina fafe?" (Are you coming?)
- The only difference is rising tone for questions

AI systems generating Soussou text should be aware that written punctuation (?) is essential for distinguishing these forms.

---

## 10. Register Variations

### Formal/Literary (Bible style)
- Uses naxa for past tense
- Full possessive constructions (xa)
- Complex relative clauses with naxan

### Casual/Street
- French loanwords common (mais, apres, un peu)
- Contracted possessives (M'ma, Ikha)
- Shortened pronouns (I for Itan)

---

## Conclusion

Soussou sentence construction follows consistent patterns that can be learned:

1. **Basic order is SOV** (Subject-Object-Verb)
2. **Negation** uses m'ma before verb
3. **Questions** use final question words or tone
4. **Imperatives** place object before verb
5. **Particles** have specific positions (intensifiers final, location markers after verb/noun)
6. **Connectors** like nun, barima, alako link clauses

By following these rules, an AI can generate grammatically correct Soussou sentences that native speakers will understand.
