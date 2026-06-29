import type { Rank, ScoreBreakdown, TeamRoundScore } from '../types'
import {
  BATIDA_BONUS,
  CANASTRA_BONUS,
  CARD_VALUES,
  MORTO_PENALTY,
} from './constants'

/** Soma o valor de uma lista de cartas (usado no modo "seletor de cartas"). */
export function sumCards(ranks: Rank[]): number {
  return ranks.reduce((total, rank) => total + CARD_VALUES[rank], 0)
}

/**
 * Calcula a pontuação de uma dupla em uma rodada, detalhando cada componente.
 *
 * Fórmula:
 *   total = bônus das canastras
 *         + pontos dos jogos simples
 *         + bônus de batida (se bateu)
 *         − pontos das cartas na mão
 *         − penalidade de morto (se não pegou)
 */
export function calcularPontuacaoRodada(
  score: TeamRoundScore
): ScoreBreakdown {
  const canastras =
    score.canastrasLimpas * CANASTRA_BONUS.limpa +
    score.canastrasSujas * CANASTRA_BONUS.suja +
    score.canastrasReais * CANASTRA_BONUS.real

  const jogosSimples = score.jogosSimplesPontos
  const batida = score.bateu ? BATIDA_BONUS : 0
  const cartasNaMao = -score.cartasNaMaoPontos
  const morto = score.pegouMorto ? 0 : -MORTO_PENALTY

  const total = canastras + jogosSimples + batida + cartasNaMao + morto

  return { canastras, jogosSimples, batida, cartasNaMao, morto, total }
}

/** Cria uma pontuação de rodada vazia (zeros e flags falsas). */
export function emptyTeamRoundScore(): TeamRoundScore {
  return {
    canastrasLimpas: 0,
    canastrasSujas: 0,
    canastrasReais: 0,
    jogosSimplesPontos: 0,
    cartasNaMaoPontos: 0,
    pegouMorto: false,
    bateu: false,
  }
}
