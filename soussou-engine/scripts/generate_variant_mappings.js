/**
 * Generate comprehensive variant mappings from lexicon
 */

const fs = require('fs');
const path = require('path');

// Paths
const lexiconPath = path.join(__dirname, '..', 'data', 'lexicon.json');
const outputPath = path.join(__dirname, '..', 'data', 'variant_mappings.json');

// Load lexicon
const lexicon = JSON.parse(fs.readFileSync(lexiconPath, 'utf8'));

/**
 * Normalize a Soussou word to canonical form
 */
function normalize(str) {
  if (!str) return '';

  let result = str
    .trim()
    .toLowerCase()
    // Remove apostrophes
    .replace(/['''`]/g, '')
    // Normalize diacritics
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    // Convert special IPA characters
    .replace(/ɛ/g, 'e')
    .replace(/ɔ/g, 'o')
    .replace(/ŋ/g, 'ng')
    .replace(/ɲ/g, 'ny')
    .replace(/ŭ/g, 'u')
    // Remove hyphens at end
    .replace(/-$/g, '')
    // Remove trailing h
    .replace(/h$/g, '');

  // Compress double consonants
  const consonants = 'bcdfghjklmnpqrstvwxyz';
  for (const c of consonants) {
    result = result.replace(new RegExp(c + c, 'g'), c);
  }

  return result;
}

// Build mappings
const variantToBase = {};
const baseToVariants = {};
const normalizedToBase = {};

lexicon.forEach(entry => {
  const base = entry.base;
  const variants = entry.variants || [base];
  const normalizedBase = normalize(base);

  // Initialize base_to_variants
  if (!baseToVariants[base]) {
    baseToVariants[base] = [];
  }

  // Add all variants
  variants.forEach(variant => {
    // variant_to_base: exact variant -> base
    const lowerVariant = variant.toLowerCase();
    variantToBase[lowerVariant] = base;

    // base_to_variants: collect all
    if (!baseToVariants[base].includes(variant)) {
      baseToVariants[base].push(variant);
    }

    // normalized_to_base: normalized form -> base
    const normalizedVariant = normalize(variant);
    if (!normalizedToBase[normalizedVariant]) {
      normalizedToBase[normalizedVariant] = base;
    }
  });

  // Also map the base itself
  variantToBase[base.toLowerCase()] = base;
  normalizedToBase[normalizedBase] = base;
});

// Generate additional synthetic variants based on patterns
const syntheticVariants = {};

Object.keys(baseToVariants).forEach(base => {
  const variants = [];

  // Generate common variant patterns
  // 1. With apostrophe prefixes for n, m
  if (base.startsWith('n') && base.length > 1) {
    variants.push("n'" + base.slice(1));
    variants.push('nn' + base.slice(1));
  }
  if (base.startsWith('m') && base.length > 1) {
    variants.push("m'" + base.slice(1));
    variants.push('mm' + base.slice(1));
  }

  // 2. With trailing h
  if (!base.endsWith('h')) {
    variants.push(base + 'h');
  }

  // 3. Case variations
  variants.push(base.charAt(0).toUpperCase() + base.slice(1));

  // Add to synthetic
  variants.forEach(v => {
    const lowerV = v.toLowerCase();
    if (!variantToBase[lowerV]) {
      if (!syntheticVariants[base]) syntheticVariants[base] = [];
      syntheticVariants[base].push(v);
    }
  });
});

// Build phonetic mappings for fuzzy matching
const phoneticMappings = {
  // Vowel equivalents
  'e': ['e', 'ɛ', 'é', 'è', 'ê', 'ë'],
  'o': ['o', 'ɔ', 'ó', 'ò', 'ô', 'ö'],
  'a': ['a', 'á', 'à', 'â', 'ä'],
  'i': ['i', 'í', 'ì', 'î', 'ï'],
  'u': ['u', 'ú', 'ù', 'û', 'ü', 'ŭ'],

  // Consonant equivalents
  'ng': ['ng', 'ŋ', 'ngg'],
  'ny': ['ny', 'ɲ', 'gn'],
  'w': ['w', 'wh'],
  'f': ['f', 'ff', 'ph'],
  'n': ['n', 'nn'],
  'm': ['m', 'mm'],
  's': ['s', 'ss'],
  'k': ['k', 'kh', 'c', 'q'],
  'g': ['g', 'gh'],
  'x': ['x', 'kh', 'ch']
};

// Character equivalence map for fuzzy matching
const charEquivalents = {
  'ɛ': 'e',
  'ɔ': 'o',
  'ŋ': 'ng',
  'ɲ': 'ny',
  'ŭ': 'u',
  'é': 'e',
  'è': 'e',
  'ê': 'e',
  'ë': 'e',
  'á': 'a',
  'à': 'a',
  'â': 'a',
  'ä': 'a',
  'í': 'i',
  'ì': 'i',
  'î': 'i',
  'ï': 'i',
  'ó': 'o',
  'ò': 'o',
  'ô': 'o',
  'ö': 'o',
  'ú': 'u',
  'ù': 'u',
  'û': 'u',
  'ü': 'u',
  "'": '',
  "'": '',
  "'": '',
  '`': ''
};

// Normalization rules documentation
const normalizationRules = {
  order: [
    'trim',
    'lowercase',
    'apostrophe',
    'diacritics',
    'specialChars',
    'trailingHyphen',
    'trailingH',
    'doubleConsonants'
  ],
  rules: {
    'trim': 'Remove leading/trailing whitespace',
    'lowercase': 'Convert to lowercase',
    'apostrophe': "Remove apostrophes: ' ' ' `",
    'diacritics': 'Remove accent marks using NFD normalization',
    'specialChars': 'Convert IPA: ɛ→e, ɔ→o, ŋ→ng, ɲ→ny, ŭ→u',
    'trailingHyphen': 'Remove trailing hyphen (-)',
    'trailingH': 'Remove trailing h',
    'doubleConsonants': 'Compress: nn→n, ff→f, mm→m, ss→s, etc.'
  },
  examples: [
    { input: "N'na", output: "na", applied: ["lowercase", "apostrophe", "doubleConsonants"] },
    { input: "fafé", output: "fafe", applied: ["lowercase", "diacritics"] },
    { input: "kɛmɛ", output: "keme", applied: ["lowercase", "specialChars"] },
    { input: "M'ma", output: "ma", applied: ["lowercase", "apostrophe", "doubleConsonants"] },
    { input: "fafeh", output: "fafe", applied: ["lowercase", "trailingH"] },
    { input: "whon'", output: "won", applied: ["lowercase", "apostrophe", "trailingH"] },
    { input: "Tanna", output: "tana", applied: ["lowercase", "doubleConsonants"] },
    { input: "mà-", output: "ma", applied: ["lowercase", "diacritics", "trailingHyphen"] }
  ]
};

// Build final output
const output = {
  metadata: {
    generated: new Date().toISOString(),
    lexiconEntries: lexicon.length,
    totalVariantMappings: Object.keys(variantToBase).length,
    totalBases: Object.keys(baseToVariants).length,
    totalNormalizedMappings: Object.keys(normalizedToBase).length,
    syntheticVariantBases: Object.keys(syntheticVariants).length
  },
  variant_to_base: variantToBase,
  base_to_variants: baseToVariants,
  normalized_to_base: normalizedToBase,
  synthetic_variants: syntheticVariants,
  phonetic_mappings: phoneticMappings,
  char_equivalents: charEquivalents,
  normalization_rules: normalizationRules
};

// Write output
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log('Generated variant_mappings.json');
console.log('  Lexicon entries:', output.metadata.lexiconEntries);
console.log('  Total variant mappings:', output.metadata.totalVariantMappings);
console.log('  Total bases:', output.metadata.totalBases);
console.log('  Normalized mappings:', output.metadata.totalNormalizedMappings);
console.log('  Synthetic variant bases:', output.metadata.syntheticVariantBases);
