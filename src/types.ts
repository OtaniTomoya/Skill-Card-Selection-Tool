export type Plan = 'sense' | 'logic' | 'anomaly'

export type CardRarity = 'N' | 'R' | 'SR' | 'SSR'
export type CardUnlockSource =
  | 'produce-level'
  | 'random-default'
  | 'idol-unique'
  | 'support-event'
  | 'unknown'

export type EventStatus = 'archived' | 'live' | 'partial' | 'inferred'

export type AvailabilityKind = 'main' | 'featured' | 'boosted'
export type SkillSwitchMode = 'original' | 'switched'
export type MemoryState = 'base' | 'upgraded' | 'customized'

export interface IdolImageVariant {
  idolId: string
  idolName: string
  imagePath: string
}

export interface CardImageSet {
  defaultImagePath: string
  idolVariants: IdolImageVariant[]
}

export interface Card {
  id: string
  name: string
  plan: Plan
  rarity: CardRarity
  isUnique: boolean
  isMemoryEligible: boolean
  unlockLevel?: number
  unlockSource: CardUnlockSource
  effectText: string
  tags: string[]
  sourceUrl: string
  imageSet: CardImageSet
}

export interface CustomizationTier {
  tierKey: string
  label: string
}

export interface CustomizationSlot {
  slotKey: string
  label: string
  tiers: CustomizationTier[]
}

export interface CardCustomizationSpec {
  cardId: string
  maxSelections: number
  slots: CustomizationSlot[]
}

export interface SelectedCustomization {
  slotKey: string
  tierKey: string
}

export interface MemorySelection {
  cardId: string
  state: MemoryState
  customizations: SelectedCustomization[]
}

export interface ResolvedMemorySelection {
  card: Card
  selection: MemorySelection
}

export interface EventSnapshot {
  eventId: string
  label: string
  period: string
  mainPlan: Plan
  subPlan: Plan
  boostedCardIds: string[]
  featuredCardIds: string[]
  status: EventStatus
  notes?: string
  sourceUrls: string[]
}

export interface SyncMetadata {
  syncedAt: string
  totalCards: number
  totalEvents: number
  downloadedImages: number
}

export interface CandidateResult {
  selectedMemories: ResolvedMemorySelection[]
  rFillers: Card[]
  invalidSelections: ResolvedMemorySelection[]
}

export interface CardWithAvailability {
  card: Card
  availability: AvailabilityKind
}

export interface SkillSwitchPair {
  id: string
  plan: Plan
  originalCardId: string
  originalCardName: string
  switchedCardId: string
  switchedCardName: string
  unlockLevel: number
}
