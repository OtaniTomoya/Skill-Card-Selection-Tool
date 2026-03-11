export type TargetRank = 'SSS' | 'SSS+' | 'S4'
export type FinalExamRank = 0 | 1 | 2 | 3

export interface InitialLegendInput {
  preVo: number
  preDa: number
  preVi: number
  abiVo: number
  abiDa: number
  abiVi: number
  midScore: number
  finalScore: number
  finalRank: FinalExamRank
}

export interface TargetRankResult {
  targetRank: TargetRank
  targetEvaluation: number
  requiredFinalScore: number | null
  status: 'unavailable' | 'achieved' | 'impossible' | 'required'
}

export interface InitialLegendResult {
  currentRank: string
  isEmpty: boolean
  preTotal: number
  targets: TargetRankResult[]
  totalEvaluation: number
}

const TARGET_RANKS: Array<{ targetEvaluation: number; targetRank: TargetRank }> = [
  { targetEvaluation: 20000, targetRank: 'SSS' },
  { targetEvaluation: 23000, targetRank: 'SSS+' },
  { targetEvaluation: 26000, targetRank: 'S4' },
]

const STATUS_BONUS_BY_FINAL_RANK: Record<FinalExamRank, number> = {
  0: 0,
  1: 120,
  2: 60,
  3: 30,
}

const EVALUATION_BONUS_BY_FINAL_RANK: Record<FinalExamRank, number> = {
  0: 0,
  1: 1700,
  2: 900,
  3: 500,
}

function normalizeNumber(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.floor(value))
}

function normalizeRank(value: number): FinalExamRank {
  if (value === 1 || value === 2 || value === 3) {
    return value
  }

  return 0
}

export function calculateMidEvaluation(score: number): number {
  const normalizedScore = normalizeNumber(score)

  if (normalizedScore < 10000) {
    return Math.floor(0.11 * normalizedScore)
  }

  if (normalizedScore < 20000) {
    return Math.floor(1100 + 0.08 * (normalizedScore - 10000))
  }

  if (normalizedScore < 30000) {
    return Math.floor(1900 + 0.05 * (normalizedScore - 20000))
  }

  if (normalizedScore < 40000) {
    return Math.floor(2400 + 0.008 * (normalizedScore - 30000))
  }

  if (normalizedScore < 50000) {
    return Math.floor(2480 + 0.003 * (normalizedScore - 40000))
  }

  if (normalizedScore < 60000) {
    return Math.floor(2510 + 0.002 * (normalizedScore - 50000))
  }

  if (normalizedScore <= 200000) {
    return Math.floor(2530 + 0.001 * (normalizedScore - 60000))
  }

  return 2670
}

export function calculateFinalExamEvaluation(score: number): number {
  const normalizedScore = normalizeNumber(score)

  if (normalizedScore < 300000) {
    return Math.floor(0.015 * normalizedScore)
  }

  if (normalizedScore < 500000) {
    return Math.floor(4500 + 0.01 * (normalizedScore - 300000))
  }

  if (normalizedScore < 600000) {
    return Math.floor(6500 + 0.008 * (normalizedScore - 500000))
  }

  if (normalizedScore <= 2000000) {
    return Math.floor(7300 + 0.001 * (normalizedScore - 600000))
  }

  return 8700
}

export function calculateRequiredFinalScore(
  baseEvaluationWithoutFinal: number,
  targetEvaluation: number,
): Pick<TargetRankResult, 'requiredFinalScore' | 'status'> {
  const neededFinalEvaluation = targetEvaluation - normalizeNumber(baseEvaluationWithoutFinal)

  if (neededFinalEvaluation <= 0) {
    return {
      requiredFinalScore: null,
      status: 'achieved',
    }
  }

  if (neededFinalEvaluation <= 4500) {
    return {
      requiredFinalScore: Math.ceil(neededFinalEvaluation / 0.015),
      status: 'required',
    }
  }

  if (neededFinalEvaluation <= 6500) {
    return {
      requiredFinalScore: Math.ceil((neededFinalEvaluation - 4500) / 0.01 + 300000),
      status: 'required',
    }
  }

  if (neededFinalEvaluation <= 7300) {
    return {
      requiredFinalScore: Math.ceil((neededFinalEvaluation - 6500) / 0.008 + 500000),
      status: 'required',
    }
  }

  if (neededFinalEvaluation <= 8700) {
    return {
      requiredFinalScore: Math.ceil((neededFinalEvaluation - 7300) / 0.001 + 600000),
      status: 'required',
    }
  }

  return {
    requiredFinalScore: null,
    status: 'impossible',
  }
}

export function getEvaluationRank(score: number): string {
  const normalizedScore = normalizeNumber(score)

  if (normalizedScore >= 26000) {
    return 'S4'
  }

  if (normalizedScore >= 23000) {
    return 'SSS+'
  }

  if (normalizedScore >= 20000) {
    return 'SSS'
  }

  if (normalizedScore >= 18000) {
    return 'SS+'
  }

  if (normalizedScore >= 16000) {
    return 'SS'
  }

  if (normalizedScore >= 14500) {
    return 'S+'
  }

  if (normalizedScore >= 13000) {
    return 'S'
  }

  if (normalizedScore >= 11500) {
    return 'A+'
  }

  if (normalizedScore >= 10000) {
    return 'A'
  }

  if (normalizedScore >= 8000) {
    return 'B+'
  }

  if (normalizedScore >= 6000) {
    return 'B'
  }

  if (normalizedScore >= 4500) {
    return 'C+'
  }

  if (normalizedScore >= 3000) {
    return 'C'
  }

  return 'F'
}

export function calculateInitialLegendEvaluation(
  input: InitialLegendInput,
): InitialLegendResult {
  const normalizedInput: InitialLegendInput = {
    abiDa: normalizeNumber(input.abiDa),
    abiVi: normalizeNumber(input.abiVi),
    abiVo: normalizeNumber(input.abiVo),
    finalRank: normalizeRank(input.finalRank),
    finalScore: normalizeNumber(input.finalScore),
    midScore: normalizeNumber(input.midScore),
    preDa: normalizeNumber(input.preDa),
    preVi: normalizeNumber(input.preVi),
    preVo: normalizeNumber(input.preVo),
  }

  const preTotal = normalizedInput.preVo + normalizedInput.preDa + normalizedInput.preVi
  const isEmpty =
    preTotal === 0 &&
    normalizedInput.abiVo === 0 &&
    normalizedInput.abiDa === 0 &&
    normalizedInput.abiVi === 0 &&
    normalizedInput.midScore === 0 &&
    normalizedInput.finalScore === 0

  if (isEmpty) {
    return {
      currentRank: 'F',
      isEmpty: true,
      preTotal,
      targets: TARGET_RANKS.map(({ targetEvaluation, targetRank }) => ({
        requiredFinalScore: null,
        status: 'unavailable',
        targetEvaluation,
        targetRank,
      })),
      totalEvaluation: 0,
    }
  }

  const statusBonus = STATUS_BONUS_BY_FINAL_RANK[normalizedInput.finalRank]
  const finalRankEvaluation = EVALUATION_BONUS_BY_FINAL_RANK[normalizedInput.finalRank]
  const finalVo = Math.min(2800, normalizedInput.preVo + normalizedInput.abiVo + statusBonus)
  const finalDa = Math.min(2800, normalizedInput.preDa + normalizedInput.abiDa + statusBonus)
  const finalVi = Math.min(2800, normalizedInput.preVi + normalizedInput.abiVi + statusBonus)
  const statSum = finalVo + finalDa + finalVi
  const statEvaluation = Math.floor(2.1 * statSum)
  const midEvaluation = calculateMidEvaluation(normalizedInput.midScore)
  const finalExamEvaluation = calculateFinalExamEvaluation(normalizedInput.finalScore)
  const totalEvaluation =
    statEvaluation + midEvaluation + finalExamEvaluation + finalRankEvaluation
  const baseEvaluationWithoutFinal = statEvaluation + midEvaluation + finalRankEvaluation

  return {
    currentRank: getEvaluationRank(totalEvaluation),
    isEmpty: false,
    preTotal,
    targets: TARGET_RANKS.map(({ targetEvaluation, targetRank }) => ({
      ...calculateRequiredFinalScore(baseEvaluationWithoutFinal, targetEvaluation),
      targetEvaluation,
      targetRank,
    })),
    totalEvaluation,
  }
}
