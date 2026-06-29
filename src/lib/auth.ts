/** Cliente de autenticação. A trava real é server-side; aqui é só o fluxo de UX. */

export async function login(senha: string): Promise<void> {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senha }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.erro || 'Falha no login')
  }
}

/** Consulta o servidor se o cookie de sessão atual é válido. */
export async function verificarSessao(): Promise<boolean> {
  try {
    const res = await fetch('/api/me')
    if (!res.ok) return false
    const data = await res.json()
    return Boolean(data.autenticado)
  } catch {
    return false
  }
}
