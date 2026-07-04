# ARCHITECTURE.md — NewCosmos

## Visão geral
```
Navegador (index.html / chat.html)
   │  POST /api/chat (com token, SEM chave de IA)
   ▼
Vercel Serverless (api/*.js)  ── lê segredos do ambiente ──▶ Anthropic / Supabase / E-mail
   │
   ├─ chat.js            → proxy Claude + tracking de tokens/custo por sessão
   ├─ validate-token.js  → valida token (testador/pago) no Supabase
   ├─ update-session.js  → grava histórico da sessão (memória persistente)
   ├─ session-report.js  → gera relatório via Claude + envia e-mail
   ├─ webhook-hotmart.js → pagamento → cria token + limite por plano
   ├─ webhook-calcom.js  → agendamento → token gratuito + e-mail
   └─ keepalive.js       → ping no Supabase a cada 3 dias (free tier)
```

## Camadas / responsabilidades
- **Front estático** — apresentação e UI do chat. Sem segredos.
- **API serverless** — cada arquivo = um endpoint (controller fino). Segredos só aqui (env).
- **Supabase** — persistência: sessões, tokens, custo, histórico.
- **Integrações externas** — Anthropic (IA), Hotmart (pagamento), Cal.com (agenda), e-mail.

## Fluxos principais
1. **Acesso:** compra (Hotmart) ou agendamento (Cal.com) → webhook cria token no Supabase → e-mail com link.
2. **Encontro:** chat.html valida token (`validate-token`) → `chat` faz proxy p/ Claude, atualiza custo/tokens; `update-session` grava histórico.
3. **Fechamento:** `session-report` gera relatório via Claude e envia por e-mail.

## SOUL / persona
O guia tem um framework invisível (Circuito 7 de Leary) e 13 domínios de conhecimento — define tom e conteúdo. **Regra:** nunca usar "terapia/terapeuta".

## Configuração de runtime
`vercel.json` define `maxDuration` por função (chat 30s, report 30s, webhooks 15s, validate/update 10s).
