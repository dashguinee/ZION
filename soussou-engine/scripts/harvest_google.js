#!/usr/bin/env node
/**
 * Google Translate Harvester for Susu
 *
 * Harvests translations from Google Translate to:
 * 1. Expand our verified corpus
 * 2. Learn transformation patterns
 * 3. Identify gaps in our vocabulary
 *
 * Usage: node scripts/harvest_google.js [--save]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Google API key
const API_KEY = 'AIzaSyCV-1WfnuFLmxw5ib_fuVcO2KLGjUXLpuk';

// Phrases to harvest (common everyday phrases not in our corpus)
const HARVEST_PHRASES = [
  // Greetings & Responses
  'Good morning',
  'Good afternoon',
  'Good evening',
  'Good night',
  'See you later',
  'Take care',
  'Have a nice day',

  // Basic Questions
  'Where are you going',
  'Where do you live',
  'How old are you',
  'Do you understand',
  'Can you help me',
  'What time is it',
  'How much does it cost',

  // Basic Statements
  'I am from Guinea',
  'I speak Susu',
  'I am learning Susu',
  'I understand a little',
  'Please speak slowly',
  'I am lost',
  'I am sick',

  // Actions
  'I am going home',
  'I am coming back',
  'I am waiting for you',
  'I will come tomorrow',
  'I went to the market',
  'She is cooking food',
  'He is working',
  'They are sleeping',

  // Food & Drink
  'I am thirsty',
  'Give me water',
  'The food is good',
  'I want to eat',
  'Let us eat',

  // Family
  'This is my mother',
  'This is my father',
  'I have two children',
  'My brother is here',
  'My sister is there',

  // Weather & Nature
  'It is raining',
  'The weather is good',
  'The sky is clear',
  'It is very hot today',

  // Emotions & States
  'I am very happy',
  'I am very tired',
  'I am not feeling well',
  'I miss you',
  'I am grateful',
  'I am sorry',

  // Commerce
  'How much',
  'Too expensive',
  'Give me discount',
  'I will buy this',
  'I have money',
  'I have no money',

  // Directions
  'Turn left',
  'Turn right',
  'Go straight',
  'Stop here',
  'The house is near',
  'The market is far',

  // Time
  'Today',
  'Tomorrow',
  'Yesterday',
  'This morning',
  'This evening',
  'Next week',
  'Last month',

  // Common Verbs (infinitive/command)
  'Come here',
  'Go away',
  'Sit down',
  'Stand up',
  'Wait',
  'Listen',
  'Look',
  'Be quiet',
  'Hurry up'
];

/**
 * Fetch translation from Google Translate API
 */
async function googleTranslate(text, from = 'en', to = 'sus') {
  return new Promise((resolve, reject) => {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
    const postData = JSON.stringify({
      q: text,
      source: from,
      target: to,
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
 * Load existing transformer mappings
 */
function loadTransformer() {
  try {
    const transformer = require('../src/translation_transformer');
    return transformer;
  } catch (e) {
    console.warn('Could not load transformer:', e.message);
    return null;
  }
}

/**
 * Harvest translations and compare with our transformer
 */
async function harvest(phrases, delayMs = 200) {
  const results = [];
  const transformer = loadTransformer();

  console.log(`Harvesting ${phrases.length} phrases from Google Translate...\n`);

  for (let i = 0; i < phrases.length; i++) {
    const phrase = phrases[i];

    try {
      // Get Google translation
      const googleResult = await googleTranslate(phrase);

      // Get our transformer result
      let oursResult = null;
      if (transformer) {
        const transformed = transformer.generateSusu(phrase);
        oursResult = transformed.translation;
      }

      results.push({
        english: phrase,
        google: googleResult,
        ours: oursResult,
        match: googleResult && oursResult &&
               googleResult.toLowerCase().trim() === oursResult.toLowerCase().replace(/\[|\]/g, '').trim()
      });

      // Progress indicator
      const matchIcon = results[results.length - 1].match ? '✓' : '✗';
      console.log(`[${i + 1}/${phrases.length}] ${matchIcon} "${phrase}"`);
      console.log(`  Google: ${googleResult}`);
      if (oursResult) console.log(`  Ours:   ${oursResult}`);
      console.log();

      // Rate limiting
      await new Promise(r => setTimeout(r, delayMs));
    } catch (e) {
      console.error(`Error with "${phrase}":`, e.message);
      results.push({
        english: phrase,
        error: e.message
      });
    }
  }

  return results;
}

/**
 * Analyze harvested results for patterns
 */
function analyzePatterns(results) {
  const analysis = {
    total: results.length,
    successful: 0,
    matched: 0,
    patterns: {
      pronouns: {},
      verbs: {},
      nouns: {},
      phrases: []
    }
  };

  for (const r of results) {
    if (r.google) {
      analysis.successful++;
      if (r.match) analysis.matched++;

      // Store as phrase pattern
      analysis.patterns.phrases.push({
        en: r.english.toLowerCase(),
        sus: r.google
      });
    }
  }

  analysis.matchRate = analysis.successful > 0
    ? ((analysis.matched / analysis.successful) * 100).toFixed(1) + '%'
    : '0%';

  return analysis;
}

/**
 * Generate corpus additions from harvested data
 */
function generateCorpusAdditions(results) {
  const additions = {
    phrases: {},
    words: {}
  };

  for (const r of results) {
    if (r.google && !r.error) {
      const key = r.english.toLowerCase().replace(/[?!.,]/g, '').trim();
      additions.phrases[key] = r.google;

      // Extract single-word translations if phrase is one word
      const words = key.split(/\s+/);
      if (words.length === 1) {
        additions.words[words[0]] = r.google.split(/\s+/)[0];
      }
    }
  }

  return additions;
}

// ===========================================================================
// MAIN
// ===========================================================================

async function main() {
  const args = process.argv.slice(2);
  const shouldSave = args.includes('--save');

  console.log('=== Google Translate Harvester for Susu ===\n');
  console.log(`Mode: ${shouldSave ? 'Harvest + Save' : 'Harvest Only (use --save to persist)'}\n`);

  // Harvest phrases
  const results = await harvest(HARVEST_PHRASES);

  // Analyze patterns
  console.log('\n=== Analysis ===\n');
  const analysis = analyzePatterns(results);
  console.log(`Total phrases: ${analysis.total}`);
  console.log(`Successful translations: ${analysis.successful}`);
  console.log(`Matched our transformer: ${analysis.matched} (${analysis.matchRate})`);

  // Generate additions
  const additions = generateCorpusAdditions(results);
  console.log(`\nNew phrase mappings: ${Object.keys(additions.phrases).length}`);
  console.log(`New word mappings: ${Object.keys(additions.words).length}`);

  if (shouldSave) {
    // Save to file
    const outputPath = path.join(__dirname, '../data/harvested_google.json');
    fs.writeFileSync(outputPath, JSON.stringify({
      harvestDate: new Date().toISOString(),
      analysis,
      results,
      additions
    }, null, 2));
    console.log(`\nSaved to: ${outputPath}`);

    // Also save just the phrase mappings for easy integration
    const phrasePath = path.join(__dirname, '../data/google_phrases.json');
    fs.writeFileSync(phrasePath, JSON.stringify(additions.phrases, null, 2));
    console.log(`Phrase mappings saved to: ${phrasePath}`);
  }

  // Show sample of non-matching patterns for learning
  console.log('\n=== Patterns to Learn ===\n');
  const nonMatching = results.filter(r => r.google && !r.match).slice(0, 10);
  for (const r of nonMatching) {
    console.log(`"${r.english}"`);
    console.log(`  Google: ${r.google}`);
    console.log(`  Ours:   ${r.ours || 'N/A'}`);
    console.log();
  }
}

main().catch(console.error);
