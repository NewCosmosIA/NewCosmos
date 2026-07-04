# SECURITY.md — NewCosmos

## Segredos (só no servidor Vercel)
- `ANTHROPIC_API_KEY` — chave da IA. **Nunca** chega ao browser (proxy em `api/chat.js`).
- `SUPABASE_URL`, `SUPABASE_SECRET_KEY` — acesso ao banco.
- Token do Hotmart (validar webhook) e credenciais de e-mail.
- `.env`/`.env*.local` no `.gitignore`. `.vercel` ignorado.

## Boas práticas aplicadas
- Chave de IA isolada no serverless; front nunca a vê.
- Acesso ao chat por token com limite por plano (validate-token).
- Tracking de custo por sessão (evita abuso/estouro).

## A reforçar
- Validar assinatura dos webhooks (Hotmart hottok / Cal.com secret) antes de emitir token.
- Rate limit no `chat` por token.

## Se um segredo vazar
Rotacionar `ANTHROPIC_API_KEY` (console Anthropic) e `SUPABASE_SECRET_KEY` (Supabase), atualizar env na Vercel e redeploy.

## Compliance de linguagem
Nunca usar "terapia/terapêutico/terapeuta" nas saídas (bem-estar, não terapia).
