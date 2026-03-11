import { describe, expect, it } from 'vitest'

import {
  calculateFinalExamEvaluation,
  calculateInitialLegendEvaluation,
  calculateMidEvaluation,
  calculateRequiredFinalScore,
} from '../src/lib/initial-legend-evaluation'

describe('initial legend evaluation', () => {
  it('uses the documented mid-exam breakpoints', () => {
    expect(calculateMidEvaluation(9999)).toBe(1099)
    expect(calculateMidEvaluation(10000)).toBe(1100)
    expect(calculateMidEvaluation(19999)).toBe(1899)
    expect(calculateMidEvaluation(20000)).toBe(1900)
    expect(calculateMidEvaluation(29999)).toBe(2399)
    expect(calculateMidEvaluation(30000)).toBe(2400)
    expect(calculateMidEvaluation(59999)).toBe(2529)
    expect(calculateMidEvaluation(60000)).toBe(2530)
  })

  it('uses the documented final-exam breakpoints', () => {
    expect(calculateFinalExamEvaluation(299999)).toBe(4499)
    expect(calculateFinalExamEvaluation(300000)).toBe(4500)
    expect(calculateFinalExamEvaluation(499999)).toBe(6499)
    expect(calculateFinalExamEvaluation(500000)).toBe(6500)
    expect(calculateFinalExamEvaluation(599999)).toBe(7299)
    expect(calculateFinalExamEvaluation(600000)).toBe(7300)
  })

  it('returns achieved and impossible target states at the expected thresholds', () => {
    expect(calculateRequiredFinalScore(20000, 20000)).toEqual({
      requiredFinalScore: null,
      status: 'achieved',
    })
    expect(calculateRequiredFinalScore(1000, 26000)).toEqual({
      requiredFinalScore: null,
      status: 'impossible',
    })
  })

  it('reflects the selected final rank in both status bonus and rank evaluation', () => {
    const firstPlace = calculateInitialLegendEvaluation({
      abiDa: 0,
      abiVi: 0,
      abiVo: 0,
      finalRank: 1,
      finalScore: 0,
      midScore: 0,
      preDa: 1000,
      preVi: 1000,
      preVo: 1000,
    })
    const thirdPlace = calculateInitialLegendEvaluation({
      abiDa: 0,
      abiVi: 0,
      abiVo: 0,
      finalRank: 3,
      finalScore: 0,
      midScore: 0,
      preDa: 1000,
      preVi: 1000,
      preVo: 1000,
    })

    expect(firstPlace.totalEvaluation).toBe(8756)
    expect(thirdPlace.totalEvaluation).toBe(6989)
  })

  it('keeps the calculator empty until any meaningful input is set', () => {
    expect(
      calculateInitialLegendEvaluation({
        abiDa: 0,
        abiVi: 0,
        abiVo: 0,
        finalRank: 0,
        finalScore: 0,
        midScore: 0,
        preDa: 0,
        preVi: 0,
        preVo: 0,
      }),
    ).toEqual({
      currentRank: 'F',
      isEmpty: true,
      preTotal: 0,
      targets: [
        {
          requiredFinalScore: null,
          status: 'unavailable',
          targetEvaluation: 20000,
          targetRank: 'SSS',
        },
        {
          requiredFinalScore: null,
          status: 'unavailable',
          targetEvaluation: 23000,
          targetRank: 'SSS+',
        },
        {
          requiredFinalScore: null,
          status: 'unavailable',
          targetEvaluation: 26000,
          targetRank: 'S4',
        },
      ],
      totalEvaluation: 0,
    })
  })
})
