require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.GEMINI_API_KEY;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Hinglish Converter API', version: '1.0.0' });
});

// POST /convert — English to Hinglish conversion
app.post('/convert', async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required and must be a non-empty string.' });
  }

  if (text.trim().length > 10000) {
    return res.status(400).json({ error: 'Text exceeds maximum length of 10,000 characters.' });
  }

  const prompt = `Convert the following English text into natural Hinglish.

Rules:
1. Use Hindi words WRITTEN IN ENGLISH SCRIPT (Roman Urdu / Romanized Hindi) — NOT Devanagari script.
2. Keep it natural and conversational, like how young Indians actually speak.
3. Maintain the original meaning accurately.
4. Do not translate proper nouns, names, or technical terms.
5. Mix English and Hindi fluidly — do not translate every single word.
6. Output ONLY the converted Hinglish text. No explanations, no labels, no quotes.

English Text:
${text.trim()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Gemini API error:', response.status, errBody);
      return res.status(502).json({ error: 'AI service error. Please try again.' });
    }

    const data = await response.json();
    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!result) {
      return res.status(502).json({ error: 'Empty response from AI service.' });
    }

    return res.json({
      result,
      model: 'gemini-2.5-flash',
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timed out. Please try again.' });
    }
    console.error('Server error:', err.message);
    return res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Hinglish Converter API running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Convert: POST http://localhost:${PORT}/convert\n`);
});
