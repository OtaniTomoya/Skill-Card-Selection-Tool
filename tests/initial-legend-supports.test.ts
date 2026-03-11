import { describe, expect, it } from 'vitest'

import {
  calculateInitialLegendSupportTotals,
  INITIAL_LEGEND_SUPPORT_CARDS,
} from '../src/lib/initial-legend-supports'

describe('initial legend supports', () => {
  it('contains the known support cards that can add exam-end parameter points', () => {
    expect(INITIAL_LEGEND_SUPPORT_CARDS.map((supportCard) => supportCard.name)).toEqual([
      '今はあえて、背を向けて',
      'ふわふわでワクワク',
      '体当たりのラブコール',
      'もうっ！冷たいよ！',
      'プロデュースって大変ね',
      'キラキラして綺麗～っ！',
      '利用し合うのが友達！',
      'すっかり仲良しって感じ♪',
      '第2回教室パーティー！',
    ])
  })

  it('sums selected support bonuses by stat', () => {
    expect(
      calculateInitialLegendSupportTotals([
        'imawa-aete',
        'mouttsu-tsumetaiyo',
        'classroom-party-2',
      ]),
    ).toEqual({
      abiDa: 22,
      abiVi: 17,
      abiVo: 17,
    })
  })
})
