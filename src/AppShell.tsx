import {
  startTransition,
  useEffect,
  useRef,
  useState,
} from 'react'

import { CardDetailPanel } from './components/CardDetailPanel'
import { InitialLegendCalculator } from './components/InitialLegendCalculator'
import { CardTile } from './components/CardTile'
import { MemoryCandidateTile } from './components/MemoryCandidateTile'
import { SeoSections } from './components/SeoSections'
import { SkillSwitchPanel } from './components/SkillSwitchPanel'
import cardsData from './data/cards.json'
import customizationsData from './data/customizations.json'
import eventsData from './data/events.json'
import metadataData from './data/metadata.json'
import { withBasePath } from './lib/assets'
import { deriveCandidateCards, getAvailableCardsForEvent } from './lib/event-rules'
import { isMemoryEligibleCard } from './lib/memory-eligibility'
import {
  canSetCustomizationTier,
  createMemorySelection,
  formatMemorySelectionLabel,
} from './lib/memory-selections'
import {
  getEventPagePath,
  getMemoryEligibleCards,
} from './lib/site'
import {
  filterCardsBySkillSwitch,
  getSkillSwitchPairs,
  isSkillSwitchUnlocked,
  toggleSkillSwitch,
} from './lib/skill-card-switches'
import {
  type PlanFilter,
  readUrlFilterState,
  syncUrlFilterState,
} from './lib/url-state'
import type {
  Card,
  CardCustomizationSpec,
  EventSnapshot,
  MemorySelection,
  SkillSwitchMode,
  SyncMetadata,
} from './types'

interface AppShellProps {
  cards?: Card[]
  customizations?: CardCustomizationSpec[]
  events?: EventSnapshot[]
  metadata?: SyncMetadata
}

const PLAN_FILTERS = [
  { id: 'all', label: '指定なし' },
  { id: 'sense', label: 'センス' },
  { id: 'logic', label: 'ロジック' },
  { id: 'anomaly', label: 'アノマリー' },
] as const
const DEFAULT_MAX_PRODUCER_LEVEL = 60

interface CandidateCardItem {
  card: Card
  detailLabel: string
  memorySelection: MemorySelection | null
}

const cardsFromJson = (
  cardsData as Array<
    Omit<Card, 'isUnique' | 'isMemoryEligible' | 'unlockLevel' | 'unlockSource'>
    & Partial<Pick<Card, 'isUnique' | 'isMemoryEligible' | 'unlockLevel' | 'unlockSource'>>
  >
).map((card) => ({
  ...card,
  isMemoryEligible: isMemoryEligibleCard(card),
  isUnique: card.isUnique ?? false,
  unlockLevel: card.unlockLevel,
  unlockSource: card.unlockSource ?? 'unknown',
})) as Card[]
const customizationsFromJson = customizationsData as CardCustomizationSpec[]
const eventsFromJson = eventsData as EventSnapshot[]
const metadataFromJson = metadataData as SyncMetadata

function getProducerLevelChoices(cards: Card[]): number[] {
  const maxUnlockLevel = cards.reduce(
    (currentMax, card) => Math.max(currentMax, card.unlockLevel ?? 0),
    0,
  )
  const upperBound = Math.max(DEFAULT_MAX_PRODUCER_LEVEL, maxUnlockLevel)
  return Array.from({ length: upperBound }, (_, index) => index + 1)
}

function getAvailableIdsForState(
  cards: Card[],
  skillSwitchPairs: ReturnType<typeof getSkillSwitchPairs>,
  switchedPairIds: string[],
  nextEvent: EventSnapshot | null,
  nextProducerLevel: number,
): Set<string> {
  const nextEffectiveCards = filterCardsBySkillSwitch(
    cards,
    skillSwitchPairs,
    new Set(switchedPairIds),
    nextProducerLevel,
  )

  return new Set(
    nextEvent
      ? getAvailableCardsForEvent(
          nextEffectiveCards,
          nextEvent,
          nextProducerLevel,
        ).map(({ card }) => card.id)
      : [],
  )
}

export function AppShell({
  cards = cardsFromJson,
  customizations = customizationsFromJson,
  events = eventsFromJson,
  metadata = metadataFromJson,
}: AppShellProps) {
  const producerLevelChoices = getProducerLevelChoices(cards)
  const defaultEventId = events[0]?.eventId ?? ''
  const defaultProducerLevel =
    producerLevelChoices[producerLevelChoices.length - 1] ?? DEFAULT_MAX_PRODUCER_LEVEL
  const skillSwitchPairs = getSkillSwitchPairs(cards)
  const defaultSwitchedPairIds = skillSwitchPairs.map((pair) => pair.id)
  const [eventId, setEventId] = useState(defaultEventId)
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all')
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const [isSkillSwitchPanelOpen, setIsSkillSwitchPanelOpen] = useState(false)
  const [producerLevel, setProducerLevel] = useState(defaultProducerLevel)
  const [switchedPairIds, setSwitchedPairIds] = useState<string[]>(() => defaultSwitchedPairIds)
  const [selectedMemories, setSelectedMemories] = useState<MemorySelection[]>([])
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [activeCandidateCardId, setActiveCandidateCardId] = useState<string | null>(null)
  const hasInitializedUrlStateRef = useRef(false)

  const switchedPairIdSet = new Set(switchedPairIds)
  const customizationSpecIndex = new Map(customizations.map((spec) => [spec.cardId, spec]))
  const effectiveCards = filterCardsBySkillSwitch(
    cards,
    skillSwitchPairs,
    switchedPairIdSet,
    producerLevel,
  )
  const currentEvent = events.find((event) => event.eventId === eventId) ?? null
  const availableCards = currentEvent
    ? getAvailableCardsForEvent(effectiveCards, currentEvent, producerLevel)
    : []
  const searchableCards = availableCards.filter(({ card }) => {
    return planFilter === 'all' || card.plan === planFilter
  })
  const currentPlanFilterLabel =
    PLAN_FILTERS.find((filter) => filter.id === planFilter)?.label ?? '指定なし'
  const unlockedSkillSwitchPairs = skillSwitchPairs.filter((pair) =>
    isSkillSwitchUnlocked(pair, producerLevel),
  )
  const activeSwitchedPairCount = unlockedSkillSwitchPairs.filter((pair) =>
    switchedPairIdSet.has(pair.id),
  ).length
  const selectedMemoryIndex = new Map(selectedMemories.map((memory) => [memory.cardId, memory]))
  const activeCard =
    availableCards.find(({ card }) => card.id === activeCardId)?.card ?? searchableCards[0]?.card ?? null
  const activeMemorySelection = activeCard ? selectedMemoryIndex.get(activeCard.id) ?? null : null
  const candidateResult = currentEvent
    ? deriveCandidateCards(effectiveCards, currentEvent, selectedMemories, producerLevel)
    : {
        invalidSelections: [],
        rFillers: [],
        selectedMemories: [],
      }
  const selectedCandidateCards: CandidateCardItem[] = candidateResult.selectedMemories.map(({ card, selection }) => ({
    card,
    detailLabel: formatMemorySelectionLabel(card, selection, customizationSpecIndex.get(card.id)),
    memorySelection: selection,
  }))
  const rCandidateCards: CandidateCardItem[] = candidateResult.rFillers.map((card) => ({
    card,
    detailLabel: card.name,
    memorySelection: null,
  }))
  const candidateCards = [...selectedCandidateCards, ...rCandidateCards]
  const activeCandidate =
    candidateCards.find((candidate) => candidate.card.id === activeCandidateCardId) ?? null
  const activeCandidateCard = activeCandidate?.card ?? null
  const activeCandidateMemorySelection = activeCandidate?.memorySelection ?? null
  const memoryEligibleCards = getMemoryEligibleCards(cards)

  function toggleCard(cardId: string) {
    if (!availableCards.some(({ card }) => card.id === cardId)) {
      return
    }

    setSelectedMemories((current) =>
      current.some((memory) => memory.cardId === cardId)
        ? current.filter((memory) => memory.cardId !== cardId)
        : [...current, createMemorySelection(cardId)],
    )
  }

  function updateMemoryState(cardId: string, state: MemorySelection['state']) {
    if (state === 'customized' && !customizationSpecIndex.has(cardId)) {
      return
    }

    setSelectedMemories((current) =>
      current.map((memorySelection) => (
        memorySelection.cardId === cardId
          ? {
              ...memorySelection,
              state,
            }
          : memorySelection
      )),
    )
  }

  function setMemoryCustomization(cardId: string, slotKey: string, tierKey: string | null) {
    const customizationSpec = customizationSpecIndex.get(cardId)
    if (!customizationSpec) {
      return
    }

    setSelectedMemories((current) =>
      current.map((memorySelection) => {
        if (memorySelection.cardId !== cardId) {
          return memorySelection
        }

        const existingCustomization = memorySelection.customizations.find(
          (entry) => entry.slotKey === slotKey,
        )

        if (tierKey === null) {
          return {
            ...memorySelection,
            customizations: memorySelection.customizations.filter(
              (entry) => entry.slotKey !== slotKey,
            ),
            state: 'customized',
          }
        }

        if (existingCustomization) {
          if (!canSetCustomizationTier(memorySelection, customizationSpec, slotKey, tierKey)) {
            return memorySelection
          }

          return {
            ...memorySelection,
            customizations: memorySelection.customizations.map((entry) => (
              entry.slotKey === slotKey
                ? {
                    slotKey,
                    tierKey,
                  }
                : entry
            )),
            state: 'customized',
          }
        }

        if (!canSetCustomizationTier(memorySelection, customizationSpec, slotKey, tierKey)) {
          return memorySelection
        }

        return {
          ...memorySelection,
          customizations: [
            ...memorySelection.customizations,
            {
              slotKey,
              tierKey,
            },
          ],
          state: 'customized',
        }
      }),
    )
  }

  useEffect(() => {
    if (hasInitializedUrlStateRef.current || events.length === 0 || cards.length === 0) {
      return
    }

    const nextUrlState = readUrlFilterState({
      cards: cards.map((card) => card.id),
      defaultState: {
        activeCardId: null,
        eventId: defaultEventId,
        planFilter: 'all',
        producerLevel: defaultProducerLevel,
      },
      events,
      producerLevelChoices,
    })
    const nextEvent = events.find((event) => event.eventId === nextUrlState.eventId) ?? null
    const nextAvailableIds = getAvailableIdsForState(
      cards,
      skillSwitchPairs,
      switchedPairIds,
      nextEvent,
      nextUrlState.producerLevel,
    )

    startTransition(() => {
      setEventId(nextUrlState.eventId)
      setPlanFilter(nextUrlState.planFilter)
      setProducerLevel(nextUrlState.producerLevel)
      setActiveCardId(
        nextUrlState.activeCardId && nextAvailableIds.has(nextUrlState.activeCardId)
          ? nextUrlState.activeCardId
          : null,
      )
    })

    hasInitializedUrlStateRef.current = true
  }, [
    cards,
    defaultEventId,
    defaultProducerLevel,
    events,
    producerLevelChoices,
    skillSwitchPairs,
    switchedPairIds,
  ])

  useEffect(() => {
    if (!hasInitializedUrlStateRef.current) {
      return
    }

    syncUrlFilterState(
      {
        activeCardId,
        eventId,
        planFilter,
        producerLevel,
      },
      {
        activeCardId: null,
        eventId: defaultEventId,
        planFilter: 'all',
        producerLevel: defaultProducerLevel,
      },
    )
  }, [
    activeCardId,
    defaultEventId,
    defaultProducerLevel,
    eventId,
    planFilter,
    producerLevel,
  ])

  function handleEventChange(nextEventId: string) {
    const nextEvent = events.find((event) => event.eventId === nextEventId)
    const nextAvailableIds = getAvailableIdsForState(
      cards,
      skillSwitchPairs,
      switchedPairIds,
      nextEvent ?? null,
      producerLevel,
    )

    startTransition(() => {
      setEventId(nextEventId)
      setPlanFilter('all')
      setActiveCardId(null)
      setActiveCandidateCardId(null)
      setSelectedMemories((current) =>
        current.filter((memorySelection) => nextAvailableIds.has(memorySelection.cardId)),
      )
    })
  }

  function handleProducerLevelChange(nextProducerLevel: number) {
    const nextAvailableIds = getAvailableIdsForState(
      cards,
      skillSwitchPairs,
      switchedPairIds,
      currentEvent,
      nextProducerLevel,
    )

    startTransition(() => {
      setProducerLevel(nextProducerLevel)
      setActiveCardId(null)
      setActiveCandidateCardId(null)
      setSelectedMemories((current) =>
        current.filter((memorySelection) => nextAvailableIds.has(memorySelection.cardId)),
      )
    })
  }

  function handleSkillSwitchChange(pairId: string, mode: SkillSwitchMode) {
    const nextSwitchedPairIds = toggleSkillSwitch(switchedPairIds, pairId, mode)
    const nextAvailableIds = getAvailableIdsForState(
      cards,
      skillSwitchPairs,
      nextSwitchedPairIds,
      currentEvent,
      producerLevel,
    )

    startTransition(() => {
      setSwitchedPairIds(nextSwitchedPairIds)
      setActiveCardId((current) => (current && nextAvailableIds.has(current) ? current : null))
      setActiveCandidateCardId((current) =>
        current && nextAvailableIds.has(current) ? current : null,
      )
      setSelectedMemories((current) =>
        current.filter((memorySelection) => nextAvailableIds.has(memorySelection.cardId)),
      )
    })
  }

  function handleResetSkillSwitches() {
    const nextAvailableIds = getAvailableIdsForState(
      cards,
      skillSwitchPairs,
      defaultSwitchedPairIds,
      currentEvent,
      producerLevel,
    )

    startTransition(() => {
      setSwitchedPairIds(defaultSwitchedPairIds)
      setActiveCardId((current) => (current && nextAvailableIds.has(current) ? current : null))
      setActiveCandidateCardId((current) =>
        current && nextAvailableIds.has(current) ? current : null,
      )
      setSelectedMemories((current) =>
        current.filter((memorySelection) => nextAvailableIds.has(memorySelection.cardId)),
      )
    })
  }

  if (events.length === 0 || cards.length === 0) {
    return (
      <main className="app-shell app-shell--empty">
        <section className="hero-card">
          <p className="eyebrow">Data Missing</p>
          <h1>同期データがまだありません。</h1>
          <p>
            `npm run sync:data` を実行すると、カード一覧・開催回・画像アセットをローカル生成します。
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Gakumasu</p>
          <h1>メモリ厳選ツール</h1>
          <p className="hero-card__lead">
            欲しいメモリーを複数選ぶと、取得してもいいスキルカードを検索します。
          </p>
        </div>
        <div className="hero-card__meta">
          <div className="hero-card__stats">
            <span>カード {metadata.totalCards} 枚</span>
            <span>開催回 {metadata.totalEvents} 件</span>
            <span>候補 {memoryEligibleCards.length} 枚</span>
          </div>
          <span>更新 {new Date(metadata.syncedAt).toLocaleString('ja-JP')}</span>
        </div>
      </section>

      <SeoSections
        cards={cards}
        currentEvent={currentEvent}
        events={events}
        metadata={metadata}
      />

      <section className="control-panel" id="tool">
        <label className="control-panel__block">
          <span>開催回</span>
          <select
            aria-label="開催回"
            onChange={(event) => handleEventChange(event.target.value)}
            value={eventId}
          >
            {events.map((event) => (
              <option key={event.eventId} value={event.eventId}>
                {event.label}
              </option>
            ))}
          </select>
        </label>
        <label className="control-panel__block">
          <span>PLv</span>
          <select
            aria-label="PLv"
            onChange={(event) => handleProducerLevelChange(Number(event.target.value))}
            value={producerLevel}
          >
            {producerLevelChoices.map((level) => (
              <option key={level} value={level}>
                PLv {level}
              </option>
            ))}
          </select>
        </label>
        {currentEvent ? (
          <div className="event-summary">
            <span className="event-summary__label">開催日時</span>
            <p>{currentEvent.period}</p>
            <a className="event-summary__link" href={withBasePath(getEventPagePath(currentEvent.eventId))}>
              この開催回の詳細ページ
            </a>
          </div>
        ) : null}
      </section>

      <section className="filter-row">
        <div className="filter-toolbar">
          <div className="filter-toolbar__summary">
            <span className="filter-toolbar__label">絞り込み</span>
            <p>
              プラン: {currentPlanFilterLabel} / 切り替え中: {activeSwitchedPairCount} 組 /
              解放済み: {unlockedSkillSwitchPairs.length} 組
            </p>
          </div>
          <div className="chip-group">
            <button
              aria-controls="filter-panel"
              aria-expanded={isFilterPanelOpen}
              className={`filter-toggle${isFilterPanelOpen ? ' is-active' : ''}`}
              onClick={() => setIsFilterPanelOpen((current) => !current)}
              type="button"
            >
              {isFilterPanelOpen ? '詳細設定を閉じる' : '絞り込みを管理'}
            </button>
            {skillSwitchPairs.length > 0 ? (
              <button
                aria-controls="skill-switch-panel"
                aria-expanded={isSkillSwitchPanelOpen}
                className={`filter-toggle${isSkillSwitchPanelOpen ? ' is-active' : ''}`}
                onClick={() => setIsSkillSwitchPanelOpen((current) => !current)}
                type="button"
              >
                {isSkillSwitchPanelOpen ? '切り替え設定を閉じる' : '切り替え設定を開く'}
              </button>
            ) : null}
          </div>
        </div>
        {isFilterPanelOpen ? (
          <div className="filter-panel" id="filter-panel">
            <fieldset className="filter-panel__group">
              <legend>プラン</legend>
              <div className="filter-panel__options" role="radiogroup" aria-label="プラン絞り込み">
                {PLAN_FILTERS.map((filter) => (
                  <label className="filter-option" key={filter.id}>
                    <input
                      checked={planFilter === filter.id}
                      name="plan-filter"
                      onChange={() => setPlanFilter(filter.id)}
                      type="radio"
                      value={filter.id}
                    />
                    <span>{filter.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        ) : null}
        {isSkillSwitchPanelOpen && skillSwitchPairs.length > 0 ? (
          <div className="filter-panel" id="skill-switch-panel">
            <SkillSwitchPanel
              onChangeMode={handleSkillSwitchChange}
              onReset={handleResetSkillSwitches}
              pairs={skillSwitchPairs}
              producerLevel={producerLevel}
              switchedPairIds={switchedPairIdSet}
            />
          </div>
        ) : null}
      </section>

      <div className="workspace">
        <section className="catalog-panel">
          <div className="panel-header">
            <h2>スキルカード一覧</h2>
            <p>{searchableCards.length} 枚</p>
          </div>
          <div className="card-grid">
            {searchableCards.map(({ card }) => (
              <CardTile
                card={card}
                isSelected={selectedMemoryIndex.has(card.id)}
                key={card.id}
                onOpen={setActiveCardId}
                onToggle={toggleCard}
              />
            ))}
          </div>
        </section>

        <CardDetailPanel
          card={activeCard}
          customizationSpec={activeCard ? customizationSpecIndex.get(activeCard.id) : undefined}
          memorySelection={activeMemorySelection}
          onSetCustomization={setMemoryCustomization}
          onToggleSelection={toggleCard}
          onUpdateMemoryState={updateMemoryState}
        />
      </div>

      <div
        className={`result-workspace${activeCandidateCard ? ' result-workspace--with-detail' : ''}`}
      >
        <section className="result-panel">
          <div className="panel-header">
            <h2>取得候補一覧</h2>
            <p>{candidateCards.length} 枚</p>
          </div>
          {candidateResult.invalidSelections.length > 0 ? (
            <p className="warning-text">
              開催回またはPLv条件外の選択は除外されました:
              {candidateResult.invalidSelections.map(({ card, selection }) => (
                formatMemorySelectionLabel(card, selection, customizationSpecIndex.get(card.id))
              )).join('、')}
            </p>
          ) : null}
          {candidateCards.length > 0 ? (
            <div className="result-groups">
              {selectedCandidateCards.length > 0 ? (
                <section className="result-group">
                  <div className="result-group__header">
                    <h3>選択したスキルカード</h3>
                    <p>{selectedCandidateCards.length} 枚</p>
                  </div>
                  <div aria-label="選択したスキルカード一覧" className="candidate-grid">
                    {selectedCandidateCards.map(({ card, detailLabel, memorySelection }) => (
                      <MemoryCandidateTile
                        card={card}
                        detailLabel={detailLabel}
                        isActive={activeCandidateCard?.id === card.id}
                        key={card.id}
                        memorySelection={memorySelection}
                        onOpen={setActiveCandidateCardId}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
              {rCandidateCards.length > 0 ? (
                <section className="result-group">
                  <div className="result-group__header">
                    <h3>Rカード</h3>
                    <p>{rCandidateCards.length} 枚</p>
                  </div>
                  <div aria-label="Rカード一覧" className="candidate-grid">
                    {rCandidateCards.map(({ card, detailLabel }) => (
                      <MemoryCandidateTile
                        card={card}
                        detailLabel={detailLabel}
                        isActive={activeCandidateCard?.id === card.id}
                        key={card.id}
                        memorySelection={null}
                        onOpen={setActiveCandidateCardId}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
            <p className="result-empty">取得候補がありません。</p>
          )}
        </section>

        {activeCandidateCard ? (
          <CardDetailPanel
            card={activeCandidateCard}
            customizationSpec={customizationSpecIndex.get(activeCandidateCard.id)}
            memorySelection={activeCandidateMemorySelection}
            onSetCustomization={setMemoryCustomization}
            onToggleSelection={toggleCard}
            onUpdateMemoryState={updateMemoryState}
          />
        ) : null}
      </div>

      <InitialLegendCalculator />
    </main>
  )
}
