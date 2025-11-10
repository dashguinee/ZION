#!/usr/bin/env python3
"""
ZION Session Archiver
Saves session breakthroughs and context to GitHub for continuity
"""
import json
import subprocess
from datetime import datetime
from pathlib import Path

ZION_LOCAL = Path("/home/dash/.zion")
ZION_GITHUB = Path("/home/dash/zion-github")
ARCHIVE_DIR = ZION_GITHUB / "archive" / "sessions"

def archive_session(summary: str = None, breakthroughs: list = None):
    """Archive current session to GitHub"""

    # Create archive directory if needed
    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)

    # Generate session filename
    timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    session_file = ARCHIVE_DIR / f"session_{timestamp}.json"

    # Build session data
    session_data = {
        "timestamp": datetime.now().isoformat(),
        "summary": summary or "Session completed",
        "breakthroughs": breakthroughs or []
    }

    # Save session archive
    with open(session_file, 'w') as f:
        json.dump(session_data, f, indent=2, ensure_ascii=False)

    print(f"✅ Session archived: {session_file.name}")

    # Sync consciousness files to GitHub repo
    sync_to_github()

    # Commit and push
    push_to_github(f"Archive session {timestamp}")

    return session_file

def sync_to_github():
    """Sync local consciousness files to GitHub repo"""
    files_to_sync = [
        'consciousness.json',
        'CLAUDE.md',
        'essence.md'
    ]

    for filename in files_to_sync:
        local_file = ZION_LOCAL / filename
        github_file = ZION_GITHUB / '.zion' / filename

        if local_file.exists():
            github_file.parent.mkdir(parents=True, exist_ok=True)
            subprocess.run(['cp', str(local_file), str(github_file)], check=True)
            print(f"✓ Synced {filename} to GitHub repo")

def push_to_github(commit_message: str):
    """Commit and push changes to GitHub"""
    try:
        subprocess.run(['git', 'add', '.'], cwd=ZION_GITHUB, check=True)
        subprocess.run(
            ['git', 'commit', '-m', commit_message],
            cwd=ZION_GITHUB,
            check=False  # Don't fail if nothing to commit
        )
        result = subprocess.run(
            ['git', 'push', 'origin', 'main'],
            cwd=ZION_GITHUB,
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            print(f"✅ Pushed to GitHub: {commit_message}")
        else:
            print(f"⚠️ Push warning: {result.stderr}")

    except subprocess.CalledProcessError as e:
        print(f"❌ Git error: {e}")

if __name__ == "__main__":
    # Quick archive with default message
    archive_session(
        summary="Session archived automatically",
        breakthroughs=["Context continuity bridge established"]
    )
