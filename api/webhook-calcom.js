// api/webhook-calcom.js
// Recebe notificação do Cal.com quando alguém agenda sessão gratuita
// Gera token gratuito e envia por e-mail

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
  // Token gratuito válido por 48h a partir do agendamento
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
      token,
      email,
      nome,
      plano: 'gratuito',
      status: 'ativo',
      expires_at: expiresAt.toISOString(),
      hotmart_transaction: 'calcom-free'
    })
  });
  return response.ok;
}

async function sendEmail(email, nome, token) {
  const chatUrl = `https://www.newcosmos.com.br/chat.html?token=${token}`;
  const nomeTexto = nome ? nome.split(' ')[0] : 'querido(a)';

  if (!RESEND_API_KEY) {
    console.log(`[EMAIL GRATUITO] Para: ${email} | Token: ${token} | Link: ${chatUrl}`);
    return true;
  }

  const emailBody = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #0f0a1e; color: #f0e8ff; padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #D4AF37; font-size: 28px; margin: 0;">✦ NewCosmos ✦</h1>
        <p style="color: #9B59B6; margin: 8px 0 0;">Terapias Integrativas</p>
      </div>

      <p style="font-size: 18px; color: #f0e8ff;">Olá, ${nomeTexto}! 🌙</p>

      <p style="line-height: 1.7; color: #d0c0f0;">
        Seu <strong style="color: #D4AF37">Encontro Gratuito</strong> foi agendado com sucesso. 
        Que alegria ter você aqui!
      </p>

      <p style="line-height: 1.7; color: #d0c0f0;">
        No horário combinado, clique no botão abaixo para iniciar sua sessão:
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${chatUrl}"
           style="background: linear-gradient(135deg, #6B3FA0, #2D1B69);
                  color: #D4AF37;
                  padding: 16px 32px;
                  border-radius: 8px;
                  text-decoration: none;
                  font-size: 16px;
                  display: inline-block;">
          ✦ Iniciar meu Encontro Gratuito
        </a>
      </div>

      <p style="font-size: 12px; color: #9B59B6; line-height: 1.6;">
        Este link é válido por 48 horas a partir do agendamento.<br>
        Link direto: <a href="${chatUrl}" style="color: #D4AF37;">${chatUrl}</a>
      </p>

      <div style="background: rgba(45,27,105,0.4); border: 1px solid rgba(107,63,160,0.3); border-radius: 10px; padding: 20px; margin: 24px 0;">
        <p style="color: #D4AF37; font-size: 13px; margin: 0 0 8px;">✦ Após seu encontro gratuito</p>
        <p style="color: #d0c0f0; font-size: 12px; line-height: 1.6; margin: 0;">
          Se sentir que quer continuar essa jornada, conheça nossos planos de acompanhamento 
          em <a href="https://www.newcosmos.com.br/#planos" style="color: #D4AF37;">newcosmos.com.br</a>
        </p>
      </div>

      <hr style="border: 1px solid #2D1B69; margin: 24px 0;">

      <p style="font-size: 12px; color: #6B3FA0; text-align: center;">
        NewCosmos Terapias Integrativas<br>
        www.newcosmos.com.br
      </p>
    </div>
  `;

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
      html: emailBody
    })
  });
  return res.ok;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;

    // Cal.com envia evento "BOOKING_CREATED" quando agendamento é confirmado
    const triggerEvent = body?.triggerEvent;
    if (triggerEvent !== 'BOOKING_CREATED') {
      return res.status(200).json({ message: 'Evento ignorado', triggerEvent });
    }

    const payload = body?.payload;
    const email = payload?.attendees?.[0]?.email;
    const nome = payload?.attendees?.[0]?.name;

    if (!email) {
      return res.status(400).json({ error: 'Email não encontrado no payload' });
    }

    const token = generateToken();
    const saved = await saveToken(token, email, nome);

    if (!saved) {
      return res.status(500).json({ error: 'Erro ao salvar token' });
    }

    await sendEmail(email, nome, token);

    console.log(`[CALCOM] Sessão gratuita: ${email} | token: ${token}`);
    return res.status(200).json({ success: true, email });

  } catch (error) {
    console.error('[CALCOM WEBHOOK ERROR]', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
