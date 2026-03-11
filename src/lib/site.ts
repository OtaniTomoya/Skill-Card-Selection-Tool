import type {
  Card,
  EventSnapshot,
  EventStatus,
  Plan,
} from '../types'

export const SITE_NAME = '学マス メモリー厳選ツール'
export const SITE_SHORT_NAME = 'メモリー厳選ツール'
export const SITE_TITLE = '学マス メモリー厳選ツール | あさり先生のプロデュースゼミのスキルカード検索'
export const SITE_DESCRIPTION = '学園アイドルマスターの「あさり先生のプロデュースゼミ」で、開催回ごとの特別出現カード・選出率上昇カード・メモリー候補をまとめて確認できる静的サイトです。'
export const SITE_LOCALE = 'ja_JP'
export const SITE_AUTHOR = 'OtaniTomoya'
export const DEFAULT_GITHUB_OWNER = 'OtaniTomoya'
export const DEFAULT_REPO_NAME = 'Skill-Card-Selection-Tool'
export const SITE_KEYWORDS = [
  '学マス',
  '学園アイドルマスター',
  'メモリー厳選',
  'あさり先生のプロデュースゼミ',
  'スキルカード',
  'メモリー候補',
]
export const FAQ_ITEMS = [
  {
    answer:
      '開催回、PLv、プラン、スキルカード切り替えをもとに、欲しいメモリー候補と同時に拾えるカードを確認できます。',
    question: 'このツールで何が分かりますか？',
  },
  {
    answer:
      'Game8 のカード情報と、学マスwikiなどで確認した開催回の特別出現カード・選出率上昇カードを突き合わせています。',
    question: 'データはどこから同期していますか？',
  },
  {
    answer:
      'トップページの一覧から候補を選び、個別ページや開催回ページからもツール本体へ戻れるようにしています。',
    question: 'カード個別ページや開催回ページはありますか？',
  },
] as const

export const PLAN_LABELS: Record<Plan, string> = {
  anomaly: 'アノマリー',
  logic: 'ロジック',
  sense: 'センス',
}

const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  archived: '終了',
  inferred: '推定',
  live: '開催中',
  partial: '一部確認',
}

export function getEventStatusLabel(status: EventStatus): string {
  return EVENT_STATUS_LABELS[status]
}

export function getCardsIndexPath(): string {
  return 'cards/'
}

export function getEventsIndexPath(): string {
  return 'events/'
}

export function getCardPagePath(cardId: string): string {
  return `cards/${cardId}/`
}

export function getEventPagePath(eventId: string): string {
  return `events/${eventId}/`
}

export function getSiteOrigin(owner: string = DEFAULT_GITHUB_OWNER): string {
  return `https://${owner.toLowerCase()}.github.io`
}

export function normalizeBasePath(basePath: string): string {
  if (!basePath || basePath === '/') {
    return '/'
  }

  const withLeadingSlash = basePath.startsWith('/') ? basePath : `/${basePath}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

export function buildSiteUrl(origin: string, basePath: string, pathname: string = ''): string {
  const normalizedBasePath = normalizeBasePath(basePath)
  const normalizedPathname = pathname.replace(/^\/+/, '')
  const joinedPath = normalizedPathname.length > 0
    ? `${normalizedBasePath}${normalizedPathname}`
    : normalizedBasePath
  return new URL(joinedPath, origin).toString()
}

export function formatSyncedAtForDisplay(syncedAt: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(syncedAt))
}

export function formatDateForSitemap(date: string): string {
  return new Date(date).toISOString()
}

export function getMemoryEligibleCards(cards: Card[]): Card[] {
  return cards.filter((card) => card.isMemoryEligible)
}

export function getLiveEvent(events: EventSnapshot[]): EventSnapshot | null {
  return events.find((event) => event.status === 'live') ?? events[0] ?? null
}
