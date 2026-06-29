import { RANKS, type Rank } from '../types'
import type {
  AnaliseIA,
  Classificacao,
  JogoReconhecido,
  ResultadoAnalise,
} from '../types'
import { sumCards } from './scoring'
import { blobParaBase64, comprimirImagem } from './imageCompress'

const RANK_SET = new Set<string>(RANKS)
const CLASSIFICACOES: Classificacao[] = [
  'canastra_real',
  'canastra_limpa',
  'canastra_suja',
  'jogo_simples',
]

/**
 * Normaliza um rótulo de carta vindo da IA para um Rank válido.
 * Tolera naipe junto ("9♦", "JS", "K de ouros") extraindo o índice do INÍCIO.
 * Rejeita rótulos ambíguos como "99" ou "100" (segundo dígito após o índice).
 */
function normalizarRank(raw: unknown): Rank | null {
  if (typeof raw !== 'string') return null
  const s = raw.toUpperCase().replace(/\s+/g, '')
  let rank: string
  let resto: string
  if (s.startsWith('10')) {
    rank = '10'
    resto = s.slice(2)
  } else if (/[23456789JQKA]/.test(s[0] ?? '')) {
    rank = s[0]
    resto = s.slice(1)
  } else {
    return null
  }
  // O que sobra (naipe) não pode começar com dígito — evita "99", "100".
  if (/^[0-9]/.test(resto)) return null
  return RANK_SET.has(rank) ? (rank as Rank) : null
}

/** Extrai os ranks válidos de uma lista crua de cartas da IA. */
function extrairCartas(cartas: unknown): Rank[] {
  if (!Array.isArray(cartas)) return []
  return cartas
    .map(normalizarRank)
    .filter((c): c is Rank => c !== null)
}

/**
 * Mapeia a resposta crua da IA para os campos do formulário.
 * Função PURA (sem rede) — tratada como entrada não confiável:
 * valida tipos/enums e reaplica a classificação por tamanho/coringa.
 */
export function mapearAnalise(bruto: unknown): ResultadoAnalise {
  const analise = bruto as Partial<AnaliseIA> | null
  const jogosBrutos = Array.isArray(analise?.jogos) ? analise!.jogos : []

  const jogos: JogoReconhecido[] = jogosBrutos.map((j) => {
    const cartas = extrairCartas(j?.cartas)
    const temCoringa = cartas.some((c) => c === '2')
    return {
      cartas,
      temCoringa,
      classificacao: saneClassificacao(j?.classificacao, cartas, temCoringa),
    }
  })

  const patch = {
    canastrasLimpas: jogos.filter((j) => j.classificacao === 'canastra_limpa')
      .length,
    canastrasSujas: jogos.filter((j) => j.classificacao === 'canastra_suja')
      .length,
    canastrasReais: jogos.filter((j) => j.classificacao === 'canastra_real')
      .length,
    // Soma de TODAS as cartas baixadas (inclui as das canastras); o bônus das
    // canastras é aplicado à parte na fórmula de pontuação.
    cartasBaixadasPontos: jogos.reduce(
      (soma, j) => soma + sumCards(j.cartas as Rank[]),
      0
    ),
  }

  const confianca =
    analise?.confianca === 'alta' ||
    analise?.confianca === 'media' ||
    analise?.confianca === 'baixa'
      ? analise.confianca
      : 'baixa'

  return {
    patch,
    confianca,
    observacoes:
      typeof analise?.observacoes === 'string' ? analise.observacoes : undefined,
    jogos,
  }
}

/**
 * Reaplica regras de classificação a partir das cartas reconhecidas, em vez de
 * confiar cegamente no rótulo da IA. Uma "canastra" com menos de 7 cartas vira
 * jogo simples; 7+ cartas viram limpa/suja conforme houver coringa.
 */
function saneClassificacao(
  original: unknown,
  cartas: Rank[],
  temCoringa: boolean
): Classificacao {
  const rotulo = CLASSIFICACOES.includes(original as Classificacao)
    ? (original as Classificacao)
    : 'jogo_simples'

  if (cartas.length < 7) return 'jogo_simples'
  // 7+ cartas: respeita "real" se a IA marcou; senão decide pelo coringa.
  if (rotulo === 'canastra_real') return 'canastra_real'
  return temCoringa ? 'canastra_suja' : 'canastra_limpa'
}

/** Comprime a foto e envia para /api/analisar no modo indicado; devolve o JSON cru. */
async function postAnalise(
  foto: Blob,
  modo: 'mesa' | 'mao'
): Promise<unknown> {
  // Resolução/qualidade maiores na análise ajudam a IA a ler os índices das
  // cartas corretamente (ainda bem abaixo do limite de payload do servidor).
  const comprimida = await comprimirImagem(foto, 1600, 0.85)
  const imagem = await blobParaBase64(comprimida)

  const res = await fetch('/api/analisar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imagem, mime: 'image/jpeg', modo }),
  })

  if (res.status === 401) {
    throw new Error('Sessão expirada. Recarregue e entre novamente.')
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.erro || 'Falha ao analisar a foto')
  }

  return res.json()
}

/** Analisa os jogos baixados de uma dupla e mapeia para os campos do formulário. */
export async function analisarFoto(foto: Blob): Promise<ResultadoAnalise> {
  return mapearAnalise(await postAnalise(foto, 'mesa'))
}

export interface ResultadoSomaMao {
  total: number
  cartas: Rank[]
  confianca: 'alta' | 'media' | 'baixa'
  observacoes?: string
}

/**
 * Soma o valor de TODAS as cartas reconhecidas (modo "mão" — cartas soltas).
 * Função PURA/testável: achata os jogos, filtra ranks válidos e soma.
 */
export function somarCartasDeAnalise(bruto: unknown): ResultadoSomaMao {
  const analise = bruto as Partial<AnaliseIA> | null
  const jogos = Array.isArray(analise?.jogos) ? analise!.jogos : []

  const cartas = jogos.flatMap((j) => extrairCartas(j?.cartas))

  const confianca =
    analise?.confianca === 'alta' ||
    analise?.confianca === 'media' ||
    analise?.confianca === 'baixa'
      ? analise.confianca
      : 'baixa'

  return {
    total: sumCards(cartas),
    cartas,
    confianca,
    observacoes:
      typeof analise?.observacoes === 'string' ? analise.observacoes : undefined,
  }
}

/** Comprime a foto das cartas na mão, envia à IA e devolve a soma. */
export async function somarCartasFoto(foto: Blob): Promise<ResultadoSomaMao> {
  return somarCartasDeAnalise(await postAnalise(foto, 'mao'))
}
