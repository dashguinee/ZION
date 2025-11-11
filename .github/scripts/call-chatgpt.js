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

// Prepare ChatGPT API request
const messages = [
  {
    role: 'system',
    content: 'You are ChatGPT Congregation, part of a multi-AI debate system. You provide counter-perspectives and challenge assumptions. Be concise and add NEW insights.'
  },
  {
    role: 'user',
    content: `Recent congregation conversation:\n\n${context}\n\nZION just posted a response. Analyze their perspective and provide your counter-argument, synthesis, or agreement. Be concise (max 500 words). Focus on what ZION might have missed.`
  }
];

const requestData = JSON.stringify({
  model: 'gpt-4',
  messages: messages,
  max_tokens: 800,
  temperature: 0.7
});

const options = {
  hostname: 'api.openai.com',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Length': requestData.length
  }
};

console.log('🤖 Calling ChatGPT API...');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (response.choices && response.choices[0]) {
        const aiResponse = response.choices[0].message.content;

        console.log('✅ ChatGPT responded');
        console.log('Response preview:', aiResponse.substring(0, 100) + '...');

        // Add to congregation thread
        const newMessage = {
          id: `msg_chatgpt_${Date.now()}_auto`,
          author: 'chatgpt',
          model: 'gpt-4',
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
      console.error('❌ Error parsing ChatGPT response:', error);
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
