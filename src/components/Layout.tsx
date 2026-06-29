import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface LayoutProps {
  title: string
  /** Mostra botão de voltar no cabeçalho. */
  back?: boolean
  /** Ação opcional à direita do cabeçalho. */
  action?: ReactNode
  children: ReactNode
}

export default function Layout({ title, back, action, children }: LayoutProps) {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-teal-700 px-4 py-3 text-white shadow-sm">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="-ml-1 rounded-full p-1 text-2xl leading-none transition hover:bg-white/15"
            aria-label="Voltar"
          >
            &#8592;
          </button>
        )}
        <h1 className="flex-1 text-lg font-semibold tracking-tight">{title}</h1>
        {action}
      </header>
      <main className="flex-1 px-4 py-4 pb-24">{children}</main>
    </div>
  )
}
