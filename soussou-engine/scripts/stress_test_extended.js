#!/usr/bin/env node
/**
 * Extended Stress Test - 50+ phrases across all categories
 */

const https = require('https');
const guinius = require('../src/guinius');
const susuAI = require('../src/susu_ai');

susuAI.CONFIG.googleApiKey = 'AIzaSyCV-1WfnuFLmxw5ib_fuVcO2KLGjUXLpuk';

// Extended test set - 50 phrases
const TEST_PHRASES = [
  // Greetings (10)
  'Hello', 'Good morning', 'Good afternoon', 'Good evening', 'Good night',
  'How are you', 'See you later', 'Take care', 'Have a nice day', 'Welcome',

  // Basic (10)
  'Thank you', 'You are welcome', 'I love you', 'What is your name', 'My name is John',
  'Yes', 'No', 'Please', 'I am sorry', 'Excuse me',

  // Actions (10)
  'I am going home', 'I want to eat', 'Give me water', 'Come here', 'Sit down',
  'Stand up', 'Wait', 'Listen', 'Look', 'Hurry up',

  // Questions (10)
  'Where are you going', 'How much does it cost', 'Do you understand', 'What time is it', 'Where do you live',
  'How old are you', 'Can you help me', 'Where are you from', 'What are you doing', 'Why',

  // States (10)
  'I am happy', 'I am tired', 'I am hungry', 'I am sick', 'The food is good',
  'I am thirsty', 'I am very happy', 'I am very tired', 'I am lost', 'I understand a little'
];

async function googleTranslate(text) {
  return new Promise((resolve, reject) => {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${susuAI.CONFIG.googleApiKey}`;
    const postData = JSON.stringify({ q: text, source: 'en', target: 'sus', format: 'text' });
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    };
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.data?.translations?.[0]) resolve(result.data.translations[0].translatedText);
          else resolve(null);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function normalize(s) {
  if (!s) return '';
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[?!.,;:'"()]/g, '').replace(/\s+/g, ' ').trim();
}

function compare(ours, google) {
  const normOurs = normalize(ours);
  const normGoogle = normalize(google);
  if (normOurs === normGoogle) return { match: 'exact', score: 1 };

  const ourWords = new Set(normOurs.split(' ').filter(w => w.length > 1));
  const googleWords = new Set(normGoogle.split(' ').filter(w => w.length > 1));
  let overlap = 0;
  for (const w of ourWords) if (googleWords.has(w)) overlap++;

  const total = Math.max(ourWords.size, googleWords.size);
  if (total === 0) return { match: 'empty', score: 0 };
  const score = overlap / total;

  if (score >= 0.7) return { match: 'close', score };
  if (score >= 0.3) return { match: 'partial', score };
  return { match: 'different', score };
}

async function runTests() {
  console.log('=== GUINIUS Extended Stress Test (50 phrases) ===\n');

  const stats = { total: 0, exact: 0, close: 0, partial: 0, different: 0 };
  const failures = [];

  for (let i = 0; i < TEST_PHRASES.length; i++) {
    const phrase = TEST_PHRASES[i];
    try {
      const guiniusResult = await guinius.translate(phrase);
      const ours = guiniusResult.translation;
      const source = guiniusResult.source;
      const google = await googleTranslate(phrase);
      const comparison = compare(ours, google);

      stats.total++;
      stats[comparison.match]++;

      const icon = comparison.match === 'exact' || comparison.match === 'close' ? '✓' :
                   comparison.match === 'partial' ? '~' : '✗';

      console.log(`[${i+1}/${TEST_PHRASES.length}] ${icon} "${phrase}" [${source}]`);

      if (comparison.match !== 'exact' && comparison.match !== 'close') {
        failures.push({ phrase, ours, google, source, match: comparison.match });
      }

      await new Promise(r => setTimeout(r, 100));
    } catch (e) {
      console.error(`Error: ${phrase}:`, e.message);
    }
  }

  const accuracy = ((stats.exact + stats.close) / stats.total * 100).toFixed(1);

  console.log('\n=== SUMMARY ===\n');
  console.log(`Total: ${stats.total}`);
  console.log(`Exact: ${stats.exact} (${(stats.exact/stats.total*100).toFixed(1)}%)`);
  console.log(`Close: ${stats.close} (${(stats.close/stats.total*100).toFixed(1)}%)`);
  console.log(`Partial: ${stats.partial} (${(stats.partial/stats.total*100).toFixed(1)}%)`);
  console.log(`Different: ${stats.different} (${(stats.different/stats.total*100).toFixed(1)}%)`);
  console.log(`\n** ACCURACY: ${accuracy}% **`);

  if (failures.length > 0) {
    console.log(`\n=== FAILURES (${failures.length}) ===\n`);
    for (const f of failures) {
      console.log(`"${f.phrase}" [${f.source}]`);
      console.log(`  OURS:   ${f.ours}`);
      console.log(`  GOOGLE: ${f.google}\n`);
    }
  }
}

runTests().catch(console.error);
