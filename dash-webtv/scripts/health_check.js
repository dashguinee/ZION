const https = require('https');
const http = require('http');
const fs = require('fs');

const PROXY_URL = 'https://zion-production-39d8.up.railway.app/api/proxy?url=';
const TIMEOUT = 8000;

async function testUrl(url, useProxy = false) {
  const testUrl = useProxy ? PROXY_URL + encodeURIComponent(url) : url;

  return new Promise((resolve) => {
    const client = testUrl.startsWith('https') ? https : http;
    const req = client.get(testUrl, { timeout: TIMEOUT }, (res) => {
      resolve({ status: res.statusCode, ok: res.statusCode === 200 });
    });
    req.on('error', (e) => resolve({ status: 'ERR', ok: false, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 'TIMEOUT', ok: false }); });
    setTimeout(() => { req.destroy(); }, TIMEOUT + 1000);
  });
}

async function testChannel(ch) {
  const isHttp = ch.url.startsWith('http://');

  // First try direct
  let result = await testUrl(ch.url, false);

  // If HTTP failed or blocked, try proxy
  if (!result.ok && isHttp) {
    result = await testUrl(ch.url, true);
    if (result.ok) {
      return { ...ch, needsProxy: true, status: 'OK_PROXY' };
    }
  }

  if (result.ok) {
    return { ...ch, status: 'OK' };
  }

  return { ...ch, status: 'DEAD', reason: result.status };
}

async function main() {
  const data = JSON.parse(fs.readFileSync('./data/africa_channels.json', 'utf8'));

  const sections = [
    'verified_channels',
    'guinea_channels',
    'senegal_channels',
    'ivory_coast_channels',
    'cameroon_channels',
    'south_africa_free',
    'international_french',
    'supersport',
    'supersport_backup',
    'supersport_hls',
    'bein_sports',
    'dstv_movies',
    'mena_cached'
  ];

  const results = {
    healthy: {},
    dead: {},
    stats: {}
  };

  for (const section of sections) {
    if (!data[section] || data[section].length === 0) continue;

    const channels = data[section];
    console.log(`\n=== Testing ${section} (${channels.length} channels) ===`);

    results.healthy[section] = [];
    results.dead[section] = [];

    // Test in batches of 10
    for (let i = 0; i < channels.length; i += 10) {
      const batch = channels.slice(i, i + 10);
      const tests = await Promise.all(batch.map(ch => testChannel(ch)));

      for (const result of tests) {
        if (result.status === 'OK' || result.status === 'OK_PROXY') {
          results.healthy[section].push(result);
          process.stdout.write('.');
        } else {
          results.dead[section].push(result);
          process.stdout.write('x');
        }
      }
    }

    const healthy = results.healthy[section].length;
    const total = channels.length;
    const pct = Math.round(healthy / total * 100);
    results.stats[section] = { healthy, total, pct };
    console.log(`\n${section}: ${healthy}/${total} (${pct}%)`);
  }

  // Summary
  console.log('\n\n========== HEALTH CHECK SUMMARY ==========');
  let totalHealthy = 0;
  let totalChannels = 0;

  for (const [section, stats] of Object.entries(results.stats)) {
    console.log(`${section}: ${stats.healthy}/${stats.total} (${stats.pct}%)`);
    totalHealthy += stats.healthy;
    totalChannels += stats.total;
  }

  console.log(`\nTOTAL: ${totalHealthy}/${totalChannels} (${Math.round(totalHealthy/totalChannels*100)}%)`);

  // Save healthy channels back
  const healthyData = { ...data };
  for (const section of sections) {
    if (results.healthy[section]) {
      healthyData[section] = results.healthy[section].map(ch => {
        delete ch.status;
        delete ch.reason;
        return ch;
      });
    }
  }

  healthyData.metadata.health_check = new Date().toISOString();
  healthyData.metadata.total_healthy = totalHealthy;

  fs.writeFileSync('./data/africa_channels_healthy.json', JSON.stringify(healthyData, null, 2));
  console.log('\nHealthy channels saved to: data/africa_channels_healthy.json');

  // Also save dead for reference
  fs.writeFileSync('./data/dead_channels.json', JSON.stringify(results.dead, null, 2));
  console.log('Dead channels logged to: data/dead_channels.json');
}

main().catch(console.error);
