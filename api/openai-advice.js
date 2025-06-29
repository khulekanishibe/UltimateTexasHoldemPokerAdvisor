/**
 * OpenAI API Endpoint for Poker Advice
 * 
 * This serverless function handles OpenAI API calls securely
 * by keeping the API key on the server side.
 * 
 * Environment Variables Required:
 * - OPENAI_API_KEY: Your OpenAI API key
 * 
 * Usage:
 * POST /api/openai-advice
 * Body: { prompt: "poker analysis prompt" }
 * 
 * Response: { advice: "AI generated advice" }
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('❌ OPENAI_API_KEY environment variable not set');
      return res.status(500).json({ 
        error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' 
      });
    }

    console.log('🤖 Making OpenAI API request...');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional poker advisor specializing in Ultimate Texas Hold\'em strategy. Provide concise, actionable advice in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorData);
      
      if (response.status === 401) {
        return res.status(500).json({ error: 'Invalid OpenAI API key' });
      } else if (response.status === 429) {
        return res.status(500).json({ error: 'OpenAI API rate limit exceeded' });
      } else {
        return res.status(500).json({ error: 'OpenAI API request failed' });
      }
    }

    const data = await response.json();
    console.log('✅ OpenAI API response received');

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return res.status(500).json({ error: 'Invalid OpenAI API response' });
    }

    const aiAdvice = data.choices[0].message.content;
    console.log('🎯 AI advice generated:', aiAdvice.substring(0, 100) + '...');

    return res.status(200).json({ advice: aiAdvice });

  } catch (error) {
    console.error('💥 OpenAI API handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error: ' + (error.message || 'Unknown error')
    });
  }
}