import { useMemo, useRef, useState } from 'react'
import { RANKS, type Rank } from '../types'
import { CARD_VALUES } from '../lib/constants'
import { sumCards } from '../lib/scoring'
import { somarCartasFoto, type ResultadoSomaMao } from '../lib/aiVision'

interface CardSelectorProps {
  /** Cartas atualmente contadas (multiset por rank). */
  counts: Partial<Record<Rank, number>>
  onChange: (counts: Partial<Record<Rank, number>>) => void
}

const RANK_LABEL: Record<Rank, string> = {
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  J: 'J',
  Q: 'Q',
  K: 'K',
  A: 'A',
  '2': '2',
}

/**
 * Seletor visual de cartas. Toque adiciona uma carta do rank; toque longo /
 * botão "−" remove. Cada rank mostra a quantidade selecionada.
 */
export default function CardSelector({ counts, onChange }: CardSelectorProps) {
  const add = (rank: Rank, delta: number) => {
    const next = { ...counts }
    const val = (next[rank] ?? 0) + delta
    if (val <= 0) delete next[rank]
    else next[rank] = val
    onChange(next)
  }

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {RANKS.map((rank) => {
        const qty = counts[rank] ?? 0
        return (
          <button
            key={rank}
            type="button"
            onClick={() => add(rank, 1)}
            onContextMenu={(e) => {
              e.preventDefault()
              add(rank, -1)
            }}
            className={`relative flex flex-col items-center justify-center rounded-lg border py-2 transition select-none ${
              qty > 0
                ? 'border-teal-500 bg-teal-50 text-teal-800'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            <span className="text-base font-bold leading-none">
              {RANK_LABEL[rank]}
            </span>
            <span className="mt-0.5 text-[10px] text-slate-400">
              {CARD_VALUES[rank]}pt
            </span>
            {qty > 0 && (
              <>
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[11px] font-bold text-white">
                  {qty}
                </span>
                <span
                  onClick={(e) => {
                    e.stopPropagation()
                    add(rank, -1)
                  }}
                  className="absolute -bottom-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-400 text-[13px] font-bold text-white"
                >
                  −
                </span>
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Campo de pontos com dois modos: digitar total OU selecionar cartas.
 * Reporta o total ao componente pai via onChange.
 */
export function ScoreInput({
  label,
  value,
  onChange,
  hint,
  permitirFoto = false,
}: {
  label: string
  value: number
  onChange: (total: number) => void
  hint?: string
  /** Habilita o botão de câmera que soma as cartas por foto (modo "mão"). */
  permitirFoto?: boolean
}) {
  const [modo, setModo] = useState<'total' | 'cartas'>('total')
  const [counts, setCounts] = useState<Partial<Record<Rank, number>>>({})
  const fileRef = useRef<HTMLInputElement>(null)
  const [analisando, setAnalisando] = useState(false)
  const [erroFoto, setErroFoto] = useState('')
  const [resultadoFoto, setResultadoFoto] = useState<ResultadoSomaMao>()

  const handleFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setErroFoto('')
    setResultadoFoto(undefined)
    setAnalisando(true)
    try {
      const r = await somarCartasFoto(file)
      setResultadoFoto(r)
      setModo('total') // mostra o número resultante
      onChange(r.total)
    } catch (err) {
      setErroFoto(err instanceof Error ? err.message : 'Falha ao analisar')
    } finally {
      setAnalisando(false)
    }
  }

  const totalCartas = useMemo(() => {
    const flat: Rank[] = []
    for (const [rank, qty] of Object.entries(counts)) {
      for (let i = 0; i < (qty ?? 0); i++) flat.push(rank as Rank)
    }
    return sumCards(flat)
  }, [counts])

  const handleCounts = (c: Partial<Record<Rank, number>>) => {
    setCounts(c)
    const flat: Rank[] = []
    for (const [rank, qty] of Object.entries(c)) {
      for (let i = 0; i < (qty ?? 0); i++) flat.push(rank as Rank)
    }
    onChange(sumCards(flat))
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-600">{label}</label>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setModo('total')}
              className={`px-2.5 py-1 ${modo === 'total' ? 'bg-teal-600 text-white' : 'bg-white text-slate-500'}`}
            >
              Total
            </button>
            <button
              type="button"
              onClick={() => setModo('cartas')}
              className={`px-2.5 py-1 ${modo === 'cartas' ? 'bg-teal-600 text-white' : 'bg-white text-slate-500'}`}
            >
              Cartas
            </button>
          </div>
          {permitirFoto && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={analisando}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-teal-300 bg-teal-50 text-lg text-teal-700 transition active:scale-95 enabled:hover:bg-teal-100 disabled:opacity-50"
              aria-label="Fotografar e somar cartas"
              title="Fotografar e somar cartas"
            >
              {analisando ? '…' : '📷'}
            </button>
          )}
        </div>
      </div>

      {permitirFoto && (
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFoto}
          className="hidden"
        />
      )}

      {modo === 'total' ? (
        <input
          type="number"
          inputMode="numeric"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder="0"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none"
        />
      ) : (
        <div>
          <CardSelector counts={counts} onChange={handleCounts} />
          <p className="mt-2 text-right text-sm font-semibold text-teal-700">
            Total: {totalCartas} pts
          </p>
        </div>
      )}
      {analisando && (
        <p className="mt-1 text-xs text-teal-600">Analisando a foto…</p>
      )}
      {erroFoto && <p className="mt-1 text-xs text-red-600">{erroFoto}</p>}
      {resultadoFoto && (
        <p className="mt-1 text-xs text-slate-500">
          📷 Lidas {resultadoFoto.cartas.length} cartas ={' '}
          <span className="font-semibold text-teal-700">
            {resultadoFoto.total} pts
          </span>{' '}
          (confiança {resultadoFoto.confianca}). Confira e ajuste se preciso.
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
