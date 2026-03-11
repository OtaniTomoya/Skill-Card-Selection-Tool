import type { EventSnapshot, Plan } from '../types'

export type PlanFilter = 'all' | Plan

export interface UrlFilterState {
  activeCardId: string | null
  eventId: string
  planFilter: PlanFilter
  producerLevel: number
}

interface ReadUrlFilterStateOptions {
  cards: string[]
  defaultState: UrlFilterState
  events: EventSnapshot[]
  producerLevelChoices: number[]
}

export function readUrlFilterState({
  cards,
  defaultState,
  events,
  producerLevelChoices,
}: ReadUrlFilterStateOptions): UrlFilterState {
  if (typeof window === 'undefined') {
    return defaultState
  }

  const params = new URLSearchParams(window.location.search)
  const requestedEventId = params.get('event')
  const requestedPlanFilter = params.get('plan')
  const requestedProducerLevel = Number(params.get('plv'))
  const requestedCardId = params.get('card')

  const hasEvent = events.some((event) => event.eventId === requestedEventId)
  const hasProducerLevel = producerLevelChoices.includes(requestedProducerLevel)
  const hasCard = requestedCardId !== null && cards.includes(requestedCardId)
  const hasPlanFilter = requestedPlanFilter === 'all'
    || requestedPlanFilter === 'sense'
    || requestedPlanFilter === 'logic'
    || requestedPlanFilter === 'anomaly'

  return {
    activeCardId: hasCard ? requestedCardId : defaultState.activeCardId,
    eventId: hasEvent ? requestedEventId ?? defaultState.eventId : defaultState.eventId,
    planFilter: hasPlanFilter
      ? (requestedPlanFilter as PlanFilter)
      : defaultState.planFilter,
    producerLevel: hasProducerLevel ? requestedProducerLevel : defaultState.producerLevel,
  }
}

export function syncUrlFilterState(
  state: UrlFilterState,
  defaultState: UrlFilterState,
): void {
  if (typeof window === 'undefined') {
    return
  }

  const url = new URL(window.location.href)
  const params = new URLSearchParams()

  if (state.eventId !== defaultState.eventId) {
    params.set('event', state.eventId)
  }

  if (state.planFilter !== defaultState.planFilter) {
    params.set('plan', state.planFilter)
  }

  if (state.producerLevel !== defaultState.producerLevel) {
    params.set('plv', String(state.producerLevel))
  }

  if (state.activeCardId && state.activeCardId !== defaultState.activeCardId) {
    params.set('card', state.activeCardId)
  }

  const nextSearch = params.toString()
  const nextUrl = `${url.pathname}${nextSearch.length > 0 ? `?${nextSearch}` : ''}${url.hash}`
  window.history.replaceState({}, '', nextUrl)
}
