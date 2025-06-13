import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { analyzeScreenStructure, generatePromptWithGemini } from '../src/config/gemini';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Middleware to validate requests
const validateRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Analyze screen structure
app.post('/api/analyze', validateRequest, async (req, res) => {
  try {
    const screenSpec = await analyzeScreenStructure(req.body);
    res.json(screenSpec);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze screen' });
  }
});

// Generate prompt
app.post('/api/prompt', validateRequest, async (req, res) => {
  try {
    const prompt = await generatePromptWithGemini(req.body);
    res.json({ prompt });
  } catch (error) {
    console.error('Prompt generation error:', error);
    res.status(500).json({ error: 'Failed to generate prompt' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 