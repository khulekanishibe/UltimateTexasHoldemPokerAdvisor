/**
 * OpenAI API Serverless Function for Ultimate Texas Hold'em Advisor
 * 
 * This function handles OpenAI API calls securely by keeping the API key
 * on the server side using environment variables.
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
      return res.status(400).json({ 
        error: 'Prompt is required',
        success: false 
      });
    }

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('❌ OPENAI_API_KEY environment variable not set');
      return res.status(500).json({ 
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.',
        success: false 
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
        model: 'gpt-4o-mini', // Using the more affordable model
        messages: [
          {
            role: 'system',
            content: `You are a professional Ultimate Texas Hold'em poker coach with 20+ years of experience. 
            
            Provide strategic betting advice in JSON format with these exact fields:
            - recommendation: specific action (e.g., "Bet 4x", "Check", "Fold")
            - reasoning: brief strategic explanation (max 100 words)
            - confidence: "high", "medium", or "low"
            - riskLevel: "conservative", "moderate", or "aggressive"
            
            Focus on Ultimate Texas Hold'em specific strategy. Be concise and actionable.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.3, // Lower temperature for more consistent strategic advice
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorData);
      
      let errorMessage = 'OpenAI API request failed';
      if (response.status === 401) {
        errorMessage = 'Invalid OpenAI API key';
      } else if (response.status === 429) {
        errorMessage = 'OpenAI API rate limit exceeded';
      } else if (response.status === 402) {
        errorMessage = 'OpenAI API quota exceeded';
      }
      
      return res.status(500).json({ 
        error: errorMessage,
        success: false 
      });
    }

    const data = await response.json();
    console.log('✅ OpenAI API response received');

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return res.status(500).json({ 
        error: 'Invalid OpenAI API response format',
        success: false 
      });
    }

    const aiAdvice = data.choices[0].message.content;
    console.log('🎯 AI advice generated:', aiAdvice.substring(0, 100) + '...');

    // Try to parse as JSON, fallback to plain text
    let parsedAdvice;
    try {
      parsedAdvice = JSON.parse(aiAdvice);
    } catch {
      // Fallback if AI doesn't return valid JSON
      parsedAdvice = {
        recommendation: aiAdvice.split('\n')[0] || 'Check',
        reasoning: aiAdvice,
        confidence: 'medium',
        riskLevel: 'moderate'
      };
    }

    return res.status(200).json({ 
      advice: parsedAdvice,
      success: true 
    });

  } catch (error) {
    console.error('💥 OpenAI API handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      success: false 
    });
  }
}