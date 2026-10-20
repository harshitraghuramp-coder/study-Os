import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Initialize server-side Gemini client with User-Agent header
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health and Config endpoints
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'StudyOS AI Engine',
      provider: process.env.AI_PROVIDER || 'google-gemini',
      model: process.env.AI_MODEL || 'gemini-3.8-flash',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/chat/config', (_req: Request, res: Response) => {
    res.json({
      provider: process.env.AI_PROVIDER || 'google-gemini',
      model: process.env.AI_MODEL || 'gemini-3.8-flash',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      maxOutputTokens: Number(process.env.AI_MAX_OUTPUT_TOKENS) || 4096,
      timeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS) || 30000,
      modes: [
        { id: 'universal', name: 'Universal AI', description: 'Answers any questions across all knowledge domains' },
        { id: 'feynman', name: 'Feynman Explainer', description: 'Intuitive analogies and first-principles reasoning' },
        { id: 'socratic', name: 'Socratic Tutor', description: 'Step-by-step guided questions' },
        { id: 'code', name: 'Code & Debugger', description: 'Programming, algorithms, and technical debugging' },
        { id: 'math', name: 'Math & STEM', description: 'Rigorous step-by-step derivations and formulas' },
        { id: 'exam', name: 'Exam Prep & Active Recall', description: 'Practice drills, quizzes, and high-yield concepts' },
        { id: 'writing', name: 'Writing & Essay Coach', description: 'Clarity, argument structure, and style refinement' },
      ],
    });
  });

  // Universal AI Chatbot Streaming Endpoint (SSE)
  app.post('/api/chat/stream', async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        messages = [],
        mode = 'universal',
        context,
        documentContext,
        attachedContext,
        customInstruction,
      } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'Messages array is required' });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(503).json({
          error: 'Gemini API key is not configured. Please ensure GEMINI_API_KEY is configured in your environment secrets.',
        });
        return;
      }

      let systemPrompt = `You are StudyOS Universal AI, a capable, patient, rigorous, and knowledgeable general-purpose AI assistant.
Your capabilities:
1. Universal Knowledge: Answer questions across general knowledge, science (physics, chemistry, biology), mathematics, computer science & programming, engineering, languages & translation, history, geography, economics, philosophy, literature, and humanities.
2. Explanations: Explain difficult concepts using intuitive analogies, first-principles reasoning, and step-by-step problem-solving.
3. Programming: Provide accurate, well-commented code blocks with syntax highlighting, algorithm explanations, edge cases, and debugging advice.
4. Mathematical Rigor: Use clear step-by-step mathematical derivations and show intermediate work. Format formulas cleanly.
5. Study & Productivity: Help formulate study plans, exam preparation strategies, and active recall revision.
6. Uncertainty & Honesty: State clearly when you are uncertain or when information cannot be verified rather than inventing citations, papers, or facts.
7. Tone & Formatting: Speak with clarity, respect, and conciseness. Use structured Markdown with bold key terms, lists, tables, and code blocks.`;

      // Mode-specific persona enhancements
      if (mode === 'feynman') {
        systemPrompt += `\n\n[Mode: Feynman Concept Explainer]\nEmphasize the Feynman technique. Use intuitive real-world metaphors, eliminate unnecessary jargon or explain it immediately, break concepts down to first principles, and check understanding with a quick mental thought experiment.`;
      } else if (mode === 'socratic') {
        systemPrompt += `\n\n[Mode: Socratic Method]\nAct as a Socratic tutor. Do NOT immediately hand over the final answer. Instead, ask probing diagnostic questions, provide hints, and guide the student to discover and derive the solution step by step.`;
      } else if (mode === 'code') {
        systemPrompt += `\n\n[Mode: Code & Algorithms Specialist]\nProvide production-grade, idiomatic code examples. Include comments, time and space complexity ($O(n)$ notation), edge cases, and best engineering practices. Use language tags on all code fences.`;
      } else if (mode === 'math') {
        systemPrompt += `\n\n[Mode: Mathematics & Science Rigor]\nBreak problems down into distinct logical steps. Show intermediate algebraic and calculus transformations. State the relevant definitions, theorems, or physical laws before applying them.`;
      } else if (mode === 'exam') {
        systemPrompt += `\n\n[Mode: Active Recall & Exam Prep]\nFocus on high-yield exam concepts, common trap answers, memory mnemonics, and active self-testing questions.`;
      } else if (mode === 'writing') {
        systemPrompt += `\n\n[Mode: Writing & Argumentation Coach]\nAnalyze argument structure, thesis clarity, flow, tone, and conciseness. Offer constructive revisions while preserving the student's authentic voice.`;
      }

      if (context) {
        systemPrompt += `\n\n[Active Student Context]\nLearning Level: ${context.learning_category || 'general'}\nActive Subjects: ${JSON.stringify(context.subjects || [])}\nUpcoming Deadlines: ${JSON.stringify(context.deadlines || [])}\nUse this context when relevant to the user's query, but answer general questions directly without forcing unnecessary academic framing.`;
      }

      if (documentContext) {
        systemPrompt += `\n\n[Attached Study Document Excerpt]\n"""\n${documentContext.slice(0, 10000)}\n"""\nWhen questions relate to this document, ground your answers in this text and cite specific passages.`;
      }

      if (attachedContext) {
        systemPrompt += `\n\n[User Attached ${attachedContext.type || 'Context'}: "${attachedContext.name || 'Untitled'}"]\n"""\n${String(attachedContext.content || '').slice(0, 8000)}\n"""\nTake this attached material into account when answering.`;
      }

      if (customInstruction) {
        systemPrompt += `\n\n[User Custom Instruction]\n${customInstruction}`;
      }

      // Convert messages to Gemini contents format
      // Retain recent messages for context window management
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
      const recentMessages = messages.slice(-16);

      for (const m of recentMessages) {
        if (m.role === 'user' || m.role === 'assistant') {
          let text = String(m.content || '');
          if (m.attachment?.content) {
            text += `\n\n[Attached File: ${m.attachment.name}]\n${m.attachment.content.slice(0, 4000)}`;
          }
          contents.push({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text }],
          });
        }
      }

      // Set headers for Server-Sent Events (SSE)
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      let isAborted = false;
      req.on('close', () => {
        isAborted = true;
      });

      let responseStream;
      const primaryModel = process.env.AI_MODEL || 'gemini-3.8-flash';
      try {
        responseStream = await ai.models.generateContentStream({
          model: primaryModel,
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
          },
        });
      } catch (primaryErr: any) {
        console.warn(`Primary model ${primaryModel} failed, trying fallback:`, primaryErr?.message);
        // Fallback to flash-latest or 3.1-flash-lite
        const fallbackModel = primaryModel === 'gemini-3.8-flash' ? 'gemini-flash-latest' : 'gemini-3.1-flash-lite';
        responseStream = await ai.models.generateContentStream({
          model: fallbackModel,
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
          },
        });
      }

      for await (const chunk of responseStream) {
        if (isAborted) break;
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      if (!isAborted) {
        res.write('data: [DONE]\n\n');
      }
      res.end();
    } catch (error: any) {
      console.error('Error in /api/chat/stream:', error);
      let errorMsg = error?.message || 'Internal server error';
      try {
        const parsed = JSON.parse(errorMsg);
        if (parsed?.error?.message) {
          try {
            const inner = JSON.parse(parsed.error.message);
            errorMsg = inner?.error?.message || parsed.error.message;
          } catch {
            errorMsg = parsed.error.message;
          }
        }
      } catch {}

      if (!res.headersSent) {
        res.status(500).json({
          error: 'Failed to process AI chat stream',
          details: errorMsg,
        });
      } else {
        res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
        res.end();
      }
    }
  });

  // Conversation Auto-Titling Endpoint
  app.post('/api/chat/title', async (req: Request, res: Response): Promise<void> => {
    try {
      const { firstMessage } = req.body;
      if (!firstMessage || typeof firstMessage !== 'string') {
        res.status(400).json({ error: 'firstMessage is required' });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Create a brief 3 to 5 word topic title for this user query. Return only the title text with no quotation marks or punctuation:\n"${firstMessage.slice(0, 500)}"`,
      });

      const title = (response.text || 'Study Session').trim().replace(/["\n\r]/g, '');
      res.json({ title: title.slice(0, 45) });
    } catch (error: any) {
      console.error('Error generating title:', error);
      res.json({ title: 'New Conversation' });
    }
  });

  // 1. AI Study Tutor Endpoint (Explain, Socratic, Concept breakdown)
  app.post('/api/ai/tutor', async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        message,
        history = [],
        mode = 'explain',
        subject = 'General',
        level = 'college',
      } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const systemPrompt = `You are StudyOS AI, an elite educational tutor and study assistant.
Target student level: ${level}.
Active subject: ${subject}.
Mode: ${mode}.

Instructions based on mode:
- If mode is "explain": Use the Feynman technique. Give a clear real-world analogy first, derive the concept from first principles, and summarize key takeaways.
- If mode is "socratic": Ask probing, step-by-step diagnostic questions to guide the student toward deriving the answer independently.
- If mode is "weak_topics": Analyze the topic, identify standard student misconceptions, and propose 2 concrete targeted drill exercises.
- If mode is "coach": Provide evidence-based cognitive advice on pacing, spacing effect, active retrieval, and focus stamina.

Formatting: Use clean Markdown, bolding, concise bullet points, and high signal-to-noise ratio. Never hallucinate sources.`;

      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(history) && history.length > 0) {
        for (const item of history.slice(-6)) {
          if (item.role === 'user' || item.role === 'assistant') {
            contents.push({
              role: item.role === 'user' ? 'user' : 'model',
              parts: [{ text: String(item.content) }],
            });
          }
        }
      }

      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });

      res.json({
        reply: response.text || 'I am ready to help you master this topic. What specific problem or question are you stuck on?',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error in /api/ai/tutor:', error);
      res.status(500).json({
        error: 'Failed to generate tutor response',
        details: error?.message || 'Internal server error',
      });
    }
  });

  // 2. Structured Study Plan Generator Endpoint
  app.post('/api/ai/plan-generator', async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        tasks = [],
        availableHoursPerDay = 3,
        startDate = new Date().toISOString().split('T')[0],
        goals = ['Prepare for exams'],
        subjects = [],
      } = req.body;

      const prompt = `Generate a realistic, balanced, multi-day StudyOS study plan draft.
User Goals: ${JSON.stringify(goals)}
Target Subjects: ${JSON.stringify(subjects)}
Available Study Capacity: ${availableHoursPerDay} hours per day
Planning Start Date: ${startDate}
Existing Pending Tasks: ${JSON.stringify(tasks)}

Strict Guidelines:
1. Never over-schedule or fill every minute; leave buffer for cognitive recovery.
2. Max session length per block: 25-50 minutes.
3. Prioritize urgent deadlines first.
4. Include at least 1 revision/spaced retrieval block.
5. Provide actionable rationale and warn if workload exceeds available time.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              rationale: { type: Type.STRING },
              warnings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    task_title: { type: Type.STRING },
                    subject_name: { type: Type.STRING },
                    scheduled_start: { type: Type.STRING, description: 'ISO 8601 string or YYYY-MM-DDTHH:MM:SS' },
                    scheduled_end: { type: Type.STRING, description: 'ISO 8601 string or YYYY-MM-DDTHH:MM:SS' },
                    duration_minutes: { type: Type.INTEGER },
                    reason: { type: Type.STRING },
                  },
                  required: ['task_title', 'subject_name', 'scheduled_start', 'scheduled_end', 'duration_minutes', 'reason'],
                },
              },
            },
            required: ['title', 'rationale', 'items'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (error: any) {
      console.error('Error in /api/ai/plan-generator:', error);
      res.status(500).json({
        error: 'Failed to generate study plan',
        details: error?.message || 'Internal server error',
      });
    }
  });

  // 3. AI Summarizer Tool Endpoint
  app.post('/api/ai/summarize', async (req: Request, res: Response): Promise<void> => {
    try {
      const { text, format = 'detailed' } = req.body;

      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'Text content is required' });
        return;
      }

      const prompt = `Analyze and summarize the following study material in format: "${format}".
Material:
"""
${text.slice(0, 8000)}
"""

Produce structured output according to the schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: 'High-level synthesis' },
              keyConcepts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Crucial definitions and theorems',
              },
              flashcards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING },
                  },
                  required: ['question', 'answer'],
                },
              },
              revisionChecklist: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['summary', 'keyConcepts', 'flashcards', 'revisionChecklist'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (error: any) {
      console.error('Error in /api/ai/summarize:', error);
      res.status(500).json({
        error: 'Failed to summarize material',
        details: error?.message || 'Internal server error',
      });
    }
  });

  // 4. AI Quiz Generator Endpoint
  app.post('/api/ai/quiz-generator', async (req: Request, res: Response): Promise<void> => {
    try {
      const { topic, difficulty = 'intermediate', count = 3 } = req.body;

      if (!topic) {
        res.status(400).json({ error: 'Topic is required' });
        return;
      }

      const prompt = `Generate a ${count}-question active recall quiz for the topic "${topic}" at "${difficulty}" difficulty.
Each question must test conceptual understanding rather than mere trivia. Include 4 distinct options, the zero-based index of the correct option, and a 1-sentence conceptual explanation.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correct_index: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                  },
                  required: ['question', 'options', 'correct_index', 'explanation'],
                },
              },
            },
            required: ['topic', 'questions'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (error: any) {
      console.error('Error in /api/ai/quiz-generator:', error);
      res.status(500).json({
        error: 'Failed to generate quiz',
        details: error?.message || 'Internal server error',
      });
    }
  });

  // 5. Document Q&A Endpoint
  app.post('/api/ai/document-qa', async (req: Request, res: Response): Promise<void> => {
    try {
      const { documentText, question } = req.body;

      if (!documentText || !question) {
        res.status(400).json({ error: 'documentText and question are required' });
        return;
      }

      const prompt = `You are StudyOS Document Assistant. Answer the question strictly using context from the document provided below.
If the answer cannot be determined from the document, explicitly state that rather than inventing information. Cite specific passages or section titles where possible.

Document Passage:
"""
${documentText.slice(0, 10000)}
"""

Question: ${question}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      res.json({
        answer: response.text || 'Unable to generate answer from the provided document context.',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error in /api/ai/document-qa:', error);
      res.status(500).json({
        error: 'Failed to process document Q&A',
        details: error?.message || 'Internal server error',
      });
    }
  });

  // 6. RFC 5545 iCalendar (.ics) Export Endpoint
  app.post('/api/calendar/export-ics', (req: Request, res: Response) => {
    try {
      const { events = [] } = req.body;

      const formatICSDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//StudyOS Learning Platform//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:StudyOS Schedule',
        'X-WR-TIMEZONE:UTC',
      ];

      for (const ev of events) {
        const uid = `studyos-${ev.id || Math.random().toString(36).substring(2)}@studyos.io`;
        const start = formatICSDate(ev.startTime || ev.scheduled_start || new Date().toISOString());
        const end = formatICSDate(ev.endTime || ev.scheduled_end || new Date(Date.now() + 45 * 60000).toISOString());
        const summary = (ev.title || 'Study Session').replace(/[,;\\]/g, ' ');
        const description = (ev.description || 'Focus study block organized via StudyOS').replace(/[,;\\]/g, ' ');

        icsLines.push('BEGIN:VEVENT');
        icsLines.push(`UID:${uid}`);
        icsLines.push(`DTSTAMP:${formatICSDate(new Date().toISOString())}`);
        icsLines.push(`DTSTART:${start}`);
        icsLines.push(`DTEND:${end}`);
        icsLines.push(`SUMMARY:${summary}`);
        icsLines.push(`DESCRIPTION:${description}`);
        icsLines.push('STATUS:CONFIRMED');
        icsLines.push('END:VEVENT');
      }

      icsLines.push('END:VCALENDAR');

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="studyos-schedule.ics"');
      res.send(icsLines.join('\r\n'));
    } catch (error: any) {
      console.error('Error generating .ics:', error);
      res.status(500).json({ error: 'Failed to generate calendar file' });
    }
  });

  // Mount Vite in dev mode or serve static in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudyOS server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
