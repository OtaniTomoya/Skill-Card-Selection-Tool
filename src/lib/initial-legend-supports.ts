export type InitialLegendSupportStat = 'vocal' | 'dance' | 'visual'

export interface InitialLegendSupportCard {
  bonus: number
  id: string
  name: string
  rarity: 'SR' | 'SSR' | '配布SSR'
  stat: InitialLegendSupportStat
}

// Complete-limit-break values for the support abilities used in first-legend score calculators.
export const INITIAL_LEGEND_SUPPORT_CARDS: InitialLegendSupportCard[] = [
  { bonus: 17, id: 'imawa-aete', name: '今はあえて、背を向けて', rarity: 'SR', stat: 'vocal' },
  { bonus: 17, id: 'fuwafuwa-de-wakuwaku', name: 'ふわふわでワクワク', rarity: 'SR', stat: 'dance' },
  { bonus: 17, id: 'taiatari-no-love-call', name: '体当たりのラブコール', rarity: 'SR', stat: 'visual' },
  { bonus: 22, id: 'mouttsu-tsumetaiyo', name: 'もうっ！冷たいよ！', rarity: 'SSR', stat: 'dance' },
  {
    bonus: 17,
    id: 'produce-tte-taihenne',
    name: 'プロデュースって大変ね',
    rarity: '配布SSR',
    stat: 'dance',
  },
  {
    bonus: 22,
    id: 'kirakira-shite-kirei',
    name: 'キラキラして綺麗～っ！',
    rarity: 'SSR',
    stat: 'dance',
  },
  {
    bonus: 22,
    id: 'riyo-shiau-no-ga-tomodachi',
    name: '利用し合うのが友達！',
    rarity: 'SSR',
    stat: 'dance',
  },
  {
    bonus: 17,
    id: 'sukkari-nakayoshi',
    name: 'すっかり仲良しって感じ♪',
    rarity: '配布SSR',
    stat: 'dance',
  },
  {
    bonus: 17,
    id: 'classroom-party-2',
    name: '第2回教室パーティー！',
    rarity: '配布SSR',
    stat: 'visual',
  },
]

export interface InitialLegendSupportTotals {
  abiDa: number
  abiVi: number
  abiVo: number
}

export function calculateInitialLegendSupportTotals(
  selectedSupportIds: Iterable<string>,
): InitialLegendSupportTotals {
  const selectedSet = new Set(selectedSupportIds)

  return INITIAL_LEGEND_SUPPORT_CARDS.reduce<InitialLegendSupportTotals>(
    (totals, supportCard) => {
      if (!selectedSet.has(supportCard.id)) {
        return totals
      }

      if (supportCard.stat === 'vocal') {
        return {
          ...totals,
          abiVo: totals.abiVo + supportCard.bonus,
        }
      }

      if (supportCard.stat === 'dance') {
        return {
          ...totals,
          abiDa: totals.abiDa + supportCard.bonus,
        }
      }

      return {
        ...totals,
        abiVi: totals.abiVi + supportCard.bonus,
      }
    },
    {
      abiDa: 0,
      abiVi: 0,
      abiVo: 0,
    },
  )
}
