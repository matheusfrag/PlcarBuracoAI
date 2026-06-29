import { useEffect, useState } from 'react'
import { comprimirImagem } from '../lib/imageCompress'

interface PhotoCaptureProps {
  photo?: Blob
  onChange: (photo?: Blob) => void
}

/**
 * Captura/escolhe uma foto da mesa. Usa a câmera traseira no celular
 * (capture="environment") e também permite escolher da galeria.
 */
export default function PhotoCapture({ photo, onChange }: PhotoCaptureProps) {
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    if (!photo) {
      setUrl(undefined)
      return
    }
    const objectUrl = URL.createObjectURL(photo)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [photo])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      onChange(await comprimirImagem(file))
    } catch {
      onChange(file) // fallback: usa o original se a compressão falhar
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-600">
        Foto da mesa (opcional)
      </label>
      {url ? (
        <div className="relative">
          <img
            src={url}
            alt="Mesa"
            className="w-full rounded-lg border border-slate-200 object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute top-2 right-2 rounded-full bg-black/60 px-3 py-1 text-sm text-white"
          >
            Remover
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white py-6 text-slate-500 transition active:bg-slate-50">
          <span className="text-2xl">📷</span>
          <span className="text-sm font-medium">Tirar / escolher foto</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />
        </label>
      )}
    </div>
  )
}
