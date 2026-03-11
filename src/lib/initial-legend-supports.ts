export type InitialLegendSupportStat = 'vocal' | 'dance' | 'visual'
export type InitialLegendSupportLimitBreak = 0 | 1 | 2 | 3 | 4

export interface InitialLegendSupportCard {
  bonusByLimitBreak: Record<InitialLegendSupportLimitBreak, number>
  id: string
  name: string
  rarity: 'SR' | 'SSR' | '配布SSR'
  stat: InitialLegendSupportStat
}

const SR_LIMIT_BREAK_BONUSES: Record<InitialLegendSupportLimitBreak, number> = {
  0: 9,
  1: 11,
  2: 13,
  3: 15,
  4: 17,
}

const DISTRIBUTED_SSR_LIMIT_BREAK_BONUSES: Record<InitialLegendSupportLimitBreak, number> = {
  0: 11,
  1: 12,
  2: 14,
  3: 15,
  4: 17,
}

const SSR_LIMIT_BREAK_BONUSES: Record<InitialLegendSupportLimitBreak, number> = {
  0: 17,
  1: 18,
  2: 19,
  3: 20,
  4: 22,
}

export const INITIAL_LEGEND_SUPPORT_CARDS: InitialLegendSupportCard[] = [
  {
    bonusByLimitBreak: SR_LIMIT_BREAK_BONUSES,
    id: 'imawa-aete',
    name: '今はあえて、背を向けて',
    rarity: 'SR',
    stat: 'vocal',
  },
  {
    bonusByLimitBreak: SR_LIMIT_BREAK_BONUSES,
    id: 'fuwafuwa-de-wakuwaku',
    name: 'ふわふわでワクワク',
    rarity: 'SR',
    stat: 'dance',
  },
  {
    bonusByLimitBreak: SR_LIMIT_BREAK_BONUSES,
    id: 'taiatari-no-love-call',
    name: '体当たりのラブコール',
    rarity: 'SR',
    stat: 'visual',
  },
  {
    bonusByLimitBreak: SSR_LIMIT_BREAK_BONUSES,
    id: 'mouttsu-tsumetaiyo',
    name: 'もうっ！冷たいよ！',
    rarity: 'SSR',
    stat: 'dance',
  },
  {
    bonusByLimitBreak: DISTRIBUTED_SSR_LIMIT_BREAK_BONUSES,
    id: 'produce-tte-taihenne',
    name: 'プロデュースって大変ね',
    rarity: '配布SSR',
    stat: 'dance',
  },
  {
    bonusByLimitBreak: SSR_LIMIT_BREAK_BONUSES,
    id: 'kirakira-shite-kirei',
    name: 'キラキラして綺麗～っ！',
    rarity: 'SSR',
    stat: 'dance',
  },
  {
    bonusByLimitBreak: SSR_LIMIT_BREAK_BONUSES,
    id: 'riyo-shiau-no-ga-tomodachi',
    name: '利用し合うのが友達！',
    rarity: 'SSR',
    stat: 'dance',
  },
  {
    bonusByLimitBreak: DISTRIBUTED_SSR_LIMIT_BREAK_BONUSES,
    id: 'sukkari-nakayoshi',
    name: 'すっかり仲良しって感じ♪',
    rarity: '配布SSR',
    stat: 'dance',
  },
  {
    bonusByLimitBreak: DISTRIBUTED_SSR_LIMIT_BREAK_BONUSES,
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

export type InitialLegendSupportSelection = Partial<
  Record<string, InitialLegendSupportLimitBreak>
>

export function calculateInitialLegendSupportTotals(
  selectedSupportSelections: InitialLegendSupportSelection,
): InitialLegendSupportTotals {
  return INITIAL_LEGEND_SUPPORT_CARDS.reduce<InitialLegendSupportTotals>(
    (totals, supportCard) => {
      const selectedLimitBreak = selectedSupportSelections[supportCard.id]
      if (selectedLimitBreak === undefined) {
        return totals
      }

      const bonus = supportCard.bonusByLimitBreak[selectedLimitBreak]

      if (supportCard.stat === 'vocal') {
        return {
          ...totals,
          abiVo: totals.abiVo + bonus,
        }
      }

      if (supportCard.stat === 'dance') {
        return {
          ...totals,
          abiDa: totals.abiDa + bonus,
        }
      }

      return {
        ...totals,
        abiVi: totals.abiVi + bonus,
      }
    },
    {
      abiDa: 0,
      abiVi: 0,
      abiVo: 0,
    },
  )
}
