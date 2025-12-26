#!/usr/bin/env node
/**
 * Stress Test v2 - Compare Guinius vs Google Translate
 *
 * Tests translations across multiple categories to measure accuracy
 */

const https = require('https');

// Load Guinius
const guinius = require('../src/guinius');
const susuAI = require('../src/susu_ai');

// Set API key
susuAI.CONFIG.googleApiKey = 'AIzaSyCV-1WfnuFLmxw5ib_fuVcO2KLGjUXLpuk';

// Test phrases organized by category
const TEST_PHRASES = {
  greetings: [
    'Hello',
    'Good morning',
    'Good night',
    'How are you',
    'See you later'
  ],
  basic: [
    'Thank you',
    'You are welcome',
    'I love you',
    'What is your name',
    'My name is John'
  ],
  actions: [
    'I am going home',
    'I want to eat',
    'Give me water',
    'Come here',
    'Sit down'
  ],
  questions: [
    'Where are you going',
    'How much does it cost',
    'Do you understand',
    'What time is it',
    'Where do you live'
  ],
  states: [
    'I am happy',
    'I am tired',
    'I am hungry',
    'I am sick',
    'The food is good'
  ]
};

/**
 * Fetch translation from Google Translate API
 */
async function googleTranslate(text) {
  return new Promise((resolve, reject) => {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${susuAI.CONFIG.googleApiKey}`;
    const postData = JSON.stringify({
      q: text,
      source: 'en',
      target: 'sus',
      format: 'text'
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.data && result.data.translations && result.data.translations[0]) {
            resolve(result.data.translations[0].translatedText);
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Normalize for comparison
 */
function normalize(s) {
  if (!s) return '';
  return s.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[?!.,;:'"()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compare two translations
 */
function compare(ours, google) {
  const normOurs = normalize(ours);
  const normGoogle = normalize(google);

  if (normOurs === normGoogle) return { match: 'exact', score: 1 };

  // Check if main words match (ignoring order)
  const ourWords = new Set(normOurs.split(' ').filter(w => w.length > 1));
  const googleWords = new Set(normGoogle.split(' ').filter(w => w.length > 1));

  let overlap = 0;
  for (const w of ourWords) {
    if (googleWords.has(w)) overlap++;
  }

  const total = Math.max(ourWords.size, googleWords.size);
  if (total === 0) return { match: 'empty', score: 0 };

  const score = overlap / total;

  if (score >= 0.7) return { match: 'close', score };
  if (score >= 0.3) return { match: 'partial', score };
  return { match: 'different', score };
}

async function runTests() {
  console.log('=== GUINIUS vs Google Translate Stress Test ===\n');

  const stats = {
    total: 0,
    exact: 0,
    close: 0,
    partial: 0,
    different: 0,
    byCategory: {}
  };

  for (const [category, phrases] of Object.entries(TEST_PHRASES)) {
    console.log(`\n--- ${category.toUpperCase()} ---\n`);

    stats.byCategory[category] = { total: 0, matches: 0 };

    for (const phrase of phrases) {
      try {
        // Get Guinius translation
        const guiniusResult = await guinius.translate(phrase);
        const ours = guiniusResult.translation;
        const source = guiniusResult.source;

        // Get Google translation
        const google = await googleTranslate(phrase);

        // Compare
        const comparison = compare(ours, google);

        stats.total++;
        stats.byCategory[category].total++;

        if (comparison.match === 'exact' || comparison.match === 'close') {
          stats[comparison.match]++;
          stats.byCategory[category].matches++;
          console.log(`✓ "${phrase}"`);
        } else if (comparison.match === 'partial') {
          stats.partial++;
          console.log(`~ "${phrase}"`);
        } else {
          stats.different++;
          console.log(`✗ "${phrase}"`);
        }

        console.log(`  GUINIUS: ${ours} [${source}]`);
        console.log(`  GOOGLE:  ${google}`);
        console.log(`  Match: ${comparison.match} (${(comparison.score * 100).toFixed(0)}%)\n`);

        // Rate limit
        await new Promise(r => setTimeout(r, 150));
      } catch (e) {
        console.error(`Error with "${phrase}":`, e.message);
      }
    }
  }

  // Summary
  console.log('\n=== SUMMARY ===\n');
  console.log(`Total tested: ${stats.total}`);
  console.log(`Exact matches: ${stats.exact} (${(stats.exact/stats.total*100).toFixed(1)}%)`);
  console.log(`Close matches: ${stats.close} (${(stats.close/stats.total*100).toFixed(1)}%)`);
  console.log(`Partial matches: ${stats.partial} (${(stats.partial/stats.total*100).toFixed(1)}%)`);
  console.log(`Different: ${stats.different} (${(stats.different/stats.total*100).toFixed(1)}%)`);

  const accuracy = ((stats.exact + stats.close) / stats.total * 100).toFixed(1);
  console.log(`\n** Overall accuracy: ${accuracy}% **`);

  console.log('\nBy category:');
  for (const [cat, data] of Object.entries(stats.byCategory)) {
    const pct = (data.matches / data.total * 100).toFixed(0);
    console.log(`  ${cat}: ${data.matches}/${data.total} (${pct}%)`);
  }
}

runTests().catch(console.error);
