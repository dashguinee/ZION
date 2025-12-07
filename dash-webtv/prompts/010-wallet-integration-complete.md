# Meta-Prompt: Complete Wallet Top-Up Integration

## Context
You are completing the DASH Wallet integration. The audit found that the top-up flow shows payment instructions but NEVER creates a pending transaction in the backend. This is CRITICAL for business operations.

## Project Location
- Frontend: `/home/dash/zion-github/dash-webtv/`
- Backend: `/home/dash/zion-github/dash-streaming-server/`

## Critical Issue

### Current Broken Flow:
1. User clicks "Top Up" ✅
2. User sees payment instructions ✅
3. User sends mobile money ✅
4. **NO TRANSACTION RECORDED** ❌
5. Admin has no idea payment was made ❌
6. User never gets credit ❌

### Required Fixed Flow:
1. User clicks "Top Up"
2. User enters amount
3. User sees payment instructions
4. User clicks "I've Sent Payment"
5. **POST /api/wallet/:username/topup** with `adminConfirmed: false`
6. Transaction created as "pending"
7. Admin sees pending transactions
8. Admin confirms → user gets credit
9. User notified of successful top-up

## Implementation Tasks

### 1. Frontend - Add Amount Input
**File:** `/home/dash/zion-github/dash-webtv/js/app.js`
**Location:** Around line 6027-6070 (top-up modal)

**Current Code Problem:**
```javascript
// Shows modal but no amount input
// No API call made
```

**Add:**
```javascript
// Amount input field
<input type="number" id="topup-amount" placeholder="Enter amount (GNF)" min="10000" step="10000">

// Preset amounts
<button onclick="setAmount(40000)">40,000 GNF</button>
<button onclick="setAmount(80000)">80,000 GNF</button>
<button onclick="setAmount(100000)">100,000 GNF</button>
```

### 2. Frontend - Create Transaction on Confirmation
**File:** `/home/dash/zion-github/dash-webtv/js/app.js`

**Add function:**
```javascript
async confirmTopUpPayment() {
  const username = localStorage.getItem('dash_user')
  const amount = parseInt(document.getElementById('topup-amount').value)

  if (!amount || amount < 10000) {
    this.showToast('Please enter a valid amount (minimum 10,000 GNF)', 'error')
    return
  }

  try {
    const response = await fetch(`${this.backendUrl}/api/wallet/${username}/topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amount,
        paymentMethod: 'mobile_money',
        adminConfirmed: false,
        timestamp: new Date().toISOString()
      })
    })

    if (response.ok) {
      this.showToast('Payment recorded! Awaiting admin confirmation.', 'success')
      this.closeTopUpModal()
      this.refreshWalletBalance()
    } else {
      throw new Error('Failed to record payment')
    }
  } catch (error) {
    this.showToast('Error recording payment. Please contact support.', 'error')
    console.error('Top-up error:', error)
  }
}
```

### 3. Backend - Verify Top-Up Endpoint
**File:** `/home/dash/zion-github/dash-streaming-server/src/routes/wallet.js`

**Verify endpoint exists and works:**
- POST `/api/wallet/:username/topup`
- Should create pending transaction
- Should NOT add to balance yet
- Should notify admin (optional)

### 4. Frontend - Show Pending Transactions
**File:** `/home/dash/zion-github/dash-webtv/js/app.js`

**In wallet display, show:**
```javascript
// Pending top-ups section
<div class="pending-topups">
  <h4>Pending Transactions</h4>
  <div class="pending-item">
    <span>+80,000 GNF</span>
    <span class="status pending">Awaiting confirmation</span>
    <span class="date">Dec 7, 2025</span>
  </div>
</div>
```

### 5. Update Top-Up Modal UI
**Create new modal structure:**
```html
<div class="topup-modal">
  <h2>Top Up DASH Wallet</h2>

  <!-- Step 1: Amount -->
  <div class="step" id="step-amount">
    <h3>Select Amount</h3>
    <div class="preset-amounts">
      <button>40,000 GNF</button>
      <button>80,000 GNF</button>
      <button>100,000 GNF</button>
    </div>
    <input type="number" placeholder="Or enter custom amount">
    <button onclick="showPaymentInstructions()">Continue</button>
  </div>

  <!-- Step 2: Payment -->
  <div class="step hidden" id="step-payment">
    <h3>Payment Instructions</h3>
    <p>Send <strong>80,000 GNF</strong> to:</p>
    <div class="payment-number">611361300</div>
    <p>Orange Money / MTN Mobile Money</p>
    <button onclick="confirmTopUpPayment()">I've Sent Payment</button>
  </div>

  <!-- Step 3: Confirmation -->
  <div class="step hidden" id="step-confirmed">
    <h3>Payment Recorded!</h3>
    <p>Your payment of 80,000 GNF has been recorded.</p>
    <p>Admin will confirm within 24 hours.</p>
    <button onclick="closeModal()">Done</button>
  </div>
</div>
```

### 6. Add Transaction History Display
**In wallet section:**
```javascript
async loadTransactionHistory() {
  const username = localStorage.getItem('dash_user')
  const response = await fetch(`${this.backendUrl}/api/wallet/${username}/history`)
  const history = await response.json()

  // Separate pending from confirmed
  const pending = history.filter(t => !t.adminConfirmed)
  const confirmed = history.filter(t => t.adminConfirmed)

  // Render both sections
  this.renderPendingTransactions(pending)
  this.renderTransactionHistory(confirmed)
}
```

## Verification Steps
1. Open app, navigate to Wallet
2. Click "Top Up"
3. Enter amount 40,000 GNF
4. Click "Continue"
5. See payment instructions
6. Click "I've Sent Payment"
7. Verify toast shows "Payment recorded"
8. Verify transaction appears in history as "Pending"
9. Check backend wallets.json for new transaction
10. Use admin endpoint to confirm transaction
11. Verify balance increases after confirmation

## Output
Return:
- Modified files list
- New functions added
- UI changes made
- Backend verification results
- Test flow results
