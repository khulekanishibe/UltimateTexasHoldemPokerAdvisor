import express from 'express';
import openaiAdviceHandler from './api/openai-advice.js';

const app = express();
const port = 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Add CORS middleware for all routes
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Root path handler
app.get('/', (req, res) => {
  res.json({
    message: 'Ultimate Texas Hold\'em Advisor API Server',
    status: 'running',
    endpoints: {
      'POST /api/openai-advice': 'Get AI poker advice'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Route for the OpenAI advice API
app.all('/api/openai-advice', async (req, res) => {
  try {
    await openaiAdviceHandler(req, res);
  } catch (error) {
    console.error('API handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      success: false
    });
  }
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'POST /api/openai-advice'
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    success: false
  });
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 API server listening at http://localhost:${port}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  http://localhost:${port}/`);
  console.log(`   GET  http://localhost:${port}/health`);
  console.log(`   POST http://localhost:${port}/api/openai-advice`);
});