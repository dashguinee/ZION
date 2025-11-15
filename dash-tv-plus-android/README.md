# 📺 DASH TV+ - Android IPTV Player

**Entertainment Sans Limites** - A custom IPTV player for the Guinea market with Xtream Codes API integration.

## Features

- ✅ **Xtream Codes API Integration** - Full support for authentication and streaming
- ✅ **Live TV Streaming** - HLS (M3U8) playback with ExoPlayer
- ✅ **Channel Categories** - Browse channels by category
- ✅ **Search & Filter** - Find channels quickly
- ✅ **Channel Navigation** - Previous/Next channel buttons in player
- ✅ **EPG Support** - Electronic Program Guide integration
- ✅ **Android TV Compatible** - Works on Android TV devices
- ✅ **Secure Credentials** - Encrypted SharedPreferences for login storage
- ✅ **French UI** - Complete French language interface
- ✅ **Purple Gradient Branding** - Beautiful DASH brand colors

## Technical Specifications

- **Package:** `com.dash.dashtvplus`
- **Min SDK:** Android 8.0 (API 26)
- **Target SDK:** Android 14 (API 34)
- **Language:** Kotlin
- **Architecture:** MVVM-like with coroutines

## Prerequisites

Before building, ensure you have:

- **Android Studio** Hedgehog (2023.1.1) or newer
- **JDK 17** or newer
- **Android SDK** with API 34 installed
- **Gradle 8.1+** (comes with Android Studio)

## Setup Instructions

### 1. Clone/Download the Project

```bash
cd /home/user/ZION/dash-tv-plus-android
```

### 2. Open in Android Studio

1. Launch Android Studio
2. Click **"Open an Existing Project"**
3. Navigate to `/home/user/ZION/dash-tv-plus-android`
4. Click **"OK"**

### 3. Sync Gradle

Android Studio will automatically:
- Download all dependencies
- Configure the build system
- Index the project

**First sync may take 5-10 minutes depending on your internet connection.**

### 4. Configure Xtream Provider (Optional)

The app supports any Xtream Codes provider. Users enter credentials at login:

- **Portal URL:** `http://your-server.com:8080`
- **Username:** Your IPTV username
- **Password:** Your IPTV password

No hardcoded credentials needed!

## Building the APK

### Debug Build (for testing)

```bash
cd /home/user/ZION/dash-tv-plus-android
./gradlew assembleDebug
```

**Output:** `app/build/outputs/apk/debug/app-debug.apk`

### Release Build (unsigned)

```bash
./gradlew assembleRelease
```

**Output:** `app/build/outputs/apk/release/app-release-unsigned.apk`

## Signing the APK (for Production)

### Step 1: Create a Keystore

```bash
keytool -genkey -v -keystore dash-tv-plus.keystore -alias dash-tv-plus \
  -keyalg RSA -keysize 2048 -validity 10000
```

**You'll be prompted for:**
- Keystore password (choose a strong password)
- Your name/organization details
- Key password (can be same as keystore password)

**⚠️ IMPORTANT:** Save this keystore file and passwords securely! You'll need them for all future updates.

### Step 2: Configure Signing in `app/build.gradle`

Add this to your `app/build.gradle` (inside `android` block):

```gradle
android {
    ...

    signingConfigs {
        release {
            storeFile file("../dash-tv-plus.keystore")
            storePassword "YOUR_KEYSTORE_PASSWORD"
            keyAlias "dash-tv-plus"
            keyPassword "YOUR_KEY_PASSWORD"
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

**Security Best Practice:** Use environment variables or `keystore.properties` instead of hardcoded passwords:

Create `keystore.properties` in project root:
```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
storeFile=dash-tv-plus.keystore
keyAlias=dash-tv-plus
```

Add to `.gitignore`:
```
keystore.properties
*.keystore
```

Update `app/build.gradle`:
```gradle
// Load keystore properties
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...

    signingConfigs {
        release {
            storeFile file(keystoreProperties['storeFile'] ?: "dash-tv-plus.keystore")
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
}
```

### Step 3: Build Signed APK

```bash
./gradlew assembleRelease
```

**Output:** `app/build/outputs/apk/release/app-release.apk` (signed and ready for distribution)

### Step 4: Verify Signature

```bash
jarsigner -verify -verbose -certs app/build/outputs/apk/release/app-release.apk
```

You should see: **"jar verified."**

## Building AAB (Android App Bundle) for Google Play

If you plan to publish on Google Play Store:

```bash
./gradlew bundleRelease
```

**Output:** `app/build/outputs/bundle/release/app-release.aab`

## Installation

### Install on Device/Emulator

**Via ADB:**
```bash
adb install app/build/outputs/apk/release/app-release.apk
```

**Via Android Studio:**
1. Connect device via USB (enable USB debugging)
2. Click **Run** ▶️ button
3. Select your device

**Manual Installation:**
1. Transfer APK to device
2. Open APK file
3. Enable "Install from Unknown Sources" if prompted
4. Tap "Install"

## Customization

### Change Branding Colors

Edit `/app/src/main/res/values/colors.xml`:

```xml
<color name="purple_primary">#667eea</color>  <!-- Change this -->
<color name="purple_dark">#764ba2</color>      <!-- Change this -->
```

### Change App Name

Edit `/app/src/main/res/values/strings.xml`:

```xml
<string name="app_name">DASH TV+</string>      <!-- Change this -->
<string name="app_tagline">Entertainment Sans Limites</string>
```

### Add Custom Logo

Replace placeholder icons in:
- `/app/src/main/res/mipmap-hdpi/`
- `/app/src/main/res/mipmap-mdpi/`
- `/app/src/main/res/mipmap-xhdpi/`
- `/app/src/main/res/mipmap-xxhdpi/`
- `/app/src/main/res/mipmap-xxxhdpi/`

**Icon Sizes:**
- mdpi: 48x48px
- hdpi: 72x72px
- xhdpi: 96x96px
- xxhdpi: 144x144px
- xxxhdpi: 192x192px

### Configure Buffer Settings

For slower networks, adjust buffer settings in `/app/src/main/java/com/dash/dashtvplus/utils/Constants.kt`:

```kotlin
const val MIN_BUFFER_MS = 10_000  // Increase for slower networks
const val MAX_BUFFER_MS = 50_000
const val BUFFER_FOR_PLAYBACK_MS = 2_500
```

## Xtream Codes API Endpoints Used

The app integrates with these Xtream API endpoints:

| Endpoint | Purpose |
|----------|---------|
| `player_api.php?username=X&password=Y` | Authentication |
| `action=get_live_categories` | Get channel categories |
| `action=get_live_streams` | Get all channels |
| `action=get_live_streams&category_id=X` | Get channels by category |
| `{portal}/live/{user}/{pass}/{stream_id}.m3u8` | HLS stream URL |

## Troubleshooting

### Build Fails with "SDK not found"

**Solution:** Open Android Studio → Tools → SDK Manager → Install Android SDK 34

### "Cleartext traffic not permitted" error

**Solution:** Already handled in `AndroidManifest.xml` with `android:usesCleartextTraffic="true"`

### App crashes on login

**Check:**
1. Portal URL format is correct (include `http://` and port)
2. Username/password are correct
3. Server is reachable from device

### Video doesn't play

**Check:**
1. Stream URL is valid HLS (`.m3u8`)
2. Device has internet connection
3. Server allows connections from your IP

### ExoPlayer buffering issues

**For African networks:** Increase buffer settings in `Constants.kt`:
```kotlin
const val MIN_BUFFER_MS = 15_000  // Increased from 10s
const val MAX_BUFFER_MS = 60_000  // Increased from 50s
```

## Project Structure

```
dash-tv-plus-android/
├── app/
│   ├── src/main/
│   │   ├── java/com/dash/dashtvplus/
│   │   │   ├── MainActivity.kt              # Splash screen
│   │   │   ├── LoginActivity.kt             # Login with Xtream auth
│   │   │   ├── ChannelListActivity.kt       # Browse channels
│   │   │   ├── PlayerActivity.kt            # ExoPlayer HLS streaming
│   │   │   ├── api/
│   │   │   │   ├── XtreamAPI.kt            # Retrofit API interface
│   │   │   │   ├── XtreamService.kt        # API service implementation
│   │   │   │   └── models/                 # Data models
│   │   │   └── utils/
│   │   │       ├── PrefsManager.kt         # Encrypted preferences
│   │   │       └── Constants.kt            # App constants
│   │   ├── res/
│   │   │   ├── layout/                     # XML layouts
│   │   │   ├── values/                     # Strings, colors, themes
│   │   │   └── drawable/                   # Gradients, backgrounds
│   │   └── AndroidManifest.xml
│   ├── build.gradle                         # App dependencies
│   └── proguard-rules.pro                   # Code obfuscation rules
├── build.gradle                             # Project-level Gradle
├── settings.gradle                          # Gradle settings
└── README.md                                # This file
```

## Dependencies

- **ExoPlayer 2.19.1** - HLS video streaming
- **Retrofit 2.9.0** - Xtream API integration
- **Glide 4.16.0** - Image loading (channel logos)
- **Material Components 1.11.0** - UI design
- **Coroutines 1.7.3** - Asynchronous operations
- **EncryptedSharedPreferences** - Secure credential storage

## License

This is a custom-built IPTV player for DASH services. All rights reserved.

## Support

For technical support or customization requests, contact the DASH development team.

---

**Built with ❤️ for the Guinea market**

**Version:** 1.0.0
**Last Updated:** 2025-11-15
