import Dexie, { type EntityTable } from 'dexie'
import type { Game, Round, Team, TeamRoundScore } from '../types'
import { calcularPontuacaoRodada } from './scoring'

const db = new Dexie('PlacarBuraco') as Dexie & {
  games: EntityTable<Game, 'id'>
  rounds: EntityTable<Round, 'id'>
}

db.version(1).stores({
  games: '++id, status, createdAt',
  rounds: '++id, gameId, roundNumber',
})

export { db }

// ---------- Partidas ----------

export async function criarPartida(
  team1: Team,
  team2: Team,
  targetScore: number
): Promise<number> {
  return db.games.add({
    team1,
    team2,
    targetScore,
    status: 'active',
    createdAt: new Date(),
  }) as Promise<number>
}

export async function encerrarPartida(
  gameId: number,
  winner: Game['winner']
): Promise<void> {
  await db.games.update(gameId, {
    status: 'finished',
    winner,
    finishedAt: new Date(),
  })
}

export async function excluirPartida(gameId: number): Promise<void> {
  await db.transaction('rw', db.games, db.rounds, async () => {
    await db.rounds.where('gameId').equals(gameId).delete()
    await db.games.delete(gameId)
  })
}

// ---------- Rodadas ----------

export async function adicionarRodada(
  gameId: number,
  team1Score: TeamRoundScore,
  team2Score: TeamRoundScore
): Promise<number> {
  const count = await db.rounds.where('gameId').equals(gameId).count()
  return db.rounds.add({
    gameId,
    roundNumber: count + 1,
    team1Score,
    team2Score,
    createdAt: new Date(),
  }) as Promise<number>
}

export async function excluirRodada(roundId: number): Promise<void> {
  await db.rounds.delete(roundId)
}

// ---------- Totais ----------

export interface TotaisPartida {
  team1: number
  team2: number
}

/** Soma os totais acumulados de cada dupla a partir das rodadas. */
export function calcularTotais(rounds: Round[]): TotaisPartida {
  return rounds.reduce<TotaisPartida>(
    (acc, r) => {
      acc.team1 += calcularPontuacaoRodada(r.team1Score).total
      acc.team2 += calcularPontuacaoRodada(r.team2Score).total
      return acc
    },
    { team1: 0, team2: 0 }
  )
}
