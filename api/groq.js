import Groq from 'groq-sdk';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'Missing Groq API key. Add GROQ_API_KEY in Vercel Project Settings > Environment Variables.'
    });
  }

  try {
    const groq = new Groq({ apiKey });
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
    const status = Number(error?.status || error?.statusCode) || 500;
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: error?.message || 'Groq API request failed'
    });
  }
}
