# 🚀 DASH TV+ Quick Start Guide

## For Developers - Get Running in 5 Minutes

### 1. Prerequisites Check
```bash
# Verify Java version (need JDK 17+)
java -version

# Verify Android SDK
echo $ANDROID_HOME
```

### 2. Open Project
```bash
# From command line
cd /home/user/ZION/dash-tv-plus-android
code .  # Or open with Android Studio
```

### 3. Build Debug APK
```bash
# Sync and build
./gradlew assembleDebug

# Output will be at:
# app/build/outputs/apk/debug/app-debug.apk
```

### 4. Install on Device
```bash
# Via ADB (device must be connected)
adb install app/build/outputs/apk/debug/app-debug.apk

# Or drag-and-drop APK to emulator
```

### 5. Test Credentials

Use any Xtream Codes IPTV provider:

**Example Test Server:**
- Portal URL: `http://your-xtream-server.com:8080`
- Username: `your_username`
- Password: `your_password`

**Note:** Replace with your actual IPTV provider credentials.

## First Run Workflow

1. **Splash Screen** → Shows DASH TV+ logo (2 seconds)
2. **Login Screen** → Enter Xtream credentials
3. **Channel List** → Browse categories and channels
4. **Player** → Tap a channel to start streaming

## Common Issues & Quick Fixes

### Build Error: "SDK not found"
```bash
# Install Android SDK via Android Studio
# Tools → SDK Manager → Android 14.0 (API 34)
```

### "Cleartext traffic not permitted"
Already handled! ✅ The app allows HTTP connections.

### Video Won't Play
- Check internet connection
- Verify stream URL format: `http://server:port/live/user/pass/streamid.m3u8`
- Try increasing buffer in `Constants.kt`

### Login Fails
- Verify portal URL includes `http://` and port (e.g., `:8080`)
- Test credentials in web browser first
- Check server is accessible from device

## Customization Quick Tips

### Change App Name
`app/src/main/res/values/strings.xml`
```xml
<string name="app_name">YOUR APP NAME</string>
```

### Change Colors
`app/src/main/res/values/colors.xml`
```xml
<color name="purple_primary">#YOUR_COLOR</color>
<color name="purple_dark">#YOUR_DARK_COLOR</color>
```

### Change Package Name
1. Update `applicationId` in `app/build.gradle`
2. Refactor package in Android Studio: Right-click package → Refactor → Rename
3. Update `AndroidManifest.xml` package attribute

## Build for Production

### 1. Create Keystore
```bash
keytool -genkey -v -keystore release.keystore \
  -alias my-app -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Build Signed APK
```bash
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk
```

### 3. Distribute
- Upload to Google Play Store (AAB format)
- Direct distribution via website/WhatsApp (APK format)
- Side-loading on Android TV devices

## Useful Commands

```bash
# Clean build
./gradlew clean

# Build both debug and release
./gradlew assemble

# Run on connected device
./gradlew installDebug

# Check app size
du -sh app/build/outputs/apk/release/app-release.apk

# List connected devices
adb devices

# View logs
adb logcat | grep DashTV
```

## Next Steps

1. ✅ Replace placeholder icons with your logo
2. ✅ Customize colors to match your brand
3. ✅ Test with your Xtream provider
4. ✅ Create signed release APK
5. ✅ Distribute to users!

---

**Need help?** Check the full README.md for detailed documentation.
