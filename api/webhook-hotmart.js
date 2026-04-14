// api/webhook-hotmart.js
// Recebe pagamento do Hotmart, gera token e define limite de sessões por plano:
// avulso: 1 sessão | essencial: 4/mês | transformacao: 8/mês
// REGRA: NUNCA usar "terapia", "terapêutico" ou "terapeuta" nos textos

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;

function generateToken() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 32; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
  return token;
}

function getPlano(productId, offerCode) {
  if (productId === '7551594') return 'avulso';
  if (offerCode === 'rpd18egt') return 'essencial';
  if (offerCode === 'c9txhfot') return 'transformacao';
  return 'avulso';
}

function getPlanoConfig(plano) {
  const configs = {
    avulso:       { sessions_limit: 1,  days: 7  },
    essencial:    { sessions_limit: 4,  days: 35 },
    transformacao:{ sessions_limit: 8,  days: 35 },
    gratuito:     { sessions_limit: 1,  days: 2  }
  };
  return configs[plano] || configs.avulso;
}

async function saveToken(token, email, nome, plano, transactionId) {
  const config = getPlanoConfig(plano);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.days);

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
      sessions_limit: config.sessions_limit,
      sessions_used: 0,
      expires_at: expiresAt.toISOString(),
      hotmart_transaction: transactionId
    })
  });
  return response.ok;
}

function buildEmailAvulso(nomeTexto, chatUrl) {
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f0a1e;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;font-family:Georgia,serif;">
  <tr><td style="background:linear-gradient(135deg,#2D1B69,#1a0e3d);padding:40px;text-align:center;border-bottom:1px solid rgba(78,205,196,0.2);">
    <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#4ecdc4;margin-bottom:10px;">✦ &nbsp; N E W C O S M O S &nbsp; ✦</div>
    <div style="font-size:28px;color:#D4AF37;letter-spacing:2px;margin-bottom:6px;">NewCosmos</div>
    <div style="font-size:12px;color:#9B59B6;letter-spacing:3px;text-transform:uppercase;">Bem-estar Integrativo com IA</div>
  </td></tr>
  <tr><td style="padding:40px;background:#0f0a1e;">
    <p style="font-size:20px;color:#f0e8ff;margin:0 0 20px;">Olá, ${nomeTexto}! 🌙</p>
    <p style="font-size:15px;color:#d0c0f0;line-height:1.8;margin:0 0 16px;">Seu <strong style="color:#D4AF37;">Encontro Avulso</strong> foi confirmado. Que alegria ter você nessa jornada!</p>
    <p style="font-size:15px;color:#d0c0f0;line-height:1.8;margin:0 0 32px;">Quando estiver pronto(a), clique no botão abaixo para iniciar seu encontro:</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px;">
      <a href="${chatUrl}" style="display:inline-block;background:linear-gradient(135deg,#6B3FA0,#2D1B69);color:#D4AF37;padding:18px 40px;border-radius:6px;text-decoration:none;font-size:16px;letter-spacing:1px;border:1px solid rgba(212,175,55,0.3);">✦ &nbsp; Iniciar meu Encontro</a>
    </td></tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(45,27,105,0.3);border:1px solid rgba(78,205,196,0.15);border-radius:6px;margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4ecdc4;margin-bottom:10px;">Informações do seu acesso</div>
        <div style="font-size:13px;color:#d0c0f0;line-height:1.9;">
          🔑 &nbsp; Acesso válido por <strong style="color:#f0e8ff;">7 dias</strong> — use quando estiver pronto(a)<br>
          ⏱ &nbsp; Duração: <strong style="color:#f0e8ff;">até 60 minutos</strong> de encontro<br>
          🎁 &nbsp; Inclui o eBook <strong style="color:#f0e8ff;">"7 Práticas Holísticas para o Dia a Dia"</strong><br>
          📱 &nbsp; Acesse pelo celular ou computador, sem instalar nada<br>
          🔒 &nbsp; Link de uso único — não compartilhe
        </div>
      </td></tr>
    </table>
    <p style="font-size:12px;color:#6B5A8C;line-height:1.6;margin:0 0 24px;">Ou acesse diretamente:<br><a href="${chatUrl}" style="color:#4ecdc4;word-break:break-all;text-decoration:none;">${chatUrl}</a></p>
    <hr style="border:none;border-top:1px solid rgba(107,63,160,0.2);margin:24px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(201,169,110,0.06);border:1px solid rgba(201,169,110,0.15);border-radius:6px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-size:13px;color:#D4AF37;margin-bottom:8px;">✦ &nbsp; Gostou da experiência?</div>
        <p style="font-size:13px;color:#a090c0;line-height:1.7;margin:0 0 14px;">Conheça nossos planos de acompanhamento contínuo e aprofunde sua jornada de autoconhecimento e bem-estar holístico.</p>
        <a href="https://www.newcosmos.com.br/#planos" style="font-size:12px;color:#4ecdc4;text-decoration:none;">Ver planos → newcosmos.com.br</a>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="background:#080512;padding:24px 40px;text-align:center;border-top:1px solid rgba(107,63,160,0.2);">
    <div style="font-size:14px;color:#D4AF37;letter-spacing:2px;margin-bottom:8px;">✦ NewCosmos ✦</div>
    <div style="font-size:11px;color:#4a3a6a;line-height:1.6;">NewCosmos — Bem-estar Integrativo com Inteligência Artificial<br>
      <a href="https://www.newcosmos.com.br" style="color:#4ecdc4;text-decoration:none;">www.newcosmos.com.br</a> &nbsp;·&nbsp; <a href="https://newcosmos.co" style="color:#4ecdc4;text-decoration:none;">newcosmos.co</a></div>
    <div style="font-size:10px;color:#3a2a5a;margin-top:12px;line-height:1.5;">Este espaço é de apoio ao bem-estar e autoconhecimento — não substitui profissionais de saúde habilitados.</div>
  </td></tr>
</table></body></html>`;
}

function buildEmailEssencial(nomeTexto, chatUrl) {
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f0a1e;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;font-family:Georgia,serif;">
  <tr><td style="background:linear-gradient(135deg,#1a4a1a,#0a2a0a);padding:40px;text-align:center;border-bottom:1px solid rgba(212,175,55,0.3);">
    <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#D4AF37;margin-bottom:10px;">✦ &nbsp; N E W C O S M O S &nbsp; ✦</div>
    <div style="font-size:28px;color:#D4AF37;letter-spacing:2px;margin-bottom:6px;">NewCosmos</div>
    <div style="font-size:12px;color:#4ecdc4;letter-spacing:3px;text-transform:uppercase;">Plano Essencial · Ativo</div>
  </td></tr>
  <tr><td style="padding:40px;background:#0f0a1e;">
    <p style="font-size:20px;color:#f0e8ff;margin:0 0 20px;">Olá, ${nomeTexto}! 🌿</p>
    <p style="font-size:15px;color:#d0c0f0;line-height:1.8;margin:0 0 16px;">Sua assinatura do <strong style="color:#D4AF37;">Plano Essencial</strong> está ativa. Bem-vindo(a) à sua jornada contínua de autoconhecimento e bem-estar!</p>
    <p style="font-size:15px;color:#d0c0f0;line-height:1.8;margin:0 0 32px;">Seu acesso ao chat já está liberado. Use quando sentir que é o momento certo:</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px;">
      <a href="${chatUrl}" style="display:inline-block;background:linear-gradient(135deg,#1a6a1a,#0d3d0d);color:#D4AF37;padding:18px 40px;border-radius:6px;text-decoration:none;font-size:16px;letter-spacing:1px;border:1px solid rgba(212,175,55,0.3);">✦ &nbsp; Acessar meu Espaço NewCosmos</a>
    </td></tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(26,106,26,0.1);border:1px solid rgba(212,175,55,0.2);border-radius:6px;margin-bottom:20px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#D4AF37;margin-bottom:12px;">Como funciona o seu plano</div>
        <div style="font-size:13px;color:#d0c0f0;line-height:2;">
          📅 &nbsp; <strong style="color:#f0e8ff;">4 encontros por mês</strong> — 1 por semana<br>
          ⏱ &nbsp; Cada encontro dura <strong style="color:#f0e8ff;">até 60 minutos</strong><br>
          🗓 &nbsp; Escolha o dia e horário que funcionar melhor para você<br>
          💬 &nbsp; Cada encontro é independente — acesse pelo link abaixo<br>
          🔄 &nbsp; Seu acesso renova automaticamente todo mês
        </div>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(45,27,105,0.3);border:1px solid rgba(78,205,196,0.15);border-radius:6px;margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4ecdc4;margin-bottom:10px;">Seu acesso</div>
        <div style="font-size:13px;color:#d0c0f0;line-height:1.9;">
          🔑 &nbsp; <strong style="color:#f0e8ff;">4 encontros disponíveis</strong> neste mês<br>
          📅 &nbsp; Acesso válido por <strong style="color:#f0e8ff;">35 dias</strong> — renova automaticamente<br>
          📱 &nbsp; Acesse pelo celular ou computador, sem instalar nada<br>
          🔒 &nbsp; Link pessoal — não compartilhe<br>
          ♾ &nbsp; Histórico dos seus encontros preservado
        </div>
      </td></tr>
    </table>
    <p style="font-size:12px;color:#6B5A8C;line-height:1.6;margin:0 0 24px;">Link direto de acesso:<br><a href="${chatUrl}" style="color:#4ecdc4;word-break:break-all;text-decoration:none;">${chatUrl}</a></p>
    <hr style="border:none;border-top:1px solid rgba(107,63,160,0.2);margin:24px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(78,205,196,0.05);border:1px solid rgba(78,205,196,0.12);border-radius:6px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-size:13px;color:#4ecdc4;margin-bottom:8px;">✦ &nbsp; Dica para aproveitar melhor seu plano</div>
        <p style="font-size:13px;color:#a090c0;line-height:1.7;margin:0;">Tente manter uma regularidade semanal — os encontros se constroem uns sobre os outros. Cada sessão aprofunda o que foi trabalhado na anterior, criando uma jornada de transformação real e contínua.</p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="background:#080512;padding:24px 40px;text-align:center;border-top:1px solid rgba(107,63,160,0.2);">
    <div style="font-size:14px;color:#D4AF37;letter-spacing:2px;margin-bottom:8px;">✦ NewCosmos ✦</div>
    <div style="font-size:11px;color:#4a3a6a;line-height:1.6;">NewCosmos — Bem-estar Integrativo com Inteligência Artificial<br>
      <a href="https://www.newcosmos.com.br" style="color:#4ecdc4;text-decoration:none;">www.newcosmos.com.br</a> &nbsp;·&nbsp; <a href="https://newcosmos.co" style="color:#4ecdc4;text-decoration:none;">newcosmos.co</a></div>
    <div style="font-size:10px;color:#3a2a5a;margin-top:12px;line-height:1.5;">Este espaço é de apoio ao bem-estar e autoconhecimento — não substitui profissionais de saúde habilitados.</div>
  </td></tr>
</table></body></html>`;
}

function buildEmailTransformacao(nomeTexto, chatUrl) {
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f0a1e;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;font-family:Georgia,serif;">
  <tr><td style="background:linear-gradient(135deg,#3d1a69,#1a0a3d);padding:40px;text-align:center;border-bottom:1px solid rgba(155,89,182,0.4);">
    <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#9B59B6;margin-bottom:10px;">✦ &nbsp; N E W C O S M O S &nbsp; ✦</div>
    <div style="font-size:28px;color:#D4AF37;letter-spacing:2px;margin-bottom:6px;">NewCosmos</div>
    <div style="font-size:12px;color:#9B59B6;letter-spacing:3px;text-transform:uppercase;">Plano Transformação · Ativo</div>
  </td></tr>
  <tr><td style="padding:40px;background:#0f0a1e;">
    <p style="font-size:20px;color:#f0e8ff;margin:0 0 20px;">Olá, ${nomeTexto}! 🔮</p>
    <p style="font-size:15px;color:#d0c0f0;line-height:1.8;margin:0 0 16px;">Sua assinatura do <strong style="color:#D4AF37;">Plano Transformação</strong> está ativa. Você escolheu o caminho mais profundo — e estamos honrados em caminhar com você.</p>
    <p style="font-size:15px;color:#d0c0f0;line-height:1.8;margin:0 0 32px;">Seu acesso ao chat já está liberado. Comece quando sentir que é o momento:</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px;">
      <a href="${chatUrl}" style="display:inline-block;background:linear-gradient(135deg,#6B3FA0,#2D1B69);color:#D4AF37;padding:18px 40px;border-radius:6px;text-decoration:none;font-size:16px;letter-spacing:1px;border:1px solid rgba(212,175,55,0.4);">✦ &nbsp; Acessar meu Espaço NewCosmos</a>
    </td></tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(107,63,160,0.1);border:1px solid rgba(155,89,182,0.25);border-radius:6px;margin-bottom:20px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9B59B6;margin-bottom:12px;">Como funciona o seu plano</div>
        <div style="font-size:13px;color:#d0c0f0;line-height:2;">
          📅 &nbsp; <strong style="color:#f0e8ff;">8 encontros por mês</strong> — 2 por semana<br>
          ⏱ &nbsp; Cada encontro dura <strong style="color:#f0e8ff;">até 60 minutos</strong><br>
          🗓 &nbsp; Escolha os dias e horários que funcionam melhor para você<br>
          💬 &nbsp; Cada encontro é independente — acesse pelo link abaixo<br>
          🔄 &nbsp; Seu acesso renova automaticamente todo mês<br>
          📄 &nbsp; Relatórios PDF detalhados da sua jornada incluídos
        </div>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(45,27,105,0.3);border:1px solid rgba(78,205,196,0.15);border-radius:6px;margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4ecdc4;margin-bottom:10px;">Seu acesso</div>
        <div style="font-size:13px;color:#d0c0f0;line-height:1.9;">
          🔑 &nbsp; <strong style="color:#f0e8ff;">8 encontros disponíveis</strong> neste mês<br>
          📅 &nbsp; Acesso válido por <strong style="color:#f0e8ff;">35 dias</strong> — renova automaticamente<br>
          📱 &nbsp; Acesse pelo celular ou computador, sem instalar nada<br>
          🔒 &nbsp; Link pessoal — não compartilhe<br>
          ♾ &nbsp; Histórico completo dos seus encontros preservado
        </div>
      </td></tr>
    </table>
    <p style="font-size:12px;color:#6B5A8C;line-height:1.6;margin:0 0 24px;">Link direto de acesso:<br><a href="${chatUrl}" style="color:#4ecdc4;word-break:break-all;text-decoration:none;">${chatUrl}</a></p>
    <hr style="border:none;border-top:1px solid rgba(107,63,160,0.2);margin:24px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(155,89,182,0.06);border:1px solid rgba(155,89,182,0.15);border-radius:6px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-size:13px;color:#9B59B6;margin-bottom:8px;">✦ &nbsp; Dica para uma jornada de transformação real</div>
        <p style="font-size:13px;color:#a090c0;line-height:1.7;margin:0;">Com 2 encontros semanais, você tem a frequência ideal para uma mudança profunda e acelerada. Use o primeiro encontro da semana para explorar e o segundo para integrar e ancorar o que emergiu. A consistência é o segredo da transformação.</p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="background:#080512;padding:24px 40px;text-align:center;border-top:1px solid rgba(107,63,160,0.2);">
    <div style="font-size:14px;color:#D4AF37;letter-spacing:2px;margin-bottom:8px;">✦ NewCosmos ✦</div>
    <div style="font-size:11px;color:#4a3a6a;line-height:1.6;">NewCosmos — Bem-estar Integrativo com Inteligência Artificial<br>
      <a href="https://www.newcosmos.com.br" style="color:#4ecdc4;text-decoration:none;">www.newcosmos.com.br</a> &nbsp;·&nbsp; <a href="https://newcosmos.co" style="color:#4ecdc4;text-decoration:none;">newcosmos.co</a></div>
    <div style="font-size:10px;color:#3a2a5a;margin-top:12px;line-height:1.5;">Este espaço é de apoio ao bem-estar e autoconhecimento — não substitui profissionais de saúde habilitados.</div>
  </td></tr>
</table></body></html>`;
}

async function sendEmail(email, nome, token, plano) {
  const chatUrl = `https://www.newcosmos.com.br/chat.html?token=${token}`;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const nomeTexto = nome ? nome.split(' ')[0] : 'querido(a)';

  const subjects = {
    avulso: '✦ Seu Encontro Avulso NewCosmos está confirmado!',
    essencial: '✦ Plano Essencial ativo — seu espaço NewCosmos está pronto',
    transformacao: '✦ Plano Transformação ativo — sua jornada começa agora'
  };

  const htmlMap = {
    avulso: buildEmailAvulso(nomeTexto, chatUrl),
    essencial: buildEmailEssencial(nomeTexto, chatUrl),
    transformacao: buildEmailTransformacao(nomeTexto, chatUrl)
  };

  if (!RESEND_API_KEY) {
    console.log(`[EMAIL] Para: ${email} | Plano: ${plano} | Token: ${token}`);
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
      subject: subjects[plano] || subjects.avulso,
      html: htmlMap[plano] || htmlMap.avulso
    })
  });
  return res.ok;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

    if (!email) return res.status(400).json({ error: 'Email não encontrado' });

    const plano = getPlano(productId, offerCode);
    const token = generateToken();

    const saved = await saveToken(token, email, nome, plano, transactionId);
    if (!saved) return res.status(500).json({ error: 'Erro ao salvar token' });

    await sendEmail(email, nome, token, plano);

    console.log(`[WEBHOOK] ${email} | ${plano} | ${token}`);
    return res.status(200).json({ success: true, plano, email });

  } catch (error) {
    console.error('[WEBHOOK ERROR]', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
