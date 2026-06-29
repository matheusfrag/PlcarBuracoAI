export type TeamId = 'team1' | 'team2'

export interface Team {
  player1: string
  player2: string
}

export interface Game {
  id?: number
  team1: Team
  team2: Team
  targetScore: number
  status: 'active' | 'finished'
  winner?: TeamId
  createdAt: Date
  finishedAt?: Date
}

/** Pontuação de uma dupla em uma única rodada (dados informados pelo usuário). */
export interface TeamRoundScore {
  canastrasLimpas: number
  canastrasSujas: number
  canastrasReais: number
  /** Pontos das cartas baixadas em jogos simples (< 7 cartas), valor positivo. */
  jogosSimplesPontos: number
  /** Pontos das cartas que sobraram na mão dos dois jogadores, valor positivo (será subtraído). */
  cartasNaMaoPontos: number
  pegouMorto: boolean
  bateu: boolean
  /** Foto dos jogos baixados desta dupla (referência + base da análise por IA). */
  photo?: Blob
}

export interface Round {
  id?: number
  gameId: number
  roundNumber: number
  team1Score: TeamRoundScore
  team2Score: TeamRoundScore
  createdAt: Date
}

// ---------- Análise por IA (Gemini) ----------

export type Classificacao =
  | 'canastra_real'
  | 'canastra_limpa'
  | 'canastra_suja'
  | 'jogo_simples'

export interface JogoReconhecido {
  cartas: string[]
  temCoringa: boolean
  classificacao: Classificacao
}

/** Resposta crua da função /api/analisar (o que o Gemini devolve). */
export interface AnaliseIA {
  jogos: JogoReconhecido[]
  confianca: 'alta' | 'media' | 'baixa'
  observacoes?: string
}

/** Resultado já mapeado para uso no formulário. */
export interface ResultadoAnalise {
  /** Campos a pré-preencher no TeamRoundScore. */
  patch: Pick<
    TeamRoundScore,
    'canastrasLimpas' | 'canastrasSujas' | 'canastrasReais' | 'jogosSimplesPontos'
  >
  confianca: 'alta' | 'media' | 'baixa'
  observacoes?: string
  /** Jogos reconhecidos (já saneados) para o usuário conferir. */
  jogos: JogoReconhecido[]
}

/** Detalhamento do cálculo de pontos de uma dupla numa rodada. */
export interface ScoreBreakdown {
  canastras: number
  jogosSimples: number
  batida: number
  cartasNaMao: number
  morto: number
  total: number
}

/** Naipes para o seletor visual de cartas. */
export const SUITS = ['copas', 'ouros', 'espadas', 'paus'] as const
export type Suit = (typeof SUITS)[number]

export const RANKS = [
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
  '2',
  'JOKER',
] as const
export type Rank = (typeof RANKS)[number]
