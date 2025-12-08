const https = require('https');
const http = require('http');
const fs = require('fs');

const PROXY_URL = 'https://zion-production-39d8.up.railway.app/api/proxy?url=';
const TIMEOUT = 10000;

async function fetchUrl(url, useProxy = false) {
  const testUrl = useProxy ? PROXY_URL + encodeURIComponent(url) : url;

  return new Promise((resolve) => {
    const client = testUrl.startsWith('https') ? https : http;
    let data = '';

    const req = client.get(testUrl, { timeout: TIMEOUT }, (res) => {
      if (res.statusCode !== 200) {
        resolve({ ok: false, status: res.statusCode, channels: 0 });
        return;
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Count channels (lines starting with http)
        const channels = data.split('\n').filter(line => line.trim().startsWith('http')).length;
        resolve({ ok: true, status: 200, channels, size: data.length });
      });
    });

    req.on('error', (e) => resolve({ ok: false, status: 'ERR', error: e.message, channels: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 'TIMEOUT', channels: 0 }); });
    setTimeout(() => { req.destroy(); }, TIMEOUT + 2000);
  });
}

async function testPlaylist(key, url) {
  console.log(`Testing: ${key}`);

  // First try direct
  let result = await fetchUrl(url, false);

  // If failed and HTTP, try proxy
  if (!result.ok && url.startsWith('http://')) {
    console.log(`  Direct failed, trying proxy...`);
    result = await fetchUrl(url, true);
    if (result.ok) {
      result.method = 'proxy';
    }
  }

  if (result.ok) {
    result.method = result.method || 'direct';
  }

  return { key, url, ...result };
}

async function main() {
  const data = JSON.parse(fs.readFileSync('./data/africa_channels.json', 'utf8'));
  const playlists = data.playlists || {};

  // Filter out comments
  const playlistEntries = Object.entries(playlists).filter(([k]) => !k.startsWith('_'));

  console.log(`\n=== TESTING ${playlistEntries.length} PLAYLIST URLS ===\n`);

  const results = {
    working: [],
    dead: []
  };

  for (const [key, url] of playlistEntries) {
    const result = await testPlaylist(key, url);

    if (result.ok) {
      console.log(`  ✓ ${result.channels} channels (${result.method})\n`);
      results.working.push(result);
    } else {
      console.log(`  ✗ ${result.status}\n`);
      results.dead.push(result);
    }
  }

  // Summary
  console.log('\n========== PLAYLIST TEST SUMMARY ==========\n');

  console.log('WORKING PLAYLISTS:');
  let totalChannels = 0;
  results.working.forEach(p => {
    console.log(`  ${p.key}: ${p.channels} channels (${p.method})`);
    totalChannels += p.channels;
  });
  console.log(`\n  TOTAL: ${results.working.length} playlists, ${totalChannels} channels\n`);

  console.log('DEAD PLAYLISTS:');
  results.dead.forEach(p => {
    console.log(`  ${p.key}: ${p.status} - ${p.url.substring(0, 50)}...`);
  });
  console.log(`\n  TOTAL DEAD: ${results.dead.length} playlists\n`);

  // Save results
  fs.writeFileSync('./data/playlist_test_results.json', JSON.stringify(results, null, 2));
  console.log('Results saved to: data/playlist_test_results.json');
}

main().catch(console.error);
