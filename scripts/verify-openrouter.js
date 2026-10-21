const fs = require('fs');
const path = require('path');

// 1. Resolve configuration securely
function getEnvConfig() {
  const config = {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_MODEL || '',
    baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  };

  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      if (trimmed.startsWith('OPENROUTER_API_KEY=')) {
        const val = trimmed.slice(trimmed.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
        if (val && val !== 'your_openrouter_api_key_here') {
          config.apiKey = val;
        }
      } else if (trimmed.startsWith('OPENROUTER_MODEL=')) {
        const val = trimmed.slice(trimmed.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
        if (val) config.model = val;
      } else if (trimmed.startsWith('OPENROUTER_BASE_URL=')) {
        const val = trimmed.slice(trimmed.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
        if (val) config.baseUrl = val.replace(/\/+$/, '');
      }
    }
  }

  if (!config.model) {
    config.model = 'openrouter/free';
  }

  return config;
}

// Mask key so it is NEVER revealed
function maskKey(key) {
  if (!key) return '(not set)';
  if (key.length <= 8) return '****';
  return key.slice(0, 4) + '...' + key.slice(-4);
}

async function verify() {
  console.log('====================================================');
  console.log('        OpenRouter LLM Provider Verification        ');
  console.log('====================================================');

  const config = getEnvConfig();

  console.log(`Base URL:     ${config.baseUrl}`);
  console.log(`Model:        ${config.model}`);
  console.log(`API Key:      ${maskKey(config.apiKey)} (${config.apiKey ? 'Configured' : 'Missing'})`);
  console.log('----------------------------------------------------');

  if (!config.apiKey) {
    console.error('❌ Error: OPENROUTER_API_KEY is not set in .env.local or environment.');
    console.log('\nTo set it:');
    console.log('  1. Open .env.local');
    console.log('  2. Add: OPENROUTER_API_KEY=your_key_here');
    console.log('  3. Re-run: npm run verify:openrouter\n');
    process.exit(1);
  }

  try {
    // 1. Check auth and limits
    console.log('Step 1/2: Verifying API key with OpenRouter...');
    const authRes = await fetch(`${config.baseUrl}/auth/key`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
      },
    });

    if (!authRes.ok) {
      console.error(`❌ Authentication failed: HTTP ${authRes.status}`);
      const errText = await authRes.text().catch(() => '');
      console.error(`Details: ${errText.replace(config.apiKey, '[REDACTED]')}`);
      process.exit(1);
    }

    const authData = await authRes.json();
    console.log('✅ API key verified successfully!');
    if (authData?.data) {
      console.log(`   - Free Tier: ${authData.data.is_free_tier ? 'Yes' : 'No'}`);
      if (authData.data.limit_remaining !== undefined) {
        console.log(`   - Limit Remaining: ${authData.data.limit_remaining}`);
      }
    }

    // 2. Perform a test chat completion
    console.log(`\nStep 2/2: Testing chat completion on model "${config.model}"...`);
    const chatRes = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'VOXORA',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'user',
            content: 'Hello, respond with {"status": "ok"}',
          },
        ],
        max_tokens: 30,
        temperature: 0.2,
      }),
    });

    if (!chatRes.ok) {
      console.error(`❌ Chat completion failed: HTTP ${chatRes.status}`);
      const errText = await chatRes.text().catch(() => '');
      console.error(`Details: ${errText.replace(config.apiKey, '[REDACTED]')}`);
      process.exit(1);
    }

    const chatData = await chatRes.json();
    const modelUsed = chatData?.model || config.model;
    const content = chatData?.choices?.[0]?.message?.content || '(no text)';
    console.log(`✅ Model responded successfully! (Resolved model: ${modelUsed})`);
    console.log(`   Response snippet: ${content.trim().slice(0, 100)}`);

    console.log('====================================================');
    console.log('🎉 OpenRouter is fully configured and operational! ');
    console.log('====================================================');
  } catch (err) {
    console.error(`❌ Connection error: ${err.message}`);
    process.exit(1);
  }
}

verify();
