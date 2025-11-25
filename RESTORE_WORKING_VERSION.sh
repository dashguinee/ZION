#!/bin/bash
# EMERGENCY RESTORE SCRIPT
# Use this to restore the working MKV playback version if something breaks

echo "🔄 RESTORING WORKING VERSION..."
echo ""
echo "Current working version details:"
echo "- Tag: v1.0-working-mkv-fallback"
echo "- Commit: efe8fe2"
echo "- Features: MKV playback via MP4 fallback (works!)"
echo "- Status: Images don't show, but video plays"
echo ""
echo "⚠️  This will DISCARD any uncommitted changes!"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    cd /home/dash/zion-github
    git reset --hard v1.0-working-mkv-fallback
    echo ""
    echo "✅ RESTORED to working version!"
    echo ""
    echo "To redeploy to Vercel:"
    echo "  cd dash-webtv"
    echo "  git push"
    echo ""
fi
