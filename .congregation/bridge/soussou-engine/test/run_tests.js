#!/usr/bin/env node

/**
 * Soussou Engine - Test Runner
 *
 * Comprehensive test harness for validating:
 * - Normalization functions
 * - Sentence generation
 * - Response selection
 * - Fuzzy matching
 */

const fs = require('fs');
const path = require('path');

// Load modules
const { normalize, normalizePhrase, areEquivalent, runTests: runNormTests } = require('../src/normalize');
const variantNormalizer = require('../src/variant_normalizer');

// Load test cases and data
const testCasesPath = path.join(__dirname, 'test_cases.json');
const trainingPath = path.join(__dirname, '..', 'data', 'training_examples.json');

let testCases = {};
let trainingExamples = [];

try {
  testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));
} catch (e) {
  console.error('Warning: Could not load test_cases.json');
}

try {
  trainingExamples = JSON.parse(fs.readFileSync(trainingPath, 'utf8'));
} catch (e) {
  console.error('Warning: Could not load training_examples.json');
}

// =============================================================================
// TEST RESULTS TRACKING
// =============================================================================

const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: [],
  sections: {}
};

function recordResult(section, testName, passed, details = null) {
  if (!results.sections[section]) {
    results.sections[section] = { passed: 0, failed: 0, tests: [] };
  }

  if (passed) {
    results.passed++;
    results.sections[section].passed++;
  } else {
    results.failed++;
    results.sections[section].failed++;
  }

  results.sections[section].tests.push({
    name: testName,
    passed,
    details
  });
}

// =============================================================================
// TEST: NORMALIZATION
// =============================================================================

function testNormalization() {
  console.log('\n--- NORMALIZATION TESTS ---\n');

  // Run built-in normalization tests
  const normResults = runNormTests();
  console.log(`Built-in tests: ${normResults.passed} passed, ${normResults.failed} failed`);

  // Additional normalization tests from test cases
  if (testCases.normalization) {
    for (const test of testCases.normalization) {
      const result = test.input.includes(' ')
        ? normalizePhrase(test.input)
        : normalize(test.input);

      const passed = result === test.expected;
      recordResult('normalization', `"${test.input}" -> "${test.expected}"`, passed, {
        got: result,
        description: test.description || ''
      });

      if (!passed) {
        console.log(`  FAIL: "${test.input}" -> got "${result}", expected "${test.expected}"`);
      }
    }
  }

  // Test equivalence pairs
  if (testCases.equivalence) {
    for (const pair of testCases.equivalence) {
      const passed = areEquivalent(pair.a, pair.b);
      recordResult('equivalence', `"${pair.a}" == "${pair.b}"`, passed, {
        normalized_a: normalizePhrase(pair.a),
        normalized_b: normalizePhrase(pair.b)
      });

      if (!passed) {
        console.log(`  FAIL: "${pair.a}" should equal "${pair.b}"`);
      }
    }
  }

  const section = results.sections['normalization'] || { passed: 0, failed: 0 };
  const equiv = results.sections['equivalence'] || { passed: 0, failed: 0 };
  console.log(`Custom normalization: ${section.passed} passed, ${section.failed} failed`);
  console.log(`Equivalence: ${equiv.passed} passed, ${equiv.failed} failed`);
}

// =============================================================================
// TEST: SENTENCE GENERATION & PATTERN MATCHING
// =============================================================================

function testGeneration() {
  console.log('\n--- GENERATION TESTS ---\n');

  if (!testCases.generation) {
    console.log('No generation tests defined');
    return;
  }

  for (const test of testCases.generation) {
    // Test that input normalizes correctly
    const normalized = variantNormalizer.normalizeInput(test.input);
    const matches = variantNormalizer.findMatches(test.input);

    const wordsFound = matches.filter(m => m.found).length;
    const totalWords = matches.length;

    // Check if expected context/type is detected
    let contextMatched = true;
    if (test.expected_context) {
      // Match against training examples
      const example = trainingExamples.find(ex =>
        variantNormalizer.areEquivalent(ex.soussou, test.input) ||
        ex.context === test.expected_context
      );
      contextMatched = example && example.context === test.expected_context;
    }

    const passed = wordsFound > 0 && contextMatched;
    recordResult('generation', `${test.description}: "${test.input}"`, passed, {
      normalized,
      wordsFound: `${wordsFound}/${totalWords}`,
      matches: matches.map(m => ({
        word: m.original,
        found: m.found,
        base: m.base
      }))
    });

    if (passed) {
      console.log(`  PASS: ${test.description}`);
    } else {
      console.log(`  FAIL: ${test.description} - ${wordsFound}/${totalWords} words matched`);
    }
  }

  const section = results.sections['generation'] || { passed: 0, failed: 0 };
  console.log(`\nGeneration: ${section.passed} passed, ${section.failed} failed`);
}

// =============================================================================
// TEST: RESPONSE SELECTION
// =============================================================================

function testResponses() {
  console.log('\n--- RESPONSE SELECTION TESTS ---\n');

  if (!testCases.responses) {
    console.log('No response tests defined');
    return;
  }

  for (const test of testCases.responses) {
    // Find matching example in training data
    const example = trainingExamples.find(ex => {
      const inputNorm = variantNormalizer.normalizeInput(test.input);
      const exNorm = variantNormalizer.normalizeInput(ex.soussou);
      return inputNorm === exNorm || ex.context === test.context;
    });

    let passed = false;
    let response = null;

    if (example && example.response) {
      response = example.response;

      // Check if response matches expected characteristics
      if (test.expected_response_contains) {
        const respNorm = variantNormalizer.normalizeInput(response.soussou);
        passed = test.expected_response_contains.some(term =>
          respNorm.includes(variantNormalizer.normalizeInput(term))
        );
      } else {
        passed = true;
      }
    }

    recordResult('responses', `"${test.input}" -> response`, passed, {
      context: test.context,
      response: response ? response.soussou : null,
      english: response ? response.english : null
    });

    if (passed) {
      console.log(`  PASS: "${test.input}" -> "${response?.soussou}"`);
    } else {
      console.log(`  FAIL: "${test.input}" - no matching response found`);
    }
  }

  const section = results.sections['responses'] || { passed: 0, failed: 0 };
  console.log(`\nResponses: ${section.passed} passed, ${section.failed} failed`);
}

// =============================================================================
// TEST: FUZZY MATCHING
// =============================================================================

function testFuzzyMatching() {
  console.log('\n--- FUZZY MATCHING TESTS ---\n');

  if (!testCases.fuzzy) {
    console.log('No fuzzy matching tests defined');
    return;
  }

  for (const test of testCases.fuzzy) {
    const matches = variantNormalizer.fuzzyMatch(test.input, test.threshold || 0.6);
    const topMatch = matches.length > 0 ? matches[0] : null;

    let passed = false;
    if (test.expected_base) {
      passed = topMatch && topMatch.base === test.expected_base;
    } else if (test.should_match) {
      passed = matches.length > 0;
    } else {
      passed = matches.length === 0;
    }

    recordResult('fuzzy', `"${test.input}" fuzzy match`, passed, {
      topMatch: topMatch ? { base: topMatch.base, score: topMatch.score.toFixed(2) } : null,
      matchCount: matches.length
    });

    if (passed) {
      console.log(`  PASS: "${test.input}" -> ${topMatch ? topMatch.base : 'no match'}`);
    } else {
      console.log(`  FAIL: "${test.input}" - got ${topMatch?.base || 'nothing'}, expected ${test.expected_base || 'no match'}`);
    }
  }

  const section = results.sections['fuzzy'] || { passed: 0, failed: 0 };
  console.log(`\nFuzzy matching: ${section.passed} passed, ${section.failed} failed`);
}

// =============================================================================
// TEST: EDGE CASES
// =============================================================================

function testEdgeCases() {
  console.log('\n--- EDGE CASE TESTS ---\n');

  // Test null/undefined handling
  const nullTests = [
    { input: null, name: 'null input' },
    { input: undefined, name: 'undefined input' },
    { input: '', name: 'empty string' },
    { input: '   ', name: 'whitespace only' }
  ];

  for (const test of nullTests) {
    try {
      const result = normalize(test.input);
      const passed = result === '';
      recordResult('edge_cases', test.name, passed, { result });

      if (passed) {
        console.log(`  PASS: ${test.name} returns empty string`);
      } else {
        console.log(`  FAIL: ${test.name} returned "${result}"`);
      }
    } catch (e) {
      recordResult('edge_cases', test.name, false, { error: e.message });
      console.log(`  FAIL: ${test.name} threw error: ${e.message}`);
    }
  }

  // Test special characters
  const specialTests = [
    { input: "N'a", expected: 'na', name: 'apostrophe removal' },
    { input: 'fafé', expected: 'fafe', name: 'accent removal' },
    { input: 'fafeh', expected: 'fafe', name: 'trailing h removal' },
    { input: 'tanna', expected: 'tana', name: 'double consonant compression' },
    { input: 'kɛmɛ', expected: 'keme', name: 'IPA character conversion' }
  ];

  for (const test of specialTests) {
    const result = normalize(test.input);
    const passed = result === test.expected;
    recordResult('edge_cases', test.name, passed, {
      input: test.input,
      expected: test.expected,
      got: result
    });

    if (passed) {
      console.log(`  PASS: ${test.name}`);
    } else {
      console.log(`  FAIL: ${test.name} - got "${result}", expected "${test.expected}"`);
    }
  }

  const section = results.sections['edge_cases'] || { passed: 0, failed: 0 };
  console.log(`\nEdge cases: ${section.passed} passed, ${section.failed} failed`);
}

// =============================================================================
// TEST: CONTEXT DETECTION
// =============================================================================

function testContextDetection() {
  console.log('\n--- CONTEXT DETECTION TESTS ---\n');

  if (!testCases.context_detection) {
    console.log('No context detection tests defined');
    return;
  }

  for (const test of testCases.context_detection) {
    // Find the example that matches this input
    const normalizedInput = variantNormalizer.normalizeInput(test.input);

    const example = trainingExamples.find(ex => {
      const exNorm = variantNormalizer.normalizeInput(ex.soussou);
      return exNorm === normalizedInput;
    });

    const detectedContext = example ? example.context : null;
    const passed = detectedContext === test.expected_context;

    recordResult('context_detection', `"${test.input}" -> ${test.expected_context}`, passed, {
      detected: detectedContext,
      expected: test.expected_context
    });

    if (passed) {
      console.log(`  PASS: "${test.input}" -> ${detectedContext}`);
    } else {
      console.log(`  FAIL: "${test.input}" - got ${detectedContext}, expected ${test.expected_context}`);
    }
  }

  const section = results.sections['context_detection'] || { passed: 0, failed: 0 };
  console.log(`\nContext detection: ${section.passed} passed, ${section.failed} failed`);
}

// =============================================================================
// REPORT GENERATION
// =============================================================================

function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('                    TEST REPORT');
  console.log('='.repeat(60));

  console.log(`\nOverall Results:`);
  console.log(`  Total:  ${results.passed + results.failed}`);
  console.log(`  Passed: ${results.passed}`);
  console.log(`  Failed: ${results.failed}`);
  console.log(`  Rate:   ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  console.log(`\nBy Section:`);
  for (const [section, data] of Object.entries(results.sections)) {
    const total = data.passed + data.failed;
    const rate = total > 0 ? ((data.passed / total) * 100).toFixed(1) : '0.0';
    console.log(`  ${section}: ${data.passed}/${total} (${rate}%)`);
  }

  // Show failures
  if (results.failed > 0) {
    console.log(`\nFailures:`);
    for (const [section, data] of Object.entries(results.sections)) {
      const failures = data.tests.filter(t => !t.passed);
      if (failures.length > 0) {
        console.log(`\n  [${section}]`);
        for (const test of failures) {
          console.log(`    - ${test.name}`);
          if (test.details) {
            console.log(`      Details: ${JSON.stringify(test.details)}`);
          }
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60));

  // Return exit code
  return results.failed === 0 ? 0 : 1;
}

// =============================================================================
// RUN ALL TESTS
// =============================================================================

function runAllTests() {
  console.log('Soussou Engine - Test Runner');
  console.log('='.repeat(60));
  console.log(`Started: ${new Date().toISOString()}`);

  testNormalization();
  testGeneration();
  testResponses();
  testFuzzyMatching();
  testEdgeCases();
  testContextDetection();

  const exitCode = generateReport();
  process.exit(exitCode);
}

// Export for use as module
module.exports = {
  runAllTests,
  testNormalization,
  testGeneration,
  testResponses,
  testFuzzyMatching,
  testEdgeCases,
  testContextDetection,
  generateReport,
  results
};

// Run if executed directly
if (require.main === module) {
  runAllTests();
}
