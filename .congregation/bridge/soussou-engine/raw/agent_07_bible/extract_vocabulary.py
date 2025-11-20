#!/usr/bin/env python3
"""
Extract unique Soussou vocabulary from Bible text files.
"""

import os
import re
import json
from collections import Counter
from pathlib import Path

def extract_words_from_file(filepath):
    """Extract words from a single text file."""
    words = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()

        # Remove line numbers (format: spaces + number + tab)
        text = re.sub(r'^\s*\d+\t', '', text, flags=re.MULTILINE)

        # Remove verse numbers
        text = re.sub(r'\b\d+\b', '', text)

        # Extract words - keep Soussou special characters (ɔ, ɛ, ɲ, ŋ, etc.)
        # Word pattern: letters including accented/special chars
        word_pattern = r"[a-zA-ZɔɛɲŋƐƆÑàáâãäèéêëìíîïòóôõöùúûüÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜ'']+"

        found_words = re.findall(word_pattern, text, re.UNICODE)

        for word in found_words:
            # Clean and normalize
            word = word.strip("'").strip("'").lower()
            if len(word) >= 2:  # Skip single characters
                words.append(word)

    except Exception as e:
        print(f"Error reading {filepath}: {e}")

    return words

def categorize_word(word):
    """Attempt to categorize word based on Soussou linguistic patterns."""
    word_lower = word.lower()

    # Pronouns
    pronouns = ['n', 'i', 'a', 'won', 'wo', 'e', 'ntan', 'itan', 'ana', 'etan']
    if word_lower in pronouns:
        return 'pronoun'

    # Common verbs (by pattern)
    if word_lower.startswith('naxa') or word_lower.endswith('xi'):
        return 'verb'

    # Nouns (by pattern - many end in 'e' or 'i')
    # This is a rough heuristic

    # Negation
    if word_lower in ['mu', 'ma']:
        return 'particle'

    # Conjunctions
    if word_lower in ['nun', 'kɔnɔ', 'xa', 'alako', 'barima']:
        return 'conjunction'

    # Default
    return 'unknown'

def main():
    base_dir = Path('/home/user/ZION/soussou-engine/raw/agent_07_bible/readaloud')
    output_dir = Path('/home/user/ZION/soussou-engine/raw/agent_07_bible')

    all_words = []
    file_count = 0
    book_stats = {}

    # Process all text files
    for txt_file in sorted(base_dir.glob('*.txt')):
        if '_read.txt' in txt_file.name:
            words = extract_words_from_file(txt_file)
            all_words.extend(words)
            file_count += 1

            # Extract book code (e.g., GEN, EXO, MAT)
            parts = txt_file.name.split('_')
            if len(parts) >= 3:
                book = parts[2]
                if book not in book_stats:
                    book_stats[book] = {'files': 0, 'words': 0}
                book_stats[book]['files'] += 1
                book_stats[book]['words'] += len(words)

    # Count word frequencies
    word_counts = Counter(all_words)

    # Build vocabulary with metadata
    vocabulary = {}
    for word, count in word_counts.items():
        vocabulary[word] = {
            'word': word,
            'frequency': count,
            'category': categorize_word(word),
            'source': 'Soso Kitaabuie Bible (eBible.org)'
        }

    # Sort by frequency
    sorted_vocab = dict(sorted(vocabulary.items(), key=lambda x: x[1]['frequency'], reverse=True))

    # Create validated.json
    validated_data = {
        'metadata': {
            'source': 'Soso Kitaabuie: Tawureta, Yabura, Inyila (eBible.org)',
            'language': 'Soussou/Susu',
            'iso_code': 'sus',
            'total_unique_words': len(sorted_vocab),
            'total_word_occurrences': sum(word_counts.values()),
            'files_processed': file_count,
            'books_covered': len(book_stats),
            'extraction_method': 'Bible text extraction',
            'license': 'Creative Commons Attribution-Noncommercial-No Derivatives 4.0'
        },
        'statistics': {
            'by_category': {},
            'by_frequency': {
                'very_common_100+': len([w for w, c in word_counts.items() if c >= 100]),
                'common_50_99': len([w for w, c in word_counts.items() if 50 <= c < 100]),
                'moderate_10_49': len([w for w, c in word_counts.items() if 10 <= c < 50]),
                'rare_2_9': len([w for w, c in word_counts.items() if 2 <= c < 10]),
                'hapax_1': len([w for w, c in word_counts.items() if c == 1])
            }
        },
        'vocabulary': sorted_vocab
    }

    # Count by category
    categories = Counter(v['category'] for v in vocabulary.values())
    validated_data['statistics']['by_category'] = dict(categories)

    # Write validated.json
    with open(output_dir / 'validated.json', 'w', encoding='utf-8') as f:
        json.dump(validated_data, f, ensure_ascii=False, indent=2)

    # Print summary
    print(f"\n=== SOUSSOU BIBLE VOCABULARY EXTRACTION ===")
    print(f"Files processed: {file_count}")
    print(f"Bible books covered: {len(book_stats)}")
    print(f"Total word occurrences: {sum(word_counts.values()):,}")
    print(f"Unique words extracted: {len(sorted_vocab):,}")
    print(f"\nTop 50 most frequent words:")
    for i, (word, data) in enumerate(list(sorted_vocab.items())[:50], 1):
        print(f"  {i:2}. {word:15} ({data['frequency']:,}x)")

    print(f"\nFrequency distribution:")
    for key, value in validated_data['statistics']['by_frequency'].items():
        print(f"  {key}: {value:,} words")

    return len(sorted_vocab)

if __name__ == '__main__':
    main()
