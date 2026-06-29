import type { VercelRequest, VercelResponse } from '@vercel/node'
import { lerToken, tokenValido } from './_auth.js'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const MAX_BASE64_LEN = 8_000_000 // ~6 MB de imagem; barra payloads abusivos

const PROMPT = `Você é um juiz de buraco analisando uma foto dos JOGOS BAIXADOS NA MESA de UMA dupla.
Identifique cada jogo (conjunto de cartas agrupadas) visível na foto.

Para CADA jogo, liste as cartas e classifique:
- "canastra_real": sequência completa A-2-3-4-5-6-7-8-9-10-J-Q-K-A do MESMO naipe, 14 cartas, SEM coringa.
- "canastra_limpa": 7 ou mais cartas, SEM coringa (2 ou Joker).
- "canastra_suja": 7 ou mais cartas, COM pelo menos um coringa (2 ou Joker).
- "jogo_simples": menos de 7 cartas.

Use os símbolos de carta: 3,4,5,6,7,8,9,10,J,Q,K,A,2,JOKER (o "2" e o "JOKER" são coringas).
Se houver cartas empilhadas e você não tiver certeza da quantidade exata, faça sua melhor estimativa
e reduza a confiança. Responda APENAS com o JSON do schema.`

interface GeminiPart {
  text?: string
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    res.status(405).json({ erro: 'Método não permitido' })
    return
  }

  // Proteção real do endpoint: exige sessão válida.
  if (!tokenValido(lerToken(req.headers.cookie))) {
    res.status(401).json({ erro: 'Não autenticado' })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    res.status(500).json({ erro: 'Servidor não configurado (GEMINI_API_KEY)' })
    return
  }
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

  const imagemBase64 = req.body?.imagem as string | undefined
  const mime = (req.body?.mime as string | undefined) || 'image/jpeg'
  if (!imagemBase64 || typeof imagemBase64 !== 'string') {
    res.status(400).json({ erro: 'Imagem ausente' })
    return
  }
  if (!mime.startsWith('image/')) {
    res.status(400).json({ erro: 'Tipo de arquivo inválido' })
    return
  }
  if (imagemBase64.length > MAX_BASE64_LEN) {
    res.status(413).json({ erro: 'Imagem grande demais' })
    return
  }

  const responseSchema = {
    type: 'object',
    properties: {
      jogos: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            cartas: { type: 'array', items: { type: 'string' } },
            temCoringa: { type: 'boolean' },
            classificacao: {
              type: 'string',
              enum: [
                'canastra_real',
                'canastra_limpa',
                'canastra_suja',
                'jogo_simples',
              ],
            },
          },
          required: ['cartas', 'temCoringa', 'classificacao'],
        },
      },
      confianca: { type: 'string', enum: ['alta', 'media', 'baixa'] },
      observacoes: { type: 'string' },
    },
    required: ['jogos', 'confianca'],
  }

  try {
    const resp = await fetch(
      `${GEMINI_URL}/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: PROMPT },
                { inline_data: { mime_type: mime, data: imagemBase64 } },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema,
          },
        }),
      }
    )

    if (!resp.ok) {
      const detalhe = await resp.text().catch(() => '')
      console.error('Erro Gemini:', resp.status, detalhe.slice(0, 500))
      res.status(502).json({ erro: 'Falha ao analisar a imagem' })
      return
    }

    const data = await resp.json()
    const texto: string | undefined = data?.candidates?.[0]?.content?.parts
      ?.map((p: GeminiPart) => p.text || '')
      .join('')

    if (!texto) {
      res.status(502).json({ erro: 'Resposta vazia da IA' })
      return
    }

    // O texto já é JSON (responseMimeType application/json). Devolve cru;
    // o cliente valida/sanea e recalcula os pontos.
    res.status(200).json(JSON.parse(texto))
  } catch (e) {
    console.error('Erro inesperado em /api/analisar:', e)
    res.status(500).json({ erro: 'Erro interno' })
  }
}
