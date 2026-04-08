# NewCosmos — Guia de Deploy
## newcosmos.co | newcosmos.com.br

---

## ESTRUTURA DO PROJETO

```
newcosmos/
├── index.html          ← Landing page
├── chat.html           ← Interface do encontro
├── vercel.json         ← Configuração do Vercel
└── api/
    └── chat.js         ← Proxy seguro para a API da Anthropic
```

---

## COMO FUNCIONA A SEGURANÇA

```
Navegador do cliente
      │
      │  POST /api/chat  (sem chave de API)
      ▼
Vercel Serverless Function (api/chat.js)
      │
      │  lê ANTHROPIC_API_KEY do ambiente seguro do Vercel
      │  POST https://api.anthropic.com/v1/messages
      ▼
API da Anthropic
```

A chave de API **nunca chega ao navegador do cliente**. Ela vive apenas
nas variáveis de ambiente do servidor Vercel.

---

## PASSO 1 — PREPARAR O REPOSITÓRIO

1. Crie uma conta no GitHub (github.com) se ainda não tiver
2. Crie um repositório novo: "newcosmos"
3. Faça upload dos arquivos:
   - index.html
   - chat.html
   - vercel.json
   - api/chat.js  ← criar a pasta "api" dentro do repositório

---

## PASSO 2 — DEPLOY NO VERCEL

1. Acesse vercel.com e faça login com sua conta GitHub
2. Clique em "Add New Project"
3. Selecione o repositório "newcosmos"
4. Clique em "Deploy" — o Vercel detecta automaticamente a configuração

---

## PASSO 3 — CONFIGURAR A CHAVE DE API NO VERCEL

No painel do Vercel, acesse:
**Settings → Environment Variables**

Adicione:
```
Name:   ANTHROPIC_API_KEY
Value:  sk-ant-api03-... (sua chave real)
Environment: Production, Preview, Development
```

Depois clique em **Redeploy** para aplicar.

---

## PASSO 4 — INTEGRAÇÃO COM 1PASSWORD (RECOMENDADO)

O 1Password Secrets Automation permite injetar segredos diretamente
nas variáveis de ambiente do Vercel sem precisar copiar/colar manualmente.

### Configurar o 1Password CLI:

```bash
# Instalar o 1Password CLI
# Mac: brew install 1password-cli
# Windows: winget install AgileBits.1Password.CLI

# Fazer login
op signin

# Criar o segredo no 1Password
op item create \
  --category="API Credential" \
  --title="NewCosmos - Anthropic API" \
  --vault="Desenvolvimento" \
  "api_key[password]=sk-ant-api03-..."
```

### Usar com o Vercel CLI:

```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login no Vercel
vercel login

# Injetar variável do 1Password no Vercel
op run -- vercel env add ANTHROPIC_API_KEY production <<< \
  "$(op read 'op://Desenvolvimento/NewCosmos - Anthropic API/api_key')"
```

### Arquivo .env local (desenvolvimento):

Crie um arquivo `.env.local` na raiz do projeto:
```
# .env.local — NÃO fazer commit deste arquivo
ANTHROPIC_API_KEY=op://Desenvolvimento/NewCosmos - Anthropic API/api_key
```

Para rodar localmente com o 1Password injetando o segredo:
```bash
op run --env-file=".env.local" -- vercel dev
```

---

## PASSO 5 — CONECTAR O DOMÍNIO GODADDY

### No painel do Vercel:
1. Vá em **Settings → Domains**
2. Adicione: `newcosmos.co`
3. Adicione: `newcosmos.com.br`
4. O Vercel vai mostrar os registros DNS necessários

### No painel do GoDaddy:
1. Acesse o gerenciador de DNS do domínio
2. Adicione os registros que o Vercel indicou:

**Para newcosmos.co:**
```
Tipo: A
Nome: @
Valor: 76.76.21.21  (IP do Vercel)
TTL: 600

Tipo: CNAME
Nome: www
Valor: cname.vercel-dns.com
TTL: 600
```

**Para newcosmos.com.br:**
```
Tipo: A
Nome: @
Valor: 76.76.21.21
TTL: 600

Tipo: CNAME
Nome: www
Valor: cname.vercel-dns.com
TTL: 600
```

3. Aguardar propagação DNS: 10 minutos a 48 horas

O Vercel provisiona o certificado SSL (HTTPS) automaticamente.

---

## PASSO 6 — TESTAR

Após o deploy e DNS propagado:

1. Acesse https://newcosmos.co → deve abrir a landing page
2. Clique em "Agendar encontro gratuito" → configurar link do Cal.com
3. Acesse https://newcosmos.co/chat.html → deve abrir o chat
4. Digite uma mensagem e verificar se o NewCosmos responde

### Testar localmente antes do deploy:
```bash
# Com Vercel CLI e 1Password
op run --env-file=".env.local" -- vercel dev

# Acessa: http://localhost:3000
```

---

## PRÓXIMOS PASSOS RECOMENDADOS

### Agendamento (Cal.com):
1. Crie conta em cal.com
2. Configure o tipo de evento: "Encontro Gratuito — 45 min"
3. Copie o link do evento
4. Substitua o `href="#"` nos botões da landing page pelo link do Cal.com

### Pagamento (Stripe ou Hotmart):
- **Stripe**: mais profissional, integração direta, aceita cartão internacional
- **Hotmart**: mais simples de configurar, popular no Brasil, aceita Pix
- Configurar planos: Avulso (R$69), Essencial (R$220/mês), Transformação (R$400/mês)

### Proteção do chat (autenticação):
Para garantir que só clientes que pagaram acessem o chat:
- Após o pagamento, o sistema envia um link único por e-mail
- O link tem um token de acesso com validade de 1 hora
- Vercel Function valida o token antes de processar a mensagem

---

## CUSTOS ESTIMADOS

| Serviço | Custo |
|---------|-------|
| Vercel (Hobby) | Gratuito até 100GB de banda |
| API Claude Sonnet | ~$3/milhão tokens de entrada, ~$15/saída |
| Cal.com | Gratuito (plano básico) |
| GoDaddy (domínio) | Já pago |
| Stripe | 3,99% + R$0,39 por transação |

**Estimativa mensal com 50 clientes ativos:**
- API Claude: ~$15-30/mês
- Vercel: $0 (plano gratuito aguenta)
- **Total: ~$15-30/mês** vs $200/mês no OpenClaw

---

## SUPORTE

Para dúvidas técnicas sobre este setup:
- Vercel docs: vercel.com/docs
- 1Password CLI: developer.1password.com/docs/cli
- Anthropic API: docs.anthropic.com
