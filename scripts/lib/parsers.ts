import { createHash } from 'node:crypto'

import { deriveTags, normalizeName } from '../../src/lib/card-tags'
import type {
  CardRarity,
  CardUnlockSource,
  CustomizationSlot,
  Plan,
} from '../../src/types'

export const SKILL_LIST_URL = 'https://game8.jp/gakuen-idolmaster/609737'
export const CUSTOMIZATION_TABLE_URL =
  'https://wikiwiki.jp/gakumas/%E3%82%AB%E3%82%B9%E3%82%BF%E3%83%9E%E3%82%A4%E3%82%BA%E6%97%A9%E8%A6%8B%E8%A1%A8'
export const SEESAA_SKILL_LIST_URL =
  'https://seesaawiki.jp/gakumasu/d/%A5%B9%A5%AD%A5%EB%A5%AB%A1%BC%A5%C9%B0%EC%CD%F7'

interface ParsedCard {
  effectText: string
  id: string
  imageUrl: string
  isUnique?: boolean
  isMemoryEligible?: boolean
  name: string
  plan: Plan
  rarity: CardRarity
  sourceUrl: string
  tags: string[]
  unlockLevel?: number
  unlockSource?: CardUnlockSource
}

export interface ParsedCustomizationSpec {
  maxSelections: number
  name: string
  slots: CustomizationSlot[]
}

export interface ParsedSeesaaCardRarity {
  name: string
  rarity: CardRarity
}

function decodeHtml(html: string): string {
  return html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
}

function stripTags(html: string): string {
  return decodeHtml(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<hr[^>]*>/gi, '\n')
      .replace(/<\/?(?:span|a|img|div|p|td|tr|table|tbody|strong)[^>]*>/gi, '')
      .replace(/<[^>]+>/g, ''),
  )
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
}

function normalizeText(html: string): string {
  return stripTags(html).replace(/\s+/g, ' ').trim()
}

function inferPlan(cell: string): Plan | null {
  const match = cell.match(/(センス|ロジック|アノマリー)の画像/)
  if (!match) {
    return null
  }

  if (match[1] === 'センス') return 'sense'
  if (match[1] === 'ロジック') return 'logic'
  return 'anomaly'
}

function inferRarity(cell: string): CardRarity | null {
  const match = cell.match(/(SSR|SR|R|N)の画像/)
  return (match?.[1] as CardRarity | undefined) ?? null
}

function extractImageUrl(cell: string): string | null {
  const match = cell.match(/data-src="([^"]+)"/)
  return match?.[1] ?? null
}

function createCardId(name: string, sourceUrl: string): string {
  const pageId = sourceUrl.match(/\/(\d+)$/)?.[1]
  if (pageId) {
    return `g8-${pageId}`
  }

  const digest = createHash('sha1').update(name).digest('hex').slice(0, 10)
  return `card-${digest}`
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractTds(rowHtml: string): string[] {
  return [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((match) => match[1])
}

function extractCells(rowHtml: string): string[] {
  return [...rowHtml.matchAll(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/g)].map((match) => match[1])
}

export function extractGame8SkillCards(html: string): ParsedCard[] {
  const rows = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)]
  const cards: ParsedCard[] = []

  for (const [, rowHtml] of rows) {
    const tds = extractTds(rowHtml)
    if (tds.length < 4) {
      continue
    }

    const plan = inferPlan(tds[2])
    const rarity = inferRarity(tds[3])
    const imageUrl = extractImageUrl(tds[0])
    if (!plan || !rarity || !imageUrl) {
      continue
    }

    const sourceUrl =
      tds[0].match(/href="([^"]+)"/)?.[1] ??
      SKILL_LIST_URL
    const name = stripTags(tds[0])
    const effectText = stripTags(tds[1])

    cards.push({
      effectText,
      id: createCardId(name, sourceUrl),
      imageUrl,
      name,
      plan,
      rarity,
      sourceUrl,
      tags: deriveTags(effectText),
    })
  }

  const unique = new Map<string, ParsedCard>()
  for (const card of cards) {
    unique.set(card.id, card)
  }

  return [...unique.values()]
}

const CUSTOMIZATION_SLOT_LAYOUTS = [
  {
    slotKey: 'A',
    slotLabelIndex: 2,
    tierIndexes: [4, 6, 8],
  },
  {
    slotKey: 'B',
    slotLabelIndex: 9,
    tierIndexes: [11, 13, 15],
  },
  {
    slotKey: 'C',
    slotLabelIndex: 16,
    tierIndexes: [18, 20, 22],
  },
] as const

const SEESAA_SLOT_KEYS = ['A', 'B', 'C'] as const

export function extractWikiCustomizationSpecs(html: string): ParsedCustomizationSpec[] {
  const specs = new Map<string, ParsedCustomizationSpec>()
  const tables = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)]

  for (const [, tableHtml] of tables) {
    const rows = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
    if (rows.length < 2) {
      continue
    }

    const headerCells = extractCells(rows[0][1]).map((cell) => normalizeText(cell))
    if (headerCells[0] !== 'スキル名' || headerCells[1] !== '強化上限') {
      continue
    }

    for (const [, rowHtml] of rows.slice(1)) {
      const cells = extractCells(rowHtml)
      if (cells.length < 2) {
        continue
      }

      const name = normalizeText(cells[0])
      const maxSelections = Number(normalizeText(cells[1]))
      if (!name || Number.isNaN(maxSelections)) {
        continue
      }

      const slots: CustomizationSlot[] = CUSTOMIZATION_SLOT_LAYOUTS.map((layout) => {
        const label = normalizeText(cells[layout.slotLabelIndex] ?? '')
        const tiers = layout.tierIndexes
          .map((index, offset) => {
            const tierLabel = stripTags(cells[index] ?? '')
            if (!tierLabel) {
              return null
            }

            return {
              label: tierLabel,
              tierKey: String(offset + 1),
            }
          })
          .filter((tier): tier is NonNullable<typeof tier> => Boolean(tier))

        if (!label || tiers.length === 0) {
          return null
        }

        return {
          label,
          slotKey: layout.slotKey,
          tiers,
        }
      }).filter((slot): slot is CustomizationSlot => Boolean(slot))

      if (slots.length === 0) {
        continue
      }

      specs.set(normalizeName(name), {
        maxSelections,
        name,
        slots,
      })
    }
  }

  return [...specs.values()]
}

function normalizeSeesaaCustomizationLabel(label: string): string {
  const normalizedLabel = label.replace(/\s+/g, '')

  if (!normalizedLabel || normalizedLabel === '--') {
    return ''
  }

  if (
    normalizedLabel === '開始時手札に入る'
    || normalizedLabel === 'レッスン開始時手札に入る'
  ) {
    return '開始時手札'
  }

  if (normalizedLabel === 'コスト値-') {
    return '使用コスト'
  }

  if (normalizedLabel === '体力消費コスト値-') {
    return '体力消費'
  }

  if (normalizedLabel === '全力値コスト値-') {
    return '全力値消費'
  }

  if (normalizedLabel.endsWith('追加')) {
    return normalizedLabel.slice(0, -2)
  }

  if (normalizedLabel.endsWith('+')) {
    return normalizedLabel.slice(0, -1)
  }

  return normalizedLabel
    .replace(/値-$/, '')
    .replace(/-$/, '')
}

export function extractSeesaaCustomizationSpecs(html: string): ParsedCustomizationSpec[] {
  const specs = new Map<string, ParsedCustomizationSpec>()
  const tables = [
    ...html.matchAll(/<table[^>]*class="[^"]*\bedit\b[^"]*"[^>]*>([\s\S]*?)<\/table>/g),
  ]

  for (const [, tableHtml] of tables) {
    const rows = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((match) => match[1])

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const cells = extractCells(rows[rowIndex]).map((cell) => stripTags(cell))
      if (cells[5] !== 'カスタム上限') {
        continue
      }

      const name = cells[0]?.split('\n')[0] ?? ''
      const maxSelections = Number(cells[6])
      if (!name || Number.isNaN(maxSelections) || maxSelections <= 0) {
        continue
      }

      let blockEnd = rowIndex + 1
      while (blockEnd < rows.length) {
        const nextCells = extractCells(rows[blockEnd]).map((cell) => stripTags(cell))
        if (nextCells[5] === 'カスタム上限') {
          break
        }
        blockEnd += 1
      }

      const blockRows = rows
        .slice(rowIndex, blockEnd)
        .map((rowHtml) => extractCells(rowHtml).map((cell) => stripTags(cell)))
      const customizationRowIndex = blockRows.findIndex(
        (row) => row[0]?.replace(/\s+/g, '') === 'カスタム',
      )
      if (customizationRowIndex < 0) {
        continue
      }

      const slotLabels = blockRows[customizationRowIndex]
        .slice(2, -1)
        .map((label, index) => ({
          label: normalizeSeesaaCustomizationLabel(label),
          slotKey: SEESAA_SLOT_KEYS[index],
          tiers: [],
        }))

      for (let tierIndex = 0; tierIndex < maxSelections; tierIndex += 1) {
        const tierRow = blockRows[customizationRowIndex + 2 + tierIndex]
        if (!tierRow?.[0]?.includes('段階')) {
          continue
        }

        slotLabels.forEach((slot, slotIndex) => {
          const tierLabel = tierRow[2 + slotIndex * 2]
          if (!slot.label || !tierLabel || tierLabel === '--') {
            return
          }

          slot.tiers.push({
            label: tierLabel,
            tierKey: String(tierIndex + 1),
          })
        })
      }

      const slots = slotLabels.filter(
        (slot): slot is CustomizationSlot => Boolean(slot.label) && slot.tiers.length > 0,
      )
      if (slots.length === 0) {
        continue
      }

      specs.set(normalizeName(name), {
        maxSelections,
        name,
        slots,
      })
    }
  }

  return [...specs.values()]
}

export function extractSeesaaCardRarities(html: string): ParsedSeesaaCardRarity[] {
  const rarities = new Map<string, ParsedSeesaaCardRarity>()
  const tables = [
    ...html.matchAll(/<table[^>]*class="[^"]*\bedit\b[^"]*"[^>]*>([\s\S]*?)<\/table>/g),
  ]

  for (const [, tableHtml] of tables) {
    const rows = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((match) => match[1])

    for (const rowHtml of rows) {
      const cells = extractCells(rowHtml).map((cell) => stripTags(cell))
      if (cells[1] !== 'レア') {
        continue
      }

      const name = cells[0]?.split('\n')[0]?.trim() ?? ''
      const rarity = cells[2]?.trim() ?? ''
      if (!name || !['N', 'R', 'SR', 'SSR'].includes(rarity)) {
        continue
      }

      rarities.set(normalizeName(name), {
        name,
        rarity: rarity as CardRarity,
      })
    }
  }

  return [...rarities.values()]
}

export function extractUnlockText(html: string, cardName: string): string {
  const sectionPatterns = [
    /<h3[^>]*id="hm_2"[^>]*>[\s\S]*?<\/h3>/i,
    /<h3[^>]*>[\s\S]*?解放条件[\s\S]*?<\/h3>/i,
  ]
  const headingMatch = sectionPatterns
    .map((pattern) => pattern.exec(html))
    .find((match): match is RegExpExecArray => Boolean(match))
  if (!headingMatch) {
    return ''
  }

  const afterHeading = html.slice(headingMatch.index + headingMatch[0].length)
  const nextHeadingIndexes = ['<h2', '<h3']
    .map((pattern) => afterHeading.indexOf(pattern))
    .filter((index) => index >= 0)
  const sectionEnd =
    nextHeadingIndexes.length > 0 ? Math.min(...nextHeadingIndexes) : afterHeading.length

  const unlockText = normalizeText(
    afterHeading
      .slice(0, sectionEnd)
      .replace(/<p[^>]*>\s*の解放条件\s*<\/p>/i, ''),
  )

  return unlockText.replace(
    new RegExp(`(${escapeRegExp(cardName)})\\s+(?=[はがをにの、。])`, 'gu'),
    '$1',
  )
}

export function inferUnlockSourceFromUnlockText(unlockText: string): CardUnlockSource {
  if (/サポートカードとして編成/.test(unlockText) || /サポートイベント発生後/.test(unlockText)) {
    return 'support-event'
  }

  if (/編成するとプロデュース中に最初から使用可能/.test(unlockText)) {
    return 'idol-unique'
  }

  if (/プロデュースレベルを\d+レベルにすると入手して/.test(unlockText)) {
    return 'produce-level'
  }

  if (/プロデュース中にランダムで使えるようになります/.test(unlockText)) {
    return 'random-default'
  }

  return 'unknown'
}

export function extractUnlockLevelFromUnlockText(unlockText: string): number | undefined {
  const match = unlockText.match(/プロデュースレベルを(\d+)レベルにすると入手して/)
  return match ? Number(match[1]) : undefined
}

export function inferIsUniqueFromUnlockText(unlockText: string): boolean {
  return inferUnlockSourceFromUnlockText(unlockText) === 'idol-unique'
}
