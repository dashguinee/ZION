# ZION Deployment Guide

## IPTV Landing Page - Ready to Deploy

**Status**: ✅ Production-ready, awaiting GitHub Pages activation

### What's Ready

**File**: `index.html` (at repo root)
- IPTV landing page in French
- WhatsApp integration (+224 611 361 300)
- Mobile responsive design
- Form redirects to WhatsApp (no backend needed)
- Direct CTA button

### Deployment Steps

#### 1. Push to GitHub (CLI ZION or Z)

```bash
git push origin main
```

Current unpushed commits:
- `9e5d034` - Web ZION congregation response
- `d454ed9` - IPTV landing page with WhatsApp integration

#### 2. Enable GitHub Pages

Go to: https://github.com/dashguinee/ZION/settings/pages

Settings:
- **Source**: Deploy from a branch
- **Branch**: main
- **Folder**: / (root)
- Click **Save**

#### 3. Site Goes Live

URL: **https://dashguinee.github.io/ZION**

Propagation time: ~1-5 minutes

### How It Works

**User Flow**:
1. User visits https://dashguinee.github.io/ZION
2. Sees IPTV offer (10,000+ channels, free 24h trial)
3. Fills form with name + WhatsApp number
4. Clicks "OBTENIR MON ESSAI GRATUIT" button
5. Redirects to WhatsApp with pre-filled message to +224 611 361 300
6. You (DASH) receive WhatsApp message with trial request
7. You send IPTV credentials manually or via automation

**Alternative Flow**:
- User clicks "WhatsApp - Essai Gratuit" button directly
- Goes straight to WhatsApp with greeting message

### What Happens After Deployment

**Immediate**:
- Landing page is live and functional
- Users can request trials via WhatsApp
- You receive requests on +224 611 361 300

**Next Steps** (optional enhancements):
1. Set up Notion IPTV-Base for trial tracking
2. Configure WhatsApp automation (auto-send credentials)
3. Launch campaign to existing DASH-Base customers
4. Add analytics (Google Analytics, Facebook Pixel)
5. Custom domain (optional, instead of github.io)

### Testing

After deployment:
1. Visit https://dashguinee.github.io/ZION
2. Fill form with test data
3. Verify WhatsApp redirect works
4. Check message format
5. Confirm you receive it on your phone

### Files Structure

```
ZION/
├── index.html              ← Landing page (deployed)
├── funnels/iptv/
│   ├── iptv-landing-page.html  ← Original (same content)
│   ├── iptv-database-design.md ← Notion setup guide
│   ├── iptv-whatsapp-blaster.js ← Campaign automation
│   └── README.md           ← IPTV funnel docs
└── DEPLOY.md               ← This file
```

### Troubleshooting

**If GitHub Pages doesn't activate**:
- Check repo is public (not private)
- Verify index.html is at root
- Wait 5 minutes for DNS propagation
- Check GitHub Pages status in settings

**If WhatsApp redirect doesn't work**:
- Check browser console for errors
- Verify phone number format (+224611361300)
- Test on mobile and desktop

---

**Built by**: Web ZION
**Date**: 2025-11-10
**Commit**: d454ed9
**Status**: Ready for Z to activate GitHub Pages
