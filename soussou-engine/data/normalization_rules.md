# Soussou Variant Normalization Rules

Soussou has no official orthography. The same word can be written many different ways depending on source, region, and personal preference. This document describes all normalization rules applied to standardize input.

## Overview

The normalization process transforms any variant spelling into a canonical form that can be matched against the lexicon. All rules are applied in sequence to ensure consistent results.

## Transformation Rules

### 1. Trim Whitespace
**Order:** 1
**Description:** Remove leading and trailing whitespace from input.

```
"  fafe  " → "fafe"
```

### 2. Case Normalization
**Order:** 2
**Description:** Convert all characters to lowercase.

```
"Fafé" → "fafé"
"KEME" → "keme"
"N'Na" → "n'na"
```

### 3. Apostrophe Removal
**Order:** 3
**Description:** Remove all apostrophe variants: `'` `'` `'` `` ` ``

This is one of the most common variations in Soussou writing. Apostrophes are often used to indicate:
- Elision (n'a, m'ma)
- Separation of syllables
- Glottal stops

```
"n'a" → "na"
"m'ma" → "mma"
"n'na" → "nna"
"i'" → "i"
"whon'" → "whon"
```

### 4. Diacritic/Accent Removal
**Order:** 4
**Description:** Remove all diacritical marks using Unicode NFD normalization.

Common accents in Soussou:
- Acute (´): é, á, ó, í, ú
- Grave (`): è, à, ò, ì, ù
- Circumflex (^): ê, â, ô, î, û
- Dieresis (¨): ë, ä, ö, ï, ü
- Breve (˘): ŭ

```
"fafé" → "fafe"
"khèré" → "khere"
"mà-" → "ma-"
"nŭn" → "nun"
"kɛ̀mɛ́" → "keme" (after IPA conversion)
```

### 5. Special Character Conversion (IPA)
**Order:** 5
**Description:** Convert IPA and special linguistic characters to their Latin equivalents.

| Character | Conversion | Description |
|-----------|------------|-------------|
| ɛ | e | Open-mid front unrounded vowel |
| ɔ | o | Open-mid back rounded vowel |
| ŋ | ng | Velar nasal |
| ɲ | ny | Palatal nasal |
| ŭ | u | Short u with breve |

```
"kɛmɛ" → "keme"
"kɔlɔn" → "kolon"
"xɔri" → "xori"
"gɛrɛ" → "gere"
"gbɛgbɛ" → "gbegbe"
```

### 6. Trailing Hyphen Removal
**Order:** 6
**Description:** Remove hyphens at the end of words (common in prefix notation).

```
"mà-" → "mà" → "ma" (after accent removal)
"rà-" → "rà" → "ra"
```

### 7. Trailing H Removal
**Order:** 7
**Description:** Remove trailing 'h' character (common spelling variant).

The trailing 'h' is often added to:
- Indicate vowel length
- Represent breath sounds
- Personal spelling preference

```
"fafeh" → "fafe"
"khereh" → "khere"
"tannah" → "tanna" → "tana"
```

### 8. Double Consonant Compression
**Order:** 8
**Description:** Compress double consonants to single consonants.

Affected consonants: b, c, d, f, g, h, j, k, l, m, n, p, q, r, s, t, v, w, x, y, z

```
"nna" → "na"
"mma" → "ma"
"faffé" → "fafé" → "fafe"
"tanna" → "tana"
"ssakka" → "saka"
```

## Complete Transformation Examples

| Input | Output | Rules Applied |
|-------|--------|---------------|
| N'na fafé | na fafe | lowercase, apostrophe, diacritics, doubleConsonants |
| M'ma | ma | lowercase, apostrophe, doubleConsonants |
| Khèré | khere | lowercase, diacritics |
| fafeh | fafe | lowercase, trailingH |
| Tanna | tana | lowercase, doubleConsonants |
| kɛmɛ | keme | lowercase, specialChars |
| whon' | won | lowercase, apostrophe, trailingH |
| Sàkkà | saka | lowercase, diacritics, doubleConsonants |
| mà- | ma | lowercase, diacritics, trailingHyphen |
| n'a Fafé | na fafe | lowercase, apostrophe, diacritics |

## Phonetic Equivalence Mappings

For fuzzy matching, these character groups are treated as equivalent:

### Vowels
- **e**: e, ɛ, é, è, ê, ë
- **o**: o, ɔ, ó, ò, ô, ö
- **a**: a, á, à, â, ä
- **i**: i, í, ì, î, ï
- **u**: u, ú, ù, û, ü, ŭ

### Consonants
- **ng**: ng, ŋ, ngg
- **ny**: ny, ɲ, gn
- **w**: w, wh
- **f**: f, ff, ph
- **n**: n, nn
- **m**: m, mm
- **s**: s, ss
- **k**: k, kh, c, q
- **g**: g, gh
- **x**: x, kh, ch

## Common Variant Patterns

### 1. Prefix Apostrophe Pattern
Words starting with n or m often have apostrophe variants:
- **na**: na, n'a, N'a, nna, N'na
- **ma**: ma, m'ma, M'ma, mma, Mma

### 2. Trailing H Pattern
Many words have variants with trailing h:
- **fafe**: fafe, fafeh, Fafé, fafféh
- **khere**: khere, khereh, Khèré, khérèh

### 3. Double Consonant Pattern
Words can be written with single or double consonants:
- **tana**: tana, tanna, Tanna
- **saka**: saka, sakka, Sàkkà

### 4. Case Variations
Proper nouns and sentence-initial words vary in case:
- **won**: won, Won, WON
- **muxu**: muxu, Muxu, MUXU

## Implementation Notes

### Normalization Function
```javascript
function normalize(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/['''`]/g, '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ɛ/g, 'e')
    .replace(/ɔ/g, 'o')
    .replace(/ŋ/g, 'ng')
    .replace(/ɲ/g, 'ny')
    .replace(/ŭ/g, 'u')
    .replace(/-$/g, '')
    .replace(/h$/g, '')
    .replace(/([bcdfghjklmnpqrstvwxyz])\1/g, '$1');
}
```

### Multi-word Phrase Handling
For phrases, normalize each word individually and join with single space:
```javascript
function normalizePhrase(phrase) {
  return phrase
    .split(/\s+/)
    .map(normalize)
    .filter(w => w.length > 0)
    .join(' ');
}
```

### Fuzzy Matching Considerations
When exact normalization fails to find a match:
1. Calculate edit distance with Soussou-specific weights
2. Give lower penalty for vowel substitutions (e/ɛ, o/ɔ)
3. Give lower penalty for consonant doubling
4. Consider phonetic similarity scoring

## Edge Cases

### Compound Words
Some words that look like variants may actually be different words:
- "nan" (that) vs "na" (is)
- "nun" (and) vs "nu" (unknown)

### Homographs
After normalization, some different words may collapse to the same form:
- Context should be used to disambiguate
- Consider part of speech and surrounding words

### Loan Words
French/Arabic loan words may follow different patterns:
- Preserve original spelling in lexicon as variant
- Apply standard normalization for matching

## Version History

- **v1.0** (2025-11-20): Initial comprehensive rule set based on 8,974 lexicon entries
