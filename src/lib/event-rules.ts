import type {
  AvailabilityKind,
  CandidateResult,
  Card,
  CardWithAvailability,
  EventSnapshot,
  MemorySelection,
  ResolvedMemorySelection,
} from '../types'

const NON_FILLER_UNLOCK_SOURCES = new Set(['idol-unique', 'support-event'])

function isUnlockedForProducerLevel(card: Card, producerLevel?: number): boolean {
  if (!producerLevel || card.unlockSource !== 'produce-level') {
    return true
  }

  return !card.unlockLevel || card.unlockLevel <= producerLevel
}

export function compareCards(left: Card, right: Card): number {
  const rarityRank = { SSR: 0, SR: 1, R: 2, N: 3 }
  return (
    rarityRank[left.rarity] - rarityRank[right.rarity] ||
    left.name.localeCompare(right.name, 'ja')
  )
}

export function getCardAvailability(
  card: Card,
  event: EventSnapshot,
): AvailabilityKind | null {
  if (card.plan === event.mainPlan) {
    return 'main'
  }

  if (event.featuredCardIds.includes(card.id)) {
    return 'featured'
  }

  if (event.boostedCardIds.includes(card.id)) {
    return 'boosted'
  }

  return null
}

export function getAvailableCardsForEvent(
  cards: Card[],
  event: EventSnapshot,
  producerLevel?: number,
): CardWithAvailability[] {
  return getCardsForEvent(cards, event, producerLevel, isFillerEligibleCard)
}

function isFillerEligibleCard(card: Card): boolean {
  if (card.rarity === 'N') {
    return false
  }

  return !NON_FILLER_UNLOCK_SOURCES.has(card.unlockSource)
}

function getCardsForEvent(
  cards: Card[],
  event: EventSnapshot,
  producerLevel: number | undefined,
  isEligibleCard: (card: Card) => boolean,
): CardWithAvailability[] {
  const unique = new Map<string, CardWithAvailability>()

  for (const card of cards) {
    if (!isEligibleCard(card)) {
      continue
    }

    if (!isUnlockedForProducerLevel(card, producerLevel)) {
      continue
    }

    const availability = getCardAvailability(card, event)
    if (!availability) {
      continue
    }

    unique.set(card.id, { card, availability })
  }

  return [...unique.values()].sort((left, right) => compareCards(left.card, right.card))
}

export function deriveCandidateCards(
  cards: Card[],
  event: EventSnapshot,
  selectedMemories: MemorySelection[],
  producerLevel?: number,
): CandidateResult {
  const cardIndex = new Map(cards.map((card) => [card.id, card]))
  const availableCards = getAvailableCardsForEvent(cards, event, producerLevel).map(
    (entry) => entry.card,
  )
  const availableIndex = new Map(availableCards.map((card) => [card.id, card]))
  const selectedSet = new Set(selectedMemories.map((memory) => memory.cardId))

  const selectedEntries = selectedMemories
    .map((memorySelection) => {
      const card = availableIndex.get(memorySelection.cardId)
      if (!card) {
        return null
      }

      return {
        card,
        selection: memorySelection,
      }
    })
    .filter((entry): entry is ResolvedMemorySelection => Boolean(entry))

  const invalidSelections = selectedMemories
    .filter((memorySelection) => !availableIndex.has(memorySelection.cardId))
    .map((memorySelection) => {
      const card = cardIndex.get(memorySelection.cardId)
      if (!card) {
        return null
      }

      return {
        card,
        selection: memorySelection,
      }
    })
    .filter((entry): entry is ResolvedMemorySelection => Boolean(entry))

  const rFillers = availableCards
    .filter((card) => card.rarity === 'R' && !selectedSet.has(card.id))
    .sort(compareCards)

  return {
    selectedMemories: selectedEntries,
    invalidSelections,
    rFillers,
  }
}
