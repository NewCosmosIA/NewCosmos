# AI_PROJECT_RULES.md — NewCosmos

## Regra principal
Alterar/revisar com endpoints finos, segredos só no servidor, documentação viva e Git seguro (Gitea).

## Regra de compliance (INEGOCIÁVEL)
**Nunca** usar "terapia", "terapêutico" ou "terapeuta" — em código, prompts, textos do site ou saídas da IA. É bem-estar/autoconhecimento.

## Antes de implementar
- Ler README (deploy), `docs/` e `docs/FEATURE_MAP.md` — procurar antes de criar.
- Branch específica (nunca `main`).

## Durante
- Toda chamada à IA passa por `api/chat.js`; toda emissão de token reutiliza a mesma lógica (hotmart/calcom). Não duplicar.
- Segredos só via `process.env` no serverless — nunca no front (`*.html`).
- Preços/modelo do Claude ficam em `chat.js` (tracking) — atualizar lá.
- Não versionar `.env*`, `.vercel`, `node_modules`, `.claude`.

## Antes de concluir
- Testar `vercel dev` localmente; revisar diff; sem segredos; encerrar processos.
- Push principal no origin (Gitea); espelhar no github quando fizer sentido.
- PR no Gitea.

## Definição de pronto
Organizado, funcional, sem duplicidade, docs atualizadas, sem segredos, sem "terapia", diff revisado, pronto para PR.
