import { useState } from 'react'
import { login } from '../lib/auth'

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await login(senha)
      onSuccess()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha no login')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs text-center">
        <div className="mb-6">
          <img src="/favicon.svg" alt="" className="mx-auto h-20 w-20" />
          <h1 className="mt-3 text-2xl font-bold text-teal-800">
            Placar Buraco
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            autoFocus
            className="w-full rounded-lg border border-slate-300 px-3 py-3 text-center text-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none"
          />
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <button
            type="submit"
            disabled={carregando || !senha}
            className="w-full rounded-xl bg-teal-600 py-3 text-lg font-semibold text-white shadow transition active:scale-[0.99] enabled:hover:bg-teal-700 disabled:opacity-40"
          >
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
