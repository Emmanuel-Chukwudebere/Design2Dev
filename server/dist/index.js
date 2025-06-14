"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_fetch_1 = __importDefault(require("node-fetch"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Hardcoded API keys for testing
const GEMINI_API_KEY = 'AIzaSyBVYs5zBOe904DqPlBPFoB5Of-3ssViNcY'; // Dummy key, replace with your actual key
const API_KEY = 'd2d1';
// Configure CORS
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express_1.default.json());
// Middleware to validate requests
const validateRequest = (req, res, next) => {
    var _a;
    const apiKey = (_a = req.headers['authorization']) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};
// Add function to list available models
async function listAvailableModels() {
    try {
        const response = await (0, node_fetch_1.default)('https://generativelanguage.googleapis.com/v1/models', {
            headers: {
                'x-goog-api-key': GEMINI_API_KEY
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to list models:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            return null;
        }
        const data = await response.json();
        console.log('Available models:', data);
        return data;
    }
    catch (error) {
        console.error('Error listing models:', error);
        return null;
    }
}
// Analyze screen structure
app.post('/api/analyze', validateRequest, async (req, res) => {
    var _a, _b, _c, _d, _e;
    try {
        console.log('Received analysis request:', {
            body: req.body,
            headers: req.headers
        });
        // List available models first
        const models = await listAvailableModels();
        if (!models) {
            throw new Error('Failed to get available models');
        }
        const { screen, designSystem } = req.body;
        if (!screen || !designSystem) {
            console.error('Missing required fields:', { screen, designSystem });
            return res.status(400).json({ error: 'Missing required fields: screen and designSystem' });
        }
        // Prepare the prompt for AI analysis
        const prompt = `
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
${screen.elements.map(el => `
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
        console.log('Calling Gemini API with prompt:', prompt);
        // Call Gemini API
        const response = await (0, node_fetch_1.default)('https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GEMINI_API_KEY
            },
            body: JSON.stringify({
                contents: [{
                        parts: [{
                                text: prompt
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
        console.log('Received Gemini API response:', result);
        if (!((_e = (_d = (_c = (_b = (_a = result.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text)) {
            throw new Error('Invalid response format from Gemini API');
        }
        const analysis = result.candidates[0].content.parts[0].text;
        // Process and structure the AI response
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
    }
    catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze screen',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Helper functions to extract structured data from AI response
function extractComponentHierarchy(analysis) {
    var _a, _b, _c, _d;
    // Extract component hierarchy information
    return {
        structure: ((_b = (_a = analysis.match(/Component hierarchy:([\s\S]*?)(?=Layout specifications:|$)/)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trim()) || '',
        relationships: ((_d = (_c = analysis.match(/Relationships:([\s\S]*?)(?=Design tokens:|$)/)) === null || _c === void 0 ? void 0 : _c[1]) === null || _d === void 0 ? void 0 : _d.trim()) || ''
    };
}
function extractLayoutSpecs(analysis) {
    var _a, _b, _c, _d, _e, _f;
    // Extract layout specifications
    return {
        spacing: ((_b = (_a = analysis.match(/Spacing:([\s\S]*?)(?=Alignment:|$)/)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trim()) || '',
        alignment: ((_d = (_c = analysis.match(/Alignment:([\s\S]*?)(?=Constraints:|$)/)) === null || _c === void 0 ? void 0 : _c[1]) === null || _d === void 0 ? void 0 : _d.trim()) || '',
        constraints: ((_f = (_e = analysis.match(/Constraints:([\s\S]*?)(?=Interactive states:|$)/)) === null || _e === void 0 ? void 0 : _e[1]) === null || _f === void 0 ? void 0 : _f.trim()) || ''
    };
}
function extractDesignTokens(analysis) {
    var _a, _b, _c, _d, _e, _f;
    // Extract design tokens
    return {
        colors: ((_b = (_a = analysis.match(/Colors:([\s\S]*?)(?=Typography:|$)/)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trim()) || '',
        typography: ((_d = (_c = analysis.match(/Typography:([\s\S]*?)(?=Shadows:|$)/)) === null || _c === void 0 ? void 0 : _c[1]) === null || _d === void 0 ? void 0 : _d.trim()) || '',
        shadows: ((_f = (_e = analysis.match(/Shadows:([\s\S]*?)(?=Accessibility:|$)/)) === null || _e === void 0 ? void 0 : _e[1]) === null || _f === void 0 ? void 0 : _f.trim()) || ''
    };
}
function extractInteractions(analysis) {
    var _a, _b, _c, _d;
    // Extract interaction states and behaviors
    return {
        states: ((_b = (_a = analysis.match(/States:([\s\S]*?)(?=Behaviors:|$)/)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trim()) || '',
        behaviors: ((_d = (_c = analysis.match(/Behaviors:([\s\S]*?)(?=Implementation:|$)/)) === null || _c === void 0 ? void 0 : _c[1]) === null || _d === void 0 ? void 0 : _d.trim()) || ''
    };
}
function extractAccessibility(analysis) {
    var _a, _b, _c, _d;
    // Extract accessibility considerations
    return {
        considerations: ((_b = (_a = analysis.match(/Accessibility:([\s\S]*?)(?=Implementation:|$)/)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trim()) || '',
        recommendations: ((_d = (_c = analysis.match(/Recommendations:([\s\S]*?)(?=Implementation:|$)/)) === null || _c === void 0 ? void 0 : _c[1]) === null || _d === void 0 ? void 0 : _d.trim()) || ''
    };
}
function extractImplementation(analysis) {
    var _a, _b, _c, _d, _e, _f;
    // Extract implementation recommendations
    return {
        approach: ((_b = (_a = analysis.match(/Implementation approach:([\s\S]*?)(?=Code structure:|$)/)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trim()) || '',
        codeStructure: ((_d = (_c = analysis.match(/Code structure:([\s\S]*?)(?=Best practices:|$)/)) === null || _c === void 0 ? void 0 : _c[1]) === null || _d === void 0 ? void 0 : _d.trim()) || '',
        bestPractices: ((_f = (_e = analysis.match(/Best practices:([\s\S]*?)$/)) === null || _e === void 0 ? void 0 : _e[1]) === null || _f === void 0 ? void 0 : _f.trim()) || ''
    };
}
// Generate prompt
app.post('/api/prompt', validateRequest, async (req, res) => {
    try {
        const { screenSpec } = req.body;
        const promptText = `Generate a detailed development prompt for this screen:\n${JSON.stringify(screenSpec, null, 2)}`;
        // Call Gemini API
        const response = await (0, node_fetch_1.default)('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
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
    }
    catch (error) {
        console.error('Prompt generation error:', error);
        res.status(500).json({ error: 'Failed to generate prompt' });
    }
});
const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
