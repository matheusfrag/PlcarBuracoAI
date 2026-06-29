/**
 * Redimensiona e recomprime uma imagem via <canvas> antes de enviar/armazenar.
 * Reduz o peso no IndexedDB e o custo/latência da chamada à IA.
 */
export async function comprimirImagem(
  file: Blob,
  maxLado = 1280,
  qualidade = 0.7
): Promise<Blob> {
  const bitmap = await carregarBitmap(file)
  try {
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height))
    const largura = Math.round(bitmap.width * escala)
    const altura = Math.round(bitmap.height * escala)

    const canvas = document.createElement('canvas')
    canvas.width = largura
    canvas.height = altura
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, largura, altura)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', qualidade)
    )
    return blob ?? file
  } finally {
    bitmap.close?.()
  }
}

async function carregarBitmap(file: Blob): Promise<ImageBitmap> {
  // createImageBitmap respeita a orientação EXIF e é mais rápido que <img>.
  return createImageBitmap(file)
}

/** Converte um Blob para base64 puro (sem o prefixo data:). */
export async function blobParaBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  let binario = ''
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binario += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binario)
}
