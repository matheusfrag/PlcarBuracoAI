import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cookieLimpo } from './_auth.js'

/** Encerra a sessão: apaga o cookie de autenticação. */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ erro: 'Método não permitido' })
    return
  }
  res.setHeader('Set-Cookie', cookieLimpo())
  res.status(200).json({ ok: true })
}
