# DASH WebTV North Star Features - Visual Guide

## 🎯 Feature 1: Custom Package Builder

### Navigation
```
Bottom Nav Bar
┌─────────────────────────────────────────────────┐
│ [Home] [Movies] [Series] [Live] [📦Package]     │
└─────────────────────────────────────────────────┘
                                      ↑
                                   NEW TAB
```

### Package Builder UI
```
╔══════════════════════════════════════════════════╗
║  📦 Build Your Package                           ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  Choose the content categories you want.         ║
║  Pay only for what you watch!                    ║
║                                                  ║
║  ┌──────────┐  ┌──────────┐  ┌──────────┐      ║
║  │  ⚽      │  │  🇫🇷     │  │  🎬      │      ║
║  │ Sports   │  │ French   │  │Nollywood │      ║
║  │ 20K GNF  │  │ 15K GNF  │  │ 15K GNF  │      ║
║  │ ✓        │  │          │  │ ✓        │      ║
║  └──────────┘  └──────────┘  └──────────┘      ║
║    SELECTED                    SELECTED          ║
║                                                  ║
║  ┌──────────┐  ┌──────────┐  ┌──────────┐      ║
║  │  🇰🇷     │  │  👶      │  │  🎵      │      ║
║  │ K-Drama  │  │  Kids    │  │  Music   │      ║
║  │ 10K GNF  │  │ 10K GNF  │  │ 10K GNF  │      ║
║  └──────────┘  └──────────┘  └──────────┘      ║
║                                                  ║
║  ┌──────────┐  ┌──────────┐                     ║
║  │  📺      │  │  🎥      │                     ║
║  │ Live TV  │  │ Premium  │                     ║
║  │ 10K GNF  │  │ 15K GNF  │                     ║
║  └──────────┘  └──────────┘                     ║
║                                                  ║
║  ┌────────────────────────────────────────┐     ║
║  │ 2 categories selected                  │     ║
║  │ 35K GNF /month                         │     ║
║  │                      [Save Package]    │     ║
║  └────────────────────────────────────────┘     ║
║                                                  ║
║  ℹ️ How it works                                ║
║  • Select the content categories you want       ║
║  • Your monthly cost is calculated              ║
║  • Top up your DASH Wallet (min 100K GNF)       ║
║  • Auto-renew each month                        ║
╚══════════════════════════════════════════════════╝
```

---

## 💰 Feature 2: DASH Wallet System

### Account Page Integration
```
╔══════════════════════════════════════════════════╗
║  👤 Account                                      ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  Logged in as: DASH                              ║
║                                                  ║
║  Your Plan: Premium + StarShare VOD              ║
║                                                  ║
║  ┌──────────────────────────────────────────┐   ║
║  │ 💳 DASH Wallet            [Top Up]      │   ║
║  │                                          │   ║
║  │         Current Balance                  │   ║
║  │         250K DMoney                      │   ║
║  │          (GREEN)                         │   ║
║  │                                          │   ║
║  │  [💵 History]    [📦 My Package]        │   ║
║  └──────────────────────────────────────────┘   ║
║                                                  ║
║  Subscription Status: Active                     ║
║                                                  ║
║  Streaming Quality: [720p ▼]                    ║
║                                                  ║
║  [Logout]                                        ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

### Top-Up Modal
```
┌────────────────────────────────────────┐
│ Top Up DASH Wallet               [×]   │
├────────────────────────────────────────┤
│                                        │
│  ℹ️ Payment Instructions               │
│                                        │
│  1. Send via Orange Money or MTN      │
│  2. Payment number: 611361300         │
│  3. Minimum: 100,000 GNF              │
│  4. Reference: DASH-{username}        │
│  5. Balance updates within 1 hour     │
│                                        │
│  ✅ No chasing for payments!           │
│  Control your entertainment budget.    │
│                                        │
│         [Got it!]                      │
└────────────────────────────────────────┘
```

### Transaction History Modal
```
┌────────────────────────────────────────┐
│ Transaction History              [×]   │
├────────────────────────────────────────┤
│                                        │
│  ⬆️ Mobile money top-up               │
│  6 Dec 2025, 14:30                    │
│                            +250K       │
│  ────────────────────────────────────  │
│  ⬇️ Monthly subscription              │
│  1 Dec 2025, 00:00                    │
│                            -45K        │
│  ────────────────────────────────────  │
│  ⬆️ Mobile money top-up               │
│  25 Nov 2025, 10:15                   │
│                            +200K       │
│                                        │
│            [Close]                     │
└────────────────────────────────────────┘
```

### Balance Status Colors
```
💚 GREEN  (>100K)  - Good balance
💛 YELLOW (50K-100K) - Warning
❤️  RED   (<50K)   - Low balance (with warning message)
```

---

## 🔒 Feature 3: Content Gating

### Locked Content Example
```
╔══════════════════════════════════════════════════╗
║  🎬 Premium Movies                               ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  ┌──────────┐  ┌──────────┐  ┌──────────┐      ║
║  │  POSTER  │  │  POSTER  │  │  POSTER  │      ║
║  │          │  │          │  │   🔒     │      ║
║  │ Movie 1  │  │ Movie 2  │  │ Movie 3  │      ║
║  └──────────┘  └──────────┘  └──────────┘      ║
║     ✓ ACCESS      ✓ ACCESS     🔒 LOCKED        ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

### Upgrade Prompt Modal
```
┌────────────────────────────────────────┐
│                                        │
│              🔒                        │
│                                        │
│  Unlock "John Wick 4"                  │
│                                        │
│  This content requires the             │
│  Premium Movies package.               │
│                                        │
│  [Maybe Later]  [Upgrade Now]          │
│                                        │
└────────────────────────────────────────┘
```

---

## 🔄 User Journey Flow

### New User Setup
```
1. Login
   ↓
2. Navigate to "Package" tab
   ↓
3. Select desired categories
   ↓
4. Save package (35K GNF/month)
   ↓
5. Go to Account → DASH Wallet
   ↓
6. Click "Top Up"
   ↓
7. Send 100K GNF via mobile money
   ↓
8. Admin confirms → Balance updated
   ↓
9. Browse and watch unlocked content
```

### Monthly Renewal
```
1. System checks user's package cost (35K)
   ↓
2. Deducts from wallet balance
   ↓
3. New balance: 100K → 65K
   ↓
4. User continues watching
   ↓
5. Low balance warning at <50K
   ↓
6. User tops up again
```

### Package Modification
```
1. User goes to "Package" tab
   ↓
2. Current selections are pre-checked
   ↓
3. Add/remove categories
   ↓
4. New total calculates live
   ↓
5. Save → New cost takes effect next month
```

---

## 📊 Category-to-Content Mapping (Future)

```javascript
// Example content categorization
const contentCategories = {
  'sports': ['SuperSport', 'ESPN', 'Sky Sports'],
  'french': ['French movies', 'French series', 'France 24'],
  'nollywood': ['African movies', 'Nigerian series'],
  'kdrama': ['Korean dramas', 'K-series'],
  'kids': ['Cartoons', 'Kids movies'],
  'music': ['Music videos', 'Concerts'],
  'livetv': ['Basic live channels'],
  'premium': ['Latest releases', 'Blockbusters']
}

// Check access
if (!hasPackageAccess('sports')) {
  // Show lock icon
  // On click: showUpgradePrompt('Premier League', 'Sports')
}
```

---

## 🎨 Design System

### Colors
- **Primary Purple**: `#9D4EDD` - Package cards, buttons
- **Accent Green**: `#34D399` - Balance (good), success states
- **Warning Yellow**: `#F59E0B` - Balance (warning)
- **Error Red**: `#EF4444` - Balance (low), deductions
- **Cyan**: `#22D3EE` - Wallet icons, info

### Typography
- **Package Title**: 1.25rem, bold
- **Price**: 1.5rem, extra bold, gradient
- **Balance**: 3rem, extra bold, colored
- **Description**: 0.875rem, secondary color

### Animations
- **Checkmark**: Scale from 0 to 1 (0.3s ease)
- **Card Hover**: Translate Y -4px (0.3s)
- **Modal**: Fade in + Slide up (0.3s)

---

## 🚀 Deployment Checklist

### Backend
- [x] Routes registered in index.js
- [x] Data files created
- [x] No environment variables needed
- [ ] Deploy to Railway
- [ ] Test endpoints with test-north-star.sh

### Frontend
- [x] Package Builder page complete
- [x] Wallet section on Account page
- [x] CSS styles added
- [x] Navigation updated
- [ ] Deploy to Vercel
- [ ] Test on mobile devices

### Admin Setup
- [ ] Create script for monthly deductions
- [ ] Set up top-up confirmation workflow
- [ ] Monitor wallet balances
- [ ] Track popular package combinations

---

**Visual Guide Created**: December 6, 2025
**Status**: COMPLETE
