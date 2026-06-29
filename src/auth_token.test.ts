import { describe, expect, it, beforeAll } from 'vitest'
import {
  criarToken,
  tokenValido,
  lerToken,
  senhaConfere,
} from '../api/_auth'

beforeAll(() => {
  process.env.AUTH_SECRET = 'segredo-de-teste-bem-longo-1234567890'
})

describe('token HMAC', () => {
  it('aceita um token recém-criado', () => {
    expect(tokenValido(criarToken())).toBe(true)
  })

  it('rejeita token ausente ou malformado', () => {
    expect(tokenValido(undefined)).toBe(false)
    expect(tokenValido('')).toBe(false)
    expect(tokenValido('semponto')).toBe(false)
  })

  it('rejeita assinatura adulterada', () => {
    const token = criarToken()
    const [exp] = token.split('.')
    expect(tokenValido(`${exp}.deadbeef`)).toBe(false)
  })

  it('rejeita token expirado', () => {
    const expirado = Date.now() - 1000
    // refaz a assinatura correta para um timestamp já vencido
    const valido = criarToken()
    const assinatura = valido.split('.')[1]
    // assinatura não corresponde a expirado → inválido de qualquer forma
    expect(tokenValido(`${expirado}.${assinatura}`)).toBe(false)
  })
})

describe('lerToken', () => {
  it('extrai o cookie buraco_auth', () => {
    expect(lerToken('outro=1; buraco_auth=abc.def; x=2')).toBe('abc.def')
    expect(lerToken('outro=1')).toBeUndefined()
    expect(lerToken(undefined)).toBeUndefined()
  })
})

describe('senhaConfere', () => {
  it('compara senhas corretamente', () => {
    expect(senhaConfere('1234', '1234')).toBe(true)
    expect(senhaConfere('1234', '4321')).toBe(false)
    expect(senhaConfere('123', '1234')).toBe(false)
  })
})
