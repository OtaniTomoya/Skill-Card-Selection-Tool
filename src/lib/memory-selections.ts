import type {
  Card,
  CardCustomizationSpec,
  CustomizationSlot,
  MemorySelection,
  MemoryState,
  SelectedCustomization,
} from '../types'

export const MEMORY_STATE_LABELS: Record<MemoryState, string> = {
  base: '未強化',
  upgraded: '強化済み',
  customized: 'カスタマイズ済み',
}

const IN_GAME_STATUS_PATTERN =
  /(絶好調|好印象|やる気|好調|集中|強気|全力|温存|元気|保留|消費体力減少|消費減少)/g

export function createMemorySelection(cardId: string): MemorySelection {
  return {
    cardId,
    customizations: [],
    state: 'base',
  }
}

function getCustomizationSlot(
  selectedCustomization: SelectedCustomization,
  customizationSpec?: CardCustomizationSpec,
): CustomizationSlot | undefined {
  return customizationSpec?.slots.find(
    (entry) => entry.slotKey === selectedCustomization.slotKey,
  )
}

function getCustomizationSlotDisplayLabel(
  slot: CustomizationSlot,
  customizationSpec?: CardCustomizationSpec,
): string {
  const slotLabel = getCustomizationSlotBaseLabel(slot)
  const duplicateCount = customizationSpec?.slots.filter(
    (entry) => getCustomizationSlotBaseLabel(entry) === slotLabel,
  ).length ?? 0

  return duplicateCount > 1 ? `${slotLabel}${slot.slotKey}` : slotLabel
}

export function getCustomizationSlotLabel(
  slot: CustomizationSlot,
  customizationSpec?: CardCustomizationSpec,
): string {
  return getCustomizationSlotDisplayLabel(slot, customizationSpec)
}

function getCustomizationSlotBaseLabel(slot: CustomizationSlot): string {
  if (slot.label === 'バフ') {
    return getInGameStatusLabel(slot.tiers[0]?.label ?? '') ?? '状態'
  }

  if (slot.label === 'コスト') {
    return '使用コスト'
  }

  if (slot.label === 'G効果') {
    return '強化後効果'
  }

  if (
    slot.label === 'パラメータ'
    && slot.tiers.some((tier) => tier.label.includes('パラメータ上昇回数'))
  ) {
    return 'パラメータ上昇回数'
  }

  return slot.label
}

function getInGameStatusLabel(value: string): string | null {
  const matches = [...value.matchAll(IN_GAME_STATUS_PATTERN)]

  if (matches.length === 0) {
    return null
  }

  return matches[matches.length - 1]?.[1] ?? null
}

export function getCustomizationTierCost(tierKey: string | null | undefined): number {
  const cost = Number(tierKey)

  if (!Number.isFinite(cost) || cost <= 0) {
    return 0
  }

  return cost
}

export function getCustomizationTotalCount(
  memorySelection: Pick<MemorySelection, 'customizations'> | null | undefined,
): number {
  return memorySelection?.customizations.reduce(
    (count, customization) => count + getCustomizationTierCost(customization.tierKey),
    0,
  ) ?? 0
}

export function canSetCustomizationTier(
  memorySelection: MemorySelection,
  customizationSpec: CardCustomizationSpec,
  slotKey: string,
  tierKey: string | null,
): boolean {
  const currentCustomization = memorySelection.customizations.find(
    (entry) => entry.slotKey === slotKey,
  )
  const currentCost = getCustomizationTotalCount(memorySelection)
  const nextCost =
    currentCost
    - getCustomizationTierCost(currentCustomization?.tierKey)
    + getCustomizationTierCost(tierKey)

  return nextCost <= customizationSpec.maxSelections
}

export function getCustomizationLabel(
  selectedCustomization: SelectedCustomization,
  customizationSpec?: CardCustomizationSpec,
): string | null {
  const slot = getCustomizationSlot(selectedCustomization, customizationSpec)
  if (!slot) {
    return null
  }

  return `${getCustomizationSlotDisplayLabel(slot, customizationSpec)}${selectedCustomization.tierKey}回`
}

export function getCustomizationOptionLabel(
  slot: CustomizationSlot,
  tierKey: string | null,
  customizationSpec?: CardCustomizationSpec,
): string {
  return `${getCustomizationSlotDisplayLabel(slot, customizationSpec)}${tierKey ?? '0'}回`
}

export function getCustomizationLabels(
  memorySelection: MemorySelection,
  customizationSpec?: CardCustomizationSpec,
): string[] {
  return memorySelection.customizations
    .map((customization) => getCustomizationLabel(customization, customizationSpec))
    .filter((label): label is string => Boolean(label))
}

export function formatMemorySelectionSummary(
  memorySelection: MemorySelection,
  customizationSpec?: CardCustomizationSpec,
): string {
  const stateLabel = MEMORY_STATE_LABELS[memorySelection.state]
  if (memorySelection.state !== 'customized') {
    return stateLabel
  }

  const customizationLabels = getCustomizationLabels(memorySelection, customizationSpec)
  if (customizationLabels.length === 0) {
    return `${stateLabel}（未選択）`
  }

  return `${stateLabel}（${customizationLabels.join(' / ')}）`
}

export function formatMemorySelectionLabel(
  card: Card,
  memorySelection: MemorySelection,
  customizationSpec?: CardCustomizationSpec,
): string {
  return `${card.name} (${formatMemorySelectionSummary(memorySelection, customizationSpec)})`
}

export function hasCustomizationMark(
  memorySelection: Pick<MemorySelection, 'state'> | null | undefined,
): boolean {
  return memorySelection?.state === 'customized'
}
