import type { Card, MemoryState } from '../types'

const UPGRADE_SEPARATOR = '\n強化後\n'

export interface CardEffectTextSet {
  baseText: string
  upgradedText: string
}

export function splitCardEffectText(effectText: string): CardEffectTextSet {
  const [baseText, upgradedText, ...rest] = effectText.split(UPGRADE_SEPARATOR)
  const normalizedBaseText = baseText.trim()

  if (upgradedText === undefined) {
    return {
      baseText: normalizedBaseText,
      upgradedText: normalizedBaseText,
    }
  }

  return {
    baseText: normalizedBaseText,
    upgradedText: [upgradedText, ...rest].join(UPGRADE_SEPARATOR).trim(),
  }
}

export function getCardEffectText(card: Card, state: MemoryState): string {
  const { baseText, upgradedText } = splitCardEffectText(card.effectText)
  return state === 'base' ? baseText : upgradedText
}

export function getEffectLines(effectText: string): string[] {
  const lines = effectText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return lines.length > 0 ? lines : ['効果テキストを確認できませんでした。']
}
