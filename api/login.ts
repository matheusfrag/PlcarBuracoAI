import type { VercelRequest, VercelResponse } from '@vercel/node'
import { criarToken, montarCookie, senhaConfere } from './_auth'

// Rate-limit simples em memória (por instância). Reseta a cada cold start.
const tentativas = new Map<string, { count: number; reset: number }>()
const JANELA_MS = 1000 * 60 * 5 // 5 min
const MAX_TENTATIVAS = 8

function rateLimited(ip: string): boolean {
  const agora = Date.now()
  const reg = tentativas.get(ip)
  if (!reg || agora > reg.reset) {
    tentativas.set(ip, { count: 1, reset: agora + JANELA_MS })
    return false
  }
  reg.count++
  return reg.count > MAX_TENTATIVAS
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ erro: 'Método não permitido' })
    return
  }

  const senhaEsperada = process.env.APP_PASSWORD
  if (!senhaEsperada || !process.env.AUTH_SECRET) {
    res.status(500).json({ erro: 'Servidor não configurado' })
    return
  }

  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    'desconhecido'
  if (rateLimited(ip)) {
    res.status(429).json({ erro: 'Muitas tentativas. Tente mais tarde.' })
    return
  }

  const senha = (req.body?.senha ?? '') as string
  if (typeof senha !== 'string' || !senhaConfere(senha, senhaEsperada)) {
    res.status(401).json({ erro: 'Senha incorreta' })
    return
  }

  res.setHeader('Set-Cookie', montarCookie(criarToken()))
  res.status(200).json({ ok: true })
}
