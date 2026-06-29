import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { calcularTotais, db, excluirPartida } from '../lib/db'
import type { Game } from '../types'

export default function Home() {
  const navigate = useNavigate()
  const games = useLiveQuery(() =>
    db.games.orderBy('createdAt').reverse().toArray()
  )

  const ativas = games?.filter((g) => g.status === 'active') ?? []
  const encerradas = games?.filter((g) => g.status === 'finished') ?? []

  return (
    <Layout title="Placar Buraco">
      <button
        onClick={() => navigate('/nova')}
        className="mb-6 w-full rounded-xl bg-teal-600 py-4 text-lg font-semibold text-white shadow transition active:scale-[0.99] hover:bg-teal-700"
      >
        + Nova Partida
      </button>

      {games === undefined && (
        <p className="text-center text-slate-400">Carregando…</p>
      )}

      {games && games.length === 0 && (
        <p className="mt-12 text-center text-slate-400">
          Nenhuma partida ainda.
          <br />
          Crie a primeira para começar a marcar pontos!
        </p>
      )}

      {ativas.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Em andamento
          </h2>
          <div className="space-y-3">
            {ativas.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        </section>
      )}

      {encerradas.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Histórico
          </h2>
          <div className="space-y-3">
            {encerradas.map((g) => (
              <GameCard key={g.id} game={g} finished />
            ))}
          </div>
        </section>
      )}
    </Layout>
  )
}

function GameCard({ game, finished }: { game: Game; finished?: boolean }) {
  const rounds = useLiveQuery(
    () => db.rounds.where('gameId').equals(game.id!).toArray(),
    [game.id]
  )
  const totais = rounds ? calcularTotais(rounds) : { team1: 0, team2: 0 }

  const dupla = (t: { player1: string; player2: string }) =>
    `${t.player1} & ${t.player2}`

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Excluir esta partida e todas as rodadas?')) {
      await excluirPartida(game.id!)
    }
  }

  return (
    <Link
      to={`/partida/${game.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition active:scale-[0.99]"
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-slate-400">
          {new Date(game.createdAt).toLocaleDateString('pt-BR')} · meta{' '}
          {game.targetScore}
        </span>
        <button
          onClick={handleDelete}
          className="-mt-1 -mr-1 rounded p-1 text-slate-300 transition hover:text-red-500"
          aria-label="Excluir partida"
        >
          ✕
        </button>
      </div>
      <div className="mt-2 space-y-1">
        <TeamLine
          name={dupla(game.team1)}
          score={totais.team1}
          winner={finished && game.winner === 'team1'}
          leading={!finished && totais.team1 >= totais.team2}
        />
        <TeamLine
          name={dupla(game.team2)}
          score={totais.team2}
          winner={finished && game.winner === 'team2'}
          leading={!finished && totais.team2 > totais.team1}
        />
      </div>
    </Link>
  )
}

function TeamLine({
  name,
  score,
  winner,
  leading,
}: {
  name: string
  score: number
  winner?: boolean
  leading?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={`truncate text-sm ${
          winner || leading ? 'font-semibold text-teal-700' : 'text-slate-600'
        }`}
      >
        {winner && '🏆 '}
        {name}
      </span>
      <span
        className={`ml-3 font-mono tabular-nums ${
          winner || leading ? 'font-bold text-teal-700' : 'text-slate-500'
        }`}
      >
        {score}
      </span>
    </div>
  )
}
