/**
 * Susu AI Data Integrator
 *
 * Merges ALL data sources into a unified knowledge base:
 * - BibleNLP parallel corpus (30,966 pairs)
 * - Google SMOL sentences (863 pairs)
 * - Google GATITOS words (4,000 pairs)
 * - Our lexicon (8,978 entries)
 * - Conversational phrases (295 entries)
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BIBLE_DIR = path.join(DATA_DIR, 'bible_susu');
const SMOL_DIR = path.join(DATA_DIR, 'google_smol');

// ============================================================================
// DATA LOADING
// ============================================================================

function loadJSONL(filepath) {
  if (!fs.existsSync(filepath)) return [];
  const lines = fs.readFileSync(filepath, 'utf-8').split('\n').filter(l => l.trim());
  return lines.map(l => {
    try { return JSON.parse(l); }
    catch { return null; }
  }).filter(Boolean);
}

function loadJSON(filepath) {
  if (!fs.existsSync(filepath)) return null;
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

/**
 * Load all data sources
 */
function loadAllSources() {
  console.log('Loading all Susu data sources...\n');

  const sources = {
    bible: { pairs: [], type: 'sentence' },
    smolsent: { pairs: [], type: 'sentence' },
    gatitos: { pairs: [], type: 'word' },
    lexicon: { entries: [], type: 'word' },
    conversational: { phrases: {}, type: 'phrase' },
  };

  // 1. Bible parallel corpus
  const biblePath = path.join(BIBLE_DIR, 'bible_parallel_corpus.json');
  if (fs.existsSync(biblePath)) {
    const bible = loadJSON(biblePath);
    sources.bible.pairs = bible || [];
    console.log(`  Bible corpus: ${sources.bible.pairs.length} verse pairs`);
  }

  // 2. SMOL sentences
  const smolsentPath = path.join(SMOL_DIR, 'smolsent_en_sus.jsonl');
  const smolsent = loadJSONL(smolsentPath);
  sources.smolsent.pairs = smolsent.map(s => ({
    english: s.src,
    susu: s.trg,
    source: 'smolsent'
  }));
  console.log(`  SMOL sentences: ${sources.smolsent.pairs.length} pairs`);

  // 3. GATITOS words/phrases
  const gatitosPath = path.join(SMOL_DIR, 'gatitos_en_sus.jsonl');
  const gatitos = loadJSONL(gatitosPath);
  sources.gatitos.pairs = gatitos.map(g => ({
    english: g.src,
    susu: g.trgs,  // Array of translations
    source: 'gatitos'
  }));
  console.log(`  GATITOS words: ${sources.gatitos.pairs.length} entries`);

  // 4. Our lexicon
  const lexiconPath = path.join(DATA_DIR, 'lexicon.json');
  if (fs.existsSync(lexiconPath)) {
    const lexicon = loadJSON(lexiconPath);
    sources.lexicon.entries = Array.isArray(lexicon) ? lexicon : Object.values(lexicon);
    console.log(`  Lexicon: ${sources.lexicon.entries.length} entries`);
  }

  // 5. Conversational phrases
  const convPath = path.join(DATA_DIR, 'conversational_susu.json');
  if (fs.existsSync(convPath)) {
    sources.conversational.phrases = loadJSON(convPath);
    const totalPhrases = Object.values(sources.conversational.phrases)
      .filter(v => typeof v === 'object')
      .reduce((sum, obj) => sum + Object.keys(obj).length, 0);
    console.log(`  Conversational: ${totalPhrases} phrases`);
  }

  return sources;
}

// ============================================================================
// UNIFIED INDEX BUILDING
// ============================================================================

/**
 * Build unified translation index
 */
function buildUnifiedIndex(sources) {
  console.log('\nBuilding unified translation index...');

  const index = {
    // Word-level lookups (English -> Susu)
    en_to_sus: new Map(),
    // Word-level lookups (Susu -> English)
    sus_to_en: new Map(),
    // Sentence patterns (for fuzzy matching)
    sentences: [],
    // Statistics
    stats: {
      totalWords: 0,
      totalSentences: 0,
      sources: {}
    }
  };

  // 1. Index GATITOS (highest quality word translations)
  for (const entry of sources.gatitos.pairs) {
    if (!entry.english || typeof entry.english !== 'string') continue;
    const enLower = entry.english.toLowerCase().trim();
    if (!enLower) continue;
    const translations = (Array.isArray(entry.susu) ? entry.susu : [entry.susu])
      .filter(t => typeof t === 'string' && t.trim());

    if (!index.en_to_sus.has(enLower)) {
      index.en_to_sus.set(enLower, []);
    }
    index.en_to_sus.get(enLower).push({
      translations,
      source: 'gatitos',
      priority: 1  // Highest priority
    });

    // Reverse index
    for (const sus of translations) {
      if (typeof sus !== 'string') continue;
      const susLower = sus.toLowerCase().trim();
      if (!susLower) continue;
      if (!index.sus_to_en.has(susLower)) {
        index.sus_to_en.set(susLower, []);
      }
      index.sus_to_en.get(susLower).push({
        english: entry.english,
        source: 'gatitos',
        priority: 1
      });
    }
    index.stats.totalWords++;
  }
  index.stats.sources.gatitos = sources.gatitos.pairs.length;

  // 2. Index conversational phrases
  const convPhrases = sources.conversational.phrases;
  for (const [category, phrases] of Object.entries(convPhrases)) {
    if (typeof phrases !== 'object' || Array.isArray(phrases)) continue;

    for (const [en, sus] of Object.entries(phrases)) {
      if (typeof en !== 'string' || typeof sus !== 'string') continue;
      const enLower = en.toLowerCase().trim();
      const susLower = sus.toLowerCase().trim();
      if (!enLower || !susLower) continue;

      if (!index.en_to_sus.has(enLower)) {
        index.en_to_sus.set(enLower, []);
      }
      index.en_to_sus.get(enLower).push({
        translations: [sus],
        source: 'conversational',
        category,
        priority: 0  // Highest for conversational
      });

      // Reverse
      if (!index.sus_to_en.has(susLower)) {
        index.sus_to_en.set(susLower, []);
      }
      index.sus_to_en.get(susLower).push({
        english: en,
        source: 'conversational',
        category,
        priority: 0
      });
      index.stats.totalWords++;
    }
  }
  index.stats.sources.conversational = index.stats.totalWords - sources.gatitos.pairs.length;

  // 3. Index SMOL sentences
  for (const pair of sources.smolsent.pairs) {
    if (!pair.english || !pair.susu) continue;
    if (typeof pair.english !== 'string' || typeof pair.susu !== 'string') continue;
    index.sentences.push({
      english: pair.english,
      susu: pair.susu,
      source: 'smolsent',
      length: pair.english.split(/\s+/).length
    });
    index.stats.totalSentences++;
  }
  index.stats.sources.smolsent = sources.smolsent.pairs.length;

  // 4. Index Bible sentences
  for (const pair of sources.bible.pairs) {
    if (!pair.english || !pair.susu) continue;
    if (typeof pair.english !== 'string' || typeof pair.susu !== 'string') continue;
    index.sentences.push({
      english: pair.english,
      susu: pair.susu,
      source: 'bible',
      verse: pair.verse_num,
      length: pair.english.split(/\s+/).length
    });
    index.stats.totalSentences++;
  }
  index.stats.sources.bible = sources.bible.pairs.length;

  // 5. Index lexicon entries with translations
  for (const entry of sources.lexicon.entries) {
    if (!entry.english && !entry.french) continue;

    const susWord = entry.base || entry.word;
    const enWord = entry.english || entry.french;

    if (susWord && enWord && typeof susWord === 'string' && typeof enWord === 'string') {
      const susLower = susWord.toLowerCase().trim();
      if (!susLower) continue;
      if (!index.sus_to_en.has(susLower)) {
        index.sus_to_en.set(susLower, []);
      }
      index.sus_to_en.get(susLower).push({
        english: enWord,
        source: 'lexicon',
        category: entry.category,
        priority: 2
      });
      index.stats.totalWords++;
    }
  }
  index.stats.sources.lexicon = sources.lexicon.entries.filter(e => e.english || e.french).length;

  console.log(`  Words indexed: ${index.en_to_sus.size} EN->SUS, ${index.sus_to_en.size} SUS->EN`);
  console.log(`  Sentences indexed: ${index.sentences.length}`);

  return index;
}

// ============================================================================
// SAVE/LOAD INDEX
// ============================================================================

/**
 * Save index to disk for fast loading
 */
function saveIndex(index, filepath) {
  const serializable = {
    en_to_sus: Object.fromEntries(index.en_to_sus),
    sus_to_en: Object.fromEntries(index.sus_to_en),
    sentences: index.sentences,
    stats: index.stats,
    created: new Date().toISOString()
  };

  fs.writeFileSync(filepath, JSON.stringify(serializable, null, 2));
  console.log(`\nIndex saved to: ${filepath}`);
  console.log(`  File size: ${(fs.statSync(filepath).size / 1024 / 1024).toFixed(2)} MB`);
}

/**
 * Load index from disk
 */
function loadIndex(filepath) {
  if (!fs.existsSync(filepath)) return null;

  const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  return {
    en_to_sus: new Map(Object.entries(data.en_to_sus)),
    sus_to_en: new Map(Object.entries(data.sus_to_en)),
    sentences: data.sentences,
    stats: data.stats,
    created: data.created
  };
}

// ============================================================================
// MAIN
// ============================================================================

function integrate() {
  console.log('=== SUSU AI DATA INTEGRATION ===\n');

  // Load all sources
  const sources = loadAllSources();

  // Build unified index
  const index = buildUnifiedIndex(sources);

  // Save index
  const indexPath = path.join(DATA_DIR, 'unified_index.json');
  saveIndex(index, indexPath);

  // Summary
  console.log('\n=== INTEGRATION COMPLETE ===');
  console.log(`\nTotal indexed:`);
  console.log(`  - ${index.en_to_sus.size} English words/phrases`);
  console.log(`  - ${index.sus_to_en.size} Susu words/phrases`);
  console.log(`  - ${index.sentences.length} parallel sentences`);
  console.log(`\nBy source:`);
  for (const [source, count] of Object.entries(index.stats.sources)) {
    console.log(`  - ${source}: ${count}`);
  }

  return index;
}

module.exports = {
  loadAllSources,
  buildUnifiedIndex,
  saveIndex,
  loadIndex,
  integrate,
  DATA_DIR,
};

// CLI
if (require.main === module) {
  integrate();
}
