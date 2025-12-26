#!/usr/bin/env node
/**
 * Reverse Translation Test - Susu → English
 * Tests if our system can translate Susu back to English accurately
 */

const guinius = require('../src/guinius');
const susuAI = require('../src/susu_ai');

// Susu phrases with known English meanings (from our corpus)
const TEST_PAIRS = [
  // Greetings
  { susu: 'inou wali', english: 'hello' },
  { susu: 'tanàmoufègnê', english: 'good morning' },
  { susu: 'wo khakèto', english: 'you are welcome' },
  { susu: 'wonou wali', english: 'thank you' },
  { susu: 'Allah kha wo khi', english: 'good night' },

  // Basic phrases
  { susu: 'I rafan ma', english: 'i love you' },
  { susu: 'ikhilidi', english: 'what is your name' },
  { susu: 'N xili', english: 'my name is' },
  { susu: 'iyo', english: 'yes' },
  { susu: 'ade', english: 'no' },

  // States
  { susu: 'N bara sEwa', english: 'i am happy' },
  { susu: 'N bara tagan', english: 'i am tired' },
  { susu: 'N furaxi', english: 'i am sick' },
  { susu: 'Donse fan', english: 'the food is good' },

  // Actions
  { susu: 'Fâ bé', english: 'come here' },
  { susu: 'Wo dOxO', english: 'sit down' },
  { susu: 'Keli', english: 'stand up' },
  { susu: 'Wo ye fi n ma', english: 'give me water' },

  // Questions
  { susu: 'Wo sigafe minden', english: 'where are you going' },
  { susu: 'Waxati mundun na', english: 'what time is it' },

  // Common words
  { susu: 'ye', english: 'water' },
  { susu: 'donse', english: 'food' },
  { susu: 'banxi', english: 'house' },
  { susu: 'ala', english: 'god' },
  { susu: 'baba', english: 'father' },
  { susu: 'nga', english: 'mother' },
];

function normalize(s) {
  if (!s) return '';
  return s.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[?!.,;:'"()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function runTests() {
  console.log('=== Susu → English Reverse Translation Test ===\n');

  const stats = { total: 0, exact: 0, close: 0, partial: 0, miss: 0 };
  const failures = [];

  for (const pair of TEST_PAIRS) {
    try {
      const result = await susuAI.translate(pair.susu, { from: 'susu' });
      const translation = result.translation || '';
      const normTrans = normalize(translation);
      const normExpected = normalize(pair.english);

      stats.total++;

      let match = 'miss';
      if (normTrans === normExpected) {
        match = 'exact';
        stats.exact++;
      } else if (normTrans.includes(normExpected) || normExpected.includes(normTrans)) {
        match = 'close';
        stats.close++;
      } else {
        // Check word overlap
        const transWords = new Set(normTrans.split(' '));
        const expectedWords = new Set(normExpected.split(' '));
        let overlap = 0;
        for (const w of transWords) if (expectedWords.has(w)) overlap++;
        if (overlap > 0) {
          match = 'partial';
          stats.partial++;
        } else {
          stats.miss++;
          failures.push({ susu: pair.susu, expected: pair.english, got: translation });
        }
      }

      const icon = match === 'exact' ? '✓' : match === 'close' ? '≈' : match === 'partial' ? '~' : '✗';
      console.log(`${icon} "${pair.susu}"`);
      console.log(`  Expected: ${pair.english}`);
      console.log(`  Got: ${translation} [${result.source || 'N/A'}]\n`);

    } catch (e) {
      console.error(`Error with "${pair.susu}":`, e.message);
      stats.miss++;
    }
  }

  const accuracy = ((stats.exact + stats.close) / stats.total * 100).toFixed(1);

  console.log('=== SUMMARY ===\n');
  console.log(`Total: ${stats.total}`);
  console.log(`Exact: ${stats.exact} (${(stats.exact/stats.total*100).toFixed(1)}%)`);
  console.log(`Close: ${stats.close} (${(stats.close/stats.total*100).toFixed(1)}%)`);
  console.log(`Partial: ${stats.partial} (${(stats.partial/stats.total*100).toFixed(1)}%)`);
  console.log(`Miss: ${stats.miss} (${(stats.miss/stats.total*100).toFixed(1)}%)`);
  console.log(`\n** Reverse Accuracy: ${accuracy}% **`);

  if (failures.length > 0) {
    console.log(`\n=== FAILURES (${failures.length}) ===\n`);
    for (const f of failures) {
      console.log(`"${f.susu}" → Expected: "${f.expected}", Got: "${f.got}"`);
    }
  }

  return { stats, accuracy, failures };
}

runTests().catch(console.error);
