import type { Card, CardUnlockSource } from '../types'

const NON_MEMORY_UNLOCK_SOURCES = new Set<CardUnlockSource>([
  'idol-unique',
  'support-event',
  'random-default',
])

type MemoryEligibilityCard = Partial<
  Pick<Card, 'isMemoryEligible' | 'isUnique' | 'unlockSource' | 'rarity'>
>

export function isMemoryEligibleCard(card: MemoryEligibilityCard): boolean {
  if (card.rarity === 'N') {
    return false
  }

  if (card.unlockSource && NON_MEMORY_UNLOCK_SOURCES.has(card.unlockSource)) {
    return false
  }

  return card.isMemoryEligible ?? !card.isUnique
}
