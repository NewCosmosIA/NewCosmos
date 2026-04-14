// api/webhook-calcom.js
// Recebe notificação do Cal.com quando alguém agenda sessão gratuita
// Gera token gratuito e envia por e-mail
// REGRA: NUNCA usar "terapia", "terapêutico" ou "terapeuta" nos textos

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

function generateToken() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

async function saveToken(token, email, nome) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48);

  const response = await fetch(`${SUPABASE_URL}/rest/v1/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SECRET,
      'Authorization': `Bearer ${SUPABASE_SECRET}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      token, email, nome,
      plano: 'gratuito',
      status: 'ativo',
      expires_at: expiresAt.toISOString(),
      hotmart_transaction: 'calcom-free'
    })
  });
  return response.ok;
}

function buildEmailHtml(nome, chatUrl) {
  const nomeTexto = nome ? nome.split(' ')[0] : 'querido(a)';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#0f0a1e;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e; font-family: Georgia, serif;">
  <tr>
    <td style="background: linear-gradient(135deg, #2D1B69, #1a0e3d); padding: 40px 40px 32px; text-align: center; border-bottom: 1px solid rgba(78,205,196,0.2);">
      <div style="font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: #4ecdc4; margin-bottom: 10px;">✦ &nbsp; N E W C O S M O S &nbsp; ✦</div>
      <div style="font-size: 28px; color: #D4AF37; letter-spacing: 2px; margin-bottom: 6px;">NewCosmos</div>
      <div style="font-size: 12px; color: #9B59B6; letter-spacing: 3px; text-transform: uppercase;">Bem-estar Integrativo com IA</div>
    </td>
  </tr>
  <tr>
    <td style="padding: 40px 40px 32px; background: #0f0a1e;">
      <p style="font-size: 20px; color: #f0e8ff; margin: 0 0 20px; line-height: 1.4;">Olá, ${nomeTexto}! 🌙</p>
      <p style="font-size: 15px; color: #d0c0f0; line-height: 1.8; margin: 0 0 16px;">
        Seu <strong style="color: #D4AF37;">Encontro Gratuito</strong> foi confirmado. Que alegria ter você aqui!
      </p>
      <p style="font-size: 15px; color: #d0c0f0; line-height: 1.8; margin: 0 0 32px;">
        No horário combinado, clique no botão abaixo para iniciar sua sessão:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding: 8px 0 32px;">
            <a href="${chatUrl}" style="display: inline-block; background: linear-gradient(135deg, #6B3FA0, #2D1B69); color: #D4AF37; padding: 18px 40px; border-radius: 6px; text-decoration: none; font-size: 16px; letter-spacing: 1px; border: 1px solid rgba(212,175,55,0.3);">
              ✦ &nbsp; Iniciar meu Encontro Gratuito
            </a>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(45,27,105,0.3); border: 1px solid rgba(78,205,196,0.15); border-radius: 6px; margin-bottom: 28px;">
        <tr>
          <td style="padding: 20px 24px;">
            <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #4ecdc4; margin-bottom: 10px;">Informações do seu acesso</div>
            <div style="font-size: 13px; color: #d0c0f0; line-height: 1.8;">
              🔑 &nbsp; Seu acesso é válido por <strong style="color: #f0e8ff;">48 horas</strong> a partir do agendamento<br>
              ⏱ &nbsp; Duração da sessão: <strong style="color: #f0e8ff;">até 45 minutos</strong><br>
              📱 &nbsp; Acesse pelo celular ou computador, sem instalar nada<br>
              🔒 &nbsp; Link de uso único — não compartilhe
            </div>
          </td>
        </tr>
      </table>
      <p style="font-size: 12px; color: #6B5A8C; line-height: 1.6; margin: 0 0 24px;">
        Ou acesse diretamente:<br>
        <a href="${chatUrl}" style="color: #4ecdc4; word-break: break-all; text-decoration: none;">${chatUrl}</a>
      </p>
      <hr style="border: none; border-top: 1px solid rgba(107,63,160,0.2); margin: 24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(201,169,110,0.06); border: 1px solid rgba(201,169,110,0.15); border-radius: 6px;">
        <tr>
          <td style="padding: 20px 24px;">
            <div style="font-size: 13px; color: #D4AF37; margin-bottom: 8px;">✦ &nbsp; Após seu encontro gratuito</div>
            <p style="font-size: 13px; color: #a090c0; line-height: 1.7; margin: 0 0 14px;">
              Conheça nossos planos de acompanhamento contínuo e aprofunde sua jornada de autoconhecimento e bem-estar holístico.
            </p>
            <a href="https://www.newcosmos.com.br/#planos" style="font-size: 12px; color: #4ecdc4; text-decoration: none;">
              Ver planos → newcosmos.com.br
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="background: #080512; padding: 24px 40px; text-align: center; border-top: 1px solid rgba(107,63,160,0.2);">
      <div style="font-size: 14px; color: #D4AF37; letter-spacing: 2px; margin-bottom: 8px;">✦ NewCosmos ✦</div>
      <div style="font-size: 11px; color: #4a3a6a; line-height: 1.6;">
        NewCosmos — Bem-estar Integrativo com Inteligência Artificial<br>
        <a href="https://www.newcosmos.com.br" style="color: #4ecdc4; text-decoration: none;">www.newcosmos.com.br</a>
        &nbsp;·&nbsp;
        <a href="https://newcosmos.co" style="color: #4ecdc4; text-decoration: none;">newcosmos.co</a>
      </div>
      <div style="font-size: 10px; color: #3a2a5a; margin-top: 12px; line-height: 1.5;">
        Este e-mail foi enviado porque você agendou um encontro na plataforma NewCosmos.<br>
        Este espaço é de apoio ao bem-estar e autoconhecimento — não substitui profissionais de saúde habilitados.
      </div>
    </td>
  </tr>
</table>
</body>
</html>`;
}

async function sendEmail(email, nome, token) {
  const chatUrl = `https://www.newcosmos.com.br/chat.html?token=${token}`;

  if (!RESEND_API_KEY) {
    console.log(`[EMAIL GRATUITO] Para: ${email} | Token: ${token} | Link: ${chatUrl}`);
    return true;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'NewCosmos <contato@newcosmos.com.br>',
      to: email,
      subject: '✦ Seu Encontro Gratuito NewCosmos está confirmado!',
      html: buildEmailHtml(nome, chatUrl)
    })
  });
  return res.ok;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body;
    const triggerEvent = body?.triggerEvent;

    if (triggerEvent !== 'BOOKING_CREATED') {
      return res.status(200).json({ message: 'Evento ignorado', triggerEvent });
    }

    const email = body?.payload?.attendees?.[0]?.email;
    const nome = body?.payload?.attendees?.[0]?.name;

    if (!email) return res.status(400).json({ error: 'Email não encontrado' });

    const token = generateToken();
    const saved = await saveToken(token, email, nome);

    if (!saved) return res.status(500).json({ error: 'Erro ao salvar token' });

    await sendEmail(email, nome, token);

    console.log(`[CALCOM] Sessão gratuita: ${email} | token: ${token}`);
    return res.status(200).json({ success: true, email });

  } catch (error) {
    console.error('[CALCOM WEBHOOK ERROR]', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
