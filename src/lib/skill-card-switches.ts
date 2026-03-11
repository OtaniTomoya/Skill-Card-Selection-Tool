import type { Card, SkillSwitchMode, SkillSwitchPair } from '../types'

const SKILL_SWITCH_NAME_PAIRS = [
  ['バランス感覚', '軌道修正'],
  ['愛嬌', 'パンプアップ'],
  ['眼力', '一発勝負'],
  ['決めポーズ', 'スリリング'],
  ['スタートダッシュ', '大胆不敵'],
  ['コール&レスポンス', '脚光'],
  ['バズワード', '話題沸騰'],
  ['今日もおはよう', 'おまもりミラクル'],
  ['もう少しだけ', 'がむしゃら'],
  ['幸せな時間', '冒険心'],
  ['ハートの合図', '気まぐれハート'],
  ['あふれる思い出', '成長痛'],
  ['開花', 'せのびの魔法'],
  ['200% スマイル', 'びしっとキメ顔'],
  ['一歩', '形勢逆転'],
  ['ラッキー', 'ノンストップ'],
  ['せーのっ！', 'フルスロットル'],
  ['汗と成長', 'リスキーチャンス'],
  ['はじけるパッション', 'オーバードライブ'],
  ['総合芸術', 'エンターテイナー'],
  ['翔び立て！', '羽ばたけ！'],
] as const

function createPairId(originalCardId: string, switchedCardId: string): string {
  return `${originalCardId}__${switchedCardId}`
}

export function getSkillSwitchPairs(cards: Card[]): SkillSwitchPair[] {
  const cardIndex = new Map(cards.map((card) => [card.name, card]))

  return SKILL_SWITCH_NAME_PAIRS.flatMap(([originalName, switchedName]) => {
    const originalCard = cardIndex.get(originalName)
    const switchedCard = cardIndex.get(switchedName)

    if (!originalCard || !switchedCard) {
      return []
    }

    return [
      {
        id: createPairId(originalCard.id, switchedCard.id),
        plan: originalCard.plan,
        originalCardId: originalCard.id,
        originalCardName: originalCard.name,
        switchedCardId: switchedCard.id,
        switchedCardName: switchedCard.name,
        unlockLevel: switchedCard.unlockLevel ?? 51,
      },
    ]
  })
}

export function isSkillSwitchUnlocked(
  pair: SkillSwitchPair,
  producerLevel: number,
): boolean {
  return producerLevel >= pair.unlockLevel
}

export function getSkillSwitchMode(
  pair: SkillSwitchPair,
  switchedPairIds: Set<string>,
  producerLevel: number,
): SkillSwitchMode {
  if (!isSkillSwitchUnlocked(pair, producerLevel)) {
    return 'original'
  }

  return switchedPairIds.has(pair.id) ? 'switched' : 'original'
}

export function filterCardsBySkillSwitch(
  cards: Card[],
  pairs: SkillSwitchPair[],
  switchedPairIds: Set<string>,
  producerLevel: number,
): Card[] {
  const inactiveCardIds = new Set<string>()

  for (const pair of pairs) {
    const mode = getSkillSwitchMode(pair, switchedPairIds, producerLevel)

    if (mode === 'switched') {
      inactiveCardIds.add(pair.originalCardId)
      continue
    }

    inactiveCardIds.add(pair.switchedCardId)
  }

  return cards.filter((card) => !inactiveCardIds.has(card.id))
}

export function toggleSkillSwitch(
  currentSwitchedPairIds: string[],
  pairId: string,
  mode: SkillSwitchMode,
): string[] {
  const nextIds = new Set(currentSwitchedPairIds)

  if (mode === 'switched') {
    nextIds.add(pairId)
  } else {
    nextIds.delete(pairId)
  }

  return [...nextIds]
}
