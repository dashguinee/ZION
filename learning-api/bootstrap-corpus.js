/**
 * Bootstrap the corpus with existing Soussou sentences
 * Extracts from training_examples.json and adds via API
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_BASE = 'http://localhost:3001';

async function addSentence(data) {
  const response = await fetch(`${API_BASE}/api/corpus/add-sentence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

async function bootstrap() {
  console.log('🚀 BOOTSTRAPPING CORPUS\n');

  // Load training examples
  const examples = JSON.parse(
    readFileSync(join(__dirname, '../soussou-engine/data/training_examples.json'), 'utf8')
  );

  console.log(`📚 Found ${examples.length} example sentences\n`);

  let added = 0;
  let skipped = 0;

  for (const ex of examples) {
    try {
      // Extract sentence and response
      const sentences = [
        {
          soussou: ex.soussou,
          french: ex.french,
          english: ex.english,
          context: ex.context
        }
      ];

      // Add response if it exists
      if (ex.response) {
        sentences.push({
          soussou: ex.response.soussou,
          french: ex.response.french,
          english: ex.response.english,
          context: `${ex.context}_response`
        });
      }

      // Add each sentence
      for (const sent of sentences) {
        try {
          await addSentence({
            soussou: sent.soussou,
            french: sent.french,
            english: sent.english,
            cultural_context: sent.context,
            contributed_by: 'Z-Core (Training Data)'
          });
          added++;
          process.stdout.write(`✓ `);
        } catch (err) {
          skipped++;
          process.stdout.write(`✗ `);
        }
      }

    } catch (error) {
      console.error(`\n❌ Error processing ${ex.id}:`, error.message);
    }
  }

  console.log('\n');
  console.log(`✅ Added: ${added} sentences`);
  console.log(`⏭️  Skipped: ${skipped} sentences`);
  console.log(`\n📊 Corpus bootstrapped!`);

  // Get final stats
  const statsResponse = await fetch(`${API_BASE}/api/stats`);
  const stats = await statsResponse.json();

  console.log(`\n📈 FINAL STATS:`);
  console.log(`   Total sentences: ${stats.corpus.total_sentences}`);
  console.log(`   Contributors: ${stats.corpus.contributors}`);
  console.log(`   Last updated: ${new Date(stats.last_updated).toLocaleString()}\n`);
}

bootstrap().catch(console.error);
