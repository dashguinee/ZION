# Agent 07 - Bible Translation Sources

## Overview

This agent extracted Soussou vocabulary from complete Bible translations. Bible texts are excellent linguistic resources because they are:
- Carefully translated by native speakers
- Reviewed by language committees
- Contain vast vocabulary across many domains
- Include both formal and narrative language

## Primary Source

### Soso Kitaabuie: Tawureta, Yabura, Inyila (2015)

**Publisher**: Mission Evangelique Reformee Neerlandaise et les Traducteurs Pionniers de la Bible (Pioneer Bible Translators)

**Download Source**: https://ebible.org/find/details.php?id=sus

**License**: Creative Commons Attribution-Noncommercial-No Derivatives 4.0

**Format Used**: Plain text read-aloud files (sus_readaloud.zip)

**Contents**:
- Complete Old Testament (39 books)
- Complete New Testament (27 books)
- Total: 66 books in 1,190 chapter files

## Extraction Results

| Metric | Value |
|--------|-------|
| Files processed | 1,190 |
| Bible books covered | 67 |
| Total word occurrences | 656,119 |
| **Unique words extracted** | **8,742** |

### Frequency Distribution

| Category | Word Count |
|----------|------------|
| Very common (100+ occurrences) | 654 |
| Common (50-99 occurrences) | 420 |
| Moderate (10-49 occurrences) | 1,677 |
| Rare (2-9 occurrences) | 3,444 |
| Hapax legomena (1 occurrence) | 2,547 |

## Most Frequent Words (Top 30)

These represent the core Soussou vocabulary:

1. **xa** (39,703x) - possessive/genitive marker
2. **na** (27,134x) - demonstrative/locative
3. **ra** (25,136x) - instrumental/locative marker
4. **ma** (20,810x) - locative/dative marker
5. **naxa** (18,296x) - narrative past tense marker
6. **wo** (17,155x) - second person plural pronoun
7. **nan** (10,370x) - emphatic/focus marker
8. **nun** (10,293x) - and/with
9. **mu** (9,935x) - negation marker
10. **be** (9,810x) - locative/to
11. **naxan** (9,015x) - relative pronoun (which/that)
12. **ne** (8,456x) - emphatic particle
13. **nu** (7,448x) - past tense auxiliary
14. **bara** (7,287x) - perfective marker (already)
15. **alatala** (6,704x) - the LORD (God)
16. **kui** (6,689x) - in/inside
17. **birin** (6,521x) - all/every
18. **ala** (5,960x) - God
19. **mixi** (5,541x) - person/man
20. **fe** (5,375x) - thing/matter
21. **yi** (5,083x) - this
22. **to** (4,861x) - when/if
23. **tan** (4,746x) - only/self
24. **naxee** (4,097x) - relative plural (those who)
25. **ya** (4,054x) - focus marker
26. **mange** (3,818x) - king
27. **fa** (3,768x) - come
28. **fala** (3,710x) - speak/say
29. **ki** (3,606x) - manner/way
30. **di** (3,494x) - child

## Secondary Sources Identified

### Historical Translation (1816)

**Title**: Lingjili Matthew ki nache 1816

**Description**: First seven chapters of Gospel of Matthew translated into Susoo by John Godfrey Wilhelm of the Church Mission Society

**Access**: https://www.bible.com/versions/2066-sus1816-lingjili-matthew-ki-nache-1816

**Note**: Not used for extraction as the 2015 complete Bible supersedes it

### Mobile/App Resources

- **YouVersion/Bible.com**: https://www.bible.com/versions/893-SOSO-soso-kitaabuie-tawureta-yabura-inyila
- **Scripture Earth**: https://www.scriptureearth.org/00eng.php?iso=sus
- **Susu Bible App** (Google Play): Audio and text available

## Linguistic Notes

### Soussou Orthography

The Bible text uses standard Soussou orthography with:
- Special characters: **e** (open e), **o** (open o), **ny** (palatal nasal), **ng** (velar nasal)
- Tonal marking: Generally not marked in this translation
- Word boundaries: Clearly defined with spaces

### Language Identification Markers

Words exhibiting typical Soussou features:
- Pronouns: ntan/itan/ana/etan (emphatic forms)
- Possessives: xa (possessive marker)
- Negation: mu/ma (negative markers)
- Verb markers: naxa (past narrative), bara (perfective), fama (future)

### French Loanwords

The text contains French loanwords (normal for Guinean Soussou):
- Borrowed biblical terms
- Modern concepts without native equivalents

## Data Quality

### Strengths
- Complete Bible provides extensive vocabulary coverage
- Professional translation by native speakers
- Multiple domains: narrative, poetry, law, prophecy, letters
- High frequency words give excellent core vocabulary

### Limitations
- Biblical/religious vocabulary overrepresented
- Some rare words may be archaic or literary
- Hapax legomena (2,547 words) may include names, places, or transcription variants
- Category classification is automated and approximate

## Attribution

This vocabulary extraction uses text from:

> Soso Kitaabuie: Tawureta, Yabura, Inyila
> Copyright 2015, Mission Evangelique Reformee Neerlandaise et les Traducteurs Pionniers de la Bible
> Language: Susu (sus)
> Dialect: (unspecified)
> https://eBible.org/sus/
> 2020-08-19
> Creative Commons Attribution-Noncommercial-No Derivatives license 4.0

## Files Generated

- **validated.json**: Complete vocabulary with frequency counts and metadata
- **sources.md**: This documentation file
- **extract_vocabulary.py**: Extraction script for reproducibility
- **readaloud/**: Raw Bible text files (1,190 chapter files)

## Additional Resources for Future Extraction

1. **Susu Language Course** (Peace Corps): https://www.livelingua.com/peace-corps/Susu/susu-language-course.pdf
2. **Audio Bible Recordings** (Global Recordings Network)
3. **Bible.is films and audio** for verification
