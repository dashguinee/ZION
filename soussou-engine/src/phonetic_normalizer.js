/**
 * Phonetic Normalization for Soussou Language
 *
 * Problem: Soussou has no standardized orthography
 * Solution: Generate phonetic variants for fuzzy matching
 *
 * Examples:
 * - Gui → [Gui, Gi, Ghi, Ghui]
 * - Eske → [Eske, Eské, Estceque, Est-ce-que]
 * - Tofan → [Tofan, To-fan, Tôfan, Toufan]
 */

class PhoneticNormalizer {
  constructor() {
    // Phonetic equivalence rules for Soussou
    this.equivalences = {
      // Vowel variations
      'é': ['e', 'é', 'è', 'ê'],
      'a': ['a', 'à', 'â'],
      'i': ['i', 'ï', 'y'],
      'o': ['o', 'ô', 'ó'],
      'u': ['u', 'ù', 'û', 'ou'],

      // Consonant variations
      'k': ['k', 'c', 'q', 'kh'],
      'g': ['g', 'gh'],
      'n': ['n', 'ñ', 'ny'],
      's': ['s', 'ss', 'c'],

      // French loan patterns
      'qu': ['ku', 'k', 'qu'],
      'ch': ['sh', 'ch', 'c'],
    };
  }

  /**
   * Generate phonetic variants for a Soussou word
   *
   * @param {string} word - Base word
   * @param {string} source - Source language hint ('french_loan', 'soussou', 'unknown')
   * @returns {Array<string>} - All possible phonetic variants
   */
  generateVariants(word, source = 'unknown') {
    const variants = new Set([word]); // Always include original

    // Strategy 1: French loan word patterns
    if (source === 'french_loan' || this._looksLikeFrenchLoan(word)) {
      this._addFrenchLoanVariants(word, variants);
    }

    // Strategy 2: Accent/diacritic variations
    this._addAccentVariants(word, variants);

    // Strategy 3: Consonant doubling/reduction
    this._addConsonantVariants(word, variants);

    // Strategy 4: Hyphenation variations
    this._addHyphenationVariants(word, variants);

    // Strategy 5: Vowel harmony variations
    this._addVowelVariants(word, variants);

    return Array.from(variants);
  }

  /**
   * Normalize word for matching (remove accents, lowercase)
   */
  normalize(word) {
    return word
      .toLowerCase()
      .normalize('NFD') // Decompose accents
      .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
      .replace(/['\u2019]/g, '') // Remove apostrophes
      .trim();
  }

  /**
   * Check if two words are phonetically similar
   */
  areSimilar(word1, word2, threshold = 0.7) {
    const norm1 = this.normalize(word1);
    const norm2 = this.normalize(word2);

    // Exact match after normalization
    if (norm1 === norm2) return true;

    // Levenshtein distance check
    const distance = this._levenshtein(norm1, norm2);
    const maxLen = Math.max(norm1.length, norm2.length);
    const similarity = 1 - (distance / maxLen);

    return similarity >= threshold;
  }

  // Private helper methods

  _looksLikeFrenchLoan(word) {
    const frenchPatterns = ['eske', 'que', 'est', 'tion', 'ment', 'eau', 'aux'];
    return frenchPatterns.some(pattern => word.toLowerCase().includes(pattern));
  }

  _addFrenchLoanVariants(word, variants) {
    const lower = word.toLowerCase();

    // est-ce que → eske variations
    if (lower.includes('eske') || lower.includes('estceque')) {
      variants.add('eske');
      variants.add('eské');
      variants.add('estceque');
      variants.add('est-ce-que');
      variants.add('est ce que');
      variants.add('èske');
    }

    // que → ke
    if (lower.includes('que')) {
      variants.add(word.replace(/que/gi, 'ke'));
      variants.add(word.replace(/que/gi, 'ké'));
    }
  }

  _addAccentVariants(word, variants) {
    // Add version with no accents
    const normalized = this.normalize(word);
    if (normalized !== word.toLowerCase()) {
      variants.add(normalized);
    }

    // Add common accent positions
    for (let i = 0; i < word.length; i++) {
      const char = word[i].toLowerCase();
      const equivalents = this.equivalences[char];

      if (equivalents) {
        for (const equiv of equivalents) {
          const variant = word.substring(0, i) + equiv + word.substring(i + 1);
          variants.add(variant);
        }
      }
    }
  }

  _addConsonantVariants(word, variants) {
    // Double consonants: nn → n, ff → f
    const doubled = word.replace(/([bcdfghjklmnpqrstvwxz])\1/gi, '$1');
    if (doubled !== word) variants.add(doubled);

    // Single consonants: n → nn, f → ff (common in Soussou)
    const singleConsonants = word.match(/[bcdfghjklmnpqrstvwxz]/gi);
    if (singleConsonants) {
      singleConsonants.forEach(c => {
        const variant = word.replace(new RegExp(c, 'gi'), c + c);
        variants.add(variant);
      });
    }
  }

  _addHyphenationVariants(word, variants) {
    // Remove hyphens: to-fan → tofan
    if (word.includes('-')) {
      variants.add(word.replace(/-/g, ''));
    }

    // Add hyphens at syllable boundaries: tofan → to-fan
    if (word.length > 4 && !word.includes('-')) {
      const mid = Math.floor(word.length / 2);
      variants.add(word.substring(0, mid) + '-' + word.substring(mid));
    }
  }

  _addVowelVariants(word, variants) {
    // u ↔ ou (common in French loans)
    if (word.includes('u')) {
      variants.add(word.replace(/u/g, 'ou'));
    }
    if (word.includes('ou')) {
      variants.add(word.replace(/ou/g, 'u'));
    }

    // i ↔ y
    if (word.includes('i')) {
      variants.add(word.replace(/i/g, 'y'));
    }
  }

  _levenshtein(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  }
}

module.exports = PhoneticNormalizer;

// CLI usage example
if (require.main === module) {
  const normalizer = new PhoneticNormalizer();

  // Test cases from Z-Core's examples
  const testWords = [
    { word: 'Gui', source: 'soussou' },
    { word: 'Eske', source: 'french_loan' },
    { word: 'Tofan', source: 'soussou' },
    { word: 'Mafoura', source: 'soussou' },
    { word: 'Ka', source: 'soussou' }
  ];

  console.log('=== PHONETIC VARIANT GENERATION ===\n');

  testWords.forEach(({ word, source }) => {
    const variants = normalizer.generateVariants(word, source);
    console.log(`${word} (${source}):`);
    console.log(`  Variants: ${variants.join(', ')}`);
    console.log(`  Normalized: ${normalizer.normalize(word)}`);
    console.log('');
  });

  // Test similarity
  console.log('=== PHONETIC SIMILARITY ===\n');
  console.log('Gui ≈ Gi:', normalizer.areSimilar('Gui', 'Gi'));
  console.log('Eske ≈ Est-ce-que:', normalizer.areSimilar('Eske', 'Est-ce-que'));
  console.log('Tofan ≈ To-fan:', normalizer.areSimilar('Tofan', 'To-fan'));
  console.log('Mafoura ≈ Mafura:', normalizer.areSimilar('Mafoura', 'Mafura'));
}
