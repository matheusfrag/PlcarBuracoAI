import { describe, expect, it } from 'vitest'
import { mapearAnalise } from './aiVision'
import { calcularPontuacaoRodada, emptyTeamRoundScore } from './scoring'

describe('mapearAnalise', () => {
  it('conta canastras por tipo e soma TODAS as cartas baixadas', () => {
    const r = mapearAnalise({
      jogos: [
        {
          cartas: ['A', 'A', 'A', 'A', 'K', 'K', 'K'], // limpa: 4*15 + 3*10 = 90
          temCoringa: false,
          classificacao: 'canastra_limpa',
        },
        {
          cartas: ['5', '5', '5', '5', '5', '5', '2'], // suja: 6*5 + 10(2) = 40
          temCoringa: true,
          classificacao: 'canastra_suja',
        },
        {
          cartas: ['3', '4', '5'], // jogo simples: 5+5+5 = 15
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
    // soma de TODAS as cartas (inclui as das canastras): 90 + 40 + 15 = 145
    expect(r.patch.cartasBaixadasPontos).toBe(145)
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
    expect(r.patch.cartasBaixadasPontos).toBe(45) // 3 ases = 45
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
    expect(r.patch.cartasBaixadasPontos).toBe(25) // A(15) + K(10)
    expect(r.confianca).toBe('baixa') // valor inválido vira 'baixa'
  })

  it('lida com resposta totalmente vazia/nula', () => {
    const r = mapearAnalise(null)
    expect(r.patch.canastrasLimpas).toBe(0)
    expect(r.patch.cartasBaixadasPontos).toBe(0)
    expect(r.jogos).toEqual([])
    expect(r.confianca).toBe('baixa')
  })

  // Regressão: cenário real da foto do usuário (esperado 450 só com jogos na mesa).
  it('cenário da foto: 1 limpa + 1 suja + simples = 450', () => {
    const r = mapearAnalise({
      jogos: [
        // paus 5-10 + 2 (suja): 5+5+5+10+10+10 + 10(2) = 55
        {
          cartas: ['5', '6', '7', '8', '9', '10', '2'],
          temCoringa: true,
          classificacao: 'canastra_suja',
        },
        // copas 4-10 (limpa): 5+5+5+5+10+10+10 = 50
        {
          cartas: ['4', '5', '6', '7', '8', '9', '10'],
          temCoringa: false,
          classificacao: 'canastra_limpa',
        },
        // ouros 4-5-6: 15
        { cartas: ['4', '5', '6'], temCoringa: false, classificacao: 'jogo_simples' },
        // espadas 8-5-6-2: 10+5+5+10 = 30
        { cartas: ['8', '5', '6', '2'], temCoringa: true, classificacao: 'jogo_simples' },
      ],
      confianca: 'media',
    })

    expect(r.patch.canastrasLimpas).toBe(1)
    expect(r.patch.canastrasSujas).toBe(1)
    expect(r.patch.cartasBaixadasPontos).toBe(150)

    // pegouMorto=true para isolar "apenas jogos na mesa" (sem penalidade de morto)
    const total = calcularPontuacaoRodada({
      ...emptyTeamRoundScore(),
      ...r.patch,
      pegouMorto: true,
    }).total
    expect(total).toBe(450) // bônus 200 + 100 + cartas 150
  })
})
