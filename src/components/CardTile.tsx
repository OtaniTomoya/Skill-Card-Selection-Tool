import type { KeyboardEvent } from 'react'

import { withBasePath } from '../lib/assets'
import type { Card } from '../types'

interface CardTileProps {
  card: Card
  isSelected: boolean
  onOpen: (cardId: string) => void
  onToggle: (cardId: string) => void
}

export function CardTile({
  card,
  isSelected,
  onOpen,
  onToggle,
}: CardTileProps) {
  const selectionLabel = `${card.name}を${isSelected ? '候補から外す' : '候補に追加'}`

  function handleSelect() {
    onOpen(card.id)
    onToggle(card.id)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    handleSelect()
  }

  return (
    <article
      aria-label={selectionLabel}
      aria-pressed={isSelected}
      className={`card-tile${isSelected ? ' is-selected' : ''}`}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="card-tile__preview">
        <img
          alt={`${card.name}のカード画像`}
          className="card-tile__image"
          loading="lazy"
          src={withBasePath(card.imageSet.defaultImagePath)}
        />
      </div>
      <div className="card-tile__body">
        <h3 className="card-tile__name">{card.name}</h3>
        <span aria-hidden="true" className="card-tile__toggle">
          {isSelected ? '選択中' : '追加'}
        </span>
      </div>
    </article>
  )
}
