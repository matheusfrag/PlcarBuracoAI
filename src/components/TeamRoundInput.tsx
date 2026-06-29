import { useState } from 'react'
import type { ResultadoAnalise, TeamRoundScore } from '../types'
import { calcularPontuacaoRodada } from '../lib/scoring'
import { analisarFoto } from '../lib/aiVision'
import CanastraCounter from './CanastraCounter'
import { ScoreInput } from './CardSelector'
import PhotoCapture from './PhotoCapture'

interface TeamRoundInputProps {
  teamName: string
  score: TeamRoundScore
  onChange: (score: TeamRoundScore) => void
}

export default function TeamRoundInput({
  teamName,
  score,
  onChange,
}: TeamRoundInputProps) {
  const set = <K extends keyof TeamRoundScore>(
    key: K,
    value: TeamRoundScore[K]
  ) => onChange({ ...score, [key]: value })

  const breakdown = calcularPontuacaoRodada(score)

  const [analisando, setAnalisando] = useState(false)
  const [erroIA, setErroIA] = useState('')
  const [resultado, setResultado] = useState<ResultadoAnalise>()

  const handleAnalisar = async () => {
    if (!score.photo) return
    setErroIA('')
    setAnalisando(true)
    try {
      const r = await analisarFoto(score.photo)
      setResultado(r)
      // Pré-preenche os campos reconhecidos (usuário revisa/ajusta depois).
      onChange({
        ...score,
        canastrasLimpas: r.patch.canastrasLimpas,
        canastrasSujas: r.patch.canastrasSujas,
        canastrasReais: r.patch.canastrasReais,
        cartasBaixadasPontos: r.patch.cartasBaixadasPontos,
      })
    } catch (e) {
      setErroIA(e instanceof Error ? e.message : 'Falha ao analisar')
    } finally {
      setAnalisando(false)
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-base font-bold text-teal-800">{teamName}</h3>

      <div className="space-y-2 rounded-lg border border-teal-100 bg-teal-50/50 p-3">
        <PhotoCapture
          photo={score.photo}
          onChange={(p) => {
            set('photo', p)
            setResultado(undefined)
            setErroIA('')
          }}
        />
        {score.photo && (
          <button
            type="button"
            onClick={handleAnalisar}
            disabled={analisando}
            className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition active:scale-[0.99] enabled:hover:bg-teal-700 disabled:opacity-50"
          >
            {analisando ? 'Analisando…' : '✨ Analisar foto com IA'}
          </button>
        )}
        {erroIA && <p className="text-sm text-red-600">{erroIA}</p>}
        {resultado && <AnaliseResumo resultado={resultado} />}
      </div>

      <CanastraCounter
        limpas={score.canastrasLimpas}
        sujas={score.canastrasSujas}
        reais={score.canastrasReais}
        onChange={(campo, valor) => {
          if (campo === 'limpas') set('canastrasLimpas', valor)
          else if (campo === 'sujas') set('canastrasSujas', valor)
          else set('canastrasReais', valor)
        }}
      />

      <ScoreInput
        label="Pontos das cartas baixadas"
        value={score.cartasBaixadasPontos}
        onChange={(v) => set('cartasBaixadasPontos', v)}
        hint="Some TODAS as cartas na mesa, inclusive as das canastras. O bônus das canastras (100/200/500) é adicionado automaticamente pelos contadores acima."
      />

      <ScoreInput
        label="Cartas na mão (a subtrair)"
        value={score.cartasNaMaoPontos}
        onChange={(v) => set('cartasNaMaoPontos', v)}
        hint="Cartas que sobraram com a dupla."
      />

      <div className="flex gap-3">
        <Toggle
          label="Pegou o morto"
          checked={score.pegouMorto}
          onChange={(v) => set('pegouMorto', v)}
        />
        <Toggle
          label="Bateu"
          checked={score.bateu}
          onChange={(v) => set('bateu', v)}
        />
      </div>

      <div className="rounded-lg bg-white px-3 py-2 text-right">
        <span className="text-xs text-slate-400">Total da rodada: </span>
        <span
          className={`font-mono text-lg font-bold tabular-nums ${
            breakdown.total >= 0 ? 'text-teal-700' : 'text-red-500'
          }`}
        >
          {breakdown.total > 0 ? '+' : ''}
          {breakdown.total}
        </span>
      </div>
    </section>
  )
}

const CONFIANCA_LABEL = {
  alta: { texto: 'Confiança alta', cor: 'text-emerald-700 bg-emerald-100' },
  media: { texto: 'Confiança média', cor: 'text-amber-700 bg-amber-100' },
  baixa: { texto: 'Confiança baixa', cor: 'text-red-700 bg-red-100' },
}

const CLASSIF_LABEL: Record<string, string> = {
  canastra_real: 'Canastra real',
  canastra_limpa: 'Canastra limpa',
  canastra_suja: 'Canastra suja',
  jogo_simples: 'Jogo simples',
}

function AnaliseResumo({ resultado }: { resultado: ResultadoAnalise }) {
  const conf = CONFIANCA_LABEL[resultado.confianca]
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-700">
          Campos pré-preenchidos — confira:
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${conf.cor}`}>
          {conf.texto}
        </span>
      </div>
      {resultado.jogos.length === 0 ? (
        <p className="text-slate-400">Nenhum jogo reconhecido na foto.</p>
      ) : (
        <ul className="space-y-1">
          {resultado.jogos.map((j, i) => (
            <li key={i} className="flex justify-between gap-2 text-slate-600">
              <span className="font-medium">{CLASSIF_LABEL[j.classificacao]}</span>
              <span className="truncate text-right text-xs text-slate-400">
                {j.cartas.join(' ')}
              </span>
            </li>
          ))}
        </ul>
      )}
      {resultado.observacoes && (
        <p className="text-xs text-slate-400">💬 {resultado.observacoes}</p>
      )}
      <p className="text-xs text-amber-600">
        ⚠ A IA pode errar. Revise os contadores e os jogos simples abaixo antes
        de salvar.
      </p>
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold transition ${
        checked
          ? 'border-teal-600 bg-teal-600 text-white'
          : 'border-slate-300 bg-white text-slate-500'
      }`}
    >
      <span>{checked ? '☑' : '☐'}</span>
      {label}
    </button>
  )
}
