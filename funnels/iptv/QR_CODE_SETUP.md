# 📱 QR CODE SETUP GUIDE - DASH TV+

Quick guide to generate QR codes for easy customer distribution.

---

## 🎯 QR CODES YOU NEED

### 1. APK Download QR Code
**Purpose:** Customer scans to download DASH TV+ APK
**URL:** [Your APK download link - see hosting options below]
**Print:** On Quick Start Card, posters, flyers

### 2. WhatsApp Contact QR Code
**Purpose:** Customer scans to message support
**URL:** `https://wa.me/224611361300?text=Bonjour%20DASH%2C%20je%20veux%20essayer%20DASH%20TV%2B`
**Print:** On all customer materials

### 3. Landing Page QR Code
**Purpose:** Customer scans to see full info
**URL:** [Your deployed landing page URL]
**Print:** On business cards, outdoor advertising

---

## 🌐 FREE QR CODE GENERATORS

### Recommended: QR Code Generator
**URL:** https://www.qr-code-generator.com/

**Steps:**
1. Go to https://www.qr-code-generator.com/
2. Select "URL" type
3. Enter your URL
4. Customize:
   - Frame: "Scan Me" or custom text
   - Colors: Purple (#667eea) to match DASH branding
   - Logo: Upload DASH TV+ logo (optional)
5. Download as PNG (high resolution)
6. Use in print materials

### Alternative Generators
- **QR Tiger:** https://www.qrcode-tiger.com/ (advanced features)
- **QR Stuff:** https://www.qrstuff.com/ (simple, fast)
- **Canva QR:** https://www.canva.com/qr-code-generator/ (design integration)

---

## 📦 APK HOSTING OPTIONS

You need a public URL for your APK before creating the QR code.

### Option 1: GitHub Releases (Recommended)

**Pros:** Free, reliable, version control
**Cons:** Requires GitHub account

**Steps:**
```bash
# 1. Build APK
cd dash-tv-plus-android
./build-apk.sh

# 2. Go to GitHub repo: https://github.com/dashguinee/ZION

# 3. Click "Releases" → "Create new release"

# 4. Tag: v1.0.0
#    Title: DASH TV+ v1.0.0
#    Description: First production release

# 5. Attach: app/build/outputs/apk/debug/app-debug.apk
#    OR: app/build/outputs/apk/release/app-release.apk

# 6. Publish release

# 7. Copy download URL (looks like):
#    https://github.com/dashguinee/ZION/releases/download/v1.0.0/dash-tv-plus.apk
```

### Option 2: Google Drive

**Pros:** Simple, familiar
**Cons:** Requires Google account, sharing permissions

**Steps:**
1. Upload APK to Google Drive
2. Right-click → Get link
3. Change to "Anyone with the link can view"
4. Copy link
5. **Important:** Use direct download link format:
   - Original: `https://drive.google.com/file/d/FILE_ID/view`
   - Direct: `https://drive.google.com/uc?export=download&id=FILE_ID`

### Option 3: Dropbox

**Pros:** Easy sharing
**Cons:** Free plan limits

**Steps:**
1. Upload APK to Dropbox
2. Right-click → Share → Create link
3. Copy link
4. Change `?dl=0` to `?dl=1` (forces download)

### Option 4: Your Own Website

**Pros:** Full control, branding
**Cons:** Requires web hosting

**Steps:**
1. Upload APK to: `https://yourdomain.com/downloads/dash-tv-plus.apk`
2. Make sure file is publicly accessible
3. Use this URL for QR code

---

## 🖨️ PRINT MATERIALS WITH QR CODES

### Quick Start Card (A5 Size)

**Layout:**
```
┌─────────────────────────────────────┐
│   📺 DASH TV+                       │
│   Entertainment Sans Limites        │
│                                     │
│   3 ÉTAPES SIMPLES:                 │
│   1. Scannez le QR code             │
│   2. Installez l'application        │
│   3. Connectez-vous                 │
│                                     │
│   ┌─────────┐  ┌─────────┐        │
│   │ APK QR  │  │ WhatsApp│        │
│   │ Code    │  │ QR Code │        │
│   └─────────┘  └─────────┘        │
│                                     │
│   Support: +224 611 361 300        │
└─────────────────────────────────────┘
```

**File to Edit:** `dash-tv-plus-android/docs/QUICK_START_CARD_FR.md`

**Update Section:**
```markdown
## 📲 Télécharger l'APK

**Option 1: Scanner le QR Code**
[Paste generated QR code image here]

**Option 2: WhatsApp**
[Paste WhatsApp QR code here]
```

### Business Card (Standard Size)

**Front:**
```
┌─────────────────────────┐
│   DASH TV+             │
│   10,000+ Chaînes      │
│   ┌─────────┐          │
│   │ QR Code │          │
│   │ (WhatsApp)│        │
│   └─────────┘          │
│   Essai Gratuit 24H    │
└─────────────────────────┘
```

**Back:**
```
┌─────────────────────────┐
│   DASH Entertainment    │
│   Services              │
│                         │
│   📞 +224 611 361 300   │
│   📺 10,000+ Chaînes    │
│   🎬 60,000+ Films      │
│   ⚡ Essai Gratuit      │
└─────────────────────────┘
```

### Poster (A3 Size)

**Headline:** "REGARDEZ 10,000+ CHAÎNES SUR VOTRE TÉLÉPHONE"

**Body:**
- Feature list
- Pricing
- Large APK download QR code
- WhatsApp contact QR code

**Call-to-Action:** "SCANNEZ POUR TÉLÉCHARGER"

---

## 📐 QR CODE SPECIFICATIONS

### For Print Materials

**Minimum Size:**
- Business cards: 1.5cm × 1.5cm
- Flyers: 3cm × 3cm
- Posters: 5cm × 5cm

**Resolution:**
- 300 DPI for print
- PNG or SVG format

**Colors:**
- Black QR on white background (best scanning)
- OR: Purple (#667eea) on white (brand match)
- **Avoid:** White QR on dark background (poor scanning)

**Testing:**
- Print test copy
- Scan with 3+ different phones
- Verify URL opens correctly

### For Digital/WhatsApp

**Format:** PNG
**Size:** 500px × 500px minimum
**File size:** < 100 KB (WhatsApp compression)

---

## 🧪 QR CODE TESTING CHECKLIST

Before mass printing:

- [ ] QR code scans successfully on iPhone
- [ ] QR code scans successfully on Android
- [ ] URL opens immediately (no redirects)
- [ ] APK download starts automatically
- [ ] WhatsApp QR opens chat with pre-filled message
- [ ] Landing page QR loads mobile-responsive page
- [ ] QR codes print clearly (not pixelated)
- [ ] QR codes work from 30cm distance
- [ ] QR codes work under normal lighting
- [ ] Backup URL written below QR (if scan fails)

---

## 💡 USAGE TIPS

### Placement Ideas

**High-Impact Locations:**
- Quick Start Card (given to every customer)
- Installation Guide PDF (page 1)
- WhatsApp profile picture (QR in bio)
- Shop window (if you have physical location)
- Community bulletin boards
- Partner shops (electronics, phone repair)

**Digital Distribution:**
- WhatsApp Status (image with QR)
- Facebook posts
- Instagram bio link
- Email signature

### Customer Instructions

**In French:**
> "📱 **Pour télécharger DASH TV+:**
> 1. Ouvrez l'appareil photo de votre téléphone
> 2. Pointez vers ce QR code
> 3. Appuyez sur la notification qui apparaît
> 4. Le téléchargement commence automatiquement"

---

## 📊 TRACKING QR CODE USAGE (Optional)

### URL Shorteners with Analytics

**Bitly (Free):**
- Shorten your APK/landing page URLs
- Get QR code automatically
- Track scans, locations, devices

**Steps:**
1. Go to https://bitly.com/
2. Create account (free)
3. Paste your long URL
4. Get shortened URL (e.g., `bit.ly/dash-tv-plus-apk`)
5. Download QR code
6. View analytics dashboard

**What You Track:**
- Total scans
- Scans per day/week
- Device types (iPhone vs Android)
- Locations (if GPS enabled)
- Referral sources

---

## 🎨 BRANDED QR CODE EXAMPLES

### Basic (Black & White)
- Simple, high contrast
- Best for scanning
- Use for: Quick Start Cards, flyers

### Branded (Purple Gradient)
- Purple corners (#667eea)
- White background
- DASH TV+ logo in center
- Use for: Business cards, posters

### Framed (With Text)
- QR code + "SCAN ME" frame
- Call-to-action below
- Branded colors
- Use for: Outdoor ads, shop displays

---

## 📱 RECOMMENDED QR CODE LAYOUT

**Customer Handout (A5 Card):**

```
Front Side:
- DASH TV+ Logo
- "Téléchargez l'Application Officielle"
- Large APK Download QR (4cm × 4cm)
- "Scannez pour télécharger"

Back Side:
- "Besoin d'Aide?"
- WhatsApp Contact QR (3cm × 3cm)
- +224 611 361 300
- "Support 7j/7"
```

**Print 50-100 copies** for first launch

---

## ✅ QUICK SETUP SUMMARY

**5-Minute Setup:**

1. **Build APK** → `./build-apk.sh`
2. **Upload to GitHub Releases** or Google Drive
3. **Copy download URL**
4. **Generate QR at** https://www.qr-code-generator.com/
5. **Download PNG**
6. **Add to Quick Start Card**
7. **Print 10 test copies**
8. **Scan with your phone** (verify it works)
9. **Print 50-100 copies** for distribution
10. **Start sharing!**

---

**QR codes make DASH TV+ installation effortless for customers!** 📱✨
