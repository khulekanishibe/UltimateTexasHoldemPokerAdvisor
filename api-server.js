import express from 'express';
import openaiAdviceHandler from './api/openai-advice.js';

const app = express();
const port = 3001;

// Use express.json() middleware to parse JSON request bodies
app.use(express.json());

// Handle CORS for all routes
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

// Route for the OpenAI advice API
app.post('/api/openai-advice', (req, res) => {
  openaiAdviceHandler(req, res);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API server is running' });
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 API server listening at http://localhost:${port}`);
  console.log(`📡 OpenAI endpoint: http://localhost:${port}/api/openai-advice`);
});