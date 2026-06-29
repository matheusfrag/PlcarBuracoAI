# Placar Buraco

PWA para contar pontos de partidas de buraco. Registre cada rodada por dupla,
com placar acumulado, histórico e **reconhecimento dos jogos por foto** usando
IA (Gemini). Dados de partidas ficam **locais** no dispositivo (IndexedDB).

## Stack
- React + TypeScript + Vite, Tailwind CSS, PWA (vite-plugin-pwa)
- IndexedDB via Dexie.js (sem backend de dados)
- Funções serverless na Vercel para login e análise de foto (Gemini)

## Regras de pontuação
- Cartas: 3–7 = 5 · 8–K = 10 · Ás = 15 · 2/Coringa = 20
- Canastra suja +100 · limpa +200 · real (A→A mesmo naipe, sem coringa) +500
- Batida +100 · não pegou o morto −100 · cartas na mão subtraem
- Para bater: pegar o morto **e** ter ≥1 canastra limpa

## Desenvolvimento

```bash
npm install
npm run dev        # app (sem as funções /api)
npm test           # testes unitários (pontuação, IA, auth)
npm run build      # build de produção
```

> As funções em `api/` (login e análise) **não rodam** com `npm run dev` puro.
> Para testá-las localmente use o Vercel CLI: `npm i -g vercel` e `vercel dev`
> (precisa de `.env.local` com as variáveis abaixo).

## Variáveis de ambiente (server-only)

Configure em **Vercel → Settings → Environment Variables** (e em `.env.local`
para `vercel dev`). **Nunca** use o prefixo `VITE_` — ele expõe a variável no
navegador.

| Variável | Descrição |
|----------|-----------|
| `GEMINI_API_KEY` | Chave do Google AI Studio (https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | Modelo de visão (padrão `gemini-2.5-flash`) |
| `APP_PASSWORD` | Senha de acesso ao app |
| `AUTH_SECRET` | String longa e aleatória para assinar a sessão |

## Deploy na Vercel
1. Suba o projeto para um repositório Git e importe na Vercel (detecta o Vite).
2. Configure as 4 variáveis acima.
3. Deploy. A Vercel serve o app em HTTPS e roda as funções em `/api/*`.

## Segurança
- App protegido por senha; o token de sessão é HMAC assinado, em cookie
  httpOnly + Secure + SameSite=Strict. A trava real é o check server-side em
  `/api/analisar` (401 sem sessão).
- A saída da IA é tratada como não confiável: validamos o JSON e **recalculamos**
  os pontos no nosso código (`src/lib/scoring.ts`).
- Recomendado: no Google Cloud, restrinja a chave à *Generative Language API* e
  defina uma cota/orçamento máximo.

## Privacidade
A análise por IA **envia a foto para o Google**. O restante do app é 100% local.
