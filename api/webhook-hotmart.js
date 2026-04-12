// api/webhook-hotmart.js
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;

function generateToken() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function getPlano(productId, offerCode) {
  if (productId === '7551594') return 'avulso';
  if (offerCode === 'rpd18egt') return 'essencial';
  if (offerCode === 'c9txhfot') return 'transformacao';
  return 'avulso';
}

function getExpiresAt(plano) {
  const now = new Date();
  if (plano === 'avulso') {
    now.setDate(now.getDate() + 7);
  } else {
    now.setDate(now.getDate() + 35);
  }
  return now.toISOString();
}

async function saveToken(token, email, nome, plano, transactionId, expiresAt) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SECRET,
      'Authorization': `Bearer ${SUPABASE_SECRET}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      token, email, nome, plano,
      status: 'ativo',
      expires_at: expiresAt,
      hotmart_transaction: transactionId
    })
  });
  return response.ok;
}

async function sendEmail(email, nome, token, plano) {
  const chatUrl = `https://www.newcosmos.com.br/chat.html?token=${token}`;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  const planoNomes = {
    avulso: 'Encontro Avulso',
    essencial: 'Plano Essencial',
    transformacao: 'Plano Transformação'
  };

  const planoInfo = {
    avulso: 'Seu token é válido por 7 dias.',
    essencial: 'Seu acesso renova automaticamente todo mês.',
    transformacao: 'Seu acesso renova automaticamente todo mês.'
  };

  if (!RESEND_API_KEY) {
    console.log(`[EMAIL] Para: ${email} | Token: ${token} | Link: ${chatUrl}`);
    return true;
  }

  const emailBody = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #0f0a1e; color: #f0e8ff; padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #D4AF37; font-size: 28px; margin: 0;">✦ NewCosmos ✦</h1>
        <p style="color: #9B59B6; margin: 8px 0 0;">Terapias Integrativas</p>
      </div>
      <p style="font-size: 18px;">Olá, ${nome || 'querido(a)'}! 🌙</p>
      <p style="line-height: 1.7; color: #d0c0f0;">
        Seu pagamento do <strong style="color: #D4AF37">${planoNomes[plano]}</strong> foi confirmado.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${chatUrl}"
           style="background: linear-gradient(135deg, #6B3FA0, #2D1B69);
                  color: #D4AF37; padding: 16px 32px;
                  border-radius: 8px; text-decoration: none; font-size: 16px;">
          ✦ Iniciar meu Encontro
        </a>
      </div>
      <p style="font-size: 12px; color: #9B59B6;">
        ${planoInfo[plano]}<br>
        Link direto: <a href="${chatUrl}" style="color: #D4AF37;">${chatUrl}</a>
      </p>
      <hr style="border: 1px solid #2D1B69; margin: 24px 0;">
      <p style="font-size: 12px; color: #6B3FA0; text-align: center;">
        NewCosmos Terapias Integrativas — www.newcosmos.com.br
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
      subject: `✦ Seu acesso ao NewCosmos — ${planoNomes[plano]}`,
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
    const event = body?.event;

    if (event !== 'PURCHASE_APPROVED' && event !== 'PURCHASE_COMPLETE') {
      return res.status(200).json({ message: 'Evento ignorado', event });
    }

    const buyer = body?.data?.buyer;
    const purchase = body?.data?.purchase;
    const product = body?.data?.product;

    const email = buyer?.email;
    const nome = buyer?.name;
    const transactionId = purchase?.transaction;
    const productId = String(product?.id);
    const offerCode = purchase?.offer?.code;

    if (!email) {
      return res.status(400).json({ error: 'Email não encontrado' });
    }

    const plano = getPlano(productId, offerCode);
    const token = generateToken();
    const expiresAt = getExpiresAt(plano);

    const saved = await saveToken(token, email, nome, plano, transactionId, expiresAt);
    if (!saved) return res.status(500).json({ error: 'Erro ao salvar token' });

    await sendEmail(email, nome, token, plano);

    console.log(`[WEBHOOK] ${email} | ${plano} | ${token}`);
    return res.status(200).json({ success: true, plano, email });

  } catch (error) {
    console.error('[WEBHOOK ERROR]', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
