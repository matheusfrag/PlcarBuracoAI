import { CANASTRA_BONUS } from '../lib/constants'

interface CanastraCounterProps {
  limpas: number
  sujas: number
  reais: number
  onChange: (campo: 'limpas' | 'sujas' | 'reais', valor: number) => void
}

const TIPOS = [
  {
    key: 'limpas' as const,
    label: 'Limpa',
    bonus: CANASTRA_BONUS.limpa,
    color: 'text-emerald-700',
  },
  {
    key: 'sujas' as const,
    label: 'Suja',
    bonus: CANASTRA_BONUS.suja,
    color: 'text-amber-700',
  },
  {
    key: 'reais' as const,
    label: 'Real (500)',
    bonus: CANASTRA_BONUS.real,
    color: 'text-purple-700',
  },
]

export default function CanastraCounter({
  limpas,
  sujas,
  reais,
  onChange,
}: CanastraCounterProps) {
  const valores = { limpas, sujas, reais }

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-600">Canastras</label>
      {TIPOS.map((t) => {
        const qty = valores[t.key]
        return (
          <div
            key={t.key}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
          >
            <div>
              <span className={`font-semibold ${t.color}`}>{t.label}</span>
              <span className="ml-2 text-xs text-slate-400">
                +{t.bonus} cada
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onChange(t.key, Math.max(0, qty - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-600 active:bg-slate-200"
                aria-label={`Menos ${t.label}`}
              >
                −
              </button>
              <span className="w-6 text-center font-mono text-lg font-bold tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => onChange(t.key, qty + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-xl font-bold text-teal-700 active:bg-teal-200"
                aria-label={`Mais ${t.label}`}
              >
                +
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
