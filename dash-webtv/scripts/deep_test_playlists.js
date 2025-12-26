const https = require('https');
const http = require('http');
const fs = require('fs');

const PROXY_URL = 'https://zion-production-39d8.up.railway.app/api/proxy?url=';
const TIMEOUT = 5000;

// Test a stream URL
async function testStream(url) {
  const testUrl = url.startsWith('http://') ? PROXY_URL + encodeURIComponent(url) : url;

  return new Promise((resolve) => {
    const client = testUrl.startsWith('https') ? https : http;
    const req = client.get(testUrl, { timeout: TIMEOUT }, (res) => {
      resolve({ ok: res.statusCode === 200, status: res.statusCode });
    });
    req.on('error', () => resolve({ ok: false, status: 'ERR' }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 'TIMEOUT' }); });
    setTimeout(() => req.destroy(), TIMEOUT + 1000);
  });
}

// Fetch and parse playlist
async function fetchPlaylist(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    let data = '';

    const req = client.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode !== 200) {
        resolve({ ok: false, channels: [] });
        return;
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const lines = data.split('\n');
        const channels = [];
        let name = '', group = '';

        for (const line of lines) {
          if (line.startsWith('#EXTINF:')) {
            const nameMatch = line.match(/,(.+)$/);
            name = nameMatch ? nameMatch[1].trim() : 'Unknown';
            const groupMatch = line.match(/group-title="([^"]+)"/);
            group = groupMatch ? groupMatch[1] : 'General';
          } else if (line.trim().startsWith('http')) {
            channels.push({ name, group, url: line.trim() });
            name = '';
          }
        }
        resolve({ ok: true, channels });
      });
    });
    req.on('error', () => resolve({ ok: false, channels: [] }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, channels: [] }); });
  });
}

async function main() {
  // Test the TOP playlists
  const playlistsToTest = [
    { key: 'freeTvHd', url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8', sample: 20 },
    { key: 'english', url: 'https://iptv-org.github.io/iptv/languages/eng.m3u', sample: 20 },
    { key: 'french', url: 'https://iptv-org.github.io/iptv/languages/fra.m3u', sample: 15 },
    { key: 'news', url: 'https://iptv-org.github.io/iptv/categories/news.m3u', sample: 15 },
    { key: 'nigeria', url: 'https://iptv-org.github.io/iptv/countries/ng.m3u', sample: 10 },
    { key: 'southAfrica', url: 'https://iptv-org.github.io/iptv/countries/za.m3u', sample: 10 },
  ];

  console.log('=== DEEP PLAYLIST ANALYSIS ===\n');

  const results = {};

  for (const playlist of playlistsToTest) {
    console.log(`\n--- ${playlist.key.toUpperCase()} ---`);
    console.log(`Fetching ${playlist.url}...`);

    const { ok, channels } = await fetchPlaylist(playlist.url);

    if (!ok) {
      console.log('  FAILED to fetch playlist');
      continue;
    }

    console.log(`  Total channels: ${channels.length}`);

    // Group by category
    const groups = {};
    channels.forEach(ch => {
      groups[ch.group] = (groups[ch.group] || 0) + 1;
    });

    console.log(`  Groups: ${Object.keys(groups).length}`);
    const topGroups = Object.entries(groups).sort((a,b) => b[1] - a[1]).slice(0, 5);
    topGroups.forEach(([g, c]) => console.log(`    - ${g}: ${c} channels`));

    // Sample test streams
    console.log(`\n  Testing ${playlist.sample} random streams...`);
    const sample = channels.sort(() => Math.random() - 0.5).slice(0, playlist.sample);

    let working = 0;
    const workingChannels = [];

    for (const ch of sample) {
      const result = await testStream(ch.url);
      if (result.ok) {
        working++;
        workingChannels.push(ch);
        process.stdout.write('.');
      } else {
        process.stdout.write('x');
      }
    }

    const rate = Math.round(working / playlist.sample * 100);
    console.log(`\n  Result: ${working}/${playlist.sample} (${rate}% working)`);

    // Show working examples
    if (workingChannels.length > 0) {
      console.log('\n  Working examples:');
      workingChannels.slice(0, 3).forEach(ch => {
        console.log(`    - ${ch.name} [${ch.group}]`);
        console.log(`      ${ch.url.substring(0, 70)}...`);
      });
    }

    results[playlist.key] = {
      total: channels.length,
      groups: Object.keys(groups).length,
      tested: playlist.sample,
      working,
      rate,
      topGroups,
      sampleWorking: workingChannels.slice(0, 5)
    };
  }

  console.log('\n\n========== SUMMARY ==========\n');

  let totalChannels = 0;
  let estimatedWorking = 0;

  for (const [key, data] of Object.entries(results)) {
    console.log(`${key}: ${data.total} channels, ${data.rate}% working (~${Math.round(data.total * data.rate / 100)} live)`);
    totalChannels += data.total;
    estimatedWorking += Math.round(data.total * data.rate / 100);
  }

  console.log(`\nTOTAL: ${totalChannels} channels`);
  console.log(`ESTIMATED WORKING: ~${estimatedWorking} live streams`);

  fs.writeFileSync('./data/playlist_deep_analysis.json', JSON.stringify(results, null, 2));
  console.log('\nFull results saved to: data/playlist_deep_analysis.json');
}

main().catch(console.error);
