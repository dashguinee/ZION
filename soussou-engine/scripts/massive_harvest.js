#!/usr/bin/env node
/**
 * GUINIUS - Massive Phrase Harvester for Susu (Soussou)
 *
 * Harvests 500+ phrases from Google Translate across 12 practical categories
 * for building a comprehensive Susu language learning system.
 *
 * Usage: node scripts/massive_harvest.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Google API configuration
const API_KEY = 'AIzaSyCV-1WfnuFLmxw5ib_fuVcO2KLGjUXLpuk';
const TARGET_LANG = 'sus'; // Susu language code

// =============================================================================
// COMPREHENSIVE PHRASE DATABASE - 500+ PHRASES ACROSS 12 CATEGORIES
// =============================================================================

const PHRASE_CATEGORIES = {
  // Category 1: Greetings & Farewells (50+ phrases)
  greetings_farewells: [
    // Basic Greetings
    'Hello',
    'Hi',
    'Good morning',
    'Good afternoon',
    'Good evening',
    'Good night',
    'How are you',
    'I am fine',
    'I am fine thank you',
    'And you',
    'What is your name',
    'My name is',
    'Nice to meet you',
    'Welcome',
    'Welcome home',

    // Farewells
    'Goodbye',
    'See you later',
    'See you tomorrow',
    'See you soon',
    'Take care',
    'Have a nice day',
    'Have a good trip',
    'Safe travels',
    'Sleep well',
    'Until next time',

    // Polite Expressions
    'Please',
    'Thank you',
    'Thank you very much',
    'You are welcome',
    'Excuse me',
    'Sorry',
    'I am sorry',
    'No problem',
    'It is nothing',
    'Bless you',

    // Greetings with context
    'Good morning everyone',
    'How was your night',
    'Did you sleep well',
    'How is your family',
    'How is work',
    'Long time no see',
    'I missed you',
    'I am happy to see you',
    'Peace be with you',
    'May God bless you',

    // Responses
    'I am doing well',
    'Everything is fine',
    'All is well',
    'Thanks to God',
    'By the grace of God',
    'I am blessed',
  ],

  // Category 2: Family & Relationships (50+ phrases)
  family_relationships: [
    // Family Members
    'Mother',
    'Father',
    'Parents',
    'Child',
    'Children',
    'Son',
    'Daughter',
    'Brother',
    'Sister',
    'Grandfather',
    'Grandmother',
    'Grandparents',
    'Uncle',
    'Aunt',
    'Cousin',
    'Nephew',
    'Niece',
    'Husband',
    'Wife',
    'Family',

    // Family Statements
    'This is my mother',
    'This is my father',
    'This is my wife',
    'This is my husband',
    'This is my child',
    'I have two children',
    'I have three brothers',
    'My sister is older',
    'My brother is younger',
    'My family is big',
    'My family is small',

    // Relationship Questions
    'Are you married',
    'Do you have children',
    'How many children do you have',
    'Where is your family',
    'Who is this',
    'Is this your mother',
    'Is this your father',

    // Relationship Statements
    'I am married',
    'I am not married',
    'I am single',
    'She is my friend',
    'He is my friend',
    'They are my neighbors',
    'I love my family',
    'I love my mother',
    'I love my father',
    'We are family',
    'Family is important',
    'I am the eldest',
    'I am the youngest',
  ],

  // Category 3: Food & Drink (50+ phrases)
  food_drink: [
    // Basic Foods
    'Food',
    'Water',
    'Rice',
    'Fish',
    'Meat',
    'Chicken',
    'Bread',
    'Vegetables',
    'Fruit',
    'Mango',
    'Banana',
    'Orange',
    'Peanuts',
    'Palm oil',
    'Salt',
    'Sugar',
    'Pepper',
    'Onion',
    'Tomato',
    'Cassava',

    // Drinks
    'Tea',
    'Coffee',
    'Milk',
    'Juice',
    'Palm wine',
    'Cold water',
    'Hot water',

    // Hunger & Thirst
    'I am hungry',
    'I am thirsty',
    'I am not hungry',
    'I am not thirsty',
    'Are you hungry',
    'Are you thirsty',

    // Eating & Drinking
    'I want to eat',
    'I want to drink',
    'Let us eat',
    'Let us drink',
    'Give me water',
    'Give me food',
    'I am eating',
    'I am drinking',
    'The food is good',
    'The food is ready',
    'The food is hot',
    'The food is cold',
    'Delicious',
    'I am full',
    'I ate already',

    // Cooking
    'She is cooking',
    'He is cooking',
    'What are you cooking',
    'I am cooking rice',
    'The rice is ready',
    'Come and eat',
  ],

  // Category 4: Health & Body (50+ phrases)
  health_body: [
    // Body Parts
    'Head',
    'Eye',
    'Eyes',
    'Ear',
    'Ears',
    'Nose',
    'Mouth',
    'Teeth',
    'Tongue',
    'Hand',
    'Hands',
    'Arm',
    'Foot',
    'Feet',
    'Leg',
    'Stomach',
    'Back',
    'Heart',
    'Blood',
    'Body',

    // Health States
    'I am sick',
    'I am not sick',
    'I am healthy',
    'I am tired',
    'I am very tired',
    'I am weak',
    'I am strong',
    'I am in pain',
    'I have a headache',
    'I have a stomachache',
    'My head hurts',
    'My stomach hurts',
    'My back hurts',
    'I have a fever',
    'I have a cold',
    'I have a cough',
    'I am not feeling well',

    // Medical
    'Doctor',
    'Hospital',
    'Medicine',
    'I need medicine',
    'Where is the hospital',
    'Call the doctor',
    'I need help',
    'It hurts here',
    'I feel better',
    'I am getting better',
    'Take care of yourself',
    'Get well soon',
    'Rest well',
    'Drink water',
    'Eat medicine',
  ],

  // Category 5: Numbers & Time (50+ phrases)
  numbers_time: [
    // Numbers
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'One hundred',
    'One thousand',

    // Time Words
    'Today',
    'Tomorrow',
    'Yesterday',
    'Now',
    'Later',
    'Morning',
    'Afternoon',
    'Evening',
    'Night',
    'Day',
    'Week',
    'Month',
    'Year',

    // Time Phrases
    'What time is it',
    'It is morning',
    'It is afternoon',
    'It is evening',
    'It is late',
    'It is early',
    'This morning',
    'This evening',
    'Last night',
    'Next week',
    'Last month',
    'This year',
    'Every day',
    'All day',
    'All night',

    // Age & Duration
    'How old are you',
    'I am twenty years old',
    'How long',
    'How many days',
    'Two hours',
    'Three days',
    'One week',
    'Wait a moment',
  ],

  // Category 6: Travel & Directions (50+ phrases)
  travel_directions: [
    // Directions
    'Left',
    'Right',
    'Straight',
    'Up',
    'Down',
    'Here',
    'There',
    'Near',
    'Far',
    'North',
    'South',
    'East',
    'West',
    'Inside',
    'Outside',
    'Front',
    'Back',
    'Behind',

    // Direction Commands
    'Turn left',
    'Turn right',
    'Go straight',
    'Go forward',
    'Go back',
    'Stop here',
    'Come here',
    'Go there',

    // Places
    'House',
    'Home',
    'Market',
    'School',
    'Hospital',
    'Mosque',
    'Church',
    'Road',
    'Street',
    'Village',
    'City',

    // Travel Questions
    'Where are you going',
    'Where is the market',
    'Where is the hospital',
    'Where is the school',
    'How do I get there',
    'Is it far',
    'Is it near',

    // Travel Statements
    'I am going home',
    'I am coming back',
    'I am leaving',
    'I am arriving',
    'I am lost',
    'The house is near',
    'The market is far',
    'I will come back',
  ],

  // Category 7: Shopping & Money (50+ phrases)
  shopping_money: [
    // Money Terms
    'Money',
    'Price',
    'Expensive',
    'Cheap',
    'Free',
    'Cost',
    'Pay',
    'Buy',
    'Sell',
    'Change',

    // Shopping Questions
    'How much',
    'How much is this',
    'How much does it cost',
    'What is the price',
    'Is it expensive',
    'Can you reduce the price',
    'Do you have change',
    'Do you have this',

    // Shopping Statements
    'I want to buy',
    'I will buy this',
    'I am not buying',
    'Too expensive',
    'Give me discount',
    'I have money',
    'I have no money',
    'I will pay',
    'I have paid',
    'Keep the change',

    // Items
    'Clothes',
    'Shoes',
    'Bag',
    'Phone',
    'This one',
    'That one',
    'Another one',
    'The same',
    'Different',

    // Bargaining
    'What is your last price',
    'That is too much',
    'I cannot afford',
    'Lower the price',
    'Good price',
    'Fair price',
    'Final price',
    'I agree',
    'No thank you',
    'Maybe later',
    'I will come back',
  ],

  // Category 8: Work & Education (50+ phrases)
  work_education: [
    // Work Terms
    'Work',
    'Job',
    'Office',
    'Boss',
    'Worker',
    'Employee',
    'Salary',
    'Business',
    'Farmer',
    'Teacher',
    'Student',

    // Work Phrases
    'I am working',
    'I am going to work',
    'I finished work',
    'I have a job',
    'I am looking for work',
    'Where do you work',
    'What is your job',
    'I work here',
    'Work is hard',
    'Work is good',

    // Education Terms
    'School',
    'Book',
    'Pen',
    'Paper',
    'To read',
    'To write',
    'To learn',
    'To teach',
    'To study',
    'Class',
    'Lesson',

    // Education Phrases
    'I am a student',
    'I am a teacher',
    'I am learning',
    'I am studying',
    'I go to school',
    'I can read',
    'I can write',
    'I cannot read',
    'I cannot write',
    'I am learning Susu',
    'Teach me',
    'I understand',
    'I do not understand',
    'What does this mean',
    'How do you say',
    'Repeat please',
    'Speak slowly',
  ],

  // Category 9: Weather & Nature (50+ phrases)
  weather_nature: [
    // Weather Terms
    'Weather',
    'Sun',
    'Rain',
    'Wind',
    'Cloud',
    'Storm',
    'Hot',
    'Cold',
    'Warm',
    'Dry',
    'Wet',

    // Weather States
    'It is hot',
    'It is cold',
    'It is raining',
    'It is sunny',
    'The weather is good',
    'The weather is bad',
    'It is very hot today',
    'It will rain today',
    'The sun is strong',
    'The rain has stopped',

    // Nature Terms
    'Tree',
    'River',
    'Mountain',
    'Ocean',
    'Sea',
    'Forest',
    'Field',
    'Farm',
    'Sky',
    'Moon',
    'Stars',
    'Earth',
    'Ground',
    'Grass',
    'Flower',

    // Animals
    'Animal',
    'Dog',
    'Cat',
    'Bird',
    'Fish',
    'Cow',
    'Goat',
    'Sheep',
    'Chicken',
    'Horse',
    'Monkey',
    'Snake',
    'Elephant',
    'Lion',

    // Nature Phrases
    'Beautiful sky',
    'The river is big',
    'The mountain is high',
    'The forest is green',
    'I love nature',
  ],

  // Category 10: Emotions & Feelings (50+ phrases)
  emotions_feelings: [
    // Basic Emotions
    'Happy',
    'Sad',
    'Angry',
    'Afraid',
    'Scared',
    'Surprised',
    'Tired',
    'Excited',
    'Worried',
    'Calm',
    'Peaceful',

    // Emotion Statements
    'I am happy',
    'I am sad',
    'I am angry',
    'I am afraid',
    'I am scared',
    'I am surprised',
    'I am tired',
    'I am excited',
    'I am worried',
    'I am calm',
    'I am at peace',

    // Strong Emotions
    'I am very happy',
    'I am very sad',
    'I am very angry',
    'I am very tired',
    'I am very afraid',
    'I am very excited',
    'I am very worried',

    // Emotion Questions
    'Are you happy',
    'Are you sad',
    'Are you angry',
    'Are you afraid',
    'Are you tired',
    'Are you okay',
    'What is wrong',
    'Why are you sad',
    'Why are you angry',
    'Do not be afraid',
    'Do not worry',
    'Be happy',
    'Do not be sad',

    // Love & Caring
    'I love you',
    'I miss you',
    'I care about you',
    'I am thinking of you',
    'You are important',
    'I am grateful',
    'I am thankful',
    'I appreciate you',
    'Thank you for everything',
    'You make me happy',
  ],

  // Category 11: Common Verbs in Context (50+ phrases)
  common_verbs: [
    // Movement Verbs
    'To go',
    'To come',
    'To walk',
    'To run',
    'To sit',
    'To stand',
    'To lie down',
    'To stop',
    'To wait',
    'To return',

    // Action Verbs
    'To eat',
    'To drink',
    'To cook',
    'To wash',
    'To clean',
    'To sleep',
    'To wake up',
    'To work',
    'To play',
    'To dance',
    'To sing',

    // Communication Verbs
    'To speak',
    'To say',
    'To ask',
    'To answer',
    'To listen',
    'To hear',
    'To call',
    'To tell',

    // Cognitive Verbs
    'To see',
    'To look',
    'To know',
    'To think',
    'To understand',
    'To remember',
    'To forget',
    'To learn',
    'To teach',

    // Verbs in Context
    'I am going',
    'You are coming',
    'He is eating',
    'She is cooking',
    'They are sleeping',
    'We are working',
    'I want to go',
    'I need to eat',
    'I have to work',
    'I can see',
    'I cannot hear',
    'Do you know',
    'I do not know',
    'Tell me',
    'Show me',
    'Help me',
    'Give me',
    'Take this',
    'Bring it',
    'Put it here',
  ],

  // Category 12: Daily Activities (50+ phrases)
  daily_activities: [
    // Morning Routine
    'Wake up',
    'Get up',
    'I woke up early',
    'I woke up late',
    'Brush teeth',
    'Wash face',
    'Take a bath',
    'Get dressed',
    'Eat breakfast',
    'Leave the house',

    // Daily Tasks
    'Go to work',
    'Go to school',
    'Go to market',
    'Buy food',
    'Cook food',
    'Wash clothes',
    'Clean the house',
    'Sweep the floor',
    'Fetch water',

    // Evening Routine
    'Come home',
    'Return from work',
    'Eat dinner',
    'Rest',
    'Watch television',
    'Talk with family',
    'Go to bed',
    'Sleep',

    // Weekly Activities
    'Go to church',
    'Go to mosque',
    'Visit family',
    'Visit friends',
    'Go shopping',
    'Do laundry',

    // Activity Questions
    'What are you doing',
    'What did you do today',
    'Where are you going',
    'What will you do tomorrow',
    'Did you eat',
    'Did you sleep well',
    'Have you finished',

    // Activity Statements
    'I am busy',
    'I am free',
    'I have finished',
    'I have not finished',
    'I am doing nothing',
    'I am resting',
    'I am on my way',
    'I will be there soon',
    'I am almost done',
    'Wait for me',
  ],
};

// =============================================================================
// GOOGLE TRANSLATE API FUNCTIONS
// =============================================================================

/**
 * Translate a single phrase using Google Translate API
 */
async function translatePhrase(text, from = 'en', to = TARGET_LANG) {
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
          if (result.error) {
            reject(new Error(result.error.message || 'API Error'));
          } else if (result.data && result.data.translations && result.data.translations[0]) {
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
 * Harvest all phrases with rate limiting
 */
async function harvestAllPhrases(delayMs = 150) {
  const results = {
    metadata: {
      harvestDate: new Date().toISOString(),
      sourceLanguage: 'en',
      targetLanguage: TARGET_LANG,
      totalPhrases: 0,
      successfulTranslations: 0,
      failedTranslations: 0,
      categories: Object.keys(PHRASE_CATEGORIES).length
    },
    categories: {},
    allPhrases: [],
    simplifiedCorpus: {}
  };

  // Count total phrases
  for (const [category, phrases] of Object.entries(PHRASE_CATEGORIES)) {
    results.metadata.totalPhrases += phrases.length;
  }

  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║       GUINIUS - MASSIVE SUSU PHRASE HARVESTER                   ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Total Phrases to Harvest: ${results.metadata.totalPhrases.toString().padEnd(35)}║`);
  console.log(`║  Categories: ${results.metadata.categories.toString().padEnd(48)}║`);
  console.log(`║  Rate Limit Delay: ${delayMs}ms${' '.repeat(40 - delayMs.toString().length)}║`);
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  let overallProgress = 0;

  for (const [category, phrases] of Object.entries(PHRASE_CATEGORIES)) {
    console.log(`\n📂 CATEGORY: ${category.toUpperCase()}`);
    console.log(`   Phrases: ${phrases.length}`);
    console.log('   ' + '─'.repeat(50));

    results.categories[category] = {
      total: phrases.length,
      successful: 0,
      failed: 0,
      phrases: []
    };

    for (let i = 0; i < phrases.length; i++) {
      const phrase = phrases[i];
      overallProgress++;

      try {
        const translation = await translatePhrase(phrase);

        if (translation) {
          const entry = {
            english: phrase,
            susu: translation,
            category: category
          };

          results.categories[category].phrases.push(entry);
          results.categories[category].successful++;
          results.allPhrases.push(entry);

          // Add to simplified corpus
          const key = phrase.toLowerCase().replace(/[?!.,]/g, '').trim();
          results.simplifiedCorpus[key] = translation;

          results.metadata.successfulTranslations++;

          // Progress indicator
          const progress = ((overallProgress / results.metadata.totalPhrases) * 100).toFixed(1);
          process.stdout.write(`\r   [${overallProgress}/${results.metadata.totalPhrases}] (${progress}%) ✓ "${phrase}" → "${translation}"`);
          process.stdout.write(' '.repeat(20)); // Clear any leftover text
        } else {
          results.categories[category].failed++;
          results.metadata.failedTranslations++;
          process.stdout.write(`\r   [${overallProgress}/${results.metadata.totalPhrases}] ✗ "${phrase}" - No translation`);
        }

        // Rate limiting
        await new Promise(r => setTimeout(r, delayMs));

      } catch (error) {
        results.categories[category].failed++;
        results.metadata.failedTranslations++;
        console.error(`\n   ⚠️  Error: "${phrase}" - ${error.message}`);

        // If we hit rate limit, wait longer
        if (error.message.includes('RATE_LIMIT') || error.message.includes('quota')) {
          console.log('   ⏳ Rate limit hit, waiting 5 seconds...');
          await new Promise(r => setTimeout(r, 5000));
        }
      }
    }

    console.log('\n');
    console.log(`   ✓ Successful: ${results.categories[category].successful}`);
    console.log(`   ✗ Failed: ${results.categories[category].failed}`);
  }

  return results;
}

/**
 * Save harvest results to files
 */
function saveResults(results) {
  const dataDir = path.join(__dirname, '../data');

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Save full results
  const fullPath = path.join(dataDir, 'massive_harvest.json');
  fs.writeFileSync(fullPath, JSON.stringify(results, null, 2));
  console.log(`\n📁 Full results saved to: ${fullPath}`);

  // Save simplified corpus for integration
  const corpusPath = path.join(dataDir, 'harvested_corpus.json');
  fs.writeFileSync(corpusPath, JSON.stringify(results.simplifiedCorpus, null, 2));
  console.log(`📁 Simplified corpus saved to: ${corpusPath}`);

  // Save category-based file
  const categorizedPath = path.join(dataDir, 'harvested_by_category.json');
  const categorized = {};
  for (const [cat, data] of Object.entries(results.categories)) {
    categorized[cat] = data.phrases.map(p => ({
      en: p.english,
      sus: p.susu
    }));
  }
  fs.writeFileSync(categorizedPath, JSON.stringify(categorized, null, 2));
  console.log(`📁 Categorized phrases saved to: ${categorizedPath}`);

  // Save simple English-Susu pairs for training
  const pairsPath = path.join(dataDir, 'training_pairs.json');
  const pairs = results.allPhrases.map(p => ({
    source: p.english.toLowerCase(),
    target: p.susu
  }));
  fs.writeFileSync(pairsPath, JSON.stringify(pairs, null, 2));
  console.log(`📁 Training pairs saved to: ${pairsPath}`);
}

/**
 * Print final summary
 */
function printSummary(results) {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                    HARVEST COMPLETE                              ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Total Phrases:        ${results.metadata.totalPhrases.toString().padEnd(41)}║`);
  console.log(`║  Successful:           ${results.metadata.successfulTranslations.toString().padEnd(41)}║`);
  console.log(`║  Failed:               ${results.metadata.failedTranslations.toString().padEnd(41)}║`);
  console.log(`║  Success Rate:         ${((results.metadata.successfulTranslations / results.metadata.totalPhrases) * 100).toFixed(1)}%${' '.repeat(37)}║`);
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log('║  CATEGORY BREAKDOWN:                                             ║');

  for (const [cat, data] of Object.entries(results.categories)) {
    const catName = cat.replace(/_/g, ' ').padEnd(25);
    const stats = `${data.successful}/${data.total}`;
    console.log(`║    ${catName} ${stats.padEnd(35)}║`);
  }

  console.log('╚══════════════════════════════════════════════════════════════════╝');
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('\n🚀 Starting GUINIUS Massive Phrase Harvest...\n');

  try {
    // Harvest all phrases
    const results = await harvestAllPhrases(150); // 150ms delay between requests

    // Save results
    saveResults(results);

    // Print summary
    printSummary(results);

    console.log('\n✅ Harvest complete! Data ready for GUINIUS corpus integration.\n');

  } catch (error) {
    console.error('\n❌ Harvest failed:', error.message);
    process.exit(1);
  }
}

// Run the harvester
main();
