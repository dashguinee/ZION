/**
 * Google Translate API for Susu
 *
 * Usage:
 *   1. Set GOOGLE_TRANSLATE_API_KEY environment variable
 *   2. node google_translate_susu.js "Hello, how are you?"
 *   3. Or use as module: const { translateToSusu } = require('./google_translate_susu')
 */

const https = require('https');

const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const SUSU_CODE = 'sus';

/**
 * Translate text to Susu
 */
async function translateToSusu(text) {
  if (!API_KEY) {
    throw new Error('GOOGLE_TRANSLATE_API_KEY not set. See scripts/google_translate_setup.md');
  }

  const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;

  const data = JSON.stringify({
    q: text,
    source: 'en',
    target: SUSU_CODE,
    format: 'text'
  });

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.error) {
            reject(new Error(json.error.message));
          } else {
            resolve(json.data.translations[0].translatedText);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Translate from Susu to English
 */
async function translateFromSusu(text) {
  if (!API_KEY) {
    throw new Error('GOOGLE_TRANSLATE_API_KEY not set');
  }

  const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;

  const data = JSON.stringify({
    q: text,
    source: SUSU_CODE,
    target: 'en',
    format: 'text'
  });

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.error) {
            reject(new Error(json.error.message));
          } else {
            resolve(json.data.translations[0].translatedText);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Batch translate multiple texts
 */
async function batchTranslate(texts, toSusu = true) {
  const results = [];
  for (const text of texts) {
    try {
      const translated = toSusu
        ? await translateToSusu(text)
        : await translateFromSusu(text);
      results.push({ original: text, translated, success: true });
    } catch (e) {
      results.push({ original: text, error: e.message, success: false });
    }
    // Rate limit: 100 requests/second, but be nice
    await new Promise(r => setTimeout(r, 100));
  }
  return results;
}

/**
 * Verify our translation against Google's
 */
async function verifyTranslation(english, ourSusu) {
  const googleSusu = await translateToSusu(english);
  const similarity = calculateSimilarity(ourSusu, googleSusu);

  return {
    english,
    ourSusu,
    googleSusu,
    similarity,
    match: similarity > 0.7
  };
}

/**
 * Simple similarity score (0-1)
 */
function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().split(/\s+/);
  const s2 = str2.toLowerCase().split(/\s+/);

  const set1 = new Set(s1);
  const set2 = new Set(s2);

  const intersection = [...set1].filter(x => set2.has(x)).length;
  const union = new Set([...s1, ...s2]).size;

  return intersection / union;
}

module.exports = {
  translateToSusu,
  translateFromSusu,
  batchTranslate,
  verifyTranslation,
  SUSU_CODE,
};

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (!API_KEY) {
    console.log('ERROR: GOOGLE_TRANSLATE_API_KEY not set');
    console.log('');
    console.log('To set up:');
    console.log('1. Create API key at: https://console.cloud.google.com/apis/credentials');
    console.log('2. export GOOGLE_TRANSLATE_API_KEY="your-key"');
    console.log('3. Run again');
    process.exit(1);
  }

  if (args.length === 0) {
    console.log('Usage: node google_translate_susu.js "text to translate"');
    console.log('       node google_translate_susu.js --from-susu "susu text"');
    process.exit(0);
  }

  const fromSusu = args[0] === '--from-susu';
  const text = fromSusu ? args.slice(1).join(' ') : args.join(' ');

  (async () => {
    try {
      const result = fromSusu
        ? await translateFromSusu(text)
        : await translateToSusu(text);

      console.log(`${fromSusu ? 'Susu' : 'English'}: ${text}`);
      console.log(`${fromSusu ? 'English' : 'Susu'}: ${result}`);
    } catch (e) {
      console.error('Error:', e.message);
    }
  })();
}
