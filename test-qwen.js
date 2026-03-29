// Simple Qwen API test
const axios = require('axios');

async function testQwenConnection() {
  const apiKey = process.env.QWEN_API_KEY;
  const baseURL = process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  const model = process.env.QWEN_MODEL || 'qwen-plus-2025-01-25';

  console.log('🧪 Testing Qwen API Connection...');
  console.log(`   Model: ${model}`);
  console.log(`   Base URL: ${baseURL}`);

  try {
    console.log(`   Making request to: ${baseURL}/chat/completions`);
    const response = await axios.post(
      `${baseURL}/chat/completions`,
      {
        model: model,
        messages: [
          { role: 'user', content: 'Hello, can you respond with "Qwen is working!"?' }
        ],
        temperature: 0.7,
        max_tokens: 100,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 30000,
      }
    );

    console.log('\n✅ Qwen API Connection Successful!');
    console.log(`   Response: ${response.data.choices[0].message.content.trim()}`);
    console.log(`   Tokens used: ${response.data.usage.total_tokens}`);
    return true;
  } catch (error) {
    console.error('\n❌ Qwen API Connection Failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.error(`   No response received. Request: ${error.message}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    return false;
  }
}

testQwenConnection().then(success => {
  process.exit(success ? 0 : 1);
});
