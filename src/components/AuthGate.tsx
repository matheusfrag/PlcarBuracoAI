import { useEffect, useState, type ReactNode } from 'react'
import Login from '../pages/Login'
import { verificarSessao } from '../lib/auth'

type Estado = 'verificando' | 'logado' | 'deslogado'

/** Libera o app apenas após login. A proteção real é server-side nas funções /api. */
export default function AuthGate({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>('verificando')

  useEffect(() => {
    verificarSessao().then((ok) => setEstado(ok ? 'logado' : 'deslogado'))
  }, [])

  if (estado === 'verificando') {
    return (
      <div className="flex min-h-full items-center justify-center text-slate-400">
        Carregando…
      </div>
    )
  }

  if (estado === 'deslogado') {
    return <Login onSuccess={() => setEstado('logado')} />
  }

  return <>{children}</>
}
