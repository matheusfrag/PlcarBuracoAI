import { useRef, useState } from 'react'
import Layout from '../components/Layout'
import { exportarDados, importarDados } from '../lib/backup'

export default function Config() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const handleExportar = async () => {
    setMsg('')
    setErro('')
    setOcupado(true)
    try {
      await exportarDados()
      setMsg('Backup exportado. Guarde o arquivo em local seguro.')
    } catch {
      setErro('Falha ao exportar.')
    } finally {
      setOcupado(false)
    }
  }

  const handleImportar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!confirm('Importar vai ADICIONAR as partidas do arquivo às atuais. Continuar?'))
      return
    setMsg('')
    setErro('')
    setOcupado(true)
    try {
      const r = await importarDados(file)
      setMsg(`Importado: ${r.partidas} partida(s) e ${r.rodadas} rodada(s).`)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao importar.')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Layout title="Configurações" back>
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <h2 className="text-base font-semibold text-slate-700">
            Backup dos dados
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Suas partidas ficam apenas neste dispositivo. Exporte um arquivo para
            não perder o histórico ao trocar de aparelho ou limpar o navegador.
          </p>
        </div>

        <button
          onClick={handleExportar}
          disabled={ocupado}
          className="w-full rounded-lg bg-teal-600 py-3 font-semibold text-white transition active:scale-[0.99] enabled:hover:bg-teal-700 disabled:opacity-50"
        >
          ⬇️ Exportar dados
        </button>

        <button
          onClick={() => fileRef.current?.click()}
          disabled={ocupado}
          className="w-full rounded-lg border border-teal-300 bg-teal-50 py-3 font-semibold text-teal-700 transition active:scale-[0.99] enabled:hover:bg-teal-100 disabled:opacity-50"
        >
          ⬆️ Importar dados
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportar}
          className="hidden"
        />

        {msg && <p className="text-sm text-teal-700">{msg}</p>}
        {erro && <p className="text-sm text-red-600">{erro}</p>}
      </section>
    </Layout>
  )
}
