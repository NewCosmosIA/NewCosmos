# FEATURE_MAP.md — NewCosmos

Procure aqui antes de criar.

## Front (estático)
| Página | Arquivo | Observações |
|--------|---------|-------------|
| Landing | `index.html` | Apresentação, 7 Princípios, CTAs (agendar/pagar) |
| Chat / encontro | `chat.html` | Interface do guia; memória; usa token |
| Privacidade | `privacidade.html` | Política |

## API (Vercel serverless)
| Endpoint | Arquivo | Função |
|----------|---------|--------|
| `POST /api/chat` | `api/chat.js` | Proxy Claude + tracking de tokens/custo por sessão (Supabase) |
| `POST /api/validate-token` | `api/validate-token.js` | Valida token e limite de sessões |
| `POST /api/update-session` | `api/update-session.js` | Salva histórico da sessão (memória) |
| `POST /api/session-report` | `api/session-report.js` | Relatório via Claude + e-mail (nunca "terapia") |
| `POST /api/webhook-hotmart` | `api/webhook-hotmart.js` | Pagamento → token + limite (avulso 1 / essencial 4 / transformação 8) |
| `POST /api/webhook-calcom` | `api/webhook-calcom.js` | Agendamento → token gratuito + e-mail |
| `GET /api/keepalive` | `api/keepalive.js` | Ping Supabase a cada 3 dias (free tier) |

## Atenção / não duplicar
- **Toda chamada à IA passa por `api/chat.js`** — não criar outro proxy.
- **Emissão de token** existe em 2 origens (hotmart pago, calcom gratuito) — reutilizar a mesma lógica/tabela de tokens, não criar uma terceira.
- Preços do Claude ficam hard-coded em `chat.js` (tracking de custo) — atualizar lá se mudar de modelo.
- Regra de linguagem: nunca "terapia/terapêutico/terapeuta".
