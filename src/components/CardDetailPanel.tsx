import { getCardEffectText, getEffectLines } from '../lib/memory-effects'
import {
  canSetCustomizationTier,
  getCustomizationLabels,
  getCustomizationOptionLabel,
  getCustomizationSlotLabel,
  getCustomizationTotalCount,
  MEMORY_STATE_LABELS,
} from '../lib/memory-selections'
import { withBasePath } from '../lib/assets'
import { getCardPagePath } from '../lib/site'
import type {
  Card,
  CardCustomizationSpec,
  MemorySelection,
  MemoryState,
} from '../types'

interface CardDetailPanelProps {
  card: Card | null
  customizationSpec?: CardCustomizationSpec
  emptyMessage?: string
  memorySelection: MemorySelection | null
  onSetCustomization: (cardId: string, slotKey: string, tierKey: string | null) => void
  onToggleSelection: (cardId: string) => void
  onUpdateMemoryState: (cardId: string, state: MemoryState) => void
}

const PLAN_LABELS = {
  sense: 'センス',
  logic: 'ロジック',
  anomaly: 'アノマリー',
}

const MEMORY_STATES: MemoryState[] = ['base', 'upgraded', 'customized']

function getNextCustomizationTier(
  memorySelection: MemorySelection,
  customizationSpec: CardCustomizationSpec,
  slotKey: string,
  tierKeys: string[],
): string | null {
  const currentTierKey = memorySelection.customizations.find(
    (entry) => entry.slotKey === slotKey,
  )?.tierKey ?? null
  const cycle = [...tierKeys, null]
  const currentIndex = cycle.findIndex((tierKey) => tierKey === currentTierKey)

  for (let offset = 1; offset <= cycle.length; offset += 1) {
    const candidate = cycle[(currentIndex + offset) % cycle.length] ?? null

    if (candidate === null) {
      return null
    }

    if (canSetCustomizationTier(memorySelection, customizationSpec, slotKey, candidate)) {
      return candidate
    }
  }

  return null
}

export function CardDetailPanel({
  card,
  customizationSpec,
  emptyMessage = 'カードをクリックすると、名前・効果・タグをここに表示します。',
  memorySelection,
  onSetCustomization,
  onToggleSelection,
  onUpdateMemoryState,
}: CardDetailPanelProps) {
  if (!card) {
    return (
      <aside className="detail-panel detail-panel--empty">
        <p>{emptyMessage}</p>
      </aside>
    )
  }

  const visibleTags = card.tags.filter((tag) => tag !== '指針')
  const selectedState = memorySelection?.state ?? 'base'
  const effectLines = getEffectLines(getCardEffectText(card, selectedState))
  const selectedCustomizationLabels = memorySelection
    ? getCustomizationLabels(memorySelection, customizationSpec)
    : []
  const selectedCustomizationCount = getCustomizationTotalCount(memorySelection)

  return (
    <aside className="detail-panel">
      <div className="detail-panel__meta">
        <div className="detail-panel__heading">
          <div>
            <p className="detail-panel__plan">{PLAN_LABELS[card.plan]}</p>
            <h2>{card.name}</h2>
          </div>
          <button onClick={() => onToggleSelection(card.id)} type="button">
            {memorySelection ? '候補から外す' : 'メモリー候補に追加'}
          </button>
        </div>
        <div className="detail-panel__badges">
          <span>{card.rarity}</span>
          {visibleTags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="detail-panel__links">
          <a href={withBasePath(getCardPagePath(card.id))}>このカードの個別ページ</a>
          <a href={card.sourceUrl} rel="noreferrer" target="_blank">
            元データを開く
          </a>
        </div>
        {memorySelection ? (
          <section className="detail-panel__section">
            <div className="detail-panel__section-header">
              <p className="detail-panel__section-label">メモリー状態</p>
            </div>
            <div className="detail-panel__toggle-group" role="group" aria-label="メモリー状態">
              {MEMORY_STATES.map((state) => {
                const isDisabled = state === 'customized' && !customizationSpec
                return (
                  <button
                    aria-pressed={selectedState === state}
                    className={`detail-panel__toggle-option${selectedState === state ? ' is-active' : ''}`}
                    disabled={isDisabled}
                    key={state}
                    onClick={() => onUpdateMemoryState(card.id, state)}
                    type="button"
                  >
                    {MEMORY_STATE_LABELS[state]}
                  </button>
                )
              })}
            </div>
            {!customizationSpec ? (
              <p className="detail-panel__hint">
                このカードはカスタマイズ対象外か、候補データがまだありません。
              </p>
            ) : null}
          </section>
        ) : null}
        <div className="detail-panel__effect">
          {effectLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        {memorySelection?.state === 'customized' && customizationSpec ? (
          <section className="detail-panel__section">
            <div className="detail-panel__section-header">
              <p className="detail-panel__section-label">
                カスタマイズ選択 {selectedCustomizationCount}/{customizationSpec.maxSelections}
              </p>
            </div>
            <div className="detail-panel__customizations">
              {customizationSpec.slots.map((slot) => {
                const selectedCustomization = memorySelection.customizations.find(
                  (entry) => entry.slotKey === slot.slotKey,
                )
                const nextTier = getNextCustomizationTier(
                  memorySelection,
                  customizationSpec,
                  slot.slotKey,
                  slot.tiers.map((tier) => tier.tierKey),
                )
                const optionLabel = getCustomizationOptionLabel(
                  slot,
                  selectedCustomization?.tierKey ?? null,
                  customizationSpec,
                )

                return (
                  <section className="customization-slot" key={slot.slotKey}>
                    <div className="customization-slot__header">
                      <h3>{getCustomizationSlotLabel(slot, customizationSpec)}</h3>
                      <span>{slot.slotKey}</span>
                    </div>
                    <button
                      aria-pressed={Boolean(selectedCustomization)}
                      className={`customization-slot__option${selectedCustomization ? ' is-active' : ''}`}
                      disabled={!selectedCustomization && nextTier === null}
                      onClick={() => onSetCustomization(card.id, slot.slotKey, nextTier)}
                      type="button"
                    >
                      {optionLabel}
                    </button>
                    <p className="detail-panel__hint">クリックで段階を切り替え</p>
                  </section>
                )
              })}
            </div>
            <div className="detail-panel__selection-summary">
              <p className="detail-panel__section-label">選択中カスタマイズ</p>
              {selectedCustomizationLabels.length > 0 ? (
                <ul className="detail-panel__selection-chips">
                  {selectedCustomizationLabels.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              ) : (
                <p className="detail-panel__hint">まだカスタマイズが選択されていません。</p>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </aside>
  )
}
