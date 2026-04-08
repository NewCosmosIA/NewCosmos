// api/chat.js — Vercel Serverless Function
// Proxy seguro entre o frontend NewCosmos e a API da Anthropic
// A chave de API NUNCA chega ao navegador do cliente

export default async function handler(req, res) {

  // ── CORS ──────────────────────────────────────────────────
  const allowedOrigins = [
    'https://newcosmos.co',
    'https://www.newcosmos.co',
    'https://newcosmos.com.br',
    'https://www.newcosmos.com.br',
    'http://localhost:3000'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY não configurada');
    return res.status(500).json({ error: 'Configuração do servidor incompleta' });
  }

  const { messages, system } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Campo messages inválido' });
  }

  if (messages.length > 60) {
    return res.status(400).json({ error: 'Histórico muito longo' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: system || '',
        messages: messages
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erro da API Anthropic:', response.status, errorData);
      return res.status(response.status).json({
        error: 'Erro ao comunicar com o serviço de IA',
        details: errorData
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('Erro interno:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
