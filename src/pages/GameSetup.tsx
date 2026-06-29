import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { criarPartida } from '../lib/db'
import { DEFAULT_TARGET_SCORE } from '../lib/constants'

export default function GameSetup() {
  const navigate = useNavigate()
  const [t1p1, setT1p1] = useState('')
  const [t1p2, setT1p2] = useState('')
  const [t2p1, setT2p1] = useState('')
  const [t2p2, setT2p2] = useState('')
  const [target, setTarget] = useState(String(DEFAULT_TARGET_SCORE))

  const valido =
    t1p1.trim() &&
    t1p2.trim() &&
    t2p1.trim() &&
    t2p2.trim() &&
    Number(target) > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valido) return
    const id = await criarPartida(
      { player1: t1p1.trim(), player2: t1p2.trim() },
      { player1: t2p1.trim(), player2: t2p2.trim() },
      Number(target)
    )
    navigate(`/partida/${id}`, { replace: true })
  }

  return (
    <Layout title="Nova Partida" back>
      <form onSubmit={handleSubmit} className="space-y-6">
        <TeamFieldset
          label="Dupla 1"
          p1={t1p1}
          p2={t1p2}
          onP1={setT1p1}
          onP2={setT1p2}
        />
        <TeamFieldset
          label="Dupla 2"
          p1={t2p1}
          p2={t2p2}
          onP1={setT2p1}
          onP2={setT2p2}
        />

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-600">
            Meta de pontos
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-3 text-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-400">
            A partida termina quando uma dupla alcança essa pontuação.
          </p>
        </div>

        <button
          type="submit"
          disabled={!valido}
          className="w-full rounded-xl bg-teal-600 py-4 text-lg font-semibold text-white shadow transition active:scale-[0.99] enabled:hover:bg-teal-700 disabled:opacity-40"
        >
          Começar
        </button>
      </form>
    </Layout>
  )
}

function TeamFieldset({
  label,
  p1,
  p2,
  onP1,
  onP2,
}: {
  label: string
  p1: string
  p2: string
  onP1: (v: string) => void
  onP2: (v: string) => void
}) {
  return (
    <fieldset className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <legend className="px-1 text-sm font-semibold text-teal-700">
        {label}
      </legend>
      <div className="space-y-2">
        <input
          value={p1}
          onChange={(e) => onP1(e.target.value)}
          placeholder="Jogador 1"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none"
        />
        <input
          value={p2}
          onChange={(e) => onP2(e.target.value)}
          placeholder="Jogador 2"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none"
        />
      </div>
    </fieldset>
  )
}
