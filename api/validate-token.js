// api/validate-token.js
// Valida token e controla número de sessões por plano:
// avulso: 1 sessão | essencial: 4/mês | transformacao: 8/mês | gratuito: 1 sessão

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
    // Busca sessão no Supabase
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

    // Verifica expiração
    if (new Date(session.expires_at) < new Date()) {
      return res.status(200).json({ valid: false, error: 'Token expirado' });
    }

    // Verifica se ainda tem sessões disponíveis
    const sessionsUsed = session.sessions_used || 0;
    const sessionsLimit = session.sessions_limit || 1;
    const sessionsRemaining = sessionsLimit - sessionsUsed;

    if (sessionsRemaining <= 0) {
      const msgs = {
        avulso: 'Seu encontro avulso já foi realizado. Para um novo encontro, adquira um novo acesso.',
        essencial: `Você já utilizou todos os ${sessionsLimit} encontros deste mês. Seu acesso renova no próximo ciclo.`,
        transformacao: `Você já utilizou todos os ${sessionsLimit} encontros deste mês. Seu acesso renova no próximo ciclo.`,
        gratuito: 'Seu encontro gratuito já foi realizado. Conheça nossos planos para continuar sua jornada.'
      };
      return res.status(200).json({
        valid: false,
        error: msgs[session.plano] || 'Limite de sessões atingido.'
      });
    }

    // Se action === 'start', registra uso da sessão
    if (action === 'start') {
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
            sessions_used: sessionsUsed + 1,
            session_started_at: session.session_started_at || new Date().toISOString(),
            status: (sessionsUsed + 1) >= sessionsLimit ? 'usado' : 'ativo'
          })
        }
      );
    }

    return res.status(200).json({
      valid: true,
      plano: session.plano,
      nome: session.nome,
      email: session.email,
      sessions_used: sessionsUsed + (action === 'start' ? 1 : 0),
      sessions_limit: sessionsLimit,
      sessions_remaining: sessionsRemaining - (action === 'start' ? 1 : 0)
    });

  } catch (error) {
    console.error('[VALIDATE ERROR]', error);
    return res.status(500).json({ valid: false, error: 'Erro interno' });
  }
}
