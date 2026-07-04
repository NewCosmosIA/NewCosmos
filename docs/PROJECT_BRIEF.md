# PROJECT_BRIEF.md — NewCosmos

## Objetivo
Plataforma de bem-estar com um **guia de IA** (Claude) que conduz encontros de autoconhecimento/autocura, com acesso por token, planos pagos e relatório de sessão por e-mail.

## Público-alvo
- Pessoas em busca de autoconhecimento, propósito, bem-estar integrativo.
- Testadores (acesso gratuito via agendamento) e clientes pagantes (Hotmart).

## Problema
Oferecer um acompanhamento guiado por IA, com identidade/propósito próprios, controle de custo e acesso, sem expor a chave da IA nem depender de plataformas caras.

## Solução
Site estático (landing + chat) + funções serverless na Vercel. O `api/chat.js` faz proxy seguro para a Anthropic (chave só no servidor), rastreando tokens e custo por sessão no Supabase. Acesso por token (testador via Cal.com, pago via Hotmart), histórico persistente e relatório de sessão por e-mail. O "guia" tem um framework invisível (SOUL / Circuito 7 de Leary).

## Escopo atual (no ar)
- Chat com memória/histórico persistente; proxy Claude com tracking de custo.
- Tokens: validação, limites por plano (avulso 1 / essencial 4 mês / transformação 8 mês).
- Webhooks: Hotmart (pagamento→token) e Cal.com (agendamento→token gratuito).
- Keepalive do Supabase (free tier). Relatório de sessão por e-mail.

## Fora do escopo agora
- (documentar novas features aqui conforme surgirem)

## Stack
- **Front:** HTML/CSS/JS estático (index, chat, privacidade).
- **Back:** Vercel serverless (Node ESM) + Supabase (Postgres/REST).
- **IA:** Anthropic (Claude Sonnet).
- **Pagamento/Agenda:** Hotmart + Cal.com. **E-mail:** serviço de envio (relatórios/tokens).
- **Versionador:** Gitea `newcosmos/newcosmos` (GitHub backup).

## Regra de compliance (CRÍTICA)
**Nunca** usar "terapia", "terapêutico" ou "terapeuta" em nenhum texto/saída — é bem-estar/autoconhecimento, não terapia. Ver `api/session-report.js`.

## Premissas / Riscos
- Chave Anthropic e segredos Supabase só em env (nunca no cliente).
- Supabase free-tier depende do keepalive para não pausar.
- Domínios newcosmos.co / newcosmos.com.br (GoDaddy → Vercel).
