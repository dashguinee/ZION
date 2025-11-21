import { readFileSync } from 'fs';
const lexicon = JSON.parse(readFileSync('./soussou-engine/data/lexicon.json', 'utf8'));
const words = Array.isArray(lexicon) ? lexicon : lexicon.words || [];
const verified = words.filter(w => w.english && w.french && w.base);
const partial = words.filter(w => w.base && (w.english || w.french) && !(w.english && w.french));
const unverified = words.filter(w => !w.english && !w.french);

console.log('=== LEXICON VERIFICATION STATUS ===\n');
console.log('Total words:', words.length);
console.log('Fully verified (Soussou + English + French):', verified.length);
console.log('Partially verified (Soussou + one language):', partial.length);
console.log('Unverified (Soussou only):', unverified.length);
console.log('\n=== SAMPLE VERIFIED WORDS ===');
verified.slice(0, 10).forEach(w => {
  console.log(`${w.base} = ${w.english || 'N/A'} / ${w.french || 'N/A'}`);
});
console.log('\n=== VERIFICATION RATE ===');
console.log(`${Math.round((verified.length / words.length) * 100)}% fully verified`);
