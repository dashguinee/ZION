const https = require('https');
const http = require('http');
const fs = require('fs');

const playlists = {
  mena: 'https://iptv-org.github.io/iptv/regions/mena.m3u',
  dstv: 'https://raw.githubusercontent.com/Tinkie/iptv/main/DSTV.m3u'
};

function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseM3U(content, source) {
  const channels = [];
  const lines = content.split('\n');
  let currentName = '';
  let currentGroup = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#EXTINF:')) {
      // Extract name (after last comma)
      const nameMatch = line.match(/,(.+)$/);
      currentName = nameMatch ? nameMatch[1].trim() : 'Unknown';
      
      // Extract group-title
      const groupMatch = line.match(/group-title="([^"]+)"/);
      currentGroup = groupMatch ? groupMatch[1] : 'General';
    }
    else if (line.startsWith('http')) {
      channels.push({
        id: `${source}-${channels.length}`,
        name: currentName,
        url: line,
        group: currentGroup,
        needsProxy: line.startsWith('http://')
      });
      currentName = '';
      currentGroup = '';
    }
  }
  
  return channels;
}

async function main() {
  console.log('Fetching MENA playlist...');
  const menaContent = await fetch(playlists.mena);
  const menaChannels = parseM3U(menaContent, 'mena');
  console.log(`MENA: ${menaChannels.length} channels`);
  
  console.log('Fetching DSTV playlist...');
  const dstvContent = await fetch(playlists.dstv);
  const dstvChannels = parseM3U(dstvContent, 'dstv');
  console.log(`DSTV: ${dstvChannels.length} channels`);
  
  // Read existing JSON
  const existingData = JSON.parse(fs.readFileSync('data/africa_channels.json', 'utf8'));
  
  // Add cached playlists
  existingData.mena_cached = menaChannels;
  existingData.dstv_cached = dstvChannels;
  
  // Update metadata
  existingData.metadata.cached_at = new Date().toISOString();
  existingData.metadata.mena_count = menaChannels.length;
  existingData.metadata.dstv_count = dstvChannels.length;
  
  // Write back
  fs.writeFileSync('data/africa_channels.json', JSON.stringify(existingData, null, 2));
  
  console.log('\n=== CACHED ===');
  console.log(`MENA: ${menaChannels.length} channels`);
  console.log(`DSTV: ${dstvChannels.length} channels`);
  console.log(`Total new: ${menaChannels.length + dstvChannels.length} channels`);
  console.log('Saved to data/africa_channels.json');
}

main().catch(console.error);
