import { db } from './db'
import { blobParaBase64 } from './imageCompress'
import type { Game, TeamRoundScore } from '../types'

/** Pontuação serializável (foto vira base64). */
type ScoreExport = Omit<TeamRoundScore, 'photo'> & { photoBase64?: string }

interface RoundExport {
  gameId: number
  roundNumber: number
  createdAt: string | Date
  team1Score: ScoreExport
  team2Score: ScoreExport
}

interface BackupFile {
  app: 'placar-buraco'
  version: number
  exportadoEm: string
  games: Game[]
  rounds: RoundExport[]
}

const APP_TAG = 'placar-buraco'

function base64ParaBlob(base64: string, mime = 'image/jpeg'): Blob {
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

async function scoreParaExport(s: TeamRoundScore): Promise<ScoreExport> {
  const { photo, ...resto } = s
  return {
    ...resto,
    photoBase64: photo ? await blobParaBase64(photo) : undefined,
  }
}

function scoreDeImport(s: ScoreExport): TeamRoundScore {
  const { photoBase64, ...resto } = s
  return {
    ...resto,
    photo: photoBase64 ? base64ParaBlob(photoBase64) : undefined,
  }
}

/** Exporta todas as partidas e rodadas (com fotos) para um arquivo .json baixável. */
export async function exportarDados(): Promise<void> {
  const games = await db.games.toArray()
  const rounds = await db.rounds.toArray()

  const roundsExport: RoundExport[] = await Promise.all(
    rounds.map(async (r) => ({
      gameId: r.gameId,
      roundNumber: r.roundNumber,
      createdAt: r.createdAt,
      team1Score: await scoreParaExport(r.team1Score),
      team2Score: await scoreParaExport(r.team2Score),
    }))
  )

  const dados: BackupFile = {
    app: APP_TAG,
    version: 1,
    exportadoEm: new Date().toISOString(),
    games,
    rounds: roundsExport,
  }

  const blob = new Blob([JSON.stringify(dados)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `placar-buraco-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export interface ResultadoImport {
  partidas: number
  rodadas: number
}

/**
 * Importa um arquivo de backup, ADICIONANDO as partidas às existentes
 * (não substitui). Reatribui ids para evitar colisões.
 */
export async function importarDados(file: File): Promise<ResultadoImport> {
  const dados = JSON.parse(await file.text()) as Partial<BackupFile>
  if (
    dados?.app !== APP_TAG ||
    !Array.isArray(dados.games) ||
    !Array.isArray(dados.rounds)
  ) {
    throw new Error('Arquivo de backup inválido.')
  }

  let partidas = 0
  let rodadas = 0

  await db.transaction('rw', db.games, db.rounds, async () => {
    const mapaId = new Map<number, number>() // id antigo → novo

    for (const g of dados.games!) {
      const { id: oldId, ...resto } = g
      const novoId = (await db.games.add({
        ...resto,
        createdAt: new Date(resto.createdAt),
        finishedAt: resto.finishedAt ? new Date(resto.finishedAt) : undefined,
      })) as number
      if (oldId != null) mapaId.set(oldId, novoId)
      partidas++
    }

    for (const r of dados.rounds!) {
      const novoGameId = mapaId.get(r.gameId)
      if (novoGameId == null) continue
      await db.rounds.add({
        gameId: novoGameId,
        roundNumber: r.roundNumber,
        createdAt: new Date(r.createdAt),
        team1Score: scoreDeImport(r.team1Score),
        team2Score: scoreDeImport(r.team2Score),
      })
      rodadas++
    }
  })

  return { partidas, rodadas }
}
