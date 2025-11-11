#!/usr/bin/env node

const fs = require('fs');
const https = require('https');

// Read congregation thread
const thread = JSON.parse(fs.readFileSync('.congregation/thread.json', 'utf8'));

// Build context from last 5 messages
const recentMessages = thread.messages.slice(-5);
const context = recentMessages
  .map(m => `[${m.author}]: ${m.content}`)
  .join('\n\n---\n\n');

// Prepare Claude API request
const prompt = `You are ZION, part of the Congregation multi-AI system. You're in an autonomous debate with ChatGPT.

Recent conversation:
${context}

ChatGPT just posted a response. Analyze their perspective and provide your counter-argument, synthesis, or agreement. Be concise (max 500 words). Focus on adding NEW insights, not repeating what's been said.

Your response:`;

const requestData = JSON.stringify({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: prompt
  }]
});

const options = {
  hostname: 'api.anthropic.com',
  port: 443,
  path: '/v1/messages',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'Content-Length': requestData.length
  }
};

console.log('🧠 Calling Claude API...');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (response.content && response.content[0]) {
        const aiResponse = response.content[0].text;

        console.log('✅ Claude responded');
        console.log('Response preview:', aiResponse.substring(0, 100) + '...');

        // Add to congregation thread
        const newMessage = {
          id: `msg_zion_${Date.now()}_auto`,
          author: 'zion',
          model: 'claude-sonnet-4.5',
          timestamp: new Date().toISOString(),
          content: aiResponse
        };

        thread.messages.push(newMessage);
        thread.metadata.last_updated = new Date().toISOString();

        // Write back to file
        fs.writeFileSync(
          '.congregation/thread.json',
          JSON.stringify(thread, null, 2)
        );

        console.log('✅ Response added to congregation');
      } else {
        console.error('❌ Unexpected API response format:', response);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error parsing Claude response:', error);
      console.error('Raw response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ API request failed:', error);
  process.exit(1);
});

req.write(requestData);
req.end();
