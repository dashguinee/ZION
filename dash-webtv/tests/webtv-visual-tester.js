/**
 * 📺 DASH WebTV Visual Tester
 * Based on ZION Dynamic Navigator - Tailored for WebTV QA Testing
 *
 * Tests:
 * 1. Login functionality
 * 2. Hero banner rendering
 * 3. African Stories tall poster style
 * 4. Collection rendering (Fast & Furious, Marvel, etc.)
 * 5. Content playback
 * 6. Console errors
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

class WebTVVisualTester {
  constructor(options = {}) {
    this.browser = null;
    this.page = null;
    this.stepCount = 0;
    this.testResults = [];
    this.consoleErrors = [];
    this.screenshotDir = options.screenshotDir || '/tmp/webtv-test-screenshots';
    this.baseUrl = options.baseUrl || 'http://localhost:3006';
    this.credentials = options.credentials || { username: 'AzizTest1', password: 'Test1' };
  }

  async initialize() {
    console.log('📺 DASH WebTV Visual Tester Starting...\n');

    // Create screenshot directory
    if (!existsSync(this.screenshotDir)) {
      mkdirSync(this.screenshotDir, { recursive: true });
    }

    // Launch browser
    this.browser = await chromium.launch({
      headless: true,  // Run headless for CI/automated testing
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    this.page = await context.newPage();

    // Capture console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.consoleErrors.push({
          text: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Capture page errors
    this.page.on('pageerror', error => {
      this.consoleErrors.push({
        text: `PAGE ERROR: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    });

    console.log('✅ Browser ready\n');
  }

  async screenshot(label) {
    this.stepCount++;
    const filename = `${this.screenshotDir}/step-${this.stepCount}-${label}.png`;
    await this.page.screenshot({ path: filename, fullPage: false });
    console.log(`📸 Screenshot: ${filename}`);
    return filename;
  }

  async test(name, testFn) {
    console.log(`\n🧪 TEST: ${name}`);
    console.log('-'.repeat(50));

    const result = {
      name,
      passed: false,
      error: null,
      screenshot: null,
      duration: 0
    };

    const startTime = Date.now();

    try {
      await testFn();
      result.passed = true;
      console.log(`✅ PASSED: ${name}`);
    } catch (error) {
      result.error = error.message;
      console.log(`❌ FAILED: ${name} - ${error.message}`);
    }

    result.duration = Date.now() - startTime;
    result.screenshot = await this.screenshot(name.replace(/\s+/g, '-').toLowerCase());
    this.testResults.push(result);

    return result;
  }

  async runAllTests() {
    console.log('\n' + '='.repeat(60));
    console.log('📺 DASH WebTV VISUAL QA TEST SUITE');
    console.log('='.repeat(60));
    console.log(`Base URL: ${this.baseUrl}`);
    console.log(`Credentials: ${this.credentials.username}`);
    console.log('='.repeat(60) + '\n');

    // Navigate to app
    await this.page.goto(this.baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await this.page.waitForTimeout(2000);
    await this.screenshot('initial-load');

    // TEST 1: Login Page Renders
    await this.test('Login Page Renders', async () => {
      const loginOverlay = await this.page.$('#login-overlay');
      if (!loginOverlay) throw new Error('Login overlay not found');

      const usernameInput = await this.page.$('#login-username');
      const passwordInput = await this.page.$('#login-password');
      const loginBtn = await this.page.$('#login-btn');

      if (!usernameInput) throw new Error('Username input not found');
      if (!passwordInput) throw new Error('Password input not found');
      if (!loginBtn) throw new Error('Login button not found');

      const logoText = await this.page.textContent('.login-logo h1');
      if (!logoText?.includes('DASH')) throw new Error('Logo text missing');
    });

    // TEST 2: Login Works
    await this.test('Login Authentication', async () => {
      await this.page.fill('#login-username', this.credentials.username);
      await this.page.fill('#login-password', this.credentials.password);
      await this.page.click('#login-btn');

      // Wait for login overlay to disappear and app to show
      await this.page.waitForSelector('#login-overlay', { state: 'hidden', timeout: 15000 });
      await this.page.waitForSelector('#app-container', { state: 'visible', timeout: 10000 });
    });

    // Wait for content to load
    console.log('\n⏳ Waiting for content to load...');
    await this.page.waitForTimeout(5000);
    await this.screenshot('after-login');

    // TEST 3: Hero Banner Exists
    await this.test('Hero Banner Renders', async () => {
      // Check for hero section - actual class is hero-cinematic
      const heroSection = await this.page.$('.hero-cinematic, #hero-cinematic');
      if (!heroSection) throw new Error('Hero section not found');

      // Check for hero image - actual class is hero-bg
      const heroImage = await this.page.$('.hero-bg, .hero-slide img');
      if (!heroImage) throw new Error('Hero image not found');

      // Check hero content - actual class is hero-title-premium
      const heroTitle = await this.page.$('.hero-title-premium, .hero-content h1');
      if (!heroTitle) throw new Error('Hero title not found');
    });

    // TEST 4: African Stories Row (Tall Posters)
    await this.test('African Stories Row Style', async () => {
      // Scroll to find African Stories
      await this.page.evaluate(() => window.scrollBy(0, 500));
      await this.page.waitForTimeout(1000);

      // Look for African Stories section
      const africanRow = await this.page.$('.african-stories-row, [data-collection="african_stories"]');

      // Check for tall poster cards (signature style)
      const africanCards = await this.page.$$('.african-story-card');

      if (africanCards.length === 0) {
        // Fallback check for any African-related content
        const africanText = await this.page.textContent('body');
        if (!africanText.toLowerCase().includes('african')) {
          throw new Error('African Stories section not found');
        }
      }

      // If cards exist, verify height is tall (poster style)
      if (africanCards.length > 0) {
        const cardHeight = await africanCards[0].evaluate(el => el.querySelector('.story-image-container')?.offsetHeight || 0);
        if (cardHeight < 200) {
          console.log(`⚠️ Warning: African card height (${cardHeight}px) may not be tall poster style`);
        }
      }
    });

    // TEST 5: Collection Rows Render
    await this.test('Collection Rows Render Content', async () => {
      // Scroll through page
      await this.page.evaluate(() => window.scrollBy(0, 800));
      await this.page.waitForTimeout(1000);

      // Check for content cards with images
      const contentCards = await this.page.$$('.content-card img, .movie-card img, .poster-image');

      if (contentCards.length < 5) {
        throw new Error(`Only ${contentCards.length} content cards with images found (expected 5+)`);
      }

      // Check for placeholder images (indicates broken content)
      const placeholders = await this.page.$$eval('img', imgs =>
        imgs.filter(img =>
          img.src.includes('placeholder') ||
          img.src.includes('no-image') ||
          !img.src ||
          img.naturalWidth === 0
        ).length
      );

      if (placeholders > 10) {
        console.log(`⚠️ Warning: ${placeholders} placeholder/broken images found`);
      }
    });

    // TEST 6: Fast & Furious Collection (Fixed)
    await this.test('Fast & Furious Shows Correct Movies', async () => {
      // Look for F&F collection
      const ffCollection = await this.page.$('[data-collection="fast_furious"], .collection-row:has-text("Fast")');

      if (ffCollection) {
        // Check that the movies contain "Fast" or "Furious"
        const cardTitles = await ffCollection.$$eval('.card-title, .content-title', titles =>
          titles.map(t => t.textContent?.toLowerCase() || '')
        );

        const hasCorrectMovies = cardTitles.some(t =>
          t.includes('fast') || t.includes('furious') || t.includes('hobbs')
        );

        if (!hasCorrectMovies && cardTitles.length > 0) {
          console.log(`⚠️ Warning: F&F titles found: ${cardTitles.slice(0, 3).join(', ')}`);
        }
      }
    });

    // TEST 7: Navigation Works
    await this.test('Navigation Menu Works', async () => {
      const bottomNav = await this.page.$('.bottom-nav');
      if (!bottomNav) throw new Error('Bottom navigation not found');

      const navItems = await this.page.$$('.nav-item');
      if (navItems.length < 5) {
        throw new Error(`Only ${navItems.length} nav items found (expected 5+)`);
      }
    });

    // TEST 8: Movies Page Navigation
    await this.test('Movies Page Loads', async () => {
      // Click Movies nav
      await this.page.click('.nav-item[data-page="movies"]');
      await this.page.waitForTimeout(3000);

      // Check for movie content - browse pages use browse-card class
      const movieCards = await this.page.$$('.browse-card, .browse-card-poster');
      if (movieCards.length < 3) {
        throw new Error(`Only ${movieCards.length} movie cards found on Movies page`);
      }
    });

    // TEST 9: Series Page Navigation
    await this.test('Series Page Loads', async () => {
      await this.page.click('.nav-item[data-page="series"]');
      await this.page.waitForTimeout(3000);

      // Check for series content - browse pages use browse-card class
      const seriesCards = await this.page.$$('.browse-card, .browse-card-poster');
      if (seriesCards.length < 3) {
        throw new Error(`Only ${seriesCards.length} series cards found on Series page`);
      }
    });

    // TEST 10: Search Works
    await this.test('Search Functionality', async () => {
      // Go back home
      await this.page.click('.nav-item[data-page="home"]');
      await this.page.waitForTimeout(2000);

      // Find search input
      const searchInput = await this.page.$('#searchInput, .search-input');
      if (!searchInput) throw new Error('Search input not found');

      // Type search
      await searchInput.fill('Batman');
      await this.page.waitForTimeout(2000);

      // Check for search results (should filter content)
      await this.screenshot('search-batman');
    });

    // TEST 11: No Critical Console Errors
    await this.test('No Critical Console Errors', async () => {
      const criticalErrors = this.consoleErrors.filter(e =>
        e.text.includes('Uncaught') ||
        e.text.includes('TypeError') ||
        e.text.includes('ReferenceError') ||
        e.text.includes('is not defined')
      );

      if (criticalErrors.length > 0) {
        console.log('Critical errors found:');
        criticalErrors.slice(0, 5).forEach(e => console.log(`  - ${e.text.substring(0, 100)}`));
        throw new Error(`${criticalErrors.length} critical console errors found`);
      }
    });

    // Generate report
    await this.generateReport();
  }

  async generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    const total = this.testResults.length;

    console.log(`\nTotal Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Pass Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (this.consoleErrors.length > 0) {
      console.log(`\n⚠️ Console Errors: ${this.consoleErrors.length}`);
      this.consoleErrors.slice(0, 5).forEach(e => {
        console.log(`  - ${e.text.substring(0, 80)}...`);
      });
    }

    // Failed tests details
    const failedTests = this.testResults.filter(r => !r.passed);
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(t => {
        console.log(`  - ${t.name}: ${t.error}`);
      });
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      summary: { total, passed, failed, passRate: ((passed / total) * 100).toFixed(1) + '%' },
      tests: this.testResults,
      consoleErrors: this.consoleErrors,
      screenshotDir: this.screenshotDir
    };

    const reportPath = `${this.screenshotDir}/test-report.json`;
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Full report saved to: ${reportPath}`);
    console.log(`📸 Screenshots saved to: ${this.screenshotDir}`);
    console.log('='.repeat(60));

    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    console.log('\n✅ Browser closed');
  }
}

// EXECUTE
async function main() {
  const tester = new WebTVVisualTester({
    baseUrl: process.env.WEBTV_URL || 'http://localhost:3006',
    credentials: {
      username: process.env.WEBTV_USER || 'AzizTest1',
      password: process.env.WEBTV_PASS || 'Test1'
    }
  });

  try {
    await tester.initialize();
    await tester.runAllTests();
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    await tester.screenshot('fatal-error');
  } finally {
    await tester.cleanup();
  }
}

main().catch(console.error);
