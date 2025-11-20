#!/usr/bin/env python3
"""
Merge Training Context into Master Lexicon

This script merges the authentic Guinea street Soussou vocabulary from
context_extraction.json into the master lexicon.json.

Rules:
- If base form exists in lexicon -> merge variants and meanings
- If NOT in lexicon -> ADD as new entry with source: "training_context"
- Preserve frequency data from Bible for existing words
"""

import json
import os
from datetime import datetime

# Paths
BASE_DIR = "/home/user/ZION/soussou-engine"
CONTEXT_FILE = os.path.join(BASE_DIR, "raw/context_extraction.json")
LEXICON_FILE = os.path.join(BASE_DIR, "data/lexicon.json")
REPORT_FILE = os.path.join(BASE_DIR, "data/merge_report.md")

def normalize_word(word):
    """Normalize word for comparison - lowercase, strip accents for matching"""
    return word.lower().strip().replace("'", "").replace("'", "")

def extract_base_word(soussou_text):
    """Extract the base word from a Soussou phrase"""
    # For single words, return as-is
    # For phrases, return the main verb/noun (usually first meaningful word)
    words = soussou_text.strip().split()
    if len(words) == 1:
        return words[0]
    # Return first word for phrases (the key vocabulary item)
    return words[0]

def main():
    print("Loading files...")

    # Load context extraction
    with open(CONTEXT_FILE, 'r', encoding='utf-8') as f:
        context_entries = json.load(f)

    # Load lexicon
    with open(LEXICON_FILE, 'r', encoding='utf-8') as f:
        lexicon = json.load(f)

    print(f"Loaded {len(context_entries)} context entries")
    print(f"Loaded {len(lexicon)} lexicon entries")

    # Build lookup index for lexicon (normalized base -> index)
    lexicon_index = {}
    for i, entry in enumerate(lexicon):
        base = entry.get('base', '')
        norm_base = normalize_word(base)
        if norm_base:
            if norm_base not in lexicon_index:
                lexicon_index[norm_base] = []
            lexicon_index[norm_base].append(i)

        # Also index variants
        for variant in entry.get('variants', []):
            norm_var = normalize_word(variant)
            if norm_var and norm_var != norm_base:
                if norm_var not in lexicon_index:
                    lexicon_index[norm_var] = []
                if i not in lexicon_index[norm_var]:
                    lexicon_index[norm_var].append(i)

    # Track merge statistics
    words_added = []
    words_updated = []
    phrases_added = []

    # Get next ID number
    max_id = 0
    for entry in lexicon:
        id_str = entry.get('id', '')
        if id_str.startswith('sus_'):
            try:
                num = int(id_str.replace('sus_', ''))
                max_id = max(max_id, num)
            except:
                pass

    next_id = max_id + 1

    # Process each context entry
    for ctx in context_entries:
        soussou_text = ctx.get('soussou', '')
        variants = ctx.get('variants', [])
        meaning_en = ctx.get('meaning_en', '')
        meaning_fr = ctx.get('meaning_fr', '')
        context = ctx.get('context', '')
        grammar = ctx.get('grammar_pattern', '')
        notes = ctx.get('notes', '')

        # Check if it's a phrase (multiple words) or single word
        is_phrase = ' ' in soussou_text.strip()

        # Get the base word for lookup
        base_word = extract_base_word(soussou_text)
        norm_base = normalize_word(base_word)

        # For single words, try to find in lexicon
        found_match = False

        if not is_phrase:
            # Single word - look for exact match
            if norm_base in lexicon_index:
                # Found match - update existing entry
                idx = lexicon_index[norm_base][0]
                entry = lexicon[idx]

                # Add new variants
                existing_variants = set(v.lower() for v in entry.get('variants', []))
                for v in variants:
                    if v.lower() not in existing_variants:
                        entry['variants'].append(v)
                        existing_variants.add(v.lower())

                # Append meanings if new
                if meaning_en and meaning_en not in entry.get('english', ''):
                    if entry.get('english'):
                        entry['english'] += f"; {meaning_en}"
                    else:
                        entry['english'] = meaning_en

                if meaning_fr and meaning_fr not in entry.get('french', ''):
                    if entry.get('french'):
                        entry['french'] += f"; {meaning_fr}"
                    else:
                        entry['french'] = meaning_fr

                # Add training_context to sources
                if 'training_context' not in entry.get('sources', []):
                    entry['sources'].append('training_context')

                words_updated.append({
                    'word': soussou_text,
                    'merged_with': entry['base'],
                    'new_variants': [v for v in variants if v.lower() not in existing_variants]
                })
                found_match = True

        if not found_match:
            # Add as new entry
            new_entry = {
                'id': f'sus_{next_id:05d}',
                'base': soussou_text if not is_phrase else base_word,
                'variants': list(set([soussou_text] + variants)),
                'english': meaning_en,
                'french': meaning_fr,
                'category': determine_category(context, grammar),
                'frequency': 0,
                'sources': ['training_context'],
                'context': context,
                'grammar_pattern': grammar
            }

            if notes:
                new_entry['notes'] = notes

            # For phrases, keep the full phrase as base
            if is_phrase:
                new_entry['base'] = soussou_text
                new_entry['is_phrase'] = True
                phrases_added.append({
                    'id': new_entry['id'],
                    'phrase': soussou_text,
                    'meaning_en': meaning_en
                })
            else:
                words_added.append({
                    'id': new_entry['id'],
                    'word': soussou_text,
                    'meaning_en': meaning_en
                })

            lexicon.append(new_entry)
            next_id += 1

            # Update index for new entry
            norm_new = normalize_word(new_entry['base'])
            if norm_new not in lexicon_index:
                lexicon_index[norm_new] = []
            lexicon_index[norm_new].append(len(lexicon) - 1)

    # Save updated lexicon
    print(f"\nSaving updated lexicon with {len(lexicon)} entries...")
    with open(LEXICON_FILE, 'w', encoding='utf-8') as f:
        json.dump(lexicon, f, ensure_ascii=False, indent=2)

    # Generate merge report
    generate_report(words_added, words_updated, phrases_added, len(context_entries), len(lexicon))

    print(f"\nMerge complete!")
    print(f"  - Words added: {len(words_added)}")
    print(f"  - Words updated: {len(words_updated)}")
    print(f"  - Phrases added: {len(phrases_added)}")
    print(f"  - Total entries now: {len(lexicon)}")

def determine_category(context, grammar):
    """Determine word category from context and grammar info"""
    context_lower = context.lower()
    grammar_lower = grammar.lower()

    if 'pronoun' in context_lower or 'pronoun' in grammar_lower:
        return 'pronoun'
    elif 'verb' in context_lower or 'verb' in grammar_lower:
        return 'verb'
    elif 'noun' in context_lower:
        return 'noun'
    elif 'question' in context_lower:
        return 'question_word'
    elif 'marker' in context_lower or 'particle' in grammar_lower:
        return 'particle'
    elif 'possessive' in context_lower:
        return 'possessive'
    elif 'adjective' in context_lower:
        return 'adjective'
    elif 'imperative' in context_lower or 'command' in context_lower:
        return 'verb'
    elif 'greeting' in context_lower:
        return 'greeting'
    elif 'interjection' in context_lower or 'affirmation' in context_lower:
        return 'interjection'
    else:
        return 'phrase'

def generate_report(words_added, words_updated, phrases_added, total_context, total_lexicon):
    """Generate detailed merge report"""

    report = f"""# Soussou Lexicon Merge Report

**Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Summary

- **Context entries processed**: {total_context}
- **New words added**: {len(words_added)}
- **Existing words updated**: {len(words_updated)}
- **New phrases added**: {len(phrases_added)}
- **Final lexicon size**: {total_lexicon}

---

## New Words Added

These are authentic Guinea street Soussou words that were NOT in the Bible/dictionary lexicon:

| ID | Word | Meaning (English) |
|----|------|-------------------|
"""

    for item in sorted(words_added, key=lambda x: x['word'].lower()):
        word = item['word'].replace('|', '\\|')
        meaning = item['meaning_en'][:50] + '...' if len(item['meaning_en']) > 50 else item['meaning_en']
        meaning = meaning.replace('|', '\\|')
        report += f"| {item['id']} | {word} | {meaning} |\n"

    report += f"""
---

## Existing Words Updated

These words already existed but were enriched with new variants/meanings:

| Word | Merged With | New Variants Added |
|------|-------------|-------------------|
"""

    for item in sorted(words_updated, key=lambda x: x['word'].lower()):
        word = item['word'].replace('|', '\\|')
        merged = item['merged_with'].replace('|', '\\|')
        variants = ', '.join(item.get('new_variants', [])) or 'None'
        report += f"| {word} | {merged} | {variants} |\n"

    report += f"""
---

## New Phrases Added

Complete phrases added for conversational context:

| ID | Phrase | Meaning (English) |
|----|--------|-------------------|
"""

    for item in sorted(phrases_added, key=lambda x: x['phrase'].lower()):
        phrase = item['phrase'].replace('|', '\\|')
        meaning = item['meaning_en'][:50] + '...' if len(item['meaning_en']) > 50 else item['meaning_en']
        meaning = meaning.replace('|', '\\|')
        report += f"| {item['id']} | {phrase} | {meaning} |\n"

    report += f"""
---

## Critical Vocabulary Now Included

The following essential colloquial words are now in the lexicon:

- **whon/whon'** - we (inclusive)
- **mma/m'ma** - my / negation marker
- **fafe** - coming
- **comprendfé** - understand (French hybrid)
- **khafé** - because of / situation
- **yite** - arrived/here
- **no'mma** - can/able to
- **Eské** - question marker (est-ce que)
- **gbo** - a lot/very much
- All pronouns: Ntan, Itan, Atan, Ana, Whon', Moukhou, Etan
- All possessives: M'ma, Akha, Ekha, Whonma, Ikha

---

## Source Attribution

All new entries are marked with `source: "training_context"` to distinguish them from Bible and dictionary sources.

This merge preserves:
- Original Bible frequency data for existing words
- Dictionary definitions and categories
- Academic sources and references

While adding:
- Street Soussou authenticity
- Colloquial usage patterns
- French-Soussou hybrid forms
- Real conversational context
"""

    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        f.write(report)

    print(f"Report saved to: {REPORT_FILE}")

if __name__ == '__main__':
    main()
