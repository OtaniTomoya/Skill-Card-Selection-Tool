import { describe, expect, it } from 'vitest'

import { deriveCandidateCards, getAvailableCardsForEvent } from '../src/lib/event-rules'
import type { Card, EventSnapshot, MemorySelection } from '../src/types'

const cards: Card[] = [
  {
    effectText: '好調+4',
    id: 'sense-ssr',
    imageSet: { defaultImagePath: 'assets/cards/sense-ssr.png', idolVariants: [] },
    isMemoryEligible: true,
    isUnique: false,
    name: 'シュプレヒコール',
    plan: 'sense',
    rarity: 'SSR',
    sourceUrl: 'https://example.com/1',
    tags: ['好調'],
    unlockLevel: 30,
    unlockSource: 'produce-level',
  },
  {
    effectText: 'パラメータ+9',
    id: 'anomaly-r',
    imageSet: { defaultImagePath: 'assets/cards/anomaly-r.png', idolVariants: [] },
    isMemoryEligible: true,
    isUnique: false,
    name: '勢い任せ',
    plan: 'anomaly',
    rarity: 'R',
    sourceUrl: 'https://example.com/2',
    tags: ['全力'],
    unlockLevel: undefined,
    unlockSource: 'unknown',
  },
  {
    effectText: 'やる気+4',
    id: 'logic-r',
    imageSet: { defaultImagePath: 'assets/cards/logic-r.png', idolVariants: [] },
    isMemoryEligible: true,
    isUnique: false,
    name: '勇気の一歩',
    plan: 'logic',
    rarity: 'R',
    sourceUrl: 'https://example.com/3',
    tags: ['やる気'],
    unlockLevel: undefined,
    unlockSource: 'unknown',
  },
  {
    effectText: '好調+2',
    id: 'sense-random',
    imageSet: { defaultImagePath: 'assets/cards/sense-random.png', idolVariants: [] },
    isMemoryEligible: true,
    isUnique: false,
    name: '始まりの合図',
    plan: 'sense',
    rarity: 'R',
    sourceUrl: 'https://example.com/4',
    tags: ['好調'],
    unlockLevel: undefined,
    unlockSource: 'unknown',
  },
]

const event: EventSnapshot = {
  boostedCardIds: ['sense-ssr'],
  eventId: 'asari-2026-03',
  featuredCardIds: [],
  label: '第5回',
  mainPlan: 'anomaly',
  period: '2026年3月',
  sourceUrls: ['https://example.com/event'],
  status: 'live',
  subPlan: 'sense',
}

describe('event rules', () => {
  it('builds the available card set from main plan plus explicit boosted/featured cards', () => {
    expect(getAvailableCardsForEvent(cards, event).map((entry) => entry.card.id)).toEqual([
      'sense-ssr',
      'anomaly-r',
    ])
  })

  it('returns selected cards plus R fillers only', () => {
    const selectedMemories: MemorySelection[] = [
      {
        cardId: 'sense-ssr',
        customizations: [],
        state: 'base',
      },
      {
        cardId: 'logic-r',
        customizations: [],
        state: 'upgraded',
      },
    ]

    expect(deriveCandidateCards(cards, event, selectedMemories)).toEqual({
      invalidSelections: [{ card: cards[2], selection: selectedMemories[1] }],
      rFillers: [cards[1]],
      selectedMemories: [{ card: cards[0], selection: selectedMemories[0] }],
    })
  })

  it('filters produce-level cards that are not unlocked by the selected PLv', () => {
    expect(getAvailableCardsForEvent(cards, event, 29).map((entry) => entry.card.id)).toEqual([
      'anomaly-r',
    ])
  })

  it('excludes unique idol cards from the event pool', () => {
    const uniqueCard = {
      ...cards[0],
      id: 'sense-unique',
      isMemoryEligible: false,
      isUnique: true,
      name: '受け取ってくれる？',
      unlockSource: 'idol-unique' as const,
    }

    expect(
      getAvailableCardsForEvent([...cards, uniqueCard], event).map((entry) => entry.card.id),
    ).toEqual(['sense-ssr', 'anomaly-r'])
  })

  it('excludes support-card-derived cards from the event pool', () => {
    const supportCard = {
      ...cards[1],
      id: 'support-event',
      isMemoryEligible: false,
      isUnique: false,
      name: '雨宿りのバス停',
      rarity: 'SR' as const,
      unlockSource: 'support-event' as const,
    }

    expect(
      getAvailableCardsForEvent([...cards, supportCard], event).map((entry) => entry.card.id),
    ).toEqual(['sense-ssr', 'anomaly-r'])
  })

  it('excludes starter deck cards from the event pool', () => {
    const starterCard = {
      ...cards[1],
      id: 'starter-1',
      isMemoryEligible: true,
      isUnique: false,
      name: 'メントレの基本',
      rarity: 'N' as const,
      unlockSource: 'unknown' as const,
    }

    expect(
      getAvailableCardsForEvent([...cards, starterCard], event).map((entry) => entry.card.id),
    ).toEqual(['sense-ssr', 'anomaly-r'])
  })

  it('does not include subplan cards unless the event lists them explicitly', () => {
    expect(
      getAvailableCardsForEvent(cards, event).map((entry) => entry.card.id),
    ).not.toContain('sense-random')
  })

  it('includes random-default R cards in the event pool and filler results', () => {
    const randomDefaultRCard = {
      ...cards[1],
      id: 'starter-r',
      isMemoryEligible: false,
      name: 'スターライト',
      unlockSource: 'random-default' as const,
    }

    expect(
      getAvailableCardsForEvent([...cards, randomDefaultRCard], event).map((entry) => entry.card.id),
    ).toEqual(['sense-ssr', 'starter-r', 'anomaly-r'])

    expect(
      deriveCandidateCards([...cards, randomDefaultRCard], event, []).rFillers.map((card) => card.id),
    ).toContain('starter-r')
  })
})
