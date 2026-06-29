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
 * Mapeia a resposta crua da IA para os campos do formulário.
 * Função PURA (sem rede) — tratada como entrada não confiável:
 * valida tipos/enums e reaplica a classificação por tamanho/coringa.
 */
export function mapearAnalise(bruto: unknown): ResultadoAnalise {
  const analise = bruto as Partial<AnaliseIA> | null
  const jogosBrutos = Array.isArray(analise?.jogos) ? analise!.jogos : []

  const jogos: JogoReconhecido[] = jogosBrutos.map((j) => {
    const cartas = Array.isArray(j?.cartas)
      ? j.cartas.filter((c): c is Rank => RANK_SET.has(c as string))
      : []
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

/** Comprime a foto, envia para /api/analisar e devolve o resultado mapeado. */
export async function analisarFoto(foto: Blob): Promise<ResultadoAnalise> {
  const comprimida = await comprimirImagem(foto)
  const imagem = await blobParaBase64(comprimida)

  const res = await fetch('/api/analisar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imagem, mime: 'image/jpeg' }),
  })

  if (res.status === 401) {
    throw new Error('Sessão expirada. Recarregue e entre novamente.')
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.erro || 'Falha ao analisar a foto')
  }

  return mapearAnalise(await res.json())
}
