import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();

// Hardcoded API keys for testing
const GEMINI_API_KEY = 'AIzaSyBVYs5zBOe904DqPlBPFoB5Of-3ssViNcY'; // Dummy key, replace with your actual key
const API_KEY = 'd2d1';

// Configure CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

interface ScreenSpec {
  id: string;
  name: string;
  dimensions: {
    width: number;
    height: number;
  };
  elements: Array<{
    id: string;
    name: string;
    type: string;
    position: { x: number; y: number };
    dimensions: { width: number; height: number };
    content?: string;
    textStyle?: {
      fontFamily: string;
      fontSize: number;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: number;
      textAlign: string;
      color: string;
    };
    styling?: Record<string, any>;
    parent?: string;
    children?: string[];
    zIndex: number;
  }>;
  designSystem: string;
  layout?: Record<string, any>;
  dependencies: string[];
  interactions: Record<string, any>;
}

// Middleware to validate requests
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['authorization']?.split(' ')[1];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Generate analysis prompt
function generateAnalysisPrompt(screen: any, designSystem: string): string {
  return `
You are a UI/UX expert specializing in ${designSystem} implementation. Your task is to analyze this mobile app screen design and provide detailed specifications for implementation.

SCREEN CONTEXT:
- Name: ${screen.name}
- Dimensions: ${screen.dimensions.width}x${screen.dimensions.height}
- Design System: ${designSystem}
- Type: Mobile App Screen
- Purpose: ${screen.name.toLowerCase().includes('login') ? 'Authentication' : 
           screen.name.toLowerCase().includes('profile') ? 'User Profile' :
           screen.name.toLowerCase().includes('settings') ? 'App Settings' :
           screen.name.toLowerCase().includes('list') ? 'Data List' :
           screen.name.toLowerCase().includes('detail') ? 'Detail View' :
           'Main Screen'}

COMPONENTS:
${screen.elements.map((el: any) => `
  - ${el.name}
    Type: ${el.type}
    Position: (${el.position.x}, ${el.position.y})
    Dimensions: ${el.dimensions.width}x${el.dimensions.height}
    ${el.content ? `Content: ${el.content}` : ''}
    ${el.textStyle ? `Text Style: ${JSON.stringify(el.textStyle)}` : ''}
    ${el.styling ? `Styling: ${JSON.stringify(el.styling)}` : ''}
    ${el.parent ? `Parent: ${el.parent}` : ''}
    ${el.children ? `Children: ${el.children.join(', ')}` : ''}
    Z-Index: ${el.zIndex}
`).join('\n')}

Please provide a detailed analysis in the following structure:

1. SCREEN OVERVIEW
- Screen purpose and user flow
- Key user interactions
- Navigation context
- Data requirements

2. COMPONENT HIERARCHY
- Component tree structure
- Parent-child relationships
- Component dependencies
- Reusable components identification
- Component composition strategy

3. LAYOUT SPECIFICATIONS
- Layout system (Flex/Grid)
- Spacing system (margins, padding)
- Alignment rules
- Component positioning
- Responsive behavior
- Safe area considerations
- Platform-specific adjustments

4. DESIGN TOKENS
- Color system
  * Primary colors
  * Secondary colors
  * Accent colors
  * Background colors
  * Text colors
  * Status colors
- Typography system
  * Font families
  * Font sizes
  * Font weights
  * Line heights
  * Letter spacing
- Spacing scale
- Border radius system
- Shadow system
- Elevation levels
- Platform-specific tokens

5. INTERACTIVE STATES
- Touch states
- Focus states
- Disabled states
- Loading states
- Error states
- Success states
- Animation specifications
- Gesture handling

6. ACCESSIBILITY
- ARIA labels and roles
- Keyboard navigation
- Color contrast ratios
- Screen reader considerations
- Dynamic text sizing
- Platform accessibility features

7. IMPLEMENTATION RECOMMENDATIONS
- Component structure
- State management approach
- Performance optimizations
- ${designSystem} specific best practices
- Code organization
- Testing strategy
- Platform-specific considerations

8. ERROR HANDLING
- Error states
- Loading states
- Empty states
- Offline behavior
- Error recovery

Please be specific and provide concrete values where possible. Focus on practical implementation details that would help a developer build this screen accurately in ${designSystem}. Include specific component names from ${designSystem} where applicable.
`;
}

// Analyze screen structure
app.post('/api/analyze', validateRequest, async (req, res) => {
  try {
    console.log('Received analysis request:', {
      body: req.body,
      headers: req.headers
    });

    const { screen, designSystem } = req.body;
    if (!screen || !designSystem) {
      console.error('Missing required fields:', { screen, designSystem });
      return res.status(400).json({ error: 'Missing required fields: screen and designSystem' });
    }

    // Call Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: generateAnalysisPrompt(screen, designSystem)
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }

    const analysis = result.candidates[0].content.parts[0].text;
    const processedAnalysis = {
      ...screen,
      designSystem,
      analysis: {
        componentHierarchy: extractComponentHierarchy(analysis),
        layoutSpecs: extractLayoutSpecs(analysis),
        designTokens: extractDesignTokens(analysis),
        interactions: extractInteractions(analysis),
        accessibility: extractAccessibility(analysis),
        implementation: extractImplementation(analysis)
      }
    };

    console.log('Sending processed analysis response');
    res.json(processedAnalysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze screen',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions to extract structured data from AI response
function extractComponentHierarchy(analysis: string) {
  // Extract component hierarchy information
  return {
    structure: analysis.match(/Component hierarchy:([\s\S]*?)(?=Layout specifications:|$)/)?.[1]?.trim() || '',
    relationships: analysis.match(/Relationships:([\s\S]*?)(?=Design tokens:|$)/)?.[1]?.trim() || ''
  };
}

function extractLayoutSpecs(analysis: string) {
  // Extract layout specifications
  return {
    spacing: analysis.match(/Spacing:([\s\S]*?)(?=Alignment:|$)/)?.[1]?.trim() || '',
    alignment: analysis.match(/Alignment:([\s\S]*?)(?=Constraints:|$)/)?.[1]?.trim() || '',
    constraints: analysis.match(/Constraints:([\s\S]*?)(?=Interactive states:|$)/)?.[1]?.trim() || ''
  };
}

function extractDesignTokens(analysis: string) {
  // Extract design tokens
  return {
    colors: analysis.match(/Colors:([\s\S]*?)(?=Typography:|$)/)?.[1]?.trim() || '',
    typography: analysis.match(/Typography:([\s\S]*?)(?=Shadows:|$)/)?.[1]?.trim() || '',
    shadows: analysis.match(/Shadows:([\s\S]*?)(?=Accessibility:|$)/)?.[1]?.trim() || ''
  };
}

function extractInteractions(analysis: string) {
  // Extract interaction states and behaviors
  return {
    states: analysis.match(/States:([\s\S]*?)(?=Behaviors:|$)/)?.[1]?.trim() || '',
    behaviors: analysis.match(/Behaviors:([\s\S]*?)(?=Implementation:|$)/)?.[1]?.trim() || ''
  };
}

function extractAccessibility(analysis: string) {
  // Extract accessibility considerations
  return {
    considerations: analysis.match(/Accessibility:([\s\S]*?)(?=Implementation:|$)/)?.[1]?.trim() || '',
    recommendations: analysis.match(/Recommendations:([\s\S]*?)(?=Implementation:|$)/)?.[1]?.trim() || ''
  };
}

function extractImplementation(analysis: string) {
  // Extract implementation recommendations
  return {
    approach: analysis.match(/Implementation approach:([\s\S]*?)(?=Code structure:|$)/)?.[1]?.trim() || '',
    codeStructure: analysis.match(/Code structure:([\s\S]*?)(?=Best practices:|$)/)?.[1]?.trim() || '',
    bestPractices: analysis.match(/Best practices:([\s\S]*?)$/)?.[1]?.trim() || ''
  };
}

// Generate prompt
app.post('/api/prompt', validateRequest, async (req: Request, res: Response) => {
  try {
    const { screenSpec } = req.body as { screenSpec: ScreenSpec };
    const promptText = `Generate a detailed development prompt for this screen:\n${JSON.stringify(screenSpec, null, 2)}`;
    
    // Call Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: promptText
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

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});