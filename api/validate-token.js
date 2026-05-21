// api/validate-token.js
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

  const { token, action } = req.body;
    if (!token) return res.status(400).json({ error: 'Token obrigatório' });

  try {
        const response = await fetch(
                `${SUPABASE_URL}/rest/v1/sessions?token=eq.${encodeURIComponent(token)}&select=*`,
          {
                    headers: {
                                'apikey': SUPABASE_SECRET,
                                'Authorization': `Bearer ${SUPABASE_SECRET}`
                    }
          }
              );

      const sessions = await response.json();
        if (!sessions || sessions.length === 0) {
                return res.status(200).json({ valid: false, error: 'Token não encontrado' });
        }

      const session = sessions[0];

      if (action === 'history') {
              let history = [];
              if (session.session_history) {
                        try { history = JSON.parse(session.session_history); } catch(e) {}
              }
              return res.status(200).json({ valid: true, history });
      }

      if (session.expires_at && new Date(session.expires_at) < new Date()) {
              return res.status(200).json({ valid: false, error: 'Token expirado' });
      }

      if (session.status === 'usado') {
              return res.status(200).json({ valid: false, error: 'Este encontro já foi realizado' });
      }

      if (session.sessions_used >= session.sessions_limit) {
              await fetch(`${SUPABASE_URL}/rest/v1/sessions?token=eq.${token}`, {
                        method: 'PATCH',
                        headers: {
                                    'Content-Type': 'application/json',
                                    'apikey': SUPABASE_SECRET,
                                    'Authorization': `Bearer ${SUPABASE_SECRET}`,
                                    'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({ status: 'usado' })
              });
              return res.status(200).json({ valid: false, error: 'Este encontro já foi realizado' });
      }

      await fetch(`${SUPABASE_URL}/rest/v1/sessions?token=eq.${token}`, {
              method: 'PATCH',
              headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_SECRET,
                        'Authorization': `Bearer ${SUPABASE_SECRET}`,
                        'Prefer': 'return=minimal'
              },
              body: JSON.stringify({
                        sessions_used: (session.sessions_used || 0) + 1,
                        session_started_at: new Date().toISOString(),
                        status: (session.sessions_used + 1) >= session.sessions_limit ? 'usado' : 'ativo'
              })
      });

      return res.status(200).json({
              valid: true,
              plano: session.plano,
              nome: session.nome,
              email: session.email,
              sessions_used: session.sessions_used + 1,
              sessions_limit: session.sessions_limit
      });

  } catch (err) {
        console.error('[VALIDATE TOKEN ERROR]', err);
        return res.status(500).json({ valid: false, error: 'Erro interno' });
  }
}
