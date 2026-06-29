import { describe, expect, it } from 'vitest'
import { mapearAnalise } from './aiVision'

describe('mapearAnalise', () => {
  it('conta canastras por tipo e soma jogos simples', () => {
    const r = mapearAnalise({
      jogos: [
        {
          cartas: ['A', 'A', 'A', 'A', 'K', 'K', 'K'], // 7 cartas, sem coringa
          temCoringa: false,
          classificacao: 'canastra_limpa',
        },
        {
          cartas: ['5', '5', '5', '5', '5', '5', '2'], // 7 cartas, com coringa
          temCoringa: true,
          classificacao: 'canastra_suja',
        },
        {
          cartas: ['3', '4', '5'], // jogo simples = 5+5+5 = 15
          temCoringa: false,
          classificacao: 'jogo_simples',
        },
      ],
      confianca: 'alta',
      observacoes: 'ok',
    })
    expect(r.patch.canastrasLimpas).toBe(1)
    expect(r.patch.canastrasSujas).toBe(1)
    expect(r.patch.canastrasReais).toBe(0)
    expect(r.patch.jogosSimplesPontos).toBe(15)
    expect(r.confianca).toBe('alta')
  })

  it('rebaixa canastra com menos de 7 cartas para jogo simples', () => {
    const r = mapearAnalise({
      jogos: [
        {
          cartas: ['A', 'A', 'A'], // só 3 cartas, mas IA disse canastra
          temCoringa: false,
          classificacao: 'canastra_limpa',
        },
      ],
      confianca: 'media',
    })
    expect(r.patch.canastrasLimpas).toBe(0)
    expect(r.patch.jogosSimplesPontos).toBe(45) // 3 ases = 45
    expect(r.jogos[0].classificacao).toBe('jogo_simples')
  })

  it('reclassifica limpa→suja quando há coringa em 7+ cartas', () => {
    const r = mapearAnalise({
      jogos: [
        {
          cartas: ['6', '6', '6', '6', '6', '6', 'JOKER'],
          temCoringa: false, // IA errou a flag; recalculamos pelas cartas
          classificacao: 'canastra_limpa',
        },
      ],
      confianca: 'baixa',
    })
    expect(r.patch.canastrasSujas).toBe(1)
    expect(r.patch.canastrasLimpas).toBe(0)
    expect(r.jogos[0].temCoringa).toBe(true)
  })

  it('ignora cartas inválidas e trata entrada malformada', () => {
    const r = mapearAnalise({
      jogos: [
        {
          cartas: ['A', 'XYZ', '99', 'K'], // XYZ e 99 são inválidas
          temCoringa: false,
          classificacao: 'jogo_simples',
        },
      ],
      confianca: 'invalida' as never,
    })
    expect(r.patch.jogosSimplesPontos).toBe(25) // A(15) + K(10)
    expect(r.confianca).toBe('baixa') // valor inválido vira 'baixa'
  })

  it('lida com resposta totalmente vazia/nula', () => {
    const r = mapearAnalise(null)
    expect(r.patch.canastrasLimpas).toBe(0)
    expect(r.patch.jogosSimplesPontos).toBe(0)
    expect(r.jogos).toEqual([])
    expect(r.confianca).toBe('baixa')
  })
})
