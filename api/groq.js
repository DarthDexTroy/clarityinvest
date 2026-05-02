import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'Missing GROQ_API_KEY environment variable' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const {
      messages,
      model = 'llama-3.3-70b-versatile',
      temperature = 0.7,
      max_tokens = 200,
      response_format
    } = body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages must be a non-empty array' });
    }

    const completion = await groq.chat.completions.create({
      messages,
      model,
      temperature,
      max_tokens,
      ...(response_format ? { response_format } : {})
    });

    return res.status(200).json({
      content: completion.choices[0]?.message?.content || ''
    });
  } catch (error) {
    console.error('Groq API proxy error:', error);
    return res.status(500).json({
      error: error?.message || 'Groq API request failed'
    });
  }
}
