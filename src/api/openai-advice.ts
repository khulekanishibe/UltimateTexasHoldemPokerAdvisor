/**
 * OpenAI API Serverless Endpoint for Ultimate Texas Hold'em Advisor
 * 
 * This serverless function handles OpenAI API calls securely
 * by keeping the API key on the server side using environment variables.
 * 
 * Environment Variables Required:
 * - OPENAI_API_KEY: Your OpenAI API key (set in Bolt Project Settings)
 * 
 * Usage:
 * POST /api/openai-advice
 * Body: { prompt: "poker analysis prompt" }
 * 
 * Response: { advice: "AI generated advice", success: true }
 */

export const POST = async ({ request }: { request: Request }) => {
  try {
    // Parse the request body
    const { prompt } = await request.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ 
          error: 'Prompt is required',
          success: false 
        }), 
        {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        }
      );
    }

    // Check for OpenAI API key
    const apiKey = import.meta.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('❌ OPENAI_API_KEY environment variable not set');
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in environment variables.',
          success: false 
        }), 
        {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    console.log('🤖 Making OpenAI API request...');

    // Call OpenAI API with GPT-4
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
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
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          success: false 
        }), 
        {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const data = await response.json();
    console.log('✅ OpenAI API response received');

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid OpenAI API response format',
          success: false 
        }), 
        {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
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

    return new Response(
      JSON.stringify({ 
        advice: parsedAdvice,
        success: true 
      }), 
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );

  } catch (error) {
    console.error('💥 OpenAI API handler error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false 
      }), 
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
};

// Handle CORS preflight requests
export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};