// api/session-report.js
// Gera relatório da sessão via Claude e envia por e-mail
// REGRA: NUNCA usar "terapia", "terapêutico" ou "terapeuta"

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Preços claude-sonnet-4-20250514
const PRICE_INPUT_PER_M  = 3.00;
const PRICE_OUTPUT_PER_M = 15.00;

// Gera resumo da sessão via Claude
async function generateSessionSummary(history, nome, plano, lang) {
  const langInstructions = {
    pt: 'Responda em português brasileiro.',
    en: 'Respond in English.',
    es: 'Responde en español.',
    it: 'Rispondi in italiano.'
  };

  const conversationText = history
    .map(m => `${m.role === 'user' ? (nome || 'Cliente') : 'NewCosmos'}: ${m.content}`)
    .join('\n\n');

  const prompt = `Você é o NewCosmos. Analise esta conversa de um encontro de bem-estar e gere um relatório estruturado.

CONVERSA:
${conversationText}

Gere um relatório com exatamente estas seções em JSON:
{
  "tema_principal": "tema central do encontro em 1 frase",
  "estado_emocional": "estado emocional identificado no início",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "praticas_recomendadas": ["prática 1 com instruções breves", "prática 2 com instruções breves"],
  "afirmacao": "uma afirmação poderosa personalizada para levar",
  "proximos_passos": "orientação para os próximos dias em 2-3 frases",
  "frequencia_recomendada": "frequência Solfeggio ou prática energética recomendada",
  "nota_holistica": "observação holística sobre o momento da jornada"
}

${langInstructions[lang] || langInstructions.pt}
Retorne APENAS o JSON, sem markdown ou texto adicional.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || '{}';

  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return null;
  }
}

// Salva resumo no Supabase
async function saveSessionReport(sessionId, report, duration, reportTokensInput, reportTokensOutput) {
  const reportCost = ((reportTokensInput || 0) / 1_000_000 * PRICE_INPUT_PER_M) +
                     ((reportTokensOutput || 0) / 1_000_000 * PRICE_OUTPUT_PER_M);

  await fetch(`${SUPABASE_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SECRET,
      'Authorization': `Bearer ${SUPABASE_SECRET}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      session_ended_at: new Date().toISOString(),
      session_report: JSON.stringify(report),
      session_duration_minutes: Math.round(duration / 60),
      report_cost_usd: reportCost
    })
  });
}

// Gera HTML do email pós-sessão
function buildPostSessionEmail(nome, plano, report, lang) {
  const nomeTexto = nome ? nome.split(' ')[0] : 'querido(a)';
  const isPremium = plano === 'essencial' || plano === 'transformacao';

  const titles = {
    pt: { subject: '✦ Resumo do seu encontro NewCosmos', greeting: 'Seu encontro chegou ao fim', carrying: 'O que você leva deste encontro', practices: 'Práticas recomendadas', affirmation: 'Sua afirmação', next: 'Próximos passos', frequency: 'Frequência recomendada', note: 'Observação holística' },
    en: { subject: '✦ Your NewCosmos session summary', greeting: 'Your session has ended', carrying: 'What you carry from this session', practices: 'Recommended practices', affirmation: 'Your affirmation', next: 'Next steps', frequency: 'Recommended frequency', note: 'Holistic note' },
    es: { subject: '✦ Resumen de tu sesión NewCosmos', greeting: 'Tu sesión ha concluido', carrying: 'Lo que llevas de esta sesión', practices: 'Prácticas recomendadas', affirmation: 'Tu afirmación', next: 'Próximos pasos', frequency: 'Frecuencia recomendada', note: 'Nota holística' },
    it: { subject: '✦ Riepilogo della tua sessione NewCosmos', greeting: 'La tua sessione è terminata', carrying: 'Cosa porti da questa sessione', practices: 'Pratiche consigliate', affirmation: 'La tua affermazione', next: 'Prossimi passi', frequency: 'Frequenza consigliata', note: 'Nota olistica' }
  };

  const t = titles[lang] || titles.pt;

  const insightsHtml = (report.insights || []).map(i =>
    `<li style="margin-bottom:8px; color:#d0c0f0; font-size:13px; line-height:1.7;">✦ ${i}</li>`
  ).join('');

  const practicesHtml = (report.praticas_recomendadas || []).map((p, i) =>
    `<div style="background:rgba(45,27,105,0.3); border-left:2px solid #4ecdc4; padding:12px 16px; margin-bottom:10px; border-radius:0 6px 6px 0;">
      <div style="font-size:11px; color:#4ecdc4; letter-spacing:1px; margin-bottom:4px;">${i + 1}</div>
      <div style="font-size:13px; color:#d0c0f0; line-height:1.7;">${p}</div>
    </div>`
  ).join('');

  const premiumSection = isPremium ? `
    <tr><td style="padding:0 40px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(107,63,160,0.08); border:1px solid rgba(155,89,182,0.2); border-radius:6px;">
        <tr><td style="padding:20px 24px;">
          <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9B59B6; margin-bottom:12px;">🔮 ${t.note}</div>
          <p style="font-size:13px; color:#d0c0f0; line-height:1.7; margin:0;">${report.nota_holistica || ''}</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:0 40px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(78,205,196,0.06); border:1px solid rgba(78,205,196,0.15); border-radius:6px;">
        <tr><td style="padding:16px 24px;">
          <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#4ecdc4; margin-bottom:8px;">🎵 ${t.frequency}</div>
          <p style="font-size:13px; color:#d0c0f0; margin:0;">${report.frequencia_recomendada || ''}</p>
        </td></tr>
      </table>
    </td></tr>` : '';

  return {
    subject: t.subject,
    html: `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f0a1e;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;font-family:Georgia,serif;">
  <tr><td style="background:linear-gradient(135deg,#2D1B69,#1a0e3d);padding:40px;text-align:center;border-bottom:1px solid rgba(78,205,196,0.2);">
    <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#4ecdc4;margin-bottom:10px;">✦ &nbsp; N E W C O S M O S &nbsp; ✦</div>
    <div style="font-size:24px;color:#D4AF37;letter-spacing:2px;margin-bottom:6px;">NewCosmos</div>
    <div style="font-size:11px;color:#9B59B6;letter-spacing:3px;text-transform:uppercase;">${t.greeting}</div>
  </td></tr>

  <tr><td style="padding:32px 40px 20px;">
    <p style="font-size:18px;color:#f0e8ff;margin:0 0 16px;">🌙 Olá, ${nomeTexto}!</p>
    <p style="font-size:14px;color:#d0c0f0;line-height:1.8;margin:0 0 8px;">
      <strong style="color:#D4AF37;">${report.tema_principal || ''}</strong>
    </p>
    <p style="font-size:13px;color:#a090c0;line-height:1.7;margin:0;">
      ${report.estado_emocional || ''}
    </p>
  </td></tr>

  <tr><td style="padding:0 40px 24px;">
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#D4AF37;margin-bottom:12px;">✦ ${t.carrying}</div>
    <ul style="margin:0;padding-left:0;list-style:none;">${insightsHtml}</ul>
  </td></tr>

  <tr><td style="padding:0 40px 24px;">
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4ecdc4;margin-bottom:12px;">🌿 ${t.practices}</div>
    ${practicesHtml}
  </td></tr>

  <tr><td style="padding:0 40px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);border-radius:6px;">
      <tr><td style="padding:20px 24px;text-align:center;">
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#D4AF37;margin-bottom:10px;">✦ ${t.affirmation}</div>
        <p style="font-size:16px;color:#f0e8ff;font-style:italic;line-height:1.6;margin:0;">"${report.afirmacao || ''}"</p>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:0 40px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(45,27,105,0.3);border:1px solid rgba(78,205,196,0.15);border-radius:6px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4ecdc4;margin-bottom:8px;">🌱 ${t.next}</div>
        <p style="font-size:13px;color:#d0c0f0;line-height:1.7;margin:0;">${report.proximos_passos || ''}</p>
      </td></tr>
    </table>
  </td></tr>

  ${premiumSection}

  <tr><td style="background:#080512;padding:24px 40px;text-align:center;border-top:1px solid rgba(107,63,160,0.2);">
    <div style="font-size:13px;color:#D4AF37;letter-spacing:2px;margin-bottom:8px;">✦ NewCosmos ✦</div>
    <div style="font-size:11px;color:#4a3a6a;line-height:1.6;">
      NewCosmos — Bem-estar Integrativo com Inteligência Artificial<br>
      <a href="https://www.newcosmos.com.br" style="color:#4ecdc4;text-decoration:none;">www.newcosmos.com.br</a>
    </div>
    <div style="font-size:10px;color:#3a2a5a;margin-top:10px;">Este espaço é de apoio ao bem-estar e autoconhecimento — não substitui profissionais de saúde habilitados.</div>
  </td></tr>
</table>
</body></html>`
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { token, history, duration, lang } = req.body;

    if (!token || !history || history.length < 2) {
      return res.status(400).json({ error: 'Dados insuficientes' });
    }

    // Buscar dados da sessão
    const sessionRes = await fetch(
      `${SUPABASE_URL}/rest/v1/sessions?token=eq.${token}&select=*`,
      { headers: { 'apikey': SUPABASE_SECRET, 'Authorization': `Bearer ${SUPABASE_SECRET}` } }
    );
    const sessions = await sessionRes.json();
    if (!sessions?.length) return res.status(404).json({ error: 'Sessão não encontrada' });

    const session = sessions[0];
    const { email, nome, plano, id } = session;

    // Gerar resumo via Claude
    const reportResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const reportData = await reportResponse.json();
    const reportTokensInput  = reportData.usage?.input_tokens  || 0;
    const reportTokensOutput = reportData.usage?.output_tokens || 0;
    const text = reportData.content?.[0]?.text || '{}';

    let report;
    try {
      report = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      report = null;
    }
    if (!report) return res.status(500).json({ error: 'Erro ao gerar resumo' });

    // Salvar no Supabase com tokens
    await saveSessionReport(id, report, duration || 0, reportTokensInput, reportTokensOutput);

    // Enviar e-mail (todos os planos recebem resumo)
    if (RESEND_API_KEY && email) {
      const { subject, html } = buildPostSessionEmail(nome, plano, report, lang || 'pt');
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'NewCosmos <contato@newcosmos.com.br>',
          to: email,
          subject,
          html
        })
      });
    }

    return res.status(200).json({ success: true, report });

  } catch (error) {
    console.error('[SESSION REPORT ERROR]', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
