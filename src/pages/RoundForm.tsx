import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import TeamRoundInput from '../components/TeamRoundInput'
import { adicionarRodada, db } from '../lib/db'
import { emptyTeamRoundScore } from '../lib/scoring'
import { validarRodada } from '../lib/validation'

export default function RoundForm() {
  const { id } = useParams()
  const gameId = Number(id)
  const navigate = useNavigate()
  const game = useLiveQuery(() => db.games.get(gameId), [gameId])

  const [team1Score, setTeam1Score] = useState(emptyTeamRoundScore())
  const [team2Score, setTeam2Score] = useState(emptyTeamRoundScore())
  const [erros, setErros] = useState<string[]>([])
  const [salvando, setSalvando] = useState(false)

  if (!game) return <Layout title="Nova Rodada" back children={null} />

  const handleSave = async () => {
    const problemas = validarRodada(team1Score, team2Score)
    setErros(problemas)
    if (problemas.length > 0) return
    setSalvando(true)
    await adicionarRodada(gameId, team1Score, team2Score)
    navigate(`/partida/${gameId}`, { replace: true })
  }

  return (
    <Layout title="Nova Rodada" back>
      <div className="space-y-5">
        <TeamRoundInput
          teamName={`${game.team1.player1} & ${game.team1.player2}`}
          score={team1Score}
          onChange={setTeam1Score}
        />
        <TeamRoundInput
          teamName={`${game.team2.player1} & ${game.team2.player2}`}
          score={team2Score}
          onChange={setTeam2Score}
        />

        {erros.length > 0 && (
          <ul className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {erros.map((e) => (
              <li key={e}>⚠ {e}</li>
            ))}
          </ul>
        )}

        <button
          onClick={handleSave}
          disabled={salvando}
          className="w-full rounded-xl bg-teal-600 py-4 text-lg font-semibold text-white shadow transition active:scale-[0.99] enabled:hover:bg-teal-700 disabled:opacity-50"
        >
          Salvar rodada
        </button>
      </div>
    </Layout>
  )
}
