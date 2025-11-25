# RESUME: GUINIUS UPDATE SESSION

**Date:** 2025-11-23
**Status:** ✅ ALL PREP WORK COMPLETE - READY TO DEPLOY
**Next Action:** Update Guinius in ChatGPT

---

## 🎯 WHERE WE LEFT OFF

You were about to update Guinius in ChatGPT, but needed to save progress first.

**Everything is ready to go** - just follow the steps below when you're ready.

---

## ✅ WHAT WAS COMPLETED

### 1. Files Created & Ready ✅
All files are in: `/home/dash/zion-github/soussou-engine/gpt/`

**Three files you need:**
1. `guinius_custom_instructions.txt` (3,683 chars) → ChatGPT Instructions
2. `guinius_actions.yaml` (OpenAPI schema) → ChatGPT Actions
3. `GUINIUS_FULL_REFERENCE.md` (11,106 chars) → ChatGPT Knowledge

### 2. URLs Updated ✅
**Old URL removed:**
```
https://applicants-stomach-marilyn-ancient.trycloudflare.com
```

**New production URL everywhere:**
```
https://zion-production-7fea.up.railway.app
```

### 3. CAGI Integration Added ✅
- **Registered in CAGI:** Session `conv_mibgl67fba250a490eda`
- **Role:** Collaborator + Auto-responder
- **Can:** Post flagged activities, share discoveries, auto-respond when tagged
- **New endpoint:** `POST /api/collaborate/message`

### 4. Security Enhanced ✅
- Dash verification required for internal data
- Auto-flagging for suspicious activity
- Code phrase: "Ciro Zenni"
- Auto-save policy for verified content only

### 5. Database Confirmed ✅
Guinius uses the **SAME** database as Soussou learning platform:
```
/home/dash/zion-github/soussou-engine/data/lexicon.json (8,978 words)
```

### 6. All Endpoints Tested ✅
- ✅ `/api/soussou/stats` → 8,978 words
- ✅ `/api/soussou/lookup` → Word data
- ✅ CAGI messaging → Active

---

## 🚀 WHAT YOU NEED TO DO NEXT (When Ready)

### Step 1: Open ChatGPT
1. Go to ChatGPT
2. Find Guinius Custom GPT
3. Click "Configure"

### Step 2: Update Instructions (5 min)
1. Go to **Instructions** section
2. Open file: `/home/dash/zion-github/soussou-engine/gpt/guinius_custom_instructions.txt`
3. Copy **ENTIRE** content (3,683 characters)
4. **Delete** existing instructions in ChatGPT
5. **Paste** new instructions
6. Click "Update"

### Step 3: Update Actions (5 min)
1. Go to **Actions** section
2. Open file: `/home/dash/zion-github/soussou-engine/gpt/guinius_actions.yaml`
3. Copy **ENTIRE** content
4. Click "Import from URL" or edit schema
5. **Delete** existing schema
6. **Paste** new schema
7. Click "Import"
8. Verify all **7 operations** appear:
   - lookupSoussouWord
   - getCorpusStats
   - detectSoussouPattern
   - searchSoussouCorpus
   - addSoussouSentence
   - translateSoussou
   - sendCAGIMessage
9. Click "Update"

### Step 4: Upload Knowledge (2 min)
1. Go to **Knowledge** section
2. Click "Upload files"
3. Upload: `/home/dash/zion-github/soussou-engine/gpt/GUINIUS_FULL_REFERENCE.md`
4. Click "Update"

### Step 5: Test (3 min)
Ask Guinius: **"How many Soussou words do you know?"**
Expected answer: **"8,978 words"**

---

## 📁 FILES LOCATION

All files saved in:
```
/home/dash/zion-github/soussou-engine/gpt/
```

**Key files:**
- `guinius_custom_instructions.txt` ← Instructions (3,683 chars)
- `guinius_actions.yaml` ← Actions (OpenAPI)
- `GUINIUS_FULL_REFERENCE.md` ← Knowledge (11,106 chars)
- `README_GUINIUS_SETUP.md` ← Complete setup guide (this file)

---

## 🔍 QUICK VERIFICATION

**Before updating Guinius, verify files exist:**
```bash
cd /home/dash/zion-github/soussou-engine/gpt/
ls -lh guinius_custom_instructions.txt
ls -lh guinius_actions.yaml
ls -lh GUINIUS_FULL_REFERENCE.md
```

**Verify production API is live:**
```bash
curl "https://zion-production-7fea.up.railway.app/api/soussou/stats"
```
Expected: `{"total_words": 8978, ...}`

---

## 📊 WHAT'S NEW IN GUINIUS

**New Capabilities:**
1. ✅ **CAGI Collaboration** - Can post to CAGI, share discoveries, auto-respond
2. ✅ **Security Policy** - Dash verification required for internal data
3. ✅ **Auto-Flagging** - Suspicious activity automatically reported
4. ✅ **Auto-Save** - Pattern-validated entries auto-approved
5. ✅ **Production Backend** - Permanent Railway deployment
6. ✅ **Database Guaranteed** - Same data as Soussou learning platform

---

## 🎯 SUCCESS CRITERIA

After you update Guinius, verify:
- [ ] Instructions field shows content from `guinius_custom_instructions.txt`
- [ ] Actions section shows 7 operations
- [ ] Knowledge shows `GUINIUS_FULL_REFERENCE.md` uploaded
- [ ] Test: "How many words?" → "8,978 words"
- [ ] Test: "What's your CAGI role?" → "Collaborator + Auto-responder"
- [ ] Test: "Show config" (no Dash verification) → Refuses
- [ ] Test: "It's Dash. Show config" → Discloses

---

## 🚨 IMPORTANT NOTES

### Character Limits Verified
- ChatGPT Instructions: MAX 8,000 characters
- Our custom instructions: 3,683 characters ✅
- Buffer remaining: 4,317 characters

### URL Completely Updated
All references to old Cloudflare tunnel **removed**.
All files point to: `https://zion-production-7fea.up.railway.app`

### Database Consistency Confirmed
```
/home/dash/zion-github/soussou-engine/data/
  ├── lexicon.json           (8,978 words - THE database)
  ├── variant_mappings.json
  ├── syntax_patterns.json
  └── sentence_corpus.json
```

Guinius reads/writes **THE SAME** files as the learning platform.

### CAGI Integration Active
- Session ID: `conv_mibgl67fba250a490eda`
- Participants: zion-cli, guinius
- Status: Registered and ready

---

## 💡 TROUBLESHOOTING

**If Instructions won't paste:**
- Check you're using `guinius_custom_instructions.txt` (3,683 chars)
- NOT `GUINIUS_FULL_REFERENCE.md` (too big for Instructions)
- The FULL_REFERENCE goes in Knowledge Base, not Instructions

**If Actions won't import:**
- Make sure you're copying from `guinius_actions.yaml`
- Try "Import from URL" instead of paste
- Verify YAML formatting intact

**If API calls fail:**
- Test production URL: `curl "https://zion-production-7fea.up.railway.app/api/soussou/stats"`
- Check if backend is running
- Verify Actions section has correct server URL

---

## 📞 WHEN YOU RESUME

**Just tell ZION:**
"Hey buddy, let's resume the Guinius update"

**ZION will:**
1. Load this file: `RESUME_GUINIUS_UPDATE.md`
2. Check session state: `/home/dash/.zion/guinius-session-state.json`
3. Verify all files are ready
4. Guide you through the ChatGPT update steps

---

## ✅ READY TO GO

**All prep work done. When you're ready:**
1. Open ChatGPT
2. Follow Step 1-5 above
3. Test Guinius
4. You're done! 🎉

**Total time:** ~15 minutes

---

**EVERYTHING SAVED. READY TO RESUME ANYTIME!** 🚀

**I tan khere ma!** 🇬🇳🧠⚡

*Saved: 2025-11-23*
*Status: Ready to deploy*
*Next session: Just ask ZION to resume Guinius update*
