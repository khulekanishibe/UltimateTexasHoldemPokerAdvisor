/**
 * Gemini API Serverless Function for Ultimate Texas Hold'em Advisor
 *
 * This function handles Gemini API calls securely by keeping the API key
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

    // Check for Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY environment variable not set');
      return res.status(500).json({
        error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables.',
        success: false
      });
    }

    console.log('🤖 Making Gemini API request...');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest?key=${apiKey}`;

    // Call Gemini API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "You are a professional Ultimate Texas Hold'em poker coach with 20+ years of experience. Provide strategic betting advice in JSON format with these exact fields: recommendation (e.g., "Bet 4x", "Check", "Fold"), reasoning (brief strategic explanation, max 100 words), confidence ("high", "medium", or "low"), and riskLevel ("conservative", "moderate", or "aggressive"). Focus on Ultimate Texas Hold'em specific strategy. Be concise and actionable. Example: ```json { "recommendation": "Bet 4x", "reasoning": "You have a strong starting hand.", "confidence": "high", "riskLevel": "aggressive" } ```"
              },
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json",
          maxOutputTokens: 400,
          temperature: 0.3,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Gemini API error:', response.status, errorData);

      let errorMessage = 'Gemini API request failed';
      if (response.status === 401 || response.status === 403) {
        errorMessage = 'Invalid Gemini API key';
      } else if (response.status === 429) {
        errorMessage = 'Gemini API rate limit exceeded';
      }

      return res.status(500).json({
        error: errorMessage,
        success: false
      });
    }

    const data = await response.json();
    console.log('✅ Gemini API response received');

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      return res.status(500).json({
        error: 'Invalid Gemini API response format',
        success: false
      });
    }

    const aiAdvice = data.candidates[0].content.parts[0].text;
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
    console.error('💥 Gemini API handler error:', error);
    return res.status(500).json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      success: false
    });
  }
}