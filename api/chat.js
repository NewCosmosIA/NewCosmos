// api/chat.js — Vercel Serverless Function
// Proxy seguro entre o frontend NewCosmos e a API da Anthropic
// Rastreia tokens e custo por sessão

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;

// Preços claude-sonnet-4-20250514 (por milhão de tokens)
const PRICE_INPUT_PER_M  = 3.00;
const PRICE_OUTPUT_PER_M = 15.00;

async function updateTokenCost(token, inputTokens, outputTokens) {
  if (!token || !SUPABASE_URL || !SUPABASE_SECRET) return;

  const costUsd = (inputTokens / 1_000_000 * PRICE_INPUT_PER_M) +
                  (outputTokens / 1_000_000 * PRICE_OUTPUT_PER_M);

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/sessions?token=eq.${token}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SECRET,
        'Authorization': `Bearer ${SUPABASE_SECRET}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        tokens_input:  inputTokens,
        tokens_output: outputTokens,
        cost_usd:      costUsd
      })
    });
  } catch (err) {
    console.error('[TOKEN TRACK ERROR]', err.message);
  }
}

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

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY não configurada');
    return res.status(500).json({ error: 'Configuração do servidor incompleta' });
  }

  const { messages, system, session_token } = req.body;

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

    // Rastrear tokens e custo no Supabase (não bloqueia a resposta)
    if (session_token && data.usage) {
      const { input_tokens, output_tokens } = data.usage;
      updateTokenCost(session_token, input_tokens || 0, output_tokens || 0);
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('Erro interno:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
