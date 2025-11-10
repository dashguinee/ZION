#!/usr/bin/env node
/**
 * 🎮 ZION IPTV CLI
 * Simple command-line interface for IPTV business management
 */

import { IPTVMaster } from './zion-iptv-master.js';
import { readFileSync, existsSync } from 'fs';
import readline from 'readline';

// Load configuration
const configFile = '/home/dash/zion-digital-twin/.iptv-config.json';

function loadConfig() {
  if (!existsSync(configFile)) {
    console.log('❌ Config file not found. Please run setup first.');
    console.log('   Create file: /home/dash/zion-digital-twin/.iptv-config.json');
    console.log(`
Example config:
{
  "reseller": {
    "username": "Dashgn",
    "password": "1D2A3S44h"
  },
  "notionToken": "your_notion_token",
  "notionDatabaseId": "your_database_id"
}
    `);
    process.exit(1);
  }

  return JSON.parse(readFileSync(configFile, 'utf8'));
}

const config = loadConfig();
const master = new IPTVMaster(config);

// CLI Interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function showMenu() {
  console.log('\n' + '='.repeat(60));
  console.log('🎮 ZION IPTV MASTER CONTROL');
  console.log('='.repeat(60));
  console.log('\n1. Create Trial Customer');
  console.log('2. Create Paid Customer');
  console.log('3. Monitor Expirations (Send Alerts)');
  console.log('4. Sync with Reseller Panel');
  console.log('5. Generate Business Report');
  console.log('6. Exit\n');
}

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function createTrial() {
  console.log('\n📝 CREATE TRIAL CUSTOMER\n');
  const name = await prompt('Customer Name: ');
  const whatsapp = await prompt('WhatsApp (with country code, e.g., 224XXXXXXX): ');

  console.log('\n🔄 Processing...\n');
  const result = await master.createTrialCustomer(name, whatsapp);

  if (result.success) {
    console.log('\n✅ SUCCESS! Trial customer created and WhatsApp sent.\n');
  } else {
    console.log(`\n❌ FAILED: ${result.error}\n`);
  }
}

async function createPaid() {
  console.log('\n📝 CREATE PAID CUSTOMER\n');
  const name = await prompt('Customer Name: ');
  const whatsapp = await prompt('WhatsApp (with country code): ');

  console.log('\nPackage Options:');
  console.log('  1. 1 Month (1 credit)');
  console.log('  2. 3 Months (3 credits)');
  console.log('  3. 6 Months (6 credits)');
  const packageChoice = await prompt('\nSelect package (1-3): ');

  const packages = {
    '1': { name: '1 Month', price: 15000 },
    '2': { name: '3 Months', price: 40000 },
    '3': { name: '6 Months', price: 75000 }
  };

  const selectedPackage = packages[packageChoice] || packages['1'];
  const amountPaid = await prompt(`Amount Paid (default ${selectedPackage.price} GNF): `) || selectedPackage.price;

  console.log('\n🔄 Processing...\n');
  const result = await master.createPaidCustomer(
    name,
    whatsapp,
    selectedPackage.name,
    parseInt(amountPaid)
  );

  if (result.success) {
    console.log('\n✅ SUCCESS! Paid customer created and WhatsApp sent.\n');
  } else {
    console.log(`\n❌ FAILED: ${result.error}\n`);
  }
}

async function monitorExpirations() {
  console.log('\n🔍 MONITORING EXPIRATIONS...\n');
  await master.monitorExpirations();
  console.log('\n✅ Monitoring complete. Check console for details.\n');
}

async function syncPanel() {
  console.log('\n🔄 SYNCING WITH RESELLER PANEL...\n');
  const result = await master.syncWithResellerPanel();
  console.log(`\n✅ Sync complete: ${result.synced.length} synced, ${result.errors.length} errors\n`);
}

async function generateReport() {
  console.log('\n📊 GENERATING BUSINESS REPORT...\n');
  const report = await master.generateReport();

  if (report) {
    console.log('✅ Report generated and saved to /tmp/iptv-business-report.json\n');
  }
}

async function main() {
  await master.initialize();

  let running = true;

  while (running) {
    showMenu();
    const choice = await prompt('Select option (1-6): ');

    switch (choice) {
      case '1':
        await createTrial();
        break;
      case '2':
        await createPaid();
        break;
      case '3':
        await monitorExpirations();
        break;
      case '4':
        await syncPanel();
        break;
      case '5':
        await generateReport();
        break;
      case '6':
        console.log('\n👋 Goodbye!\n');
        running = false;
        break;
      default:
        console.log('\n⚠️ Invalid option. Please try again.\n');
    }
  }

  rl.close();
  process.exit(0);
}

// Run
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
