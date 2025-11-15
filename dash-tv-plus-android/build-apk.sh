#!/bin/bash
# DASH TV+ APK Builder
# Simple script to build release APK without Android Studio

echo "🔨 Building DASH TV+ APK..."

# Check if gradlew exists
if [ ! -f "./gradlew" ]; then
    echo "❌ Error: gradlew not found"
    exit 1
fi

# Make gradlew executable
chmod +x ./gradlew

# Clean previous builds
echo "🧹 Cleaning previous builds..."
./gradlew clean

# Build debug APK (no signing needed for testing)
echo "📦 Building debug APK..."
./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo "✅ SUCCESS! APK built:"
    echo "📱 Location: app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "📲 To install on device:"
    echo "   adb install app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "📤 To share via WhatsApp:"
    echo "   The APK is ready at: $(pwd)/app/build/outputs/apk/debug/app-debug.apk"
else
    echo "❌ Build failed. Check errors above."
    exit 1
fi
