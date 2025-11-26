#!/usr/bin/env python3
"""
M3U Parser for DASH WebTV
Parses M3U playlist into structured JSON database
"""

import re
import json
import os
from collections import defaultdict

M3U_FILE = "/home/dash/screenshots/Playlists/m3u With Options - HLS.m3u"
OUTPUT_DIR = "/home/dash/zion-github/dash-webtv/data"

def parse_m3u(filepath):
    """Parse M3U file and extract all entries"""

    movies = []
    series = []
    live = []
    categories = defaultdict(lambda: {"movies": [], "series": [], "live": []})

    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()

    print(f"Total lines: {len(lines)}")

    i = 0
    count = 0
    while i < len(lines):
        line = lines[i].strip()

        if line.startswith('#EXTINF:'):
            # Parse metadata line
            # Format: #EXTINF:-1 tvg-id="" tvg-name="Title" tvg-logo="url" group-title="Category",Display Name

            # Extract tvg-name
            name_match = re.search(r'tvg-name="([^"]*)"', line)
            name = name_match.group(1) if name_match else ""

            # Extract tvg-logo (poster)
            logo_match = re.search(r'tvg-logo="([^"]*)"', line)
            poster = logo_match.group(1) if logo_match else ""

            # Extract group-title (category)
            group_match = re.search(r'group-title="([^"]*)"', line)
            category = group_match.group(1) if group_match else "Uncategorized"

            # Get URL from next line
            if i + 1 < len(lines):
                url = lines[i + 1].strip()

                if url.startswith('http'):
                    # Determine content type from URL
                    entry = {
                        "name": name,
                        "poster": poster,
                        "category": category,
                        "url": url
                    }

                    # Extract stream ID from URL
                    id_match = re.search(r'/(\d+)\.[a-zA-Z0-9]+$', url)
                    if id_match:
                        entry["id"] = id_match.group(1)

                    # Extract extension
                    ext_match = re.search(r'\.([a-zA-Z0-9]+)$', url)
                    if ext_match:
                        entry["ext"] = ext_match.group(1)

                    # Categorize by content type
                    if '/movie/' in url:
                        movies.append(entry)
                        categories[category]["movies"].append(len(movies) - 1)
                    elif '/series/' in url:
                        series.append(entry)
                        categories[category]["series"].append(len(series) - 1)
                    elif '/live/' in url:
                        live.append(entry)
                        categories[category]["live"].append(len(live) - 1)

                    count += 1
                    if count % 50000 == 0:
                        print(f"Processed {count} entries...")

                i += 2
            else:
                i += 1
        else:
            i += 1

    return movies, series, live, dict(categories)

def save_json(data, filename):
    """Save data to JSON file"""
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)

    size = os.path.getsize(filepath) / (1024 * 1024)
    print(f"Saved {filepath} ({size:.2f} MB)")

def main():
    print("=" * 50)
    print("DASH WebTV - M3U Parser")
    print("=" * 50)

    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Parse M3U
    print(f"\nParsing: {M3U_FILE}")
    movies, series, live, categories = parse_m3u(M3U_FILE)

    print(f"\n=== RESULTS ===")
    print(f"Movies: {len(movies)}")
    print(f"Series Episodes: {len(series)}")
    print(f"Live Channels: {len(live)}")
    print(f"Categories: {len(categories)}")

    # Save individual files
    print(f"\n=== SAVING FILES ===")
    save_json(movies, "movies.json")
    save_json(series, "series.json")
    save_json(live, "live.json")

    # Save category index
    category_index = {}
    for cat, data in categories.items():
        category_index[cat] = {
            "movies_count": len(data["movies"]),
            "series_count": len(data["series"]),
            "live_count": len(data["live"])
        }
    save_json(category_index, "categories.json")

    # Save summary
    summary = {
        "total_movies": len(movies),
        "total_series": len(series),
        "total_live": len(live),
        "total_categories": len(categories),
        "generated": "2025-11-26"
    }
    save_json(summary, "summary.json")

    # Print top categories
    print(f"\n=== TOP CATEGORIES ===")
    sorted_cats = sorted(category_index.items(),
                        key=lambda x: x[1]["movies_count"] + x[1]["series_count"],
                        reverse=True)[:20]
    for cat, counts in sorted_cats:
        total = counts["movies_count"] + counts["series_count"] + counts["live_count"]
        print(f"  {cat}: {total} items")

    print(f"\n=== DONE ===")
    print(f"Files saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
