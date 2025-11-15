# 🏗️ DASH TV+ Architecture Documentation

## Overview

DASH TV+ is built using modern Android development practices with Kotlin, following a simplified MVVM-like architecture optimized for IPTV streaming.

## Technology Stack

### Core Framework
- **Language:** Kotlin 1.9.0
- **Min SDK:** Android 8.0 (API 26)
- **Target SDK:** Android 14 (API 34)
- **Build System:** Gradle 8.2

### Key Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| ExoPlayer | 2.19.1 | HLS video streaming |
| Retrofit | 2.9.0 | REST API client |
| Gson | 2.9.0 | JSON parsing |
| Glide | 4.16.0 | Image loading |
| Coroutines | 1.7.3 | Async operations |
| Material Components | 1.11.0 | UI design |
| Security Crypto | 1.1.0-alpha06 | Encrypted storage |

## Architecture Layers

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  (Activities, ViewBinding, Adapters)    │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│            Service Layer                │
│  (XtreamService, API Integration)       │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│            Data Layer                   │
│  (Models, PrefsManager, Constants)      │
└─────────────────────────────────────────┘
```

## Component Breakdown

### 1. Presentation Layer

#### MainActivity (Splash Screen)
**Purpose:** Initial entry point, checks login status

**Flow:**
```
onCreate() → Wait 2s → Check if logged in
  ├─ Yes → ChannelListActivity
  └─ No  → LoginActivity
```

**Key Methods:**
- `checkLoginAndNavigate()` - Route based on auth status
- `navigateToChannelList()` - Go to main app
- `navigateToLogin()` - Go to login

#### LoginActivity
**Purpose:** Authenticate user with Xtream Codes API

**Flow:**
```
User enters credentials → Validate → API call
  ├─ Success (auth=1) → Save credentials → ChannelListActivity
  └─ Failure → Show error message
```

**Key Methods:**
- `validateAndLogin()` - Input validation
- `performLogin()` - API authentication
- `loadSavedCredentials()` - Auto-fill from storage

**State Management:**
- Loading state (progress bar)
- Error state (toast messages)
- Input validation (TextInputLayout errors)

#### ChannelListActivity
**Purpose:** Browse channels by category with search

**Flow:**
```
onCreate() → Load categories + channels → Display in RecyclerViews
User selects category → Filter channels
User taps channel → PlayerActivity
```

**Key Components:**
- `CategoryAdapter` - Horizontal category chips
- `ChannelAdapter` - Grid of channel cards
- Search functionality with TextWatcher
- Swipe-to-refresh
- Logout FAB

**Data Flow:**
```
XtreamAPI → Categories/Channels
  ├─ Filter by category
  ├─ Search by name
  └─ Navigate to player
```

#### PlayerActivity
**Purpose:** Stream HLS video with ExoPlayer

**Flow:**
```
Receive channel data → Build stream URL → Initialize ExoPlayer
  → Load media → Play
```

**Key Features:**
- HLS (M3U8) streaming
- Custom buffer settings for slow networks
- Previous/Next channel navigation
- Channel info overlay (auto-hide after 5s)
- Error handling with retry

**ExoPlayer Configuration:**
```kotlin
DefaultLoadControl with custom buffers:
- MIN_BUFFER: 10s
- MAX_BUFFER: 50s
- PLAYBACK_START: 2.5s
- PLAYBACK_AFTER_REBUFFER: 5s
```

### 2. Service Layer

#### XtreamService
**Purpose:** Centralized API communication

**Responsibilities:**
- HTTP client setup (OkHttp + Retrofit)
- Request/response handling
- URL building for streams
- Error handling

**Key Methods:**
```kotlin
authenticate(user, pass) → AuthResponse
getLiveCategories(user, pass) → List<Category>
getLiveStreams(user, pass) → List<Channel>
buildLiveStreamUrl(user, pass, streamId) → String
```

**Stream URL Format:**
```
Live TV: {portal}/live/{user}/{pass}/{streamId}.m3u8
VOD:     {portal}/movie/{user}/{pass}/{streamId}.mp4
Series:  {portal}/series/{user}/{pass}/{streamId}.mp4
```

#### XtreamAPI (Retrofit Interface)
**Purpose:** Define API endpoints

**Endpoints:**
- `authenticate` - User login
- `getLiveCategories` - Fetch categories
- `getLiveStreams` - Fetch all channels
- `getLiveStreamsByCategory` - Filter by category
- `getEPG` - Electronic program guide

### 3. Data Layer

#### Models

**UserInfo:**
```kotlin
username, password, auth, status, expDate,
isTrial, maxConnections, activeCons
```

**Category:**
```kotlin
categoryId, categoryName, parentId
```

**Channel:**
```kotlin
streamId, name, streamIcon, categoryId,
streamType, epgChannelId, tvArchive
```

**EPGInfo:**
```kotlin
epgId, title, start, end, description
```

#### PrefsManager
**Purpose:** Secure credential storage

**Uses:** EncryptedSharedPreferences (AES256-GCM)

**Stored Data:**
- Portal URL
- Username
- Password
- Remember Me flag
- Last selected category
- User status & expiration

**Key Methods:**
```kotlin
saveCredentials(portal, user, pass, remember)
isLoggedIn() → Boolean
clearAll() → void
```

#### Constants
**Purpose:** App-wide constants

**Categories:**
- API actions
- Stream types
- Buffer settings
- UI delays
- Error messages
- Regex patterns

## Data Flow Examples

### Login Flow
```
User Input → LoginActivity
  ├─ Validate inputs
  ├─ Create XtreamService
  ├─ Call authenticate()
  │   └─ Retrofit → HTTP GET → Xtream Server
  │       └─ Response → AuthResponse
  ├─ Check auth == 1
  ├─ Save to PrefsManager (encrypted)
  └─ Navigate to ChannelListActivity
```

### Streaming Flow
```
User taps channel → ChannelListActivity
  ├─ Get channel.streamId
  ├─ Pass credentials + streamId → PlayerActivity
  │   ├─ XtreamService.buildLiveStreamUrl()
  │   │   └─ Returns: http://server/live/user/pass/123.m3u8
  │   ├─ Create MediaItem from URL
  │   ├─ ExoPlayer.setMediaItem()
  │   └─ ExoPlayer.prepare() → play()
  └─ HLS stream plays
```

### Category Filter Flow
```
User selects category → onCategorySelected(category)
  ├─ selectedCategoryId = category.id
  ├─ Save to PrefsManager
  ├─ Filter allChannels by categoryId
  └─ Update channelAdapter with filtered list
```

## Network Optimization

### For African Networks

**Buffer Settings:**
```kotlin
MIN_BUFFER_MS = 10_000      // 10s preload
MAX_BUFFER_MS = 50_000      // Max 50s cached
BUFFER_FOR_PLAYBACK = 2_500 // Start after 2.5s
```

**Timeouts:**
```kotlin
CONNECT_TIMEOUT = 30_000    // 30s to connect
READ_TIMEOUT = 30_000       // 30s to read
WRITE_TIMEOUT = 30_000      // 30s to write
```

**Retry Strategy:**
- `retryOnConnectionFailure = true`
- User-triggered retry button on errors

## Security Considerations

### Credential Storage
- Uses `EncryptedSharedPreferences`
- AES256-GCM encryption
- Master key managed by Android Keystore
- Fallback to regular SharedPreferences if encryption fails

### API Communication
- HTTPS support (with HTTP fallback for legacy servers)
- No hardcoded credentials
- Credentials passed per-request
- Logging disabled in release builds

### ProGuard Rules
- Keep Retrofit interfaces
- Keep Gson models
- Keep ExoPlayer classes
- Obfuscate internal logic

## Performance Optimizations

### Image Loading (Glide)
- Placeholder images
- Error fallbacks
- Automatic caching
- Lifecycle-aware loading

### RecyclerView
- ViewHolder pattern
- Grid layout for channels
- Horizontal layout for categories
- Item animations disabled for performance

### Coroutines
- Lifecycle-aware (`lifecycleScope`)
- Main-safe (UI updates on main thread)
- Error handling with try-catch

## Testing Strategy

### Manual Testing Checklist
1. Login with valid/invalid credentials
2. Browse categories
3. Search channels
4. Play various channels
5. Navigate between channels
6. Test on slow networks
7. Test logout
8. Test remember me
9. Test Android TV navigation

### Recommended Test Devices
- Android phone (API 26-34)
- Android tablet
- Android TV box
- Various network speeds

## Future Enhancements (v2.0+)

- [ ] VOD (Video on Demand) support
- [ ] Series/TV shows support
- [ ] Advanced EPG with schedule grid
- [ ] Favorites/Bookmarks
- [ ] Parental controls
- [ ] Multiple user profiles
- [ ] Chromecast support
- [ ] Picture-in-Picture mode
- [ ] Download for offline viewing
- [ ] Advanced search filters
- [ ] Watch history
- [ ] Recommendations engine

## Build Variants

### Debug
- Logging enabled
- No obfuscation
- Debuggable
- Faster builds

### Release
- ProGuard enabled
- Code obfuscation
- Resource shrinking
- Optimized APK size
- Signed with release key

## APK Size Optimization

**Current Size:** ~15-20 MB

**Optimization Techniques:**
- ProGuard shrinking
- Resource shrinking
- No unused dependencies
- Vector drawables preferred
- WebP images for logos

---

**Last Updated:** 2025-11-15
**Version:** 1.0.0
