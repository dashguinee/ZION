# 🚀 IPTV Landing Pages - Deployment Instructions

## Live URLs (After GitHub Pages Enabled)

Your landing pages will be available at:

**Base URL:** `https://dashguinee.github.io/ZION/funnels/iptv/`

**Individual Pages:**
1. **Hub:** https://dashguinee.github.io/ZION/funnels/iptv/index.html
2. **Main Landing:** https://dashguinee.github.io/ZION/funnels/iptv/iptv-landing-page.html
3. **App Download:** https://dashguinee.github.io/ZION/funnels/iptv/dash-tv-plus-download.html
4. **Comparison:** https://dashguinee.github.io/ZION/funnels/iptv/iptv-vs-cable.html
5. **FAQ:** https://dashguinee.github.io/ZION/funnels/iptv/iptv-faq.html

---

## ⚡ Quick Deploy to GitHub Pages

### Step 1: Enable GitHub Pages
1. Go to: https://github.com/dashguinee/ZION
2. Click: Settings (top menu)
3. Click: Pages (left sidebar)
4. Under "Source":
   - Select: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/ (root)**
5. Click: **Save**
6. Wait 2-3 minutes for deployment

### Step 2: Verify Deployment
Visit: https://dashguinee.github.io/ZION/funnels/iptv/

If you see the landing page, you're live! 🎉

---

## 📱 Update APK Download Link

After uploading APK to GitHub Releases, update this file:

**File:** `dash-tv-plus-download.html`
**Line:** ~250 (search for "YOUR_APK_DOWNLOAD_URL")
**Replace with:** Your actual GitHub release download URL

Example:
```html
<a href="https://github.com/dashguinee/ZION/releases/download/v1.0.0/dash-tv-plus.apk"
   class="download-btn">
    📥 Télécharger DASH TV+ APK
</a>
```

---

## 🔗 Custom Domain (Optional)

Want to use your own domain like `iptv.dash.gn`?

### Step 1: Add CNAME File
Create file: `funnels/iptv/CNAME`
Content: `iptv.yourdomain.com`

### Step 2: Configure DNS
At your domain registrar, add:
```
Type: CNAME
Name: iptv
Value: dashguinee.github.io
```

### Step 3: Update GitHub Pages
Settings → Pages → Custom domain → Enter `iptv.yourdomain.com` → Save

Wait 10-15 minutes for DNS propagation.

---

## 📊 Track Visitors (Optional)

### Add Google Analytics

**File:** All HTML files
**Location:** Before `</head>` tag

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Replace `G-XXXXXXXXXX` with your Google Analytics ID.

---

## 🎨 Customize Pages

### Update WhatsApp Number
**Current:** +224 611 361 300
**Change in:** All 5 HTML files
**Search for:** `224611361300`
**Replace with:** Your number (format: country code + number, no spaces)

### Update Pricing
**File:** All pages with pricing
**Search for:** `15,000 GNF`, `40,000 GNF`, etc.
**Update:** To your actual prices

### Update Social Proof
**File:** `iptv-landing-page.html`, `iptv-vs-cable.html`
**Search for:** "50+ Clients Satisfaits"
**Update:** When you reach milestones (100+, 200+, etc.)

---

## 🧪 Test Checklist

Before announcing to customers:

- [ ] All pages load correctly
- [ ] WhatsApp links work (test on phone)
- [ ] Forms redirect to WhatsApp properly
- [ ] Images/logos display (if you added any)
- [ ] Mobile responsive (test on phone browser)
- [ ] All links between pages work
- [ ] No broken links (404 errors)
- [ ] French text displays correctly (accents)
- [ ] Pricing is accurate
- [ ] Contact info is correct

---

## 📢 Share Your Pages

**WhatsApp Status:**
```
🎉 DASH TV+ est maintenant disponible!

✓ 10,000+ chaînes TV
✓ Application professionnelle
✓ Essai gratuit 24h

Visitez: [Your GitHub Pages URL]
```

**WhatsApp Groups:**
```
Bonjour à tous! 👋

Je vous présente DASH TV+, notre nouvelle plateforme IPTV premium pour la Guinée.

🌟 Application mobile professionnelle
📺 10,000+ chaînes en direct
🎬 60,000+ films et séries
💰 À partir de 15,000 GNF/mois

Essai gratuit 24h disponible!

Plus d'infos: [Your URL]
Contact: +224 611 361 300
```

**Facebook Post:**
Share link with image (use MEDIA_KIT.md specs to create graphic)

---

## 🔄 Update Pages

When you make changes:

1. Edit HTML files locally
2. Commit changes:
   ```bash
   git add funnels/iptv/*.html
   git commit -m "Update IPTV landing pages"
   git push
   ```
3. GitHub Pages auto-updates in 1-2 minutes

---

## 🆘 Troubleshooting

**Pages not loading?**
- Wait 5 minutes after enabling GitHub Pages
- Check Settings → Pages shows green "Your site is live"
- Try incognito/private browsing mode

**WhatsApp links not working?**
- Verify number format: `https://wa.me/224611361300` (no spaces, no +)
- Test on actual phone, not desktop browser

**APK download not working?**
- Verify APK is uploaded to GitHub Releases
- Download URL is correct in HTML
- File is publicly accessible

---

## 📊 Metrics to Track

Use GitHub Pages + Analytics to track:
- Page views per day
- Most visited pages
- WhatsApp conversion rate
- Geographic locations (Guinea, diaspora)
- Device types (mobile vs desktop)
- Referral sources

---

**Your landing pages are ready!**
**Just enable GitHub Pages and you're live in 3 minutes.** 🚀
