// api/keepalive.js
// Ping simples no Supabase a cada 3 dias para evitar pausa por inatividade (free tier)

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;

export default async function handler(req, res) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/sessions?select=id&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_SECRET,
          'Authorization': `Bearer ${SUPABASE_SECRET}`
        }
      }
    );

    const ok = response.ok;
    console.log(`[KEEPALIVE] Supabase ping: ${ok ? 'OK' : response.status}`);

    return res.status(200).json({
      status: ok ? 'alive' : 'error',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[KEEPALIVE] Error:', error.message);
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
