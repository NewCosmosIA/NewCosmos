# TEST_STRATEGY.md — NewCosmos

## Situação
Sem testes automatizados. Validação hoje é manual (`vercel dev` + fluxo real).

## Prioridades a introduzir
- **Funções de token** (`validate-token`, webhooks): testar emissão, limites por plano (avulso 1 / essencial 4 / transformação 8), token inválido/expirado. Supabase mockado.
- **`chat.js`**: cálculo de custo (uncached/cached/output) para valores conhecidos; garantir que a chave nunca vaza na resposta.
- **Compliance:** teste que falha se a palavra "terapia/terapeuta" aparecer em textos/saídas versionadas.

## Smoke manual por deploy
Landing abre → agendar/pagar gera token (webhook) → chat valida token → responde → histórico grava → relatório por e-mail.

## Higiene
Encerrar `vercel dev` ao fim. Cron `keepalive` é execução única (não watch).
