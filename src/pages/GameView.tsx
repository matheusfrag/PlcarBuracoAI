import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import {
  calcularTotais,
  db,
  encerrarPartida,
  excluirRodada,
} from '../lib/db'
import { calcularPontuacaoRodada } from '../lib/scoring'
import type { Round, TeamId } from '../types'

export default function GameView() {
  const { id } = useParams()
  const gameId = Number(id)
  const navigate = useNavigate()

  const game = useLiveQuery(() => db.games.get(gameId), [gameId])
  const rounds = useLiveQuery(
    () =>
      db.rounds.where('gameId').equals(gameId).sortBy('roundNumber'),
    [gameId]
  )

  if (!game || !rounds) return <Layout title="Partida" back children={null} />

  const totais = calcularTotais(rounds)
  const team1Nome = `${game.team1.player1} & ${game.team1.player2}`
  const team2Nome = `${game.team2.player1} & ${game.team2.player2}`

  const atingiuMeta =
    totais.team1 >= game.targetScore || totais.team2 >= game.targetScore
  const vencedor: TeamId | undefined =
    game.status === 'finished'
      ? game.winner
      : atingiuMeta
        ? totais.team1 >= totais.team2
          ? 'team1'
          : 'team2'
        : undefined

  return (
    <Layout title="Placar" back>
      {/* Placar grande */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <TeamTotal
          name={team1Nome}
          score={totais.team1}
          target={game.targetScore}
          highlight={vencedor === 'team1'}
        />
        <TeamTotal
          name={team2Nome}
          score={totais.team2}
          target={game.targetScore}
          highlight={vencedor === 'team2'}
        />
      </div>

      {game.status === 'active' && atingiuMeta && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-center">
          <p className="font-semibold text-amber-800">
            🏆 {vencedor === 'team1' ? team1Nome : team2Nome} atingiu a meta!
          </p>
          <button
            onClick={() => encerrarPartida(gameId, vencedor)}
            className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Encerrar partida
          </button>
        </div>
      )}

      {game.status === 'finished' && (
        <div className="mb-4 rounded-xl border border-teal-300 bg-teal-50 p-3 text-center font-semibold text-teal-800">
          Partida encerrada · 🏆{' '}
          {game.winner === 'team1' ? team1Nome : team2Nome}
        </div>
      )}

      {game.status === 'active' && (
        <button
          onClick={() => navigate(`/partida/${gameId}/rodada`)}
          className="mb-6 w-full rounded-xl bg-teal-600 py-4 text-lg font-semibold text-white shadow transition active:scale-[0.99] hover:bg-teal-700"
        >
          + Nova Rodada
        </button>
      )}

      {/* Lista de rodadas */}
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Rodadas ({rounds.length})
      </h2>
      {rounds.length === 0 ? (
        <p className="text-center text-slate-400">Nenhuma rodada registrada.</p>
      ) : (
        <div className="space-y-2">
          {[...rounds].reverse().map((r) => (
            <RoundRow key={r.id} round={r} />
          ))}
        </div>
      )}
    </Layout>
  )
}

function TeamTotal({
  name,
  score,
  target,
  highlight,
}: {
  name: string
  score: number
  target: number
  highlight?: boolean
}) {
  const pct = Math.min(100, Math.max(0, (score / target) * 100))
  return (
    <div
      className={`rounded-xl border p-4 text-center ${
        highlight
          ? 'border-teal-500 bg-teal-50'
          : 'border-slate-200 bg-white'
      }`}
    >
      <p className="mb-1 truncate text-xs font-medium text-slate-500">{name}</p>
      <p
        className={`font-mono text-3xl font-bold tabular-nums ${
          highlight ? 'text-teal-700' : 'text-slate-700'
        }`}
      >
        {score}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-teal-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function RoundRow({ round }: { round: Round }) {
  const [aberto, setAberto] = useState(false)
  const b1 = calcularPontuacaoRodada(round.team1Score)
  const b2 = calcularPontuacaoRodada(round.team2Score)
  const temFoto = Boolean(round.team1Score.photo || round.team2Score.photo)

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <button
        onClick={() => setAberto((a) => !a)}
        className="flex w-full items-center justify-between px-3 py-3"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-slate-500">
          {temFoto && <span>📷</span>}
          Rodada {round.roundNumber}
        </span>
        <span className="flex items-center gap-4 font-mono tabular-nums">
          <Pts v={b1.total} />
          <span className="text-slate-300">·</span>
          <Pts v={b2.total} />
          <span className="ml-1 text-slate-300">{aberto ? '▲' : '▼'}</span>
        </span>
      </button>

      {aberto && (
        <div className="space-y-3 border-t border-slate-100 px-3 py-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <BreakdownCol breakdown={b1} />
            <BreakdownCol breakdown={b2} />
          </div>
          {temFoto && (
            <div className="grid grid-cols-2 gap-2">
              <BlobImg blob={round.team1Score.photo} alt="Jogos dupla 1" />
              <BlobImg blob={round.team2Score.photo} alt="Jogos dupla 2" />
            </div>
          )}
          <button
            onClick={() => {
              if (confirm('Excluir esta rodada?')) excluirRodada(round.id!)
            }}
            className="text-xs font-medium text-red-500"
          >
            Excluir rodada
          </button>
        </div>
      )}
    </div>
  )
}

/** Renderiza um Blob como imagem, criando/revogando a object URL corretamente. */
function BlobImg({ blob, alt }: { blob?: Blob; alt: string }) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!blob) {
      setUrl(undefined)
      return
    }
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])

  if (!url) return <div className="rounded-lg bg-slate-50" />
  return (
    <img src={url} alt={alt} className="w-full rounded-lg border border-slate-200" />
  )
}

function Pts({ v }: { v: number }) {
  return (
    <span className={v >= 0 ? 'text-teal-700' : 'text-red-500'}>
      {v > 0 ? '+' : ''}
      {v}
    </span>
  )
}

function BreakdownCol({
  breakdown,
}: {
  breakdown: ReturnType<typeof calcularPontuacaoRodada>
}) {
  const linhas = [
    ['Bônus canastras', breakdown.canastras],
    ['Cartas baixadas', breakdown.cartasBaixadas],
    ['Batida', breakdown.batida],
    ['Mão', breakdown.cartasNaMao],
    ['Morto', breakdown.morto],
  ] as const
  return (
    <div className="space-y-0.5">
      {linhas.map(([label, v]) => (
        <div key={label} className="flex justify-between text-slate-500">
          <span>{label}</span>
          <span className="font-mono tabular-nums">{v}</span>
        </div>
      ))}
      <div className="flex justify-between border-t border-slate-100 pt-0.5 font-semibold text-slate-700">
        <span>Total</span>
        <span className="font-mono tabular-nums">{breakdown.total}</span>
      </div>
    </div>
  )
}
