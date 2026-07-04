# DEPLOYMENT.md — NewCosmos

O guia detalhado de deploy (Vercel, domínios GoDaddy, 1Password) está no **`README.md`** (mantido como fonte principal de deploy). Resumo:

## Vercel
- Projeto Vercel (org `new-cosmos`). Deploy automático no push (GitHub) ou `vercel --prod`.
- Env vars: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, token Hotmart, credenciais de e-mail. Ver `docs/SECURITY.md`.
- `vercel.json` define `maxDuration` por função.
- Domínios: `newcosmos.co` e `newcosmos.com.br` (GoDaddy → Vercel).

## Supabase
- Free tier — manter o cron `keepalive` (a cada 3 dias) ligado para não pausar.

## Versionamento
- **origin = Gitea** `newcosmos/newcosmos`; **github = GitHub** `NewCosmosIA/NewCosmos` (backup, sincronizado).
- CI: `.gitea/workflows/ci.yml`.

## Rollback
Vercel → Deployments → Promote deploy anterior.
