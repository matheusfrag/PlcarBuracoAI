import type { Rank } from '../types'

/** Valor em pontos de cada carta individual no buraco. */
export const CARD_VALUES: Record<Rank, number> = {
  '3': 5,
  '4': 5,
  '5': 5,
  '6': 5,
  '7': 5,
  '8': 10,
  '9': 10,
  '10': 10,
  J: 10,
  Q: 10,
  K: 10,
  A: 15,
  '2': 10, // único coringa do baralho; vale 10 (regra da casa)
}

/** Bônus por tipo de canastra. */
export const CANASTRA_BONUS = {
  limpa: 200,
  suja: 100,
  real: 500,
} as const

/** Bônus por bater (fechar a rodada). */
export const BATIDA_BONUS = 100

/** Penalidade por não pegar o morto ao final da rodada. */
export const MORTO_PENALTY = 100

/** Meta de pontos padrão sugerida ao criar uma partida. */
export const DEFAULT_TARGET_SCORE = 3000
