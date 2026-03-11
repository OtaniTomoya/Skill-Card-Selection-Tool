import { mkdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { normalizeName } from '../src/lib/card-tags'
import type { Card, CardCustomizationSpec, EventSnapshot, SyncMetadata } from '../src/types'
import { EVENT_BLUEPRINTS } from './lib/event-blueprints'
import {
  CUSTOMIZATION_TABLE_URL,
  extractUnlockLevelFromUnlockText,
  extractSeesaaCardRarities,
  extractSeesaaCustomizationSpecs,
  extractWikiCustomizationSpecs,
  extractGame8SkillCards,
  inferUnlockSourceFromUnlockText,
  extractUnlockText,
  inferIsUniqueFromUnlockText,
  SEESAA_SKILL_LIST_URL,
  SKILL_LIST_URL,
} from './lib/parsers'

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'src', 'data')
const CARD_IMAGE_DIR = path.join(ROOT, 'public', 'assets', 'cards')

function getImageExtension(imageUrl: string): string {
  const match = imageUrl.match(/\.(png|webp|jpg|jpeg)/i)
  return match?.[1]?.toLowerCase() ?? 'png'
}

async function fetchText(url: string, encoding = 'utf-8'): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'gakumasu-sync/1.0',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return new TextDecoder(encoding).decode(arrayBuffer)
}

async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true })
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

async function downloadImage(url: string, destination: string): Promise<boolean> {
  try {
    await stat(destination)
    return false
  } catch {
    // file does not exist
  }

  const response = await fetch(url, {
    headers: {
      'user-agent': 'gakumasu-sync/1.0',
    },
  })
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  await writeFile(destination, Buffer.from(arrayBuffer))
  return true
}

async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items]
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (queue.length > 0) {
      const next = queue.shift()
      if (!next) {
        return
      }
      await worker(next)
    }
  })

  await Promise.all(runners)
}

async function main() {
  await ensureDir(DATA_DIR)
  await ensureDir(CARD_IMAGE_DIR)

  const skillListHtml = await fetchText(SKILL_LIST_URL)
  const customizationHtml = await fetchText(CUSTOMIZATION_TABLE_URL)
  const seesaaSkillListHtml = await fetchText(SEESAA_SKILL_LIST_URL, 'euc-jp')
  const parsedCards = extractGame8SkillCards(skillListHtml)
  const seesaaCardRarityIndex = new Map(
    extractSeesaaCardRarities(seesaaSkillListHtml).map((card) => [
      normalizeName(card.name),
      card.rarity,
    ]),
  )

  await mapWithConcurrency(parsedCards, 8, async (card) => {
    if (card.sourceUrl === SKILL_LIST_URL) {
      card.isUnique = false
      card.isMemoryEligible = true
      card.unlockLevel = undefined
      card.unlockSource = 'unknown'
      return
    }

    try {
      const detailHtml = await fetchText(card.sourceUrl)
      const unlockText = extractUnlockText(detailHtml, card.name)
      const unlockSource = inferUnlockSourceFromUnlockText(unlockText)
      card.unlockLevel = extractUnlockLevelFromUnlockText(unlockText)
      card.unlockSource = unlockSource
      card.isUnique = inferIsUniqueFromUnlockText(unlockText)
      card.isMemoryEligible =
        unlockSource !== 'idol-unique'
        && unlockSource !== 'support-event'
        && unlockSource !== 'random-default'
    } catch {
      card.isUnique = false
      card.isMemoryEligible = true
      card.unlockLevel = undefined
      card.unlockSource = 'unknown'
    }
  })

  const cards: Card[] = parsedCards.map((card) => {
    const extension = getImageExtension(card.imageUrl)
    const rarity = seesaaCardRarityIndex.get(normalizeName(card.name)) ?? card.rarity

    return {
      effectText: card.effectText,
      id: card.id,
      imageSet: {
        defaultImagePath: `assets/cards/${card.id}.${extension}`,
        idolVariants: [],
      },
      isMemoryEligible: card.isMemoryEligible ?? !card.isUnique,
      isUnique: card.isUnique ?? false,
      name: card.name,
      plan: card.plan,
      rarity,
      sourceUrl: card.sourceUrl,
      tags: card.tags,
      unlockLevel: card.unlockLevel,
      unlockSource: card.unlockSource ?? 'unknown',
    }
  })

  const cardNameIndex = new Map(cards.map((card) => [normalizeName(card.name), card.id]))
  const events: EventSnapshot[] = EVENT_BLUEPRINTS.map((blueprint) => {
    const boostedCardIds = blueprint.boostedCardNames
      .map((name) => cardNameIndex.get(normalizeName(name)))
      .filter((cardId): cardId is string => Boolean(cardId))

    const featuredCardIds = blueprint.featuredCardNames
      .map((name) => cardNameIndex.get(normalizeName(name)))
      .filter((cardId): cardId is string => Boolean(cardId))

    return {
      boostedCardIds,
      eventId: blueprint.eventId,
      featuredCardIds,
      label: blueprint.label,
      mainPlan: blueprint.mainPlan,
      notes: blueprint.notes,
      period: blueprint.period,
      sourceUrls: blueprint.sourceUrls,
      status: blueprint.status,
      subPlan: blueprint.subPlan,
    }
  })

  const customizationSourceSpecs = new Map([
    ...extractWikiCustomizationSpecs(customizationHtml).map((spec) => [normalizeName(spec.name), spec]),
  ])
  for (const spec of extractSeesaaCustomizationSpecs(seesaaSkillListHtml)) {
    customizationSourceSpecs.set(normalizeName(spec.name), spec)
  }

  const customizationSpecs: CardCustomizationSpec[] = [...customizationSourceSpecs.values()]
    .map((spec) => {
      const cardId = cardNameIndex.get(normalizeName(spec.name))
      if (!cardId) {
        return null
      }

      return {
        cardId,
        maxSelections: spec.maxSelections,
        slots: spec.slots,
      }
    })
    .filter((spec): spec is CardCustomizationSpec => Boolean(spec))

  let downloadedImages = 0
  await mapWithConcurrency(parsedCards, 6, async (card) => {
    const extension = getImageExtension(card.imageUrl)
    const destination = path.join(CARD_IMAGE_DIR, `${card.id}.${extension}`)
    const didDownload = await downloadImage(card.imageUrl, destination)
    if (didDownload) {
      downloadedImages += 1
    }
  })

  const metadata: SyncMetadata = {
    downloadedImages,
    syncedAt: new Date().toISOString(),
    totalCards: cards.filter((card) => card.isMemoryEligible).length,
    totalEvents: events.length,
  }

  await writeJson(path.join(DATA_DIR, 'cards.json'), cards)
  await writeJson(path.join(DATA_DIR, 'customizations.json'), customizationSpecs)
  await writeJson(path.join(DATA_DIR, 'events.json'), events)
  await writeJson(path.join(DATA_DIR, 'metadata.json'), metadata)
  console.log(
    JSON.stringify(
      {
        cards: cards.length,
        customizationSpecs: customizationSpecs.length,
        downloadedImages,
        events: events.length,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
