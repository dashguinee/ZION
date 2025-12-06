import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const WALLETS_FILE = path.join(__dirname, '../../data/wallets.json');

// Initialize wallets file if it doesn't exist
async function initWalletsFile() {
  try {
    await fs.access(WALLETS_FILE);
  } catch {
    await fs.writeFile(WALLETS_FILE, JSON.stringify([], null, 2));
    logger.info('Created wallets.json file');
  }
}

// Read wallets from file
async function readWallets() {
  try {
    const data = await fs.readFile(WALLETS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('Error reading wallets:', error);
    return [];
  }
}

// Write wallets to file
async function writeWallets(wallets) {
  try {
    await fs.writeFile(WALLETS_FILE, JSON.stringify(wallets, null, 2));
    return true;
  } catch (error) {
    logger.error('Error writing wallets:', error);
    return false;
  }
}

// Get or create wallet for user
async function getOrCreateWallet(username) {
  const wallets = await readWallets();
  let wallet = wallets.find(w => w.username === username);

  if (!wallet) {
    wallet = {
      username,
      balance: 0,
      lastTopup: null,
      lastDeduction: null,
      transactions: [],
      autoRenew: true,
      createdAt: new Date().toISOString()
    };
    wallets.push(wallet);
    await writeWallets(wallets);
    logger.info(`Created wallet for ${username}`);
  }

  return wallet;
}

// GET /api/wallet/:username - Get wallet balance and info
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const wallet = await getOrCreateWallet(username);

    res.json({
      success: true,
      wallet: {
        username: wallet.username,
        balance: wallet.balance,
        balanceFormatted: `${(wallet.balance / 1000).toFixed(0)}K DMoney`,
        lastTopup: wallet.lastTopup,
        lastDeduction: wallet.lastDeduction,
        autoRenew: wallet.autoRenew,
        balanceStatus: wallet.balance > 100000 ? 'good' : wallet.balance > 50000 ? 'warning' : 'low'
      }
    });
  } catch (error) {
    logger.error('Error fetching wallet:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/wallet/:username/history - Get transaction history
router.get('/:username/history', async (req, res) => {
  try {
    const { username } = req.params;
    const { limit = 10 } = req.query;

    const wallet = await getOrCreateWallet(username);
    const transactions = wallet.transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      transactions,
      totalTransactions: wallet.transactions.length
    });
  } catch (error) {
    logger.error('Error fetching history:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/wallet/:username/topup - Record a top-up (admin confirms)
router.post('/:username/topup', async (req, res) => {
  try {
    const { username } = req.params;
    const { amount, note = 'Mobile money top-up', adminConfirmed = false } = req.body;

    if (!amount || amount < 100000) {
      return res.status(400).json({ error: 'Minimum top-up is 100,000 GNF' });
    }

    const wallets = await readWallets();
    const walletIndex = wallets.findIndex(w => w.username === username);

    let wallet;
    if (walletIndex < 0) {
      wallet = await getOrCreateWallet(username);
      const updatedWallets = await readWallets();
      const newIndex = updatedWallets.findIndex(w => w.username === username);
      wallet = updatedWallets[newIndex];
    } else {
      wallet = wallets[walletIndex];
    }

    // Create transaction
    const transaction = {
      id: `TXN-${Date.now()}`,
      type: 'topup',
      amount: parseInt(amount),
      date: new Date().toISOString(),
      note,
      confirmed: adminConfirmed,
      pending: !adminConfirmed
    };

    // Update wallet
    if (adminConfirmed) {
      wallet.balance += parseInt(amount);
      wallet.lastTopup = new Date().toISOString();
    }

    wallet.transactions.push(transaction);

    // Save
    const currentWallets = await readWallets();
    const currentIndex = currentWallets.findIndex(w => w.username === username);
    if (currentIndex >= 0) {
      currentWallets[currentIndex] = wallet;
      await writeWallets(currentWallets);
    }

    logger.info(`Top-up ${adminConfirmed ? 'confirmed' : 'pending'} for ${username}: ${amount} GNF`);

    res.json({
      success: true,
      wallet: {
        username: wallet.username,
        balance: wallet.balance,
        balanceFormatted: `${(wallet.balance / 1000).toFixed(0)}K DMoney`
      },
      transaction,
      message: adminConfirmed ? 'Top-up confirmed' : 'Top-up pending admin confirmation'
    });
  } catch (error) {
    logger.error('Error processing top-up:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/wallet/:username/deduct - Monthly deduction
router.post('/:username/deduct', async (req, res) => {
  try {
    const { username } = req.params;
    const { amount, note = 'Monthly subscription' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid deduction amount' });
    }

    const wallets = await readWallets();
    const walletIndex = wallets.findIndex(w => w.username === username);

    if (walletIndex < 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const wallet = wallets[walletIndex];

    // Check sufficient balance
    if (wallet.balance < amount) {
      return res.status(400).json({
        error: 'Insufficient balance',
        balance: wallet.balance,
        required: amount,
        shortfall: amount - wallet.balance
      });
    }

    // Create transaction
    const transaction = {
      id: `TXN-${Date.now()}`,
      type: 'deduction',
      amount: parseInt(amount),
      date: new Date().toISOString(),
      note
    };

    // Update wallet
    wallet.balance -= parseInt(amount);
    wallet.lastDeduction = new Date().toISOString();
    wallet.transactions.push(transaction);

    wallets[walletIndex] = wallet;
    await writeWallets(wallets);

    logger.info(`Deduction from ${username}: ${amount} GNF - New balance: ${wallet.balance} GNF`);

    res.json({
      success: true,
      wallet: {
        username: wallet.username,
        balance: wallet.balance,
        balanceFormatted: `${(wallet.balance / 1000).toFixed(0)}K DMoney`
      },
      transaction,
      message: 'Deduction successful'
    });
  } catch (error) {
    logger.error('Error processing deduction:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/wallet/:username/settings - Update wallet settings
router.put('/:username/settings', async (req, res) => {
  try {
    const { username } = req.params;
    const { autoRenew } = req.body;

    const wallets = await readWallets();
    const walletIndex = wallets.findIndex(w => w.username === username);

    if (walletIndex < 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    wallets[walletIndex].autoRenew = autoRenew !== undefined ? autoRenew : wallets[walletIndex].autoRenew;
    await writeWallets(wallets);

    logger.info(`Wallet settings updated for ${username}: autoRenew=${wallets[walletIndex].autoRenew}`);

    res.json({
      success: true,
      wallet: wallets[walletIndex],
      message: 'Settings updated'
    });
  } catch (error) {
    logger.error('Error updating settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/wallet/:username/refund - Refund transaction
router.post('/:username/refund', async (req, res) => {
  try {
    const { username } = req.params;
    const { amount, note = 'Refund' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid refund amount' });
    }

    const wallets = await readWallets();
    const walletIndex = wallets.findIndex(w => w.username === username);

    if (walletIndex < 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const wallet = wallets[walletIndex];

    // Create transaction
    const transaction = {
      id: `TXN-${Date.now()}`,
      type: 'refund',
      amount: parseInt(amount),
      date: new Date().toISOString(),
      note
    };

    // Update wallet
    wallet.balance += parseInt(amount);
    wallet.transactions.push(transaction);

    wallets[walletIndex] = wallet;
    await writeWallets(wallets);

    logger.info(`Refund to ${username}: ${amount} GNF - New balance: ${wallet.balance} GNF`);

    res.json({
      success: true,
      wallet: {
        username: wallet.username,
        balance: wallet.balance,
        balanceFormatted: `${(wallet.balance / 1000).toFixed(0)}K DMoney`
      },
      transaction,
      message: 'Refund successful'
    });
  } catch (error) {
    logger.error('Error processing refund:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/wallet/admin/all - Get all wallets (admin)
router.get('/admin/all', async (req, res) => {
  try {
    const wallets = await readWallets();

    const summary = {
      totalWallets: wallets.length,
      totalBalance: wallets.reduce((sum, w) => sum + w.balance, 0),
      activeWallets: wallets.filter(w => w.balance > 0).length,
      lowBalanceWallets: wallets.filter(w => w.balance < 50000).length
    };

    res.json({
      success: true,
      wallets,
      summary
    });
  } catch (error) {
    logger.error('Error fetching all wallets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize on module load
initWalletsFile();

export default router;
