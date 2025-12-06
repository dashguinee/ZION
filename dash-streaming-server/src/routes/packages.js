import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const PACKAGES_FILE = path.join(__dirname, '../../data/packages.json');

// Available package categories with pricing (in GNF)
const CATEGORIES = [
  { id: 'sports', name: 'Sports', price: 20000, icon: '⚽', description: 'Live sports, SuperSport, ESPN' },
  { id: 'french', name: 'French', price: 15000, icon: '🇫🇷', description: 'French channels, movies, series' },
  { id: 'nollywood', name: 'Nollywood', price: 15000, icon: '🎬', description: 'Nigerian/African movies and series' },
  { id: 'kdrama', name: 'K-Drama', price: 10000, icon: '🇰🇷', description: 'Korean dramas' },
  { id: 'kids', name: 'Kids', price: 10000, icon: '👶', description: "Children's content" },
  { id: 'music', name: 'Music/VOYO', price: 10000, icon: '🎵', description: 'Music streaming' },
  { id: 'livetv', name: 'Live TV Basic', price: 10000, icon: '📺', description: 'Basic live channels' },
  { id: 'premium', name: 'Premium Movies', price: 15000, icon: '🎥', description: 'Latest releases' }
];

// Initialize packages file if it doesn't exist
async function initPackagesFile() {
  try {
    await fs.access(PACKAGES_FILE);
  } catch {
    await fs.writeFile(PACKAGES_FILE, JSON.stringify([], null, 2));
    logger.info('Created packages.json file');
  }
}

// Read packages from file
async function readPackages() {
  try {
    const data = await fs.readFile(PACKAGES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('Error reading packages:', error);
    return [];
  }
}

// Write packages to file
async function writePackages(packages) {
  try {
    await fs.writeFile(PACKAGES_FILE, JSON.stringify(packages, null, 2));
    return true;
  } catch (error) {
    logger.error('Error writing packages:', error);
    return false;
  }
}

// GET /api/packages/categories - List all available categories with pricing
router.get('/categories', async (req, res) => {
  try {
    res.json({
      success: true,
      categories: CATEGORIES,
      currency: 'GNF'
    });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/packages/:username - Get user's package
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const packages = await readPackages();
    const userPackage = packages.find(p => p.username === username);

    if (!userPackage) {
      return res.json({
        success: true,
        package: null,
        message: 'No package found for user'
      });
    }

    res.json({
      success: true,
      package: userPackage
    });
  } catch (error) {
    logger.error('Error fetching package:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/packages/create - Create new package
router.post('/create', async (req, res) => {
  try {
    const { username, selectedCategories } = req.body;

    if (!username || !selectedCategories || !Array.isArray(selectedCategories)) {
      return res.status(400).json({ error: 'username and selectedCategories are required' });
    }

    // Validate categories
    const validCategoryIds = CATEGORIES.map(c => c.id);
    const invalidCategories = selectedCategories.filter(id => !validCategoryIds.includes(id));

    if (invalidCategories.length > 0) {
      return res.status(400).json({ error: `Invalid categories: ${invalidCategories.join(', ')}` });
    }

    // Calculate total price
    const total = selectedCategories.reduce((sum, categoryId) => {
      const category = CATEGORIES.find(c => c.id === categoryId);
      return sum + (category ? category.price : 0);
    }, 0);

    const packages = await readPackages();

    // Check if user already has a package
    const existingIndex = packages.findIndex(p => p.username === username);

    const newPackage = {
      username,
      selectedCategories,
      monthlyPrice: total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      active: true
    };

    if (existingIndex >= 0) {
      packages[existingIndex] = newPackage;
    } else {
      packages.push(newPackage);
    }

    await writePackages(packages);

    logger.info(`Package created/updated for ${username}: ${selectedCategories.join(', ')} - ${total} GNF`);

    res.json({
      success: true,
      package: newPackage,
      message: existingIndex >= 0 ? 'Package updated' : 'Package created'
    });
  } catch (error) {
    logger.error('Error creating package:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/packages/:username - Update existing package
router.put('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { selectedCategories } = req.body;

    if (!selectedCategories || !Array.isArray(selectedCategories)) {
      return res.status(400).json({ error: 'selectedCategories is required' });
    }

    // Validate categories
    const validCategoryIds = CATEGORIES.map(c => c.id);
    const invalidCategories = selectedCategories.filter(id => !validCategoryIds.includes(id));

    if (invalidCategories.length > 0) {
      return res.status(400).json({ error: `Invalid categories: ${invalidCategories.join(', ')}` });
    }

    const packages = await readPackages();
    const packageIndex = packages.findIndex(p => p.username === username);

    if (packageIndex < 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Calculate new total
    const total = selectedCategories.reduce((sum, categoryId) => {
      const category = CATEGORIES.find(c => c.id === categoryId);
      return sum + (category ? category.price : 0);
    }, 0);

    packages[packageIndex] = {
      ...packages[packageIndex],
      selectedCategories,
      monthlyPrice: total,
      updatedAt: new Date().toISOString()
    };

    await writePackages(packages);

    logger.info(`Package updated for ${username}: ${selectedCategories.join(', ')} - ${total} GNF`);

    res.json({
      success: true,
      package: packages[packageIndex],
      message: 'Package updated successfully'
    });
  } catch (error) {
    logger.error('Error updating package:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/packages/:username - Delete package
router.delete('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const packages = await readPackages();
    const filteredPackages = packages.filter(p => p.username !== username);

    if (filteredPackages.length === packages.length) {
      return res.status(404).json({ error: 'Package not found' });
    }

    await writePackages(filteredPackages);

    logger.info(`Package deleted for ${username}`);

    res.json({
      success: true,
      message: 'Package deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting package:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize on module load
initPackagesFile();

export default router;
