// api/validate-token.js
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token, action } = req.body;
  if (!token) return res.status(400).json({ valid: false, error: 'Token não informado' });

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/sessions?token=eq.${token}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_SECRET,
          'Authorization': `Bearer ${SUPABASE_SECRET}`
        }
      }
    );

    const rows = await response.json();

    if (!rows || rows.length === 0) {
      return res.status(200).json({ valid: false, error: 'Token não encontrado' });
    }

    const session = rows[0];

    if (new Date(session.expires_at) < new Date()) {
      return res.status(200).json({ valid: false, error: 'Token expirado' });
    }

    if (session.plano === 'avulso' && session.status === 'usado') {
      return res.status(200).json({ valid: false, error: 'Este encontro já foi realizado' });
    }

    if (action === 'start' && !session.session_started_at) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/sessions?id=eq.${session.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SECRET,
            'Authorization': `Bearer ${SUPABASE_SECRET}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            session_started_at: new Date().toISOString(),
            status: session.plano === 'avulso' ? 'usado' : 'ativo'
          })
        }
      );
    }

    return res.status(200).json({
      valid: true,
      plano: session.plano,
      nome: session.nome,
      email: session.email,
      session_started_at: session.session_started_at
    });

  } catch (error) {
    console.error('[VALIDATE ERROR]', error);
    return res.status(500).json({ valid: false, error: 'Erro interno' });
  }
}
