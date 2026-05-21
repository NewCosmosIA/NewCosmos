// api/update-session.js
export const config = {
    api: { bodyParser: { sizeLimit: '2mb' } }
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

  const { token, email, history } = req.body;
    if (!token) return res.status(400).json({ error: 'Token obrigatório' });

  const updates = {};
    if (email) updates.email = email;
    if (history && Array.isArray(history)) {
          updates.session_history = JSON.stringify(history.slice(-20));
    }

  if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'Nada para atualizar' });
  }

  try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/sessions?token=eq.${token}`, {
                method: 'PATCH',
                headers: {
                          'Content-Type': 'application/json',
                          'apikey': SUPABASE_SECRET,
                          'Authorization': `Bearer ${SUPABASE_SECRET}`,
                          'Prefer': 'return=minimal'
                },
                body: JSON.stringify(updates)
        });

      if (!response.ok) {
              const err = await response.text();
              console.error('[UPDATE SESSION ERROR]', err);
              return res.status(500).json({ error: 'Erro ao atualizar sessão' });
      }

      return res.status(200).json({ success: true });
  } catch (err) {
        console.error('[UPDATE SESSION]', err);
        return res.status(500).json({ error: 'Erro interno' });
  }
}
