import crypto from 'node:crypto'

/**
 * Autenticação stateless por token HMAC.
 *
 * O token tem o formato `<expiraEm>.<assinatura>` onde:
 * - expiraEm: timestamp (ms) de expiração
 * - assinatura: HMAC-SHA256 de `<expiraEm>` usando AUTH_SECRET
 *
 * Guardado em cookie httpOnly + Secure + SameSite=Strict.
 */

const COOKIE_NAME = 'buraco_auth'
const TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 dias

function getSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET não configurado')
  return secret
}

function sign(data: string): string {
  return crypto.createHmac('sha256', getSecret()).update(data).digest('hex')
}

/** Cria um token assinado válido por TTL_MS. */
export function criarToken(): string {
  const expiraEm = Date.now() + TTL_MS
  return `${expiraEm}.${sign(String(expiraEm))}`
}

/** Verifica um token: assinatura válida e não expirado. */
export function tokenValido(token: string | undefined): boolean {
  if (!token) return false
  const [expiraStr, assinatura] = token.split('.')
  if (!expiraStr || !assinatura) return false

  const esperada = sign(expiraStr)
  // Comparação de tempo constante (evita timing attack).
  const a = Buffer.from(assinatura)
  const b = Buffer.from(esperada)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false

  const expiraEm = Number(expiraStr)
  if (!Number.isFinite(expiraEm) || Date.now() > expiraEm) return false

  return true
}

/** Monta o header Set-Cookie para o token (ou para limpar, se token vazio). */
export function montarCookie(token: string): string {
  const maxAge = Math.floor(TTL_MS / 1000)
  return [
    `${COOKIE_NAME}=${token}`,
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${maxAge}`,
  ].join('; ')
}

/** Extrai o token do header Cookie da requisição. */
export function lerToken(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return undefined
  for (const parte of cookieHeader.split(';')) {
    const [nome, ...resto] = parte.trim().split('=')
    if (nome === COOKIE_NAME) return resto.join('=')
  }
  return undefined
}

/** Comparação de senha em tempo constante. */
export function senhaConfere(fornecida: string, esperada: string): boolean {
  const a = Buffer.from(fornecida)
  const b = Buffer.from(esperada)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
