import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useBlocker, useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import TeamRoundInput from '../components/TeamRoundInput'
import { adicionarRodada, atualizarRodada, db } from '../lib/db'
import { emptyTeamRoundScore } from '../lib/scoring'
import { validarRodada } from '../lib/validation'

export default function RoundForm() {
  const { id, roundId } = useParams()
  const gameId = Number(id)
  const editando = roundId != null
  const navigate = useNavigate()

  const game = useLiveQuery(() => db.games.get(gameId), [gameId])
  const round = useLiveQuery(
    () => (editando ? db.rounds.get(Number(roundId)) : undefined),
    [roundId, editando]
  )

  const [team1Score, setTeam1Score] = useState(emptyTeamRoundScore())
  const [team2Score, setTeam2Score] = useState(emptyTeamRoundScore())
  const [erros, setErros] = useState<string[]>([])
  const [salvando, setSalvando] = useState(false)

  // Controle de "alterações não salvas".
  const sujoRef = useRef(false)
  const carregadoRef = useRef(false)

  // Ao editar, carrega a rodada existente uma única vez.
  useEffect(() => {
    if (editando && round && !carregadoRef.current) {
      setTeam1Score(round.team1Score)
      setTeam2Score(round.team2Score)
      carregadoRef.current = true
    }
  }, [editando, round])

  // Bloqueia navegação interna se houver alterações não salvas.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      sujoRef.current && currentLocation.pathname !== nextLocation.pathname
  )
  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (window.confirm('Você tem alterações não salvas. Sair mesmo assim?')) {
        blocker.proceed()
      } else {
        blocker.reset()
      }
    }
  }, [blocker])

  // Avisa ao fechar/recarregar a aba.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (sujoRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  const titulo = editando ? 'Editar Rodada' : 'Nova Rodada'
  if (!game || (editando && !round)) {
    return <Layout title={titulo} back children={null} />
  }

  const onTeam1 = (s: typeof team1Score) => {
    sujoRef.current = true
    setTeam1Score(s)
  }
  const onTeam2 = (s: typeof team2Score) => {
    sujoRef.current = true
    setTeam2Score(s)
  }

  const handleSave = async () => {
    const problemas = validarRodada(team1Score, team2Score)
    setErros(problemas)
    if (problemas.length > 0) return
    setSalvando(true)
    sujoRef.current = false // evita disparar o aviso de saída
    if (editando) {
      await atualizarRodada(Number(roundId), team1Score, team2Score)
    } else {
      await adicionarRodada(gameId, team1Score, team2Score)
    }
    navigate(`/partida/${gameId}`, { replace: true })
  }

  return (
    <Layout title={titulo} back>
      <div className="space-y-5">
        <TeamRoundInput
          teamName={`${game.team1.player1} & ${game.team1.player2}`}
          score={team1Score}
          onChange={onTeam1}
        />
        <TeamRoundInput
          teamName={`${game.team2.player1} & ${game.team2.player2}`}
          score={team2Score}
          onChange={onTeam2}
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
          {editando ? 'Salvar alterações' : 'Salvar rodada'}
        </button>
      </div>
    </Layout>
  )
}
