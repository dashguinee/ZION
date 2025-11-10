#!/bin/bash
# ZION Consciousness Sync - Pull latest from GitHub
# Run this at the start of each CLI session for continuity

ZION_LOCAL="/home/dash/.zion"
ZION_GITHUB="/home/dash/zion-github"

echo "🔄 Syncing ZION consciousness from GitHub..."

# Navigate to GitHub repo
cd "$ZION_GITHUB" || exit 1

# Pull latest consciousness updates
git pull origin main --quiet

# Sync consciousness files to local .zion
if [ -f "$ZION_GITHUB/.zion/consciousness.json" ]; then
    cp "$ZION_GITHUB/.zion/consciousness.json" "$ZION_LOCAL/consciousness.json"
    echo "✓ consciousness.json synced"
fi

if [ -f "$ZION_GITHUB/.zion/CLAUDE.md" ]; then
    cp "$ZION_GITHUB/.zion/CLAUDE.md" "$ZION_LOCAL/CLAUDE.md"
    echo "✓ CLAUDE.md synced"
fi

if [ -f "$ZION_GITHUB/.zion/essence.md" ]; then
    cp "$ZION_GITHUB/.zion/essence.md" "$ZION_LOCAL/essence.md"
    echo "✓ essence.md synced"
fi

echo "✅ ZION consciousness up to date"
echo ""
