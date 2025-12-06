# Meta-Prompt: Business Logic Implementation for DASH WebTV

## Context
You are completing the business logic for DASH WebTV's "Pay For What You Watch" model. The frontend helpers exist but are NOT wired to the backend. Critical gaps exist in billing automation and content gating.

## Project Location
- Frontend: `/home/dash/zion-github/dash-webtv/`
- Backend: `/home/dash/zion-github/dash-streaming-server/`

## Current State
- Package Builder UI: 90% complete (frontend saves to localStorage only)
- Wallet System: 85% complete (balance display works, no auto-deduction)
- Content Gating: 60% complete (frontend checks only, bypassable)
- User Tiers: Defined but not enforced

## Tasks

### 1. Create Package-to-Tier Mapping (CRITICAL)
**File**: `/home/dash/zion-github/dash-streaming-server/src/routes/packages.js`
**Issue**: Package Builder and Tier system don't communicate
**Fix**:
```javascript
// Map packages to tiers based on total price/categories selected
const TIER_THRESHOLDS = {
  BASIC: { maxCategories: 2, maxPrice: 10000 },
  STANDARD: { maxCategories: 5, maxPrice: 25000 },
  PREMIUM: { maxCategories: 8, maxPrice: Infinity }
};

function determineTier(package) {
  const categoryCount = package.categories.length;
  if (categoryCount <= 2) return 'BASIC';
  if (categoryCount <= 5) return 'STANDARD';
  return 'PREMIUM';
}
```
- When user creates package, calculate their tier
- Store tier with user record
- Return tier in package creation response

### 2. Implement Monthly Billing Automation (CRITICAL)
**New File**: `/home/dash/zion-github/dash-streaming-server/src/services/scheduler.service.js`
**Issue**: Wallet deduction endpoint exists but is NEVER called
**Fix**:
- Create scheduler that runs daily at midnight
- For each user with active package:
  - Check if billing date matches today
  - If yes, call wallet deduction endpoint internally
  - If insufficient balance, set user status to 'suspended'
  - Send notification (log for now)
- Add endpoint to manually trigger billing: `POST /api/admin/run-billing`

### 3. Add Backend Content Gating (CRITICAL)
**Files**:
- `/home/dash/zion-github/dash-streaming-server/src/routes/iptv-access.js`
- `/home/dash/zion-github/dash-streaming-server/src/routes/stream.js`
**Issue**: Content gating is frontend-only, user can bypass by clearing localStorage
**Fix**:
- Before serving any stream, validate:
  1. User has active session
  2. User has package that includes this content category
  3. User wallet has positive balance OR not yet billing date
- Return 403 with upgrade prompt if check fails:
```javascript
res.status(403).json({
  error: 'UPGRADE_REQUIRED',
  message: 'Your package does not include this content',
  requiredCategory: categoryId,
  upgradeUrl: '/packages'
});
```

### 4. Complete Top-up Confirmation Flow
**File**: `/home/dash/zion-github/dash-streaming-server/src/routes/wallet.js`
**Issue**: No way to confirm payments after user pays
**Fix**:
- Add endpoint: `POST /api/wallet/confirm-topup`
  - Takes: { userId, transactionId, amount, paymentMethod }
  - Admin must confirm (requireAdmin middleware)
  - Updates user wallet balance
  - Creates transaction record with 'confirmed' status
- Add endpoint: `GET /api/wallet/pending-topups` for admin to see pending

### 5. Unify User Systems
**Issue**: Two user systems active (iptv-users.json vs packages.json users)
**Fix**:
- Create single user service that manages:
  - Authentication
  - Package selection
  - Wallet balance
  - Streaming access
- Migrate data from both files to unified users.json
- Update all routes to use unified user service

## Data Files to Initialize
Create these with proper structure:
- `/home/dash/zion-github/dash-streaming-server/data/users.json`
- `/home/dash/zion-github/dash-streaming-server/data/packages.json`
- `/home/dash/zion-github/dash-streaming-server/data/wallets.json`
- `/home/dash/zion-github/dash-streaming-server/data/transactions.json`

## Implementation Order
1. Create unified user service
2. Add package-tier mapping
3. Add backend content gating middleware
4. Add billing scheduler
5. Add top-up confirmation flow
6. Test full flow: register → select package → check access → billing

## Success Criteria
- [ ] User cannot stream content not in their package (backend enforced)
- [ ] Billing runs automatically and deducts from wallet
- [ ] Suspended users cannot stream
- [ ] Admin can confirm top-ups
- [ ] Single source of truth for user data

## Frontend Integration Points
After backend complete, frontend needs to:
- Call `/api/packages/create` when user builds package (instead of localStorage)
- Display tier badge from API response
- Handle 403 responses with upgrade modal
- Show billing date and next charge amount

## DO NOT
- Do not change the package builder UI
- Do not modify wallet display logic
- Do not touch video player
- Do not add payment gateway integration yet (manual confirmation)

## Output
When complete, provide:
1. New endpoints created with request/response examples
2. Data file schemas
3. Test commands (curl) for each flow
4. List of frontend integration points needed
