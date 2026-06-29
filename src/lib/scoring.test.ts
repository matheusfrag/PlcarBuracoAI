import { describe, expect, it } from 'vitest'
import {
  calcularPontuacaoRodada,
  emptyTeamRoundScore,
  sumCards,
} from './scoring'
import { validarRodada } from './validation'

describe('sumCards', () => {
  it('soma valores individuais das cartas', () => {
    expect(sumCards(['3', '4', '5'])).toBe(15)
    expect(sumCards(['A', '2', 'JOKER'])).toBe(55)
    expect(sumCards(['8', '9', '10', 'K'])).toBe(40)
    expect(sumCards([])).toBe(0)
  })
})

describe('calcularPontuacaoRodada', () => {
  it('rodada vazia com morto não pego = -100', () => {
    const r = calcularPontuacaoRodada(emptyTeamRoundScore())
    expect(r.total).toBe(-100)
    expect(r.morto).toBe(-100)
  })

  it('canastra limpa + batida + pegou morto', () => {
    const r = calcularPontuacaoRodada({
      ...emptyTeamRoundScore(),
      canastrasLimpas: 1,
      pegouMorto: true,
      bateu: true,
    })
    // 200 (limpa) + 100 (batida) + 0 (morto ok) = 300
    expect(r.canastras).toBe(200)
    expect(r.batida).toBe(100)
    expect(r.morto).toBe(0)
    expect(r.total).toBe(300)
  })

  it('mistura de canastras com cartas na mão e morto pego', () => {
    const r = calcularPontuacaoRodada({
      canastrasLimpas: 1, // 200
      canastrasSujas: 2, // 200
      canastrasReais: 1, // 500
      jogosSimplesPontos: 45,
      cartasNaMaoPontos: 30,
      pegouMorto: true,
      bateu: false,
    })
    // 200 + 200 + 500 + 45 - 30 + 0 = 915
    expect(r.canastras).toBe(900)
    expect(r.jogosSimples).toBe(45)
    expect(r.cartasNaMao).toBe(-30)
    expect(r.total).toBe(915)
  })

  it('penaliza cartas na mão e morto não pego juntos', () => {
    const r = calcularPontuacaoRodada({
      ...emptyTeamRoundScore(),
      jogosSimplesPontos: 50,
      cartasNaMaoPontos: 70,
      pegouMorto: false,
    })
    // 50 - 70 - 100 = -120
    expect(r.total).toBe(-120)
  })
})

describe('validarRodada', () => {
  const base = emptyTeamRoundScore()

  it('rodada sem batida é válida', () => {
    expect(validarRodada(base, base)).toEqual([])
  })

  it('não permite bater sem pegar morto', () => {
    const erros = validarRodada(
      { ...base, bateu: true, canastrasLimpas: 1, pegouMorto: false },
      base
    )
    expect(erros).toContain('Dupla 1: não pode bater sem ter pegado o morto.')
  })

  it('não permite bater sem canastra limpa', () => {
    const erros = validarRodada(
      { ...base, bateu: true, pegouMorto: true, canastrasLimpas: 0 },
      base
    )
    expect(erros).toContain(
      'Dupla 1: não pode bater sem ao menos uma canastra limpa.'
    )
  })

  it('não permite as duas duplas baterem', () => {
    const batendo = {
      ...base,
      bateu: true,
      pegouMorto: true,
      canastrasLimpas: 1,
    }
    const erros = validarRodada(batendo, batendo)
    expect(erros).toContain('Apenas uma dupla pode bater por rodada.')
  })

  it('batida válida não gera erros', () => {
    const erros = validarRodada(
      { ...base, bateu: true, pegouMorto: true, canastrasLimpas: 1 },
      base
    )
    expect(erros).toEqual([])
  })
})
