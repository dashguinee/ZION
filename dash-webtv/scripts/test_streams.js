const https = require('https');
const http = require('http');
const data = require('../data/africa_channels.json');

async function testUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 3000 }, (res) => {
      resolve(res.statusCode === 200 ? 'OK' : res.statusCode);
    });
    req.on('error', () => resolve('ERR'));
    req.on('timeout', () => { req.destroy(); resolve('TIMEOUT'); });
    setTimeout(() => { req.destroy(); resolve('TIMEOUT'); }, 3000);
  });
}

async function main() {
  // Test 20 random MENA channels
  const mena = data.mena_cached.sort(() => Math.random() - 0.5).slice(0, 20);
  let menaOk = 0;

  console.log('Testing 20 MENA channels...');
  for (const ch of mena) {
    const result = await testUrl(ch.url);
    if (result === 'OK') menaOk++;
    process.stdout.write(result === 'OK' ? '.' : 'x');
  }
  console.log('\nMENA: ' + menaOk + '/20 working (' + Math.round(menaOk/20*100) + '%)');

  // Test 10 DSTV channels
  const dstv = data.dstv_cached.slice(0, 10);
  let dstvOk = 0;

  console.log('\nTesting 10 DSTV channels...');
  for (const ch of dstv) {
    const result = await testUrl(ch.url);
    if (result === 'OK') dstvOk++;
    process.stdout.write(result === 'OK' ? '.' : 'x');
  }
  console.log('\nDSTV: ' + dstvOk + '/10 working (' + Math.round(dstvOk/10*100) + '%)');
}

main();
