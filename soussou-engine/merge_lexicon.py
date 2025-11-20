#!/usr/bin/env python3
"""
Soussou Engine - Lexicon Merger
Merges all agent extractions into a single master lexicon.
"""

import json
import unicodedata
import re
from pathlib import Path
from collections import defaultdict
from datetime import datetime

# Paths
RAW_DIR = Path("/home/user/ZION/soussou-engine/raw")
DATA_DIR = Path("/home/user/ZION/soussou-engine/data")

# Agent directories
AGENTS = [
    "agent_01_dictionary_pdf",
    "agent_02_susu_english",
    "agent_03_soussou_french",
    "agent_04_vocabulary_lists",
    "agent_05_complete_lexicon",
    "agent_06_sil_linguistic",
    "agent_07_bible",
    "agent_08_grammar_research",
]

def normalize_word(word):
    """
    Normalize a Soussou word according to the rules:
    - lowercase
    - remove apostrophes
    - compress double consonants
    - remove accents/diacritics
    """
    if not word:
        return ""

    # Lowercase
    word = word.lower()

    # Remove apostrophes
    word = word.replace("'", "").replace("'", "").replace("`", "")

    # Remove diacritics/accents (normalize to NFD, remove combining marks)
    word = unicodedata.normalize('NFD', word)
    word = ''.join(c for c in word if unicodedata.category(c) != 'Mn')

    # Map special characters to their base forms
    char_map = {
        'ɛ': 'e', 'ɔ': 'o', 'ŋ': 'ng', 'ɲ': 'ny',
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a',
        'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
        'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o',
        'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
        'ŭ': 'u', 'ǹ': 'n', 'ń': 'n',
    }
    for old, new in char_map.items():
        word = word.replace(old, new)

    # Compress double consonants (but keep double vowels)
    consonants = 'bcdfghjklmnpqrstvwxyz'
    for c in consonants:
        word = re.sub(f'{c}{c}+', c, word)

    # Remove any remaining non-alphanumeric characters except spaces
    word = re.sub(r'[^a-z\s]', '', word)

    # Clean up whitespace
    word = ' '.join(word.split())

    return word.strip()

def extract_entries_from_agent(agent_name, data):
    """
    Extract word entries from different agent data structures.
    Returns list of dicts with: word, english, french, category, source, notes
    """
    entries = []
    source = agent_name.replace("agent_", "").replace("_", " ")

    if agent_name == "agent_01_dictionary_pdf":
        categories = data.get("categories", {})

        # Pronouns
        pronouns = categories.get("pronouns", {})
        for group in ["subject_pronouns", "emphatic_pronouns", "possessive_examples"]:
            for item in pronouns.get(group, []):
                entries.append({
                    "word": item.get("susu", ""),
                    "english": item.get("english", ""),
                    "french": item.get("french", ""),
                    "category": "pronoun",
                    "source": source,
                    "notes": item.get("notes", "")
                })

        # Numbers
        numbers = categories.get("numbers", {})
        for group in numbers:
            if isinstance(numbers[group], list):
                for item in numbers[group]:
                    entries.append({
                        "word": item.get("susu", ""),
                        "english": item.get("english", ""),
                        "french": item.get("french", ""),
                        "category": "number",
                        "source": source,
                        "notes": item.get("notes", "")
                    })

        # Greetings
        for item in categories.get("greetings", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "greeting",
                "source": source,
                "notes": item.get("notes", "")
            })

        # Basic nouns
        for item in categories.get("basic_nouns", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "noun",
                "source": source,
                "notes": item.get("notes", "")
            })

        # Verbs
        for item in categories.get("verbs", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "verb",
                "source": source,
                "notes": item.get("notes", "")
            })

        # Question words
        for item in categories.get("question_words", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "question",
                "source": source,
                "notes": item.get("notes", "")
            })

        # Grammar particles
        for item in categories.get("grammar_particles", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "particle",
                "source": source,
                "notes": item.get("notes", "")
            })

        # Traditional food
        for item in categories.get("traditional_food", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "food",
                "source": source,
                "notes": item.get("notes", "")
            })

        # Travel phrases
        for item in categories.get("travel_phrases", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "phrase",
                "source": source,
                "notes": item.get("notes", "")
            })

    elif agent_name == "agent_02_susu_english":
        # Numbers
        for item in data.get("numbers", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": "",
                "category": item.get("category", "number"),
                "source": source,
                "notes": ""
            })

        # Pronouns
        for item in data.get("pronouns", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": "",
                "category": "pronoun",
                "source": source,
                "notes": item.get("person", "")
            })

        # Greetings
        for item in data.get("greetings_phrases", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": "",
                "category": item.get("category", "greeting"),
                "source": source,
                "notes": item.get("notes", "")
            })

        # Basic vocabulary
        for item in data.get("basic_vocabulary", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": "",
                "category": item.get("category", ""),
                "source": source,
                "notes": item.get("notes", "")
            })

    elif agent_name == "agent_03_soussou_french":
        # Greetings
        for item in data.get("greetings", []):
            entries.append({
                "word": item.get("soussou", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "greeting",
                "source": source,
                "notes": item.get("notes", "")
            })

        # Basic words
        for item in data.get("basic_words", []):
            entries.append({
                "word": item.get("soussou", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "basic",
                "source": source,
                "notes": item.get("notes", "")
            })

        # Love expressions
        for item in data.get("love_expressions", []):
            entries.append({
                "word": item.get("soussou", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "expression",
                "source": source,
                "notes": item.get("notes", "")
            })

        # Pronouns
        for item in data.get("pronouns", []):
            entries.append({
                "word": item.get("soussou", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "pronoun",
                "source": source,
                "notes": item.get("notes", "")
            })

        # Numbers
        for item in data.get("numbers", []):
            entries.append({
                "word": item.get("soussou", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "number",
                "source": source,
                "notes": ""
            })

        # Days
        for item in data.get("days_of_week", []):
            entries.append({
                "word": item.get("soussou", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "day",
                "source": source,
                "notes": ""
            })

        # Time expressions
        for item in data.get("time_expressions", []):
            entries.append({
                "word": item.get("soussou", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "time",
                "source": source,
                "notes": item.get("notes", "")
            })

        # People
        for item in data.get("people", []):
            entries.append({
                "word": item.get("soussou", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "noun",
                "source": source,
                "notes": item.get("notes", "")
            })

        # Family
        for item in data.get("family", []):
            entries.append({
                "word": item.get("soussou", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "family",
                "source": source,
                "notes": item.get("notes", "")
            })

        # Common nouns
        for item in data.get("common_nouns", []):
            entries.append({
                "word": item.get("soussou", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "noun",
                "source": source,
                "notes": item.get("notes", "")
            })

        # Adjectives
        for item in data.get("adjectives", []):
            entries.append({
                "word": item.get("soussou", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "adjective",
                "source": source,
                "notes": ""
            })

        # Verbs
        for item in data.get("verbs", []):
            entries.append({
                "word": item.get("soussou", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "verb",
                "source": source,
                "notes": item.get("notes", "")
            })

        # Questions
        for item in data.get("questions", []):
            entries.append({
                "word": item.get("soussou", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "question",
                "source": source,
                "notes": item.get("notes", "")
            })

        # Food
        for item in data.get("food_vocabulary", []):
            entries.append({
                "word": item.get("soussou", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "food",
                "source": source,
                "notes": item.get("notes", "")
            })

        # Phrases
        for item in data.get("phrases", []):
            entries.append({
                "word": item.get("soussou", ""),
                "english": item.get("english", ""),
                "french": item.get("french", ""),
                "category": "phrase",
                "source": source,
                "notes": item.get("notes", "")
            })

    elif agent_name == "agent_04_vocabulary_lists":
        vocab = data.get("vocabulary", {})

        for category_name, items in vocab.items():
            if isinstance(items, list):
                for item in items:
                    entries.append({
                        "word": item.get("susu", ""),
                        "english": item.get("english", ""),
                        "french": "",
                        "category": item.get("category", category_name),
                        "source": source,
                        "notes": ""
                    })

    elif agent_name == "agent_05_complete_lexicon":
        vocab = data.get("vocabulary", {})

        for category_name, category_data in vocab.items():
            if isinstance(category_data, dict) and "words" in category_data:
                for item in category_data["words"]:
                    entries.append({
                        "word": item.get("susu", ""),
                        "english": item.get("english", ""),
                        "french": item.get("french", ""),
                        "category": category_name,
                        "source": source,
                        "notes": item.get("note", "")
                    })

    elif agent_name == "agent_06_sil_linguistic":
        vocab = data.get("vocabulary", {})

        # Numbers
        for item in vocab.get("numbers", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": "",
                "category": "number",
                "source": source,
                "notes": ""
            })

        # Pronouns
        pronouns = vocab.get("pronouns", {})
        for item in pronouns.get("subject", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": "",
                "category": "pronoun",
                "source": source,
                "notes": item.get("person", "")
            })

        # Question words
        for item in vocab.get("question_words", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": "",
                "category": "question",
                "source": source,
                "notes": ""
            })

        # Body parts
        for item in vocab.get("body_parts", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": "",
                "category": "body",
                "source": source,
                "notes": ""
            })

        # Family terms
        for item in vocab.get("family_terms", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": "",
                "category": "family",
                "source": source,
                "notes": ""
            })

        # Common nouns
        for item in vocab.get("common_nouns", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": "",
                "category": "noun",
                "source": source,
                "notes": ""
            })

        # Verbs
        for item in vocab.get("verbs", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": "",
                "category": "verb",
                "source": source,
                "notes": ""
            })

        # Greetings
        for item in vocab.get("greetings_phrases", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": "",
                "category": "greeting",
                "source": source,
                "notes": item.get("notes", "")
            })

        # Common phrases
        for item in vocab.get("common_phrases", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": "",
                "category": "phrase",
                "source": source,
                "notes": ""
            })

    elif agent_name == "agent_07_bible":
        # Bible has vocabulary as dict with word: {word, frequency, category, source}
        vocab = data.get("vocabulary", {})
        for word_key, word_data in vocab.items():
            entries.append({
                "word": word_data.get("word", word_key),
                "english": "",
                "french": "",
                "category": word_data.get("category", "unknown"),
                "source": "bible",
                "notes": "",
                "frequency": word_data.get("frequency", 0)
            })

    elif agent_name == "agent_08_grammar_research":
        # Similar structure to agent_06
        # Pronouns
        pronouns = data.get("pronouns", {})
        for group in ["subject_pronouns"]:
            for subgroup in pronouns.get(group, {}):
                if isinstance(pronouns[group][subgroup], list):
                    for item in pronouns[group][subgroup]:
                        entries.append({
                            "word": item.get("susu", ""),
                            "english": item.get("english", ""),
                            "french": "",
                            "category": "pronoun",
                            "source": source,
                            "notes": item.get("note", "")
                        })

        # Numbers
        numbers = data.get("numbers", {})
        for item in numbers.get("cardinal", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": str(item.get("number", "")),
                "french": "",
                "category": "number",
                "source": source,
                "notes": ""
            })

        # Greetings
        for item in data.get("greetings_phrases", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": "",
                "category": "greeting",
                "source": source,
                "notes": item.get("context", "")
            })

        # Basic vocabulary
        basic = data.get("basic_vocabulary", {})
        for group_name, items in basic.items():
            if isinstance(items, list):
                for item in items:
                    entries.append({
                        "word": item.get("susu", ""),
                        "english": item.get("english", ""),
                        "french": "",
                        "category": group_name,
                        "source": source,
                        "notes": item.get("note", "")
                    })

        # Verbs
        verbs = data.get("verbs", {})
        for item in verbs.get("basic_verbs", []):
            entries.append({
                "word": item.get("susu", ""),
                "english": item.get("english", ""),
                "french": "",
                "category": "verb",
                "source": source,
                "notes": ""
            })

    return entries

def load_bible_frequencies():
    """Load word frequencies from Bible extraction"""
    bible_path = RAW_DIR / "agent_07_bible" / "validated.json"
    frequencies = {}

    try:
        with open(bible_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        vocab = data.get("vocabulary", {})
        for word_key, word_data in vocab.items():
            word = word_data.get("word", word_key)
            normalized = normalize_word(word)
            if normalized:
                freq = word_data.get("frequency", 0)
                if normalized in frequencies:
                    frequencies[normalized] = max(frequencies[normalized], freq)
                else:
                    frequencies[normalized] = freq
    except Exception as e:
        print(f"Error loading Bible frequencies: {e}")

    return frequencies

def main():
    print("Soussou Engine - Lexicon Merger")
    print("=" * 50)

    # Collect all entries
    all_entries = []
    source_counts = defaultdict(int)

    for agent in AGENTS:
        agent_path = RAW_DIR / agent / "validated.json"

        if not agent_path.exists():
            print(f"  Skipping {agent} - no validated.json")
            continue

        try:
            with open(agent_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            entries = extract_entries_from_agent(agent, data)
            all_entries.extend(entries)
            source_counts[agent] = len(entries)
            print(f"  {agent}: {len(entries)} entries")
        except Exception as e:
            print(f"  Error loading {agent}: {e}")

    print(f"\nTotal raw entries: {len(all_entries)}")

    # Load Bible frequencies
    print("\nLoading Bible frequency data...")
    bible_freqs = load_bible_frequencies()
    print(f"  Loaded frequencies for {len(bible_freqs)} normalized words")

    # Merge and deduplicate
    print("\nMerging and deduplicating...")

    # Group by normalized form
    word_groups = defaultdict(list)
    for entry in all_entries:
        word = entry.get("word", "")
        if not word or len(word.strip()) == 0:
            continue

        normalized = normalize_word(word)
        if normalized:
            word_groups[normalized].append(entry)

    # Create master lexicon
    lexicon = []
    category_counts = defaultdict(int)

    for idx, (normalized, entries) in enumerate(sorted(word_groups.items())):
        # Collect variants
        variants = set()
        english_meanings = set()
        french_meanings = set()
        categories = []
        sources = set()
        notes = set()
        frequency = 0

        for entry in entries:
            # Add original word as variant
            original = entry.get("word", "").strip()
            if original:
                variants.add(original)

            # Collect meanings
            eng = entry.get("english", "").strip()
            if eng:
                english_meanings.add(eng)

            fre = entry.get("french", "").strip()
            if fre:
                french_meanings.add(fre)

            # Collect category
            cat = entry.get("category", "").strip().lower()
            if cat and cat != "unknown":
                categories.append(cat)

            # Collect sources
            src = entry.get("source", "").strip()
            if src:
                sources.add(src)

            # Collect notes
            note = entry.get("notes", "").strip()
            if note:
                notes.add(note)

            # Get frequency from Bible
            freq = entry.get("frequency", 0)
            if freq > frequency:
                frequency = freq

        # Get Bible frequency for normalized form
        if normalized in bible_freqs:
            if bible_freqs[normalized] > frequency:
                frequency = bible_freqs[normalized]

        # Determine primary category
        if categories:
            # Most common category
            from collections import Counter
            cat_counter = Counter(categories)
            primary_category = cat_counter.most_common(1)[0][0]
        else:
            primary_category = "unknown"

        category_counts[primary_category] += 1

        # Create entry
        entry = {
            "id": f"sus_{idx+1:05d}",
            "base": normalized,
            "variants": sorted(list(variants)),
            "english": "; ".join(sorted(english_meanings)) if english_meanings else "",
            "french": "; ".join(sorted(french_meanings)) if french_meanings else "",
            "category": primary_category,
            "frequency": frequency,
            "sources": sorted(list(sources))
        }

        lexicon.append(entry)

    print(f"\nMerged into {len(lexicon)} unique entries")

    # Sort by frequency (descending), then by base form
    lexicon.sort(key=lambda x: (-x["frequency"], x["base"]))

    # Reassign IDs after sorting
    for idx, entry in enumerate(lexicon):
        entry["id"] = f"sus_{idx+1:05d}"

    # Save lexicon
    lexicon_path = DATA_DIR / "lexicon.json"
    with open(lexicon_path, 'w', encoding='utf-8') as f:
        json.dump(lexicon, f, ensure_ascii=False, indent=2)

    print(f"\nSaved lexicon to {lexicon_path}")

    # Generate statistics
    stats = f"""# Soussou Engine - Lexicon Statistics

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Summary

- **Total Unique Words**: {len(lexicon)}
- **Total Raw Entries Processed**: {len(all_entries)}
- **Bible Word Frequencies Loaded**: {len(bible_freqs)}

## Entries by Source

| Source | Entry Count |
|--------|-------------|
"""

    for agent, count in sorted(source_counts.items(), key=lambda x: -x[1]):
        agent_name = agent.replace("agent_", "").replace("_", " ").title()
        stats += f"| {agent_name} | {count} |\n"

    stats += f"\n## Entries by Category\n\n| Category | Count |\n|----------|-------|\n"

    for category, count in sorted(category_counts.items(), key=lambda x: -x[1]):
        stats += f"| {category} | {count} |\n"

    # Frequency distribution
    freq_ranges = {
        "Very Common (1000+)": 0,
        "Common (100-999)": 0,
        "Moderate (10-99)": 0,
        "Rare (2-9)": 0,
        "Single Occurrence (1)": 0,
        "No Frequency Data (0)": 0
    }

    for entry in lexicon:
        freq = entry["frequency"]
        if freq >= 1000:
            freq_ranges["Very Common (1000+)"] += 1
        elif freq >= 100:
            freq_ranges["Common (100-999)"] += 1
        elif freq >= 10:
            freq_ranges["Moderate (10-99)"] += 1
        elif freq >= 2:
            freq_ranges["Rare (2-9)"] += 1
        elif freq == 1:
            freq_ranges["Single Occurrence (1)"] += 1
        else:
            freq_ranges["No Frequency Data (0)"] += 1

    stats += f"\n## Frequency Distribution\n\n| Range | Count |\n|-------|-------|\n"

    for range_name, count in freq_ranges.items():
        stats += f"| {range_name} | {count} |\n"

    # Top 20 most frequent words
    stats += f"\n## Top 20 Most Frequent Words\n\n| Rank | Word | Frequency | English | Category |\n|------|------|-----------|---------|----------|\n"

    for i, entry in enumerate(lexicon[:20]):
        english = entry["english"][:40] + "..." if len(entry["english"]) > 40 else entry["english"]
        stats += f"| {i+1} | {entry['base']} | {entry['frequency']} | {english} | {entry['category']} |\n"

    # Sample entries with translations
    stats += f"\n## Sample Entries with Translations\n\n"

    # Get entries that have both English and French
    translated = [e for e in lexicon if e["english"] and e["french"]][:10]

    for entry in translated:
        stats += f"### {entry['base']}\n"
        stats += f"- **ID**: {entry['id']}\n"
        stats += f"- **Variants**: {', '.join(entry['variants'][:5])}\n"
        stats += f"- **English**: {entry['english']}\n"
        stats += f"- **French**: {entry['french']}\n"
        stats += f"- **Category**: {entry['category']}\n"
        stats += f"- **Frequency**: {entry['frequency']}\n\n"

    # Save statistics
    stats_path = DATA_DIR / "stats.md"
    with open(stats_path, 'w', encoding='utf-8') as f:
        f.write(stats)

    print(f"Saved statistics to {stats_path}")
    print("\nMerge complete!")

if __name__ == "__main__":
    main()
