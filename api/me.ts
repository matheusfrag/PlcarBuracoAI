import type { VercelRequest, VercelResponse } from '@vercel/node'
import { lerToken, tokenValido } from './_auth'

/** Informa ao cliente se a sessão atual (cookie) é válida. */
export default function handler(req: VercelRequest, res: VercelResponse) {
  const autenticado = tokenValido(lerToken(req.headers.cookie))
  res.status(200).json({ autenticado })
}
