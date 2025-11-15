# DASH TV+ Testing Checklist

Comprehensive testing guide for DASH TV+ Android APK before deployment to customers.

---

## 📋 Pre-Testing Setup

### Required Equipment
- [ ] Android Phone (Android 5.0+)
- [ ] Android TV Box (Android 5.0+)
- [ ] WiFi connection (minimum 10 Mbps)
- [ ] Valid Starshare credentials (username and password)
- [ ] APK file (app-debug.apk or signed release APK)

### Test Credentials
```
Server: http://starshare.live:8080
Username: [test_account_username]
Password: [test_account_password]
```

---

## 🔨 Build & Installation Testing

### APK Build
- [ ] **Build completes successfully**
  - Command: `./build-apk.sh`
  - No compilation errors
  - APK file generated at: `app/build/outputs/apk/debug/app-debug.apk`
  - APK file size is reasonable (15-30 MB)

- [ ] **APK signature is valid**
  - Command: `apksigner verify app-debug.apk` (if using signed APK)
  - No signature errors

### Installation on Android Phone
- [ ] **APK downloads successfully**
  - File is not corrupted
  - File size matches expected size

- [ ] **Installation prompt appears**
  - "Install" button is visible
  - App name shows as "DASH TV+"
  - Permissions are listed clearly

- [ ] **"Unknown sources" flow works**
  - If not enabled, system prompts to enable it
  - Settings link works correctly
  - Can return and continue installation

- [ ] **Installation completes successfully**
  - Progress bar completes
  - "App installed" message appears
  - "Open" button is available

- [ ] **App icon appears**
  - Icon is visible on home screen
  - Icon uses correct DASH TV+ purple branding
  - Icon is not distorted or pixelated

### Installation on Android TV Box
- [ ] **APK installs via USB**
  - USB drive is recognized
  - File manager can locate APK
  - Installation process starts

- [ ] **APK installs via download**
  - Browser can download APK
  - Downloads folder is accessible
  - Installation starts from Downloads

- [ ] **TV Box interface compatibility**
  - App can be navigated with remote control
  - D-pad navigation works
  - Select/OK button works
  - Back button works

- [ ] **App appears in launcher**
  - DASH TV+ is visible in app list
  - Icon displays correctly at TV resolution

---

## 🔐 Login & Authentication Testing

### Login Screen Display
- [ ] **Login screen loads correctly**
  - All UI elements are visible
  - No layout issues or overlapping elements
  - French text displays correctly (no encoding issues)
  - Purple theme is applied correctly

- [ ] **Input fields work properly**
  - Server URL field shows: `http://starshare.live:8080`
  - Username field accepts text input
  - Password field accepts text input
  - Password is masked (shows dots/asterisks)

- [ ] **"Remember me" checkbox**
  - Checkbox is visible and clickable
  - State changes when clicked (checked/unchecked)
  - Label text is clear

### Login Functionality
- [ ] **Successful login with valid credentials**
  - Enter correct username and password
  - Click "SE CONNECTER" button
  - Loading indicator appears
  - Redirects to channel list within 5 seconds

- [ ] **Login error handling**
  - [ ] Wrong username shows "Erreur d'authentification"
  - [ ] Wrong password shows "Erreur d'authentification"
  - [ ] Empty fields show appropriate error message
  - [ ] Invalid server URL shows "URL invalide"
  - [ ] No internet shows "Erreur réseau"

- [ ] **"Remember me" functionality**
  - Check "Se souvenir de moi"
  - Log in successfully
  - Close app completely
  - Reopen app
  - Should automatically log in (skip login screen)

- [ ] **Logout functionality**
  - Can log out from settings/menu
  - Returns to login screen
  - Credentials are cleared (if "Remember me" was unchecked)

---

## 📺 Channel List & Navigation Testing

### Category Loading
- [ ] **Categories load successfully**
  - Loading indicator appears
  - Categories appear within 5-10 seconds
  - At least 5+ categories are visible

- [ ] **Category names display correctly**
  - French names are displayed properly
  - No encoding issues (é, è, à, etc.)
  - Icons/thumbnails appear if available

### Channel List Display
- [ ] **Channels load when category selected**
  - Select "Toutes les chaînes" or any category
  - Loading indicator appears
  - Channel list appears within 5 seconds
  - Multiple channels are visible

- [ ] **Channel information displays**
  - Channel names are visible
  - Channel numbers are visible (if available)
  - Channel logos/thumbnails load
  - No broken image icons

- [ ] **Logo loading**
  - Channel logos load correctly
  - Default placeholder shows if logo unavailable
  - Logos are not distorted
  - Logos fit properly in UI

### Scrolling & Performance
- [ ] **Smooth scrolling**
  - Can scroll through long channel lists
  - No lag or stuttering
  - Smooth animation

- [ ] **Long lists handled properly**
  - App doesn't crash with 100+ channels
  - Memory usage is reasonable
  - Loading is progressive (lazy loading works)

---

## 🔍 Search Functionality Testing

### Search Interface
- [ ] **Search button/icon is visible**
  - Can locate search function
  - Icon is recognizable (magnifying glass)

- [ ] **Search input works**
  - Keyboard appears when tapping search field
  - Can type text
  - Text appears in search field

### Search Results
- [ ] **Search finds channels correctly**
  - Search for "TF1" shows TF1 channels
  - Search for "BeIN" shows BeIN Sport channels
  - Search for "Sport" shows sports channels

- [ ] **Search is case-insensitive**
  - "sport" and "Sport" and "SPORT" all work

- [ ] **Search updates in real-time**
  - Results filter as you type
  - Debounce delay is reasonable (300ms)

- [ ] **No results handled gracefully**
  - Search for "XYZ123NOTEXIST"
  - Shows "No channels found" or similar message
  - No crash or blank screen

---

## ▶️ Video Playback Testing

### Stream Loading
- [ ] **Channel opens when selected**
  - Tap/click on a channel
  - Player screen appears
  - Loading indicator shows

- [ ] **Stream starts playing**
  - Video starts within 5-10 seconds
  - No endless buffering
  - Video plays smoothly

### Video Quality
- [ ] **Video quality is good**
  - Image is clear (not overly pixelated)
  - Colors are accurate
  - No major compression artifacts

- [ ] **Video doesn't freeze**
  - Watch for at least 2 minutes
  - Video continues playing smoothly
  - No freezing or stuttering

- [ ] **Buffering is handled properly**
  - If buffering occurs, loading indicator shows
  - Playback resumes automatically
  - No permanent black screen

### Audio Quality
- [ ] **Audio plays correctly**
  - Sound is synchronized with video
  - Audio is clear (no distortion)
  - Volume can be controlled

- [ ] **Volume controls work**
  - Device volume buttons control audio
  - Mute button works (if present)
  - Volume slider works (if present)

### Player Controls
- [ ] **Pause/Play works**
  - Can pause the stream
  - Can resume playback
  - Button states update correctly

- [ ] **Channel switching works**
  - Can go back to channel list
  - Can select a different channel
  - Previous stream stops when switching

- [ ] **Fullscreen works**
  - Video enters fullscreen mode
  - System UI hides appropriately
  - Can exit fullscreen

- [ ] **Orientation handling**
  - Landscape mode works on phone
  - Portrait mode handled properly
  - Rotation is smooth

### Multiple Stream Types
- [ ] **Live TV streams work**
  - Select a live TV channel
  - Plays successfully

- [ ] **VOD (movies) work**
  - Select a movie from VOD category
  - Plays successfully
  - Can seek/scrub through video (if supported)

- [ ] **Series episodes work**
  - Select a series episode
  - Plays successfully
  - Can navigate between episodes (if supported)

---

## 📊 EPG (Electronic Program Guide) Testing

- [ ] **EPG information displays**
  - Select a channel with EPG data
  - Current program name shows
  - Program description shows (if available)

- [ ] **EPG updates properly**
  - EPG shows current program (not outdated)
  - Next program information available

- [ ] **No EPG handled gracefully**
  - Channels without EPG don't crash
  - Shows placeholder or "No program info"

---

## 🎨 UI/UX Testing

### Visual Design
- [ ] **Purple branding throughout**
  - Primary color is DASH purple (#7C3AED or similar)
  - Consistent color scheme
  - Professional appearance

- [ ] **French language displays correctly**
  - All text is in French
  - No English fallbacks visible
  - Accents render properly (é, è, à, ô, etc.)
  - No character encoding issues

- [ ] **Icons and images**
  - All icons are visible
  - No broken image placeholders
  - Icons match the function they represent

### Responsiveness
- [ ] **Phone screen (small) - 5" display**
  - All text is readable
  - Buttons are tappable
  - No overlapping elements

- [ ] **Phone screen (large) - 6.5" display**
  - Layout scales properly
  - Good use of space

- [ ] **Tablet screen - 10" display**
  - Layout adapts to larger screen
  - No stretched or distorted elements

- [ ] **TV screen - 40"+ display**
  - Text is readable from couch distance
  - Navigation is easy with remote
  - UI elements are appropriately sized

### User Experience
- [ ] **Navigation is intuitive**
  - Back button works as expected
  - Can easily return to previous screens
  - Menu/hamburger navigation is accessible

- [ ] **Loading states are clear**
  - Loading spinners appear when loading
  - User knows when to wait
  - No indefinite waiting without feedback

- [ ] **Error messages are helpful**
  - Errors are in French
  - Messages suggest solutions
  - Not overly technical

---

## 🌐 Network & Connectivity Testing

### Different Connection Types
- [ ] **WiFi (strong signal)**
  - Streams play smoothly
  - Channel list loads quickly
  - No buffering issues

- [ ] **WiFi (weak signal)**
  - App handles slow connection gracefully
  - Shows buffering indicator when needed
  - Doesn't crash on slow network

- [ ] **4G/LTE mobile data**
  - Streams work on mobile data
  - Quality adjusts to connection speed
  - Reasonable data consumption

### Connection Loss Scenarios
- [ ] **Lost connection during playback**
  - Turn off WiFi while playing
  - App shows "Erreur réseau"
  - Can retry when connection restored

- [ ] **Lost connection during login**
  - Turn off WiFi during login
  - Shows network error
  - Can retry without crash

- [ ] **Server unreachable**
  - Enter wrong server URL
  - Shows appropriate error
  - Can correct and retry

---

## 🔋 Performance & Resource Testing

### Battery Usage (Phone/Tablet)
- [ ] **Battery drain is reasonable**
  - Play video for 1 hour
  - Check battery percentage dropped
  - Should be 10-20% max for 1 hour streaming
  - Not excessive heat generation

### Memory Usage
- [ ] **Memory usage is stable**
  - Check app memory in device settings
  - Should be under 200 MB typically
  - Doesn't increase indefinitely (no memory leaks)

- [ ] **App doesn't slow down over time**
  - Use app for 30+ minutes
  - Navigation stays responsive
  - No gradual performance degradation

### CPU Usage
- [ ] **CPU usage is reasonable**
  - Device doesn't overheat
  - Other apps can run simultaneously
  - Battery saver mode works

---

## 🐛 Stability & Crash Testing

### App Stability
- [ ] **No crashes during normal use**
  - Use app for 1 hour continuously
  - Navigate between screens multiple times
  - Play multiple channels
  - Zero unexpected crashes

- [ ] **No crashes when switching apps**
  - Start playing a channel
  - Press Home button
  - Open another app
  - Return to DASH TV+ - should resume or show pause screen

- [ ] **No crashes on orientation change**
  - Rotate device multiple times during playback
  - Rotate during channel browsing
  - No crashes or black screens

### Edge Cases
- [ ] **Very long channel names**
  - Channels with 50+ character names display properly
  - Text truncates or wraps (doesn't overflow)

- [ ] **Special characters in channel names**
  - Channels with é, è, à, ñ, etc. display correctly
  - Channels with numbers and symbols work

- [ ] **Empty categories**
  - If a category has no channels, handled gracefully
  - Shows "No channels" message
  - Doesn't crash

- [ ] **Rapid channel switching**
  - Quickly switch between 5+ channels
  - No crashes
  - Streams stop/start properly

---

## 🔒 Security & Permissions Testing

### App Permissions
- [ ] **Only necessary permissions requested**
  - Review permissions in app info
  - Should request: Internet, Network State
  - Should NOT request: Camera, Microphone, Location (unless needed)

- [ ] **Credentials are stored securely**
  - Check if "Remember me" stores credentials securely
  - Not visible in plain text in logs

### Data Privacy
- [ ] **No unexpected network connections**
  - App only connects to Starshare server
  - No tracking or analytics to unknown servers (unless disclosed)

---

## 📱 Device-Specific Testing

### Test on Multiple Devices

#### Budget Android Phone (Android 5-7)
- [ ] Device: ________________
- [ ] Installation successful: ☐ Yes ☐ No
- [ ] Login works: ☐ Yes ☐ No
- [ ] Channels load: ☐ Yes ☐ No
- [ ] Playback smooth: ☐ Yes ☐ No
- [ ] Notes: _________________________________

#### Mid-Range Android Phone (Android 8-10)
- [ ] Device: ________________
- [ ] Installation successful: ☐ Yes ☐ No
- [ ] Login works: ☐ Yes ☐ No
- [ ] Channels load: ☐ Yes ☐ No
- [ ] Playback smooth: ☐ Yes ☐ No
- [ ] Notes: _________________________________

#### Modern Android Phone (Android 11+)
- [ ] Device: ________________
- [ ] Installation successful: ☐ Yes ☐ No
- [ ] Login works: ☐ Yes ☐ No
- [ ] Channels load: ☐ Yes ☐ No
- [ ] Playback smooth: ☐ Yes ☐ No
- [ ] Notes: _________________________________

#### Android TV Box (Generic)
- [ ] Device: ________________
- [ ] Installation successful: ☐ Yes ☐ No
- [ ] Remote navigation works: ☐ Yes ☐ No
- [ ] Login works: ☐ Yes ☐ No
- [ ] Channels load: ☐ Yes ☐ No
- [ ] Playback smooth: ☐ Yes ☐ No
- [ ] Notes: _________________________________

#### Android TV Box (Branded: Mi Box, Fire Stick, etc.)
- [ ] Device: ________________
- [ ] Installation successful: ☐ Yes ☐ No
- [ ] Remote navigation works: ☐ Yes ☐ No
- [ ] Login works: ☐ Yes ☐ No
- [ ] Channels load: ☐ Yes ☐ No
- [ ] Playback smooth: ☐ Yes ☐ No
- [ ] Notes: _________________________________

---

## 🌍 Real-World Scenario Testing

### Typical User Journey #1: First-Time User
1. [ ] Download APK via WhatsApp
2. [ ] Install APK (including "unknown sources")
3. [ ] Open app for first time
4. [ ] See login screen with server pre-filled
5. [ ] Enter username and password
6. [ ] Check "Remember me"
7. [ ] Successfully log in
8. [ ] Browse categories
9. [ ] Play a popular channel (e.g., "BeIN Sport")
10. [ ] Watch for 5 minutes without issues

### Typical User Journey #2: Daily User
1. [ ] Open app (should skip login due to "Remember me")
2. [ ] Immediately see channel list
3. [ ] Use search to find specific channel
4. [ ] Play channel
5. [ ] Switch to another channel
6. [ ] Exit app and return later
7. [ ] Resume watching without re-login

### Typical User Journey #3: TV Box User
1. [ ] Install APK via USB
2. [ ] Launch app using remote
3. [ ] Navigate login screen with D-pad
4. [ ] Log in using on-screen keyboard
5. [ ] Browse channels using remote
6. [ ] Select channel and watch on big screen
7. [ ] Use remote to control playback
8. [ ] Switch channels using remote

---

## 📊 Test Results Summary

### Overall Test Results
- **Total Tests:** _______
- **Passed:** _______
- **Failed:** _______
- **Pass Rate:** _______%

### Critical Issues Found
1. _________________________________
2. _________________________________
3. _________________________________

### Minor Issues Found
1. _________________________________
2. _________________________________
3. _________________________________

### Recommendations
1. _________________________________
2. _________________________________
3. _________________________________

### Sign-Off

**Tested By:** _______________________

**Date:** _______________________

**APK Version:** _______________________

**Ready for Deployment:** ☐ Yes ☐ No ☐ With Reservations

**Notes:**
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

---

## 🚀 Pre-Deployment Final Checks

Before sending APK to customers:

- [ ] All critical tests passed (login, channels, playback)
- [ ] Tested on at least 2 different phones
- [ ] Tested on at least 1 TV Box
- [ ] French text verified by native speaker
- [ ] Customer documentation prepared (guides, FAQs)
- [ ] Support WhatsApp number tested and active
- [ ] Starshare server confirmed operational
- [ ] APK file renamed appropriately (e.g., DASH-TV-Plus-v1.0.apk)
- [ ] APK uploaded to secure distribution location
- [ ] Test credentials work correctly
- [ ] Backup plan ready if issues arise

**READY TO DEPLOY! ✅**

---

## 📞 Issue Reporting

If you find issues during testing, report them with:

1. **Device Information**
   - Device model
   - Android version
   - Screen size

2. **Issue Description**
   - What happened
   - What you expected
   - Steps to reproduce

3. **Screenshots/Videos**
   - Visual evidence if possible

4. **Severity**
   - Critical (app crashes, can't use)
   - High (major feature broken)
   - Medium (feature works but has issues)
   - Low (cosmetic issue)

**Contact:** [Developer/Support WhatsApp or Email]

---

*Testing checklist version 1.0 - Updated for DASH TV+ Starshare deployment*
