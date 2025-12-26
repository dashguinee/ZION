#!/usr/bin/env node
/**
 * Integrate Google-harvested phrases into conversational_susu.json
 */

const fs = require('fs');
const path = require('path');

// Load harvested phrases
const googlePhrases = require('../data/google_phrases.json');

// Load current corpus
const corpusPath = path.join(__dirname, '../data/conversational_susu.json');
const corpus = require(corpusPath);

// Organize phrases by category
const categorized = {
  greetings: {},
  questions: {},
  statements: {},
  actions: {},
  food_drink: {},
  family: {},
  weather: {},
  emotions: {},
  commerce: {},
  directions: {},
  time: {},
  commands: {}
};

// Categorize phrases
for (const [eng, sus] of Object.entries(googlePhrases)) {
  const lower = eng.toLowerCase();

  if (lower.includes('morning') || lower.includes('afternoon') ||
      lower.includes('evening') || lower.includes('night') ||
      lower.includes('see you') || lower.includes('take care') ||
      lower.includes('nice day')) {
    categorized.greetings[eng] = sus;
  }
  else if (lower.includes('where') || lower.includes('how') ||
           lower.includes('what') || lower.includes('do you') ||
           lower.includes('can you')) {
    categorized.questions[eng] = sus;
  }
  else if (lower.includes('mother') || lower.includes('father') ||
           lower.includes('brother') || lower.includes('sister') ||
           lower.includes('children')) {
    categorized.family[eng] = sus;
  }
  else if (lower.includes('rain') || lower.includes('weather') ||
           lower.includes('sky') || lower.includes('hot today')) {
    categorized.weather[eng] = sus;
  }
  else if (lower.includes('happy') || lower.includes('tired') ||
           lower.includes('feeling') || lower.includes('miss') ||
           lower.includes('grateful') || lower.includes('sorry')) {
    categorized.emotions[eng] = sus;
  }
  else if (lower.includes('much') || lower.includes('expensive') ||
           lower.includes('discount') || lower.includes('buy') ||
           lower.includes('money')) {
    categorized.commerce[eng] = sus;
  }
  else if (lower.includes('left') || lower.includes('right') ||
           lower.includes('straight') || lower.includes('near') ||
           lower.includes('far') || lower.includes('stop here')) {
    categorized.directions[eng] = sus;
  }
  else if (lower === 'today' || lower === 'tomorrow' || lower === 'yesterday' ||
           lower.includes('morning') || lower.includes('evening') ||
           lower.includes('week') || lower.includes('month')) {
    categorized.time[eng] = sus;
  }
  else if (lower.includes('eat') || lower.includes('thirsty') ||
           lower.includes('water') || lower.includes('food')) {
    categorized.food_drink[eng] = sus;
  }
  else if (lower.includes('come') || lower.includes('go ') ||
           lower.includes('sit') || lower.includes('stand') ||
           lower.includes('wait') || lower.includes('listen') ||
           lower.includes('look') || lower.includes('quiet') ||
           lower.includes('hurry')) {
    categorized.commands[eng] = sus;
  }
  else if (lower.startsWith('i am') || lower.startsWith('i ') ||
           lower.startsWith('he ') || lower.startsWith('she ') ||
           lower.startsWith('they ')) {
    categorized.statements[eng] = sus;
  }
  else {
    categorized.actions[eng] = sus;
  }
}

// Merge into corpus
let added = 0;

// Add to greetings
if (!corpus.greetings) corpus.greetings = {};
for (const [eng, sus] of Object.entries(categorized.greetings)) {
  if (!corpus.greetings[eng]) {
    corpus.greetings[eng] = sus;
    added++;
  }
}

// Add to questions
if (!corpus.questions) corpus.questions = {};
for (const [eng, sus] of Object.entries(categorized.questions)) {
  if (!corpus.questions[eng]) {
    corpus.questions[eng] = sus;
    added++;
  }
}

// Add family
if (!corpus.family) corpus.family = {};
for (const [eng, sus] of Object.entries(categorized.family)) {
  if (!corpus.family[eng]) {
    corpus.family[eng] = sus;
    added++;
  }
}

// Add weather
if (!corpus.weather) corpus.weather = {};
for (const [eng, sus] of Object.entries(categorized.weather)) {
  if (!corpus.weather[eng]) {
    corpus.weather[eng] = sus;
    added++;
  }
}

// Add emotions
if (!corpus.emotions) corpus.emotions = {};
for (const [eng, sus] of Object.entries(categorized.emotions)) {
  if (!corpus.emotions[eng]) {
    corpus.emotions[eng] = sus;
    added++;
  }
}

// Add commerce
if (!corpus.commerce) corpus.commerce = {};
for (const [eng, sus] of Object.entries(categorized.commerce)) {
  if (!corpus.commerce[eng]) {
    corpus.commerce[eng] = sus;
    added++;
  }
}

// Add directions
if (!corpus.directions) corpus.directions = {};
for (const [eng, sus] of Object.entries(categorized.directions)) {
  if (!corpus.directions[eng]) {
    corpus.directions[eng] = sus;
    added++;
  }
}

// Add time
if (!corpus.time) corpus.time = {};
for (const [eng, sus] of Object.entries(categorized.time)) {
  if (!corpus.time[eng]) {
    corpus.time[eng] = sus;
    added++;
  }
}

// Add food_drink
if (!corpus.food_drink) corpus.food_drink = {};
for (const [eng, sus] of Object.entries(categorized.food_drink)) {
  if (!corpus.food_drink[eng]) {
    corpus.food_drink[eng] = sus;
    added++;
  }
}

// Add commands
if (!corpus.commands) corpus.commands = {};
for (const [eng, sus] of Object.entries(categorized.commands)) {
  if (!corpus.commands[eng]) {
    corpus.commands[eng] = sus;
    added++;
  }
}

// Add statements
if (!corpus.statements) corpus.statements = {};
for (const [eng, sus] of Object.entries(categorized.statements)) {
  if (!corpus.statements[eng]) {
    corpus.statements[eng] = sus;
    added++;
  }
}

// Save updated corpus
fs.writeFileSync(corpusPath, JSON.stringify(corpus, null, 2));

console.log('=== Integration Complete ===');
console.log(`Added ${added} new phrases to corpus`);
console.log(`\nBreakdown by category:`);
for (const [cat, phrases] of Object.entries(categorized)) {
  console.log(`  ${cat}: ${Object.keys(phrases).length}`);
}

// Also print patterns learned
console.log('\n=== Key Patterns Extracted ===\n');
console.log('1. PRONOUNS (simple form):');
console.log('   N = I (not N\'tan)');
console.log('   I = you (informal)');
console.log('   Wo = you (formal/plural)');
console.log('   A = he/she/it');
console.log('   E = they');
console.log('   Won = we');

console.log('\n2. TENSE MARKERS:');
console.log('   na + VERB-fe = present progressive (N na sigafe = I am going)');
console.log('   bara + VERB = perfective/completed (N bara lOE = I have gotten lost)');
console.log('   naxa = narrative past (N naxa siga = I went)');
console.log('   fama = future (N fama = I will come)');

console.log('\n3. QUESTION STRUCTURE:');
console.log('   SOV with question word at end:');
console.log('   "Wo sigafe minden" = You going where?');
console.log('   "Waxati mundun na" = Time what is?');

console.log('\n4. COMMANDS:');
console.log('   Wo xa + VERB = polite command (Wo xa dundu = Please be quiet)');
console.log('   Bare VERB = direct command (Keli = Stand up)');

console.log('\n5. POSSESSION:');
console.log('   N + NOUN = my NOUN (N nga = my mother)');
console.log('   N ma + NOUN = my NOUN (N ma di = my child)');
