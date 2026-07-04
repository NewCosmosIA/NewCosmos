# API_CONTRACT.md — NewCosmos

Base: `https://newcosmos.co`. Funções serverless (Vercel). Segredos só no servidor.

## POST /api/chat
Proxy para a Anthropic. Recebe a conversa + token; devolve a resposta do guia. Rastreia tokens/custo na sessão (Supabase).
- Body: `{ token, messages/... }`
- Efeito: atualiza `sessions` (tokens_input, tokens_output, cost_usd).
- `maxDuration` 30s.

## POST /api/validate-token
Valida se o token existe, está ativo e dentro do limite de sessões do plano.
- Body: `{ token }` → `{ valid, plan, sessions_left, ... }`

## POST /api/update-session
Salva/atualiza o histórico da sessão (memória persistente). Body até 2mb.

## POST /api/session-report
Gera relatório da sessão via Claude e envia por e-mail. **Nunca** usar "terapia/terapeuta".

## POST /api/webhook-hotmart
Recebe evento de pagamento; cria token e define limite: `avulso`=1, `essencial`=4/mês, `transformacao`=8/mês. Validar assinatura do Hotmart.

## POST /api/webhook-calcom
Recebe agendamento; gera token gratuito e envia por e-mail.

## GET /api/keepalive
Ping no Supabase (cron a cada 3 dias) para não pausar no free tier.

### Convenção de erros
`400` payload inválido · `401/403` token inválido/sem crédito · `500` inesperado.
