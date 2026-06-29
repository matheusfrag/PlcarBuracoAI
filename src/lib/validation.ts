import type { TeamRoundScore } from '../types'

/**
 * Valida as regras de uma rodada antes de salvar.
 * Retorna lista de mensagens de erro (vazia = válido).
 *
 * Regras:
 * - Para bater: a dupla precisa ter pego o morto E ter ao menos 1 canastra limpa.
 * - No máximo uma dupla pode bater por rodada.
 */
export function validarRodada(
  team1: TeamRoundScore,
  team2: TeamRoundScore
): string[] {
  const erros: string[] = []

  if (team1.bateu && team2.bateu) {
    erros.push('Apenas uma dupla pode bater por rodada.')
  }

  for (const [nome, score] of [
    ['Dupla 1', team1],
    ['Dupla 2', team2],
  ] as const) {
    if (score.bateu) {
      if (!score.pegouMorto) {
        erros.push(`${nome}: não pode bater sem ter pegado o morto.`)
      }
      if (score.canastrasLimpas < 1) {
        erros.push(
          `${nome}: não pode bater sem ao menos uma canastra limpa.`
        )
      }
    }
  }

  return erros
}
