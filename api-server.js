import express from 'express';
import geminiAdviceHandler from './api/gemini-advice.js';

const app = express();
const port = 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Route for the OpenAI advice API
// The handler function in api/openai-advice.js already handles CORS and method checks.
app.all('/api/gemini-advice', async (req, res) => {
  // Pass the Express req and res objects directly to the serverless handler
  await geminiAdviceHandler(req, res);
});

// Start the server
app.listen(port, () => {
  console.log(`API server listening at http://localhost:${port}`);
});