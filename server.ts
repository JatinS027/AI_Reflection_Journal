import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Top-Level Request Deserialization Middleware (Mounted before routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy Google GenAI Client
let genAIInstance: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({ apiKey });
  }
  return genAIInstance;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash'
];

interface FallbackOptions {
  systemInstruction?: string;
  contents: any;
  config?: Record<string, any>;
}

// Helper to extract clean error message and status code from Gemini errors
function parseGeminiError(err: any): { message: string; statusCode: number | null; isTransient: boolean } {
  let message = err?.message || String(err || 'Unknown error');
  let statusCode: number | null = null;

  try {
    // Attempt parsing if message is a JSON string
    if (typeof message === 'string' && message.startsWith('{') && message.includes('"error"')) {
      const parsed = JSON.parse(message);
      if (parsed?.error) {
        statusCode = parsed.error.code || null;
        message = parsed.error.message || message;
      }
    }
  } catch {
    // Ignore JSON parsing failure and retain raw message
  }

  if (!statusCode && err?.status) {
    statusCode = typeof err.status === 'number' ? err.status : parseInt(err.status, 10) || null;
  }

  const isTransient = statusCode === 503 || statusCode === 429 || statusCode === 500 || statusCode === 504 ||
    message.includes('503') || message.includes('high demand') || message.includes('UNAVAILABLE') || message.includes('RESOURCE_EXHAUSTED');

  return { message, statusCode, isTransient };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateContentWithFallback(options: FallbackOptions) {
  const ai = getGenAI();
  let lastError: any = null;
  let lastParsedError: { message: string; statusCode: number | null } = { message: '', statusCode: null };

  for (let i = 0; i < MODEL_FALLBACK_LADDER.length; i++) {
    const model = MODEL_FALLBACK_LADDER[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: 0.7,
          ...options.config,
        },
      });

      if (response && response.text) {
        return {
          text: response.text,
          modelUsed: model,
        };
      }
    } catch (err: any) {
      const { message, statusCode, isTransient } = parseGeminiError(err);
      lastError = err;
      lastParsedError = { message, statusCode };

      const nextModel = i < MODEL_FALLBACK_LADDER.length - 1 ? MODEL_FALLBACK_LADDER[i + 1] : null;
      console.warn(
        `[Gemini Fallback] Model ${model} returned ${statusCode ? `status ${statusCode}` : 'error'}: "${message}". ` +
        (nextModel ? `Attempting next fallback model: ${nextModel}...` : 'No further models in fallback ladder.')
      );

      // If transient error (503 / 429), brief pause before attempting next candidate
      if (isTransient && nextModel) {
        await delay(250);
      }
    }
  }

  const failureMsg = lastParsedError.message || lastError?.message || 'All Gemini models in fallback ladder are currently experiencing high demand. Please retry in a moment.';
  throw new Error(failureMsg);
}

// --- API Endpoints ---

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Multi-turn Reflection & Brainstorming Endpoint
app.post('/api/gemini/reflect', async (req: Request, res: Response) => {
  try {
    const payload = (req.body && typeof req.body === 'object') ? req.body : {};
    const prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : '';
    const category = typeof payload.category === 'string' ? payload.category : 'reflection';
    const mood = typeof payload.mood === 'string' ? payload.mood : 'reflective';
    const location = (payload.location && typeof payload.location === 'object') ? payload.location : null;
    const history = Array.isArray(payload.history) ? payload.history : [];

    if (!prompt) {
      return res.status(400).json({ error: 'Journal prompt text is required.' });
    }

    const locationContext = location && (location.name || location.address || (location.lat && location.lng))
      ? `\n- Pinned Location: ${[location.name, location.address].filter(Boolean).join(', ') || `Coordinates (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`}. When appropriate or evocative, subtly ground your reflection in the mindfulness or environment of this place.`
      : '';

    const systemInstruction = `You are a supportive, empathetic, and insightful AI Reflection Companion and Journaling Mentor.
Your purpose is to help the user unpack their thoughts, recognize emotional patterns, practice cognitive reframing, and uncover actionable insights or creative ideas.

Guidelines:
- Tone: Warm, grounded, psychologically minded, non-judgmental, and encouraging.
- For category "${category}" and user mood "${mood}":
  - Acknowledge and validate feelings genuinely without toxic positivity.
  - Highlight key themes, strengths, or unspoken tensions in what the user shared.
  - Offer a reframing perspective or creative brainstorming angles when helpful.${locationContext}
  - End with 1-2 open-ended, gently probing reflection questions to spark deeper self-discovery.
- Format responses cleanly with readable paragraphs, markdown bullet points for clarity, and concise structure. Avoid overwhelming walls of text.`;

    // Construct conversation contents with historical turns
    const contents: any[] = [];
    for (const msg of history) {
      if (msg && typeof msg.text === 'string' && msg.text.trim()) {
        contents.push({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.text.trim() }],
        });
      }
    }

    // Add current turn
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const result = await generateContentWithFallback({
      systemInstruction,
      contents,
    });

    return res.json({
      success: true,
      text: result.text,
      model: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/reflect:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate reflection response.',
    });
  }
});

// Comprehensive Entry Summarization & Takeaways Endpoint
app.post('/api/gemini/summarize', async (req: Request, res: Response) => {
  try {
    const payload = (req.body && typeof req.body === 'object') ? req.body : {};
    const prompt = typeof payload.prompt === 'string' ? payload.prompt : '';
    const responseText = typeof payload.response === 'string' ? payload.response : '';
    const messages = Array.isArray(payload.messages) ? payload.messages : [];

    if (!prompt && messages.length === 0) {
      return res.status(400).json({ error: 'Entry content is required to summarize.' });
    }

    const conversationTranscript = messages.map((m: any) => `${m.role === 'user' ? 'User' : 'Gemini'}: ${m.text}`).join('\n\n');
    const fullContent = conversationTranscript || `User Entry:\n${prompt}\n\nAI Reflection:\n${responseText}`;

    const systemInstruction = `You are an expert executive coach and qualitative analyst.
Analyze the provided journal entry and conversation. Produce a clean structured JSON response with:
1. "summary": A 2-3 sentence synthesized summary of the core reflection.
2. "keyInsights": Array of 2-4 key takeaways or mindset shifts identified.
3. "actionItems": Array of 2-3 tangible micro-habits, next steps, or daily inquiries.

Return ONLY valid JSON matching this schema:
{
  "summary": "...",
  "keyInsights": ["...", "..."],
  "actionItems": ["...", "..."]
}`;

    const result = await generateContentWithFallback({
      systemInstruction,
      contents: [{ role: 'user', parts: [{ text: fullContent }] }],
      config: {
        responseMimeType: 'application/json',
      }
    });

    let parsed = null;
    try {
      parsed = JSON.parse(result.text);
    } catch {
      // Fallback parsing if JSON contains backticks or extra text
      const cleanJson = result.text.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    }

    return res.json({
      success: true,
      data: parsed,
      model: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/summarize:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to synthesize summary.',
    });
  }
});

// Dynamic Daily Prompts Generator
app.post('/api/gemini/prompts', async (req: Request, res: Response) => {
  try {
    const payload = (req.body && typeof req.body === 'object') ? req.body : {};
    const category = typeof payload.category === 'string' ? payload.category : 'mindfulness';
    const mood = typeof payload.mood === 'string' ? payload.mood : 'calm';

    const systemInstruction = `Generate 4 inspiring, fresh, and deeply resonant journal prompts for someone feeling "${mood}" focused on "${category}".
Return ONLY a valid JSON array of 4 strings.
Example: ["Prompt 1", "Prompt 2", "Prompt 3", "Prompt 4"]`;

    const result = await generateContentWithFallback({
      systemInstruction,
      contents: [{ role: 'user', parts: [{ text: `Generate prompts for category: ${category}, mood: ${mood}` }] }],
      config: {
        responseMimeType: 'application/json',
      }
    });

    let prompts: string[] = [];
    try {
      prompts = JSON.parse(result.text);
    } catch {
      const clean = result.text.replace(/```json\n?|\n?```/g, '').trim();
      prompts = JSON.parse(clean);
    }

    return res.json({
      success: true,
      prompts: Array.isArray(prompts) ? prompts : [],
      model: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/prompts:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate prompts.',
      prompts: [
        'What moment from today made you feel most energized or grateful?',
        'What is a current challenge that is secretly teaching you something valuable?',
        'What is one boundary or intention you would like to set for tomorrow?',
        'If you could give your present self one piece of compassionate advice, what would it be?'
      ]
    });
  }
});

// Vite & Static Asset Handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Reflection Journal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
