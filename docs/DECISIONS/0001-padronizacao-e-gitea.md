# ADR 0001: Padronização pelo manual + Gitea como origin

## Status
Aceita (2026-07)

## Contexto
NewCosmos (site + funções serverless) já tinha git no GitHub (`NewCosmosIA/NewCosmos`) e rodava na Vercel, mas sem o pacote de documentação padrão. O `.gitignore` era mínimo e não estava versionado. Quarto projeto da iniciativa de organização pelo Manual Universal IA.

## Decisão
1. Adotar o manual **in-place**, preservando histórico: `docs/`, `.gitea/`, `.gitignore` reforçado, `README` mantido como guia de deploy.
2. **Gitea = versionador principal** (`origin`, org `newcosmos`); **GitHub mantido como `github`** (backup). Antes do switch, o local foi **fast-forward** para o GitHub mais recente (estava 7 commits atrás).
3. Registrar a **regra de compliance** (nunca "terapia/terapeuta") em `AI_PROJECT_RULES.md`.

## Consequências
- (+) Histórico preservado; redundância GitHub↔Gitea; contexto documentado.
- (−) Dois remotes (origin/github). Schema do Supabase ainda informal (a formalizar).

## Relacionado
- Infra Gitea: memória `reference_gitea`. Deploy: README + `docs/DEPLOYMENT.md`.
