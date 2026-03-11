import type { KeyboardEvent } from 'react'

import { withBasePath } from '../lib/assets'
import { hasCustomizationMark } from '../lib/memory-selections'
import type {
  Card,
  MemorySelection,
} from '../types'

interface MemoryCandidateTileProps {
  card: Card
  detailLabel: string
  isActive: boolean
  memorySelection: MemorySelection | null
  onOpen: (cardId: string) => void
}

export function MemoryCandidateTile({
  card,
  detailLabel,
  isActive,
  memorySelection,
  onOpen,
}: MemoryCandidateTileProps) {
  const memoryState = memorySelection?.state ?? 'base'
  const isEnhanced = memoryState === 'upgraded' || memoryState === 'customized'
  const isCustomized = hasCustomizationMark(memorySelection)

  function handleOpen() {
    onOpen(card.id)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    handleOpen()
  }

  return (
    <article
      aria-label={`${detailLabel}を詳細表示`}
      className={`card-tile memory-candidate-tile${isActive ? ' is-active' : ''}`}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div
        className={`card-tile__preview memory-candidate-tile__preview${isEnhanced ? ' is-enhanced' : ''}${isCustomized ? ' is-customized' : ''}`}
      >
        <img
          alt={`${card.name}のカード画像`}
          className="card-tile__image"
          loading="lazy"
          src={withBasePath(card.imageSet.defaultImagePath)}
        />
        {isEnhanced ? (
          <span aria-hidden="true" className="memory-candidate-tile__gem-rail">
            <span />
            <span />
            <span />
          </span>
        ) : null}
        {isEnhanced ? (
          <span aria-hidden="true" className="memory-candidate-tile__state-mark memory-candidate-tile__state-mark--plus">
            +
          </span>
        ) : null}
        {isCustomized ? (
          <span aria-hidden="true" className="memory-candidate-tile__state-mark memory-candidate-tile__state-mark--custom">
            改
          </span>
        ) : null}
      </div>
      <div className="card-tile__body">
        <h3 className="card-tile__name">{card.name}</h3>
        <span aria-hidden="true" className="card-tile__toggle">
          {isActive ? '表示中' : '詳細'}
        </span>
      </div>
    </article>
  )
}
