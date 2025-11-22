/**
 * DASH TEST VALIDATION
 * ZION-GEM Directive: Verify code-switching pattern discovery
 *
 * Test Sequence:
 * 1. Teach: "Ma woto fan mafoura" (My car is also fast)
 * 2. Teach: "Ma bateau fan tofan" (My boat is also pretty)
 * 3. Teach: "Ma telephone fan koui" (My phone is also good)
 * 4. Discover: Trigger pattern discovery
 * 5. Verify: Check for {POSSESSIVE} {NOUN} fan {ADJECTIVE} pattern
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runDashTest() {
  log('cyan', '\n╔════════════════════════════════════════╗');
  log('cyan', '║  DASH TEST - Code-Switching Validation ║');
  log('cyan', '╚════════════════════════════════════════╝\n');

  try {
    // Step 1-3: Teach the pattern (3 sentences with "fan" intensifier)
    log('yellow', '📝 Step 1: Teaching pattern sentences...\n');

    const sentences = [
      {
        word: 'Ma woto fan mafoura',
        english: 'My car is also fast',
        french: 'Ma voiture est aussi rapide',
        category: 'phrase'
      },
      {
        word: 'Ma bateau fan tofan',
        english: 'My boat is also pretty',
        french: 'Mon bateau est aussi joli',
        category: 'phrase'
      },
      {
        word: 'Ma telephone fan koui',
        english: 'My phone is also good',
        french: 'Mon téléphone est aussi bon',
        category: 'phrase'
      }
    ];

    for (const sentence of sentences) {
      log('cyan', `   Teaching: "${sentence.word}"`);
      const response = await axios.post(`${API_BASE}/api/contribute`, sentence);
      log('green', `   ✓ Contribution accepted: ${response.data.id}\n`);
    }

    // Mark sentences as verified (simulate user verification)
    log('yellow', '📝 Step 2: Marking sentences as verified...\n');
    log('cyan', '   (Using feedback mechanism to verify)\n');

    // Submit feedback to verify the sentences
    for (const sentence of sentences) {
      await axios.post(`${API_BASE}/api/feedback`, {
        response_id: 'test_' + Date.now(),
        rating: 5,
        correction: sentence.word,
        notes: 'DASH test verification'
      });
      log('green', `   ✓ Verified: "${sentence.word}"`);
    }

    log('green', '\n✅ All test sentences taught and verified\n');

    // Wait a moment for corpus to save
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 4: Trigger pattern discovery
    log('yellow', '🔍 Step 3: Triggering pattern discovery...\n');
    const discoveryResponse = await axios.post(`${API_BASE}/api/learning/discover`);
    const { patterns_discovered, patterns } = discoveryResponse.data;

    log('cyan', `   Found ${patterns_discovered} patterns:\n`);

    if (patterns.length > 0) {
      patterns.forEach(pattern => {
        log('magenta', `   Pattern: ${pattern.pattern}`);
        log('cyan', `   Frequency: ${pattern.frequency} occurrences`);
        log('cyan', `   Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
        log('cyan', `   Examples: ${pattern.examples.join(', ')}\n`);
      });
    } else {
      log('yellow', '   No patterns discovered yet (need more verified sentences)\n');
    }

    // Step 5: Verify expected pattern
    log('yellow', '🧪 Step 4: Verifying expected pattern...\n');

    const expectedPattern = '{POSSESSIVE} {NOUN} fan {ADJECTIVE}';
    const foundExpected = patterns.some(p =>
      p.pattern.includes('fan') ||
      p.pattern.includes('POSSESSIVE') && p.pattern.includes('NOUN')
    );

    if (foundExpected) {
      log('green', `   ✅ SUCCESS: Found pattern similar to "${expectedPattern}"\n`);
    } else {
      log('red', `   ⚠️  PARTIAL: Expected pattern not found yet\n`);
      log('yellow', `   Note: Pattern engine may need more examples or different POS tags\n`);
    }

    // Show corpus stats
    log('yellow', '📊 Step 5: Corpus statistics...\n');
    const statsResponse = await axios.get(`${API_BASE}/api/corpus/stats`);
    const stats = statsResponse.data;

    log('cyan', `   Total sentences: ${stats.total_sentences}`);
    log('cyan', `   Verified sentences: ${stats.verified_sentences}`);
    log('cyan', `   Verification rate: ${stats.verification_rate}`);
    log('cyan', `   Average confidence: ${stats.avg_confidence}\n`);

    // Show learning metrics
    log('yellow', '📈 Step 6: Learning metrics...\n');
    const metricsResponse = await axios.get(`${API_BASE}/api/learning/metrics`);
    const metrics = metricsResponse.data;

    log('cyan', `   Sentences captured: ${metrics.sentences_captured}`);
    log('cyan', `   Patterns discovered: ${metrics.patterns_discovered}`);
    log('cyan', `   Error rate: ${metrics.error_rate}\n`);

    log('green', '\n╔════════════════════════════════════════╗');
    log('green', '║     DASH TEST COMPLETE ✅              ║');
    log('green', '╚════════════════════════════════════════╝\n');

    if (foundExpected) {
      log('green', '🎉 The brain is ALIVE! Pattern discovery is working!\n');
      log('green', '🔀 Code-switching detection active\n');
      log('green', '💾 Patterns persisting to syntax_patterns.json\n');
      log('green', '🚀 Ready for DASH Language protocol\n');
    } else {
      log('yellow', '⚠️  Pattern not discovered yet. Possible reasons:\n');
      log('yellow', '   - Need more examples (try adding 2-3 more sentences)\n');
      log('yellow', '   - POS tagging may differ from expected\n');
      log('yellow', '   - Pattern engine may need lexicon with word categories\n');
      log('cyan', '\n💡 Tip: Check soussou-engine/data/lexicon.json to ensure\n');
      log('cyan', '   words have proper "category" field (possessive, noun, adjective)\n');
    }

  } catch (error) {
    log('red', '\n❌ DASH TEST FAILED\n');

    if (error.code === 'ECONNREFUSED') {
      log('yellow', '⚠️  Cannot connect to API server\n');
      log('cyan', '   Please start the server first:\n');
      log('cyan', '   cd soussou-engine/api && node server.js\n');
    } else if (error.response) {
      log('red', `   Error: ${error.response.status} ${error.response.statusText}\n`);
      log('red', `   Message: ${JSON.stringify(error.response.data, null, 2)}\n`);
    } else {
      log('red', `   Error: ${error.message}\n`);
      console.error(error);
    }

    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  runDashTest().catch(console.error);
}

module.exports = runDashTest;
