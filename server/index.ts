import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

interface ScreenSpec {
  // Add your screen spec interface here
  [key: string]: any;
}

// Middleware to validate requests
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['authorization']?.split(' ')[1];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Analyze screen structure
app.post('/api/analyze', validateRequest, async (req: Request, res: Response) => {
  try {
    const { screen } = req.body as { screen: ScreenSpec };
    
    // Call Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this screen structure and provide detailed specifications:\n${JSON.stringify(screen, null, 2)}`
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze screen' });
  }
});

// Generate prompt
app.post('/api/prompt', validateRequest, async (req: Request, res: Response) => {
  try {
    const { screenSpec } = req.body as { screenSpec: ScreenSpec };
    
    // Call Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate a detailed development prompt for this screen:\n${JSON.stringify(screenSpec, null, 2)}`
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const prompt = result.candidates[0].content.parts[0].text;
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