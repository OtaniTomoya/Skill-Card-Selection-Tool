import { describe, expect, it } from 'vitest'

import cards from '../src/data/cards.json'
import events from '../src/data/events.json'
import { getAvailableCardsForEvent } from '../src/lib/event-rules'

const expectedSubPlanCards: Record<string, string[]> = {
  'asari-2026-03': [
    '国民的アイドル',
    '成就',
    '天真爛漫',
    '天賦の才',
    '魅惑のパフォーマンス',
    '魅惑の視線',
    'シュプレヒコール',
    '始まりの合図',
    '存在感',
    'ひと呼吸',
  ],
  'asari-2026-02': [
    '国民的アイドル',
    '天真爛漫',
    '魅惑の視線',
    '鳴り止まない拍手',
    'スポットライト',
    '意地',
    '演出計画',
    '存在感',
    'ひと呼吸',
  ],
  'asari-2025-12': [
    '200% スマイル',
    'ノートの端の決意',
    '私がスター',
    '星屑センセーション',
    '虹色ドリーマー',
    'ファンシーチャーム',
    'みんな大好き',
    'ゆめみごこち',
    'ワクワクが止まらない',
  ],
  'asari-2025-10': [
    'アイドルになります',
    '覚悟',
    '心・技・体',
    '全身全霊',
    '総合芸術',
    'オープニングアクト',
    '精一杯',
    '忍耐力',
  ],
  'asari-2025-09': [
    '覚醒',
    '国民的アイドル',
    '成就',
    '天真爛漫',
    '魅惑のパフォーマンス',
    '魅惑の視線',
    'スポットライト',
    '始まりの合図',
    '存在感',
    'ひと呼吸',
  ],
}

const sortNames = (names: string[]) => [...names].sort((left, right) => left.localeCompare(right, 'ja'))

describe('synced asari event data', () => {
  for (const [eventId, expectedNames] of Object.entries(expectedSubPlanCards)) {
    it(`${eventId} only exposes the verified off-plan cards`, () => {
      const event = events.find((entry) => entry.eventId === eventId)

      expect(event).toBeDefined()
      if (!event) {
        return
      }

      const actualNames = getAvailableCardsForEvent(cards, event)
        .filter((entry) => entry.card.plan === event.subPlan)
        .map((entry) => entry.card.name)

      expect(sortNames(actualNames)).toEqual(sortNames(expectedNames))
    })
  }
})
