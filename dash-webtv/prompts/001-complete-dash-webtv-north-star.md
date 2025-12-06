<objective>
Complete the DASH WebTV NORTH STAR features to transform it from a Netflix clone into a revolutionary "PAY FOR WHAT YOU WATCH" platform.

This is the final push to differentiate DASH from every other streaming platform. The vision: Replace Netflix + Spotify + Cable in one platform where users build custom packages and pay only for what they watch.

End goal: A production-ready platform where customers can:
1. Build their own subscription by selecting content categories (Sports, French, Nollywood, K-Drama, Kids, Music)
2. Pay via DASH Wallet (top-up balance, pay-as-you-go)
3. Never get chased for payments - they control their entertainment budget
</objective>

<context>
**Project State (Dec 6, 2025)**:
- Path: `/home/dash/zion-github/dash-webtv` (frontend) + `/home/dash/zion-github/dash-streaming-server` (backend)
- Content: 155,000+ items (74K playable + 81K free sources)
- Existing Features: Movies, Series, Live TV, French VOD, Free channels, User tiers, Health reporting
- Backend: Railway (https://zion-production-39d8.up.railway.app)
- Frontend: Vercel (https://dash-webtv.vercel.app)

**Tech Stack**:
- Frontend: Vanilla JS, CSS (no React in main app)
- Backend: Express.js, Node.js
- Auth: StarShare-based (existing)
- Storage: localStorage for user preferences

**Existing Code Patterns** (MUST follow):
- `dashApp` object pattern in app.js
- `render*Page()` functions for each view
- Modal patterns for overlays
- Toast notifications via `showToast()`
- API calls via `fetch()` to `this.backendUrl`

**Business Model**:
- Pricing: Category-based (Sports 20K, French 15K, Nollywood 15K, K-Drama 10K, Kids 10K, Music 10K GNF)
- Wallet: Minimum top-up 100,000 GNF
- Monthly deduction from wallet balance
- Currency: Guinean Francs (GNF), internal display as DMoney/DC
</context>

<requirements>
**FEATURE 1: Custom Package Builder UI**

1.1 New "Build Package" Page (nav tab or prominent button)
- Grid of content categories with icons and pricing
- Toggle selection for each category
- Running total display (updates live)
- Visual feedback when selected (highlight, checkmark)

1.2 Categories to offer:
- Sports (20,000 GNF) - Live sports, SuperSport, ESPN
- French (15,000 GNF) - French channels, movies, series
- Nollywood (15,000 GNF) - Nigerian/African movies and series
- K-Drama (10,000 GNF) - Korean dramas
- Kids (10,000 GNF) - Children's content
- Music/VOYO (10,000 GNF) - Music streaming
- Live TV Basic (10,000 GNF) - Basic live channels
- Premium Movies (15,000 GNF) - Latest releases

1.3 Package Summary:
- Show selected categories
- Total monthly cost
- "Confirm Package" button
- Save to user profile

1.4 Backend endpoints needed:
- `POST /api/packages/create` - Save user's custom package
- `GET /api/packages/:username` - Get user's package
- `PUT /api/packages/:username` - Update package
- `GET /api/packages/categories` - List available categories with pricing

**FEATURE 2: DASH Wallet System**

2.1 Wallet UI (Account page section or dedicated page)
- Current balance display (prominently)
- Top-up button → Payment instructions modal
- Transaction history (last 10 transactions)
- Auto-renewal status

2.2 Balance Display:
- Show in DMoney/DC format: "DC 250,000" or "250K DMoney"
- Color coding: Green (>100K), Yellow (50K-100K), Red (<50K)
- Warning when balance low

2.3 Top-up Flow:
- Show payment number: 611361300
- Show minimum: 100,000 GNF
- Instructions for Orange Money / MTN Mobile Money
- Reference format: DASH-{username}

2.4 Backend endpoints needed:
- `GET /api/wallet/:username` - Get balance and history
- `POST /api/wallet/:username/topup` - Record top-up (admin confirms)
- `POST /api/wallet/:username/deduct` - Monthly deduction
- `GET /api/wallet/:username/history` - Transaction log

2.5 Data model:
```javascript
// wallet entry
{
  username: string,
  balance: number, // in GNF
  lastTopup: Date,
  lastDeduction: Date,
  transactions: [
    { type: 'topup'|'deduction'|'refund', amount: number, date: Date, note: string }
  ],
  autoRenew: boolean
}
```

**FEATURE 3: Content Gating by Package**

3.1 Modify content display:
- Show lock icon on content user doesn't have access to
- "Upgrade to watch" prompt on locked content
- Smooth upgrade flow from locked content

3.2 Access check:
- Check user's package categories against content category
- Free content always accessible
- Graceful degradation for logged-out users
</requirements>

<implementation>
**Phase 1: Backend (do first)**
1. Create `/api/packages/*` endpoints in new file `src/routes/packages.js`
2. Create `/api/wallet/*` endpoints in new file `src/routes/wallet.js`
3. Create data files: `data/packages.json`, `data/wallets.json`
4. Add routes to `src/index.js`

**Phase 2: Frontend Package Builder**
1. Add `renderPackageBuilderPage()` to app.js
2. Create category grid with toggle selection
3. Implement live total calculation
4. Connect to backend for save/load

**Phase 3: Frontend Wallet**
1. Add wallet section to Account page (or new page)
2. Balance display with color coding
3. Top-up modal with payment instructions
4. Transaction history display

**Phase 4: Content Gating**
1. Add `hasPackageAccess(category)` method
2. Modify `renderContentCard()` to show lock icon
3. Add upgrade prompt modal

**Code Style Requirements**:
- Follow existing dashApp pattern
- Use existing CSS classes where possible
- New CSS in components.css or premium.css
- No external dependencies (vanilla JS only)
- Mobile-first responsive design
</implementation>

<output>
**Backend files to create/modify**:
- `./dash-streaming-server/src/routes/packages.js` - Package CRUD API
- `./dash-streaming-server/src/routes/wallet.js` - Wallet API
- `./dash-streaming-server/data/packages.json` - Package storage
- `./dash-streaming-server/data/wallets.json` - Wallet storage
- `./dash-streaming-server/src/index.js` - Add new routes

**Frontend files to modify**:
- `./dash-webtv/js/app.js` - Add renderPackageBuilderPage(), wallet UI, content gating
- `./dash-webtv/css/components.css` - Package builder styles
- `./dash-webtv/index.html` - Add nav item for Package Builder (optional)
</output>

<verification>
Before declaring complete, verify:

1. **Package Builder**:
   - [ ] Navigate to Package Builder page
   - [ ] Select/deselect categories - total updates
   - [ ] Save package - persists on refresh
   - [ ] Load existing package on return

2. **Wallet**:
   - [ ] Balance displays correctly
   - [ ] Top-up modal shows payment info
   - [ ] Transaction history populates
   - [ ] Low balance warning works

3. **Content Gating**:
   - [ ] Locked content shows lock icon
   - [ ] Clicking locked content shows upgrade prompt
   - [ ] Unlocked content plays normally

4. **Integration**:
   - [ ] Package + Wallet work together
   - [ ] User can build package, see cost, check wallet balance
   - [ ] Monthly cost matches package total
</verification>

<success_criteria>
1. User can build a custom package by selecting categories
2. User can see their wallet balance and top-up instructions
3. Content is gated based on user's package
4. All data persists correctly
5. UI matches existing DASH premium design aesthetic
6. Mobile responsive
7. No console errors
8. Backend returns proper JSON responses
</success_criteria>
