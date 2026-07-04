# DATABASE.md — NewCosmos (Supabase / Postgres)

Persistência via Supabase REST (`SUPABASE_URL` + `SUPABASE_SECRET_KEY`). Acesso só a partir das funções serverless.

## Entidades (alto nível)
### sessions
Sessão/token de acesso e consumo.
- `token` (chave de acesso), `plan` (avulso/essencial/transformacao)
- `tokens_input`, `tokens_output`, `cost_usd` (tracking do `chat.js`)
- limite de sessões e histórico (memória persistente via `update-session`)
- e-mail do usuário, datas.

> Colunas exatas: inferidas do uso em `api/*.js`. Ao formalizar o schema, versionar um `schema.sql` e detalhar aqui.

## Regras
- `SUPABASE_SECRET_KEY` só no servidor — nunca no front.
- Limites por plano aplicados na emissão (webhooks) e checados no `validate-token`.
- Free tier: `keepalive` evita pausa por inatividade.
- Mudança de schema → registrar aqui + `DECISIONS/`.
