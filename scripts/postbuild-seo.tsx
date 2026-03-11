import { execSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import React from 'react'
import sharp from 'sharp'
import { renderToString } from 'react-dom/server'

import { AppShell } from '../src/AppShell'
import cardsData from '../src/data/cards.json'
import eventsData from '../src/data/events.json'
import metadataData from '../src/data/metadata.json'
import {
  DEFAULT_GITHUB_OWNER,
  DEFAULT_REPO_NAME,
  FAQ_ITEMS,
  PLAN_LABELS,
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_LOCALE,
  SITE_NAME,
  SITE_SHORT_NAME,
  SITE_TITLE,
  buildSiteUrl,
  formatDateForSitemap,
  formatSyncedAtForDisplay,
  getCardPagePath,
  getCardsIndexPath,
  getEventPagePath,
  getEventsIndexPath,
  getEventStatusLabel,
  getLiveEvent,
  getMemoryEligibleCards,
  getSiteOrigin,
  normalizeBasePath,
} from '../src/lib/site'
import type {
  Card,
  EventSnapshot,
  SyncMetadata,
} from '../src/types'

const ROOT_DIR = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const DIST_DIR = path.join(ROOT_DIR, 'dist')
const PUBLIC_DIR = path.join(ROOT_DIR, 'public')

const cards = cardsData as Card[]
const events = eventsData as EventSnapshot[]
const metadata = metadataData as SyncMetadata

const STATIC_PAGE_CSS = `
  :root {
    background:
      radial-gradient(circle at top, rgba(233, 126, 62, 0.2), transparent 28%),
      linear-gradient(180deg, #f7f0e0 0%, #efe5d1 100%);
    color: #14261c;
    font-family: 'Hiragino Sans', 'Yu Gothic', 'BIZ UDPGothic', sans-serif;
    line-height: 1.6;
  }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; }
  a { color: #0e6f61; }
  img { display: block; max-width: 100%; }
  .page-shell {
    margin: 0 auto;
    max-width: 1180px;
    padding: 32px 20px 64px;
  }
  .page-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 18px;
  }
  .page-nav a,
  .page-action,
  .chip-link {
    background: rgba(255, 255, 255, 0.74);
    border: 1px solid rgba(93, 67, 35, 0.14);
    border-radius: 999px;
    display: inline-flex;
    padding: 8px 14px;
    text-decoration: none;
  }
  .page-hero,
  .page-card {
    backdrop-filter: blur(12px);
    background:
      linear-gradient(180deg, rgba(255, 253, 247, 0.92), rgba(248, 241, 228, 0.9)),
      #fff8eb;
    border: 1px solid rgba(93, 67, 35, 0.12);
    border-radius: 28px;
    box-shadow: 0 24px 60px rgba(73, 51, 23, 0.12);
    margin-bottom: 18px;
  }
  .page-hero {
    display: grid;
    gap: 18px;
    padding: 28px;
  }
  .page-hero--split {
    grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  }
  .page-eyebrow {
    color: #9b5421;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    margin: 0 0 10px;
    text-transform: uppercase;
  }
  .page-hero h1,
  .page-card h2,
  .page-card h3 {
    font-family: 'Hiragino Mincho ProN', 'Yu Mincho', serif;
    margin: 0;
  }
  .page-hero h1 {
    font-size: clamp(2rem, 4vw, 3.6rem);
    line-height: 1.08;
    margin-bottom: 10px;
  }
  .page-hero p,
  .page-card p,
  .page-card li,
  .page-card dd {
    margin: 0;
  }
  .page-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 16px;
  }
  .page-action {
    background: #14261c;
    border-color: #14261c;
    color: #fff8eb;
  }
  .page-summary {
    color: #4b6558;
    max-width: 68ch;
  }
  .page-stats,
  .chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .page-stats span,
  .chip-list span,
  .chip-list a {
    background: rgba(20, 38, 28, 0.08);
    border-radius: 999px;
    display: inline-flex;
    padding: 7px 12px;
    text-decoration: none;
  }
  .page-card {
    display: grid;
    gap: 16px;
    padding: 22px;
  }
  .page-grid {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .page-grid--three {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .page-card--soft {
    background: rgba(255, 255, 255, 0.58);
    border: 1px solid rgba(93, 67, 35, 0.12);
    border-radius: 22px;
    display: grid;
    gap: 12px;
    padding: 18px;
  }
  .page-meta {
    display: grid;
    gap: 10px;
  }
  .page-meta div {
    display: grid;
    gap: 4px;
  }
  .page-meta dt {
    color: #705331;
    font-size: 0.92rem;
    font-weight: 700;
  }
  .page-meta dd { margin: 0; }
  .page-list,
  .page-links {
    display: grid;
    gap: 10px;
    margin: 0;
    padding-left: 1.15rem;
  }
  .page-links {
    padding-left: 0;
  }
  .page-links li {
    background: rgba(255, 255, 255, 0.56);
    border: 1px solid rgba(93, 67, 35, 0.12);
    border-radius: 18px;
    list-style: none;
    padding: 14px 16px;
  }
  .page-links strong {
    display: block;
    margin-bottom: 6px;
  }
  .page-links small {
    color: #705331;
    display: block;
  }
  .page-image {
    background: rgba(255, 255, 255, 0.52);
    border-radius: 22px;
    overflow: hidden;
    padding: 14px;
  }
  .page-image img {
    border-radius: 18px;
    width: 100%;
  }
  .page-footer {
    color: #705331;
    font-size: 0.92rem;
    margin-top: 10px;
  }
  @media (max-width: 900px) {
    .page-hero--split,
    .page-grid,
    .page-grid--three {
      grid-template-columns: 1fr;
    }
  }
`

interface SiteConfig {
  basePath: string
  origin: string
  owner: string
  repo: string
}

interface RenderDocumentOptions {
  body: string
  canonicalUrl: string
  description: string
  jsonLd: unknown[]
  ogImageUrl: string
  pathWithinSite: string
  title: string
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function toJsonLdScript(value: unknown): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c')
}

function parseRepositoryInfo(remote: string): { owner: string; repo: string } | null {
  const match = remote.match(/github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?$/i)

  if (!match) {
    return null
  }

  return {
    owner: match[1],
    repo: match[2],
  }
}

function getSiteConfig(): SiteConfig {
  const repositoryFromEnv = process.env.GITHUB_REPOSITORY
  const repositoryFromGit = (() => {
    try {
      return execSync('git config --get remote.origin.url', {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim()
    } catch {
      return ''
    }
  })()

  const parsedFromEnv = repositoryFromEnv
    ? parseRepositoryInfo(`https://github.com/${repositoryFromEnv}.git`)
    : null
  const parsedFromGit = repositoryFromGit ? parseRepositoryInfo(repositoryFromGit) : null
  const repositoryInfo = parsedFromEnv ?? parsedFromGit ?? {
    owner: DEFAULT_GITHUB_OWNER,
    repo: DEFAULT_REPO_NAME,
  }
  const basePath = normalizeBasePath(
    process.env.BASE_PATH
      ?? (
        repositoryInfo.repo.toLowerCase() === `${repositoryInfo.owner.toLowerCase()}.github.io`
          ? '/'
          : `/${repositoryInfo.repo}/`
      ),
  )

  return {
    basePath,
    origin: process.env.SITE_ORIGIN ?? getSiteOrigin(repositoryInfo.owner),
    owner: repositoryInfo.owner,
    repo: repositoryInfo.repo,
  }
}

function buildInternalPath(basePath: string, pathname: string = ''): string {
  const normalizedBasePath = normalizeBasePath(basePath)
  const trimmedPathname = pathname.replace(/^\/+/, '')
  return trimmedPathname.length > 0 ? `${normalizedBasePath}${trimmedPathname}` : normalizedBasePath
}

function getCardSummary(card: Card): string {
  return `${card.name} は ${PLAN_LABELS[card.plan]} / ${card.rarity} のスキルカードです。${card.isMemoryEligible ? 'メモリー候補に含まれます。' : 'メモリー候補外のカードです。'}`
}

function getHomeStructuredData(homeUrl: string, ogImageUrl: string): unknown[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      description: SITE_DESCRIPTION,
      inLanguage: 'ja-JP',
      name: SITE_NAME,
      url: homeUrl,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      applicationCategory: 'UtilitiesApplication',
      creator: {
        '@type': 'Person',
        name: SITE_AUTHOR,
      },
      dateModified: metadata.syncedAt,
      description: SITE_DESCRIPTION,
      image: ogImageUrl,
      inLanguage: 'ja-JP',
      isAccessibleForFree: true,
      keywords: SITE_KEYWORDS.join(', '),
      name: SITE_NAME,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'JPY',
      },
      operatingSystem: 'Any',
      url: homeUrl,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
        name: item.question,
      })),
    },
  ]
}

function getBreadcrumbJsonLd(
  homeUrl: string,
  crumbs: Array<{ name: string; url: string }>,
): unknown {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      item: crumb.url,
      name: crumb.name,
      position: index + 1,
    })),
  }
}

function renderDocument({
  body,
  canonicalUrl,
  description,
  jsonLd,
  ogImageUrl,
  pathWithinSite,
  title,
}: RenderDocumentOptions, site: SiteConfig, stylesheetHref: string | null): string {
  const iconSvgPath = buildInternalPath(site.basePath, 'favicon.svg')
  const iconPngPath = buildInternalPath(site.basePath, 'favicon-48.png')
  const appleTouchIconPath = buildInternalPath(site.basePath, 'apple-touch-icon.png')
  const manifestPath = buildInternalPath(site.basePath, 'site.webmanifest')
  const pageUrl = buildSiteUrl(site.origin, site.basePath, pathWithinSite)
  const stylesheetTag = stylesheetHref
    ? `<link rel="stylesheet" crossorigin href="${escapeHtml(stylesheetHref)}" />`
    : ''

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="keywords" content="${escapeHtml(SITE_KEYWORDS.join(','))}" />
    <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" />
    <meta name="googlebot" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" />
    <meta name="theme-color" content="#fff8eb" />
    <meta name="google-site-verification" content="RQjISHlabmTwIPPufoBHniorADp5HOEYUQ_VmzA3U0M" />
    <meta property="og:locale" content="${SITE_LOCALE}" />
    <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(pageUrl)}" />
    <meta property="og:image" content="${escapeHtml(ogImageUrl)}" />
    <meta property="og:image:alt" content="${escapeHtml(SITE_SHORT_NAME)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <link rel="alternate" hreflang="ja-JP" href="${escapeHtml(canonicalUrl)}" />
    <link rel="icon" sizes="48x48" type="image/png" href="${escapeHtml(iconPngPath)}" />
    <link rel="icon" type="image/svg+xml" href="${escapeHtml(iconSvgPath)}" />
    <link rel="apple-touch-icon" href="${escapeHtml(appleTouchIconPath)}" />
    <link rel="manifest" href="${escapeHtml(manifestPath)}" />
    <title>${escapeHtml(title)}</title>
    ${stylesheetTag}
    <style>${STATIC_PAGE_CSS}</style>
    <script type="application/ld+json">${toJsonLdScript(jsonLd)}</script>
  </head>
  <body>
    ${body}
  </body>
</html>`
}

function renderHomeHead(site: SiteConfig, ogImageUrl: string): string {
  const homeUrl = buildSiteUrl(site.origin, site.basePath)
  const jsonLd = getHomeStructuredData(homeUrl, ogImageUrl)

  return [
    `<link rel="canonical" href="${escapeHtml(homeUrl)}" />`,
    `<link rel="alternate" hreflang="ja-JP" href="${escapeHtml(homeUrl)}" />`,
    `<meta property="og:locale" content="${SITE_LOCALE}" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(SITE_TITLE)}" />`,
    `<meta property="og:description" content="${escapeHtml(SITE_DESCRIPTION)}" />`,
    `<meta property="og:url" content="${escapeHtml(homeUrl)}" />`,
    `<meta property="og:image" content="${escapeHtml(ogImageUrl)}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(SITE_SHORT_NAME)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(SITE_TITLE)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(SITE_DESCRIPTION)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />`,
    `<script type="application/ld+json">${toJsonLdScript(jsonLd)}</script>`,
  ].join('\n    ')
}

function renderBasePageShell(
  site: SiteConfig,
  options: {
    actions?: string
    eyebrow: string
    footer?: string
    heroExtra?: string
    lead: string
    title: string
  },
  sections: string[],
): string {
  const homePath = buildInternalPath(site.basePath)
  const cardsPath = buildInternalPath(site.basePath, getCardsIndexPath())
  const eventsPath = buildInternalPath(site.basePath, getEventsIndexPath())
  const footer = options.footer
    ?? `最終同期: ${escapeHtml(formatSyncedAtForDisplay(metadata.syncedAt))}`

  return `<main class="page-shell">
    <nav aria-label="主要ページ" class="page-nav">
      <a href="${escapeHtml(homePath)}">ツールTOP</a>
      <a href="${escapeHtml(cardsPath)}">カード一覧</a>
      <a href="${escapeHtml(eventsPath)}">開催回一覧</a>
      <a href="${escapeHtml(`${homePath}#tool`)}">検索ツールを開く</a>
    </nav>
    <section class="page-hero${options.heroExtra ? ' page-hero--split' : ''}">
      ${options.heroExtra ? options.heroExtra : ''}
      <div>
        <p class="page-eyebrow">${escapeHtml(options.eyebrow)}</p>
        <h1>${escapeHtml(options.title)}</h1>
        <p class="page-summary">${escapeHtml(options.lead)}</p>
        ${options.actions ? `<div class="page-actions">${options.actions}</div>` : ''}
      </div>
    </section>
    ${sections.join('\n')}
    <p class="page-footer">${footer}</p>
  </main>`
}

function renderCardPage(card: Card, site: SiteConfig, stylesheetHref: string | null): string {
  const homeUrl = buildSiteUrl(site.origin, site.basePath)
  const pagePath = getCardPagePath(card.id)
  const pageUrl = buildSiteUrl(site.origin, site.basePath, pagePath)
  const ogImageUrl = buildSiteUrl(site.origin, site.basePath, card.imageSet.defaultImagePath)
  const relatedEvents = events.filter((event) =>
    event.featuredCardIds.includes(card.id) || event.boostedCardIds.includes(card.id),
  )
  const title = `${card.name} | 学マス スキルカード効果・メモリー候補`
  const description = `${card.name} の効果、プラン、レアリティ、タグ、メモリー候補可否を確認できる学マス向け個別ページです。`
  const breadcrumb = getBreadcrumbJsonLd(homeUrl, [
    { name: 'ホーム', url: homeUrl },
    { name: 'カード一覧', url: buildSiteUrl(site.origin, site.basePath, getCardsIndexPath()) },
    { name: card.name, url: pageUrl },
  ])
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      about: SITE_NAME,
      dateModified: metadata.syncedAt,
      description,
      image: ogImageUrl,
      inLanguage: 'ja-JP',
      name: title,
      url: pageUrl,
    },
    breadcrumb,
  ]
  const toolLink = `${buildInternalPath(site.basePath)}?card=${encodeURIComponent(card.id)}`
  const actions = [
    `<a class="page-action" href="${escapeHtml(toolLink)}">このカードをツールで開く</a>`,
    `<a class="chip-link" href="${escapeHtml(card.sourceUrl)}" rel="noreferrer" target="_blank">元データ</a>`,
  ].join('')
  const imageSection = `<div class="page-image"><img alt="${escapeHtml(`${card.name}のカード画像`)}" loading="eager" src="${escapeHtml(buildInternalPath(site.basePath, card.imageSet.defaultImagePath))}" /></div>`
  const detailSection = `<section class="page-card">
      <h2>カード詳細</h2>
      <div class="page-grid">
        <div class="page-card--soft">
          <h3>基本情報</h3>
          <dl class="page-meta">
            <div><dt>カード名</dt><dd>${escapeHtml(card.name)}</dd></div>
            <div><dt>プラン</dt><dd>${escapeHtml(PLAN_LABELS[card.plan])}</dd></div>
            <div><dt>レアリティ</dt><dd>${escapeHtml(card.rarity)}</dd></div>
            <div><dt>メモリー候補</dt><dd>${card.isMemoryEligible ? '対象' : '対象外'}</dd></div>
            <div><dt>解放条件</dt><dd>${card.unlockLevel ? `PLv ${card.unlockLevel}` : 'データ依存'}</dd></div>
          </dl>
        </div>
        <div class="page-card--soft">
          <h3>タグ</h3>
          <div class="chip-list">
            ${card.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
          </div>
          <h3>概要</h3>
          <p>${escapeHtml(getCardSummary(card))}</p>
        </div>
      </div>
    </section>`
  const effectSection = `<section class="page-card">
      <h2>効果</h2>
      <ol class="page-list">
        ${card.effectText.split('\n').map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
      </ol>
    </section>`
  const eventSection = relatedEvents.length > 0
    ? `<section class="page-card">
        <h2>このカードが関係する開催回</h2>
        <ul class="page-links">
          ${relatedEvents.map((event) => `
            <li>
              <strong><a href="${escapeHtml(buildInternalPath(site.basePath, getEventPagePath(event.eventId)))}">${escapeHtml(event.label)}</a></strong>
              <small>${escapeHtml(event.period)} / ${escapeHtml(getEventStatusLabel(event.status))}</small>
            </li>
          `).join('')}
        </ul>
      </section>`
    : ''
  const body = renderBasePageShell(
    site,
    {
      actions,
      eyebrow: 'Skill Card',
      heroExtra: imageSection,
      lead: description,
      title: card.name,
    },
    [detailSection, effectSection, eventSection].filter(Boolean),
  )

  return renderDocument({
    body,
    canonicalUrl: pageUrl,
    description,
    jsonLd,
    ogImageUrl,
    pathWithinSite: pagePath,
    title,
  }, site, stylesheetHref)
}

function renderEventPage(event: EventSnapshot, site: SiteConfig, stylesheetHref: string | null): string {
  const homeUrl = buildSiteUrl(site.origin, site.basePath)
  const pagePath = getEventPagePath(event.eventId)
  const pageUrl = buildSiteUrl(site.origin, site.basePath, pagePath)
  const featuredCards = event.featuredCardIds
    .map((cardId) => cards.find((card) => card.id === cardId) ?? null)
    .filter((card): card is Card => card !== null)
  const boostedCards = event.boostedCardIds
    .map((cardId) => cards.find((card) => card.id === cardId) ?? null)
    .filter((card): card is Card => card !== null)
  const lead = `${event.period} に開催された「あさり先生のプロデュースゼミ」${event.label} の確認ページです。`
  const title = `${event.label} | 学マス あさり先生のプロデュースゼミ開催回`
  const description = `${event.label} の開催期間、メインプラン、特別出現カード、選出率上昇カードをまとめた開催回ページです。`
  const ogCard = featuredCards[0] ?? boostedCards[0] ?? getMemoryEligibleCards(cards)[0]
  const ogImageUrl = ogCard
    ? buildSiteUrl(site.origin, site.basePath, ogCard.imageSet.defaultImagePath)
    : buildSiteUrl(site.origin, site.basePath, 'og-default.png')
  const breadcrumb = getBreadcrumbJsonLd(homeUrl, [
    { name: 'ホーム', url: homeUrl },
    { name: '開催回一覧', url: buildSiteUrl(site.origin, site.basePath, getEventsIndexPath()) },
    { name: event.label, url: pageUrl },
  ])
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      dateModified: metadata.syncedAt,
      description,
      image: ogImageUrl,
      inLanguage: 'ja-JP',
      name: title,
      url: pageUrl,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: featuredCards.map((card, index) => ({
        '@type': 'ListItem',
        name: card.name,
        position: index + 1,
        url: buildSiteUrl(site.origin, site.basePath, getCardPagePath(card.id)),
      })),
    },
    breadcrumb,
  ]
  const actions = [
    `<a class="page-action" href="${escapeHtml(`${buildInternalPath(site.basePath)}?event=${encodeURIComponent(event.eventId)}`)}">この開催回をツールで開く</a>`,
    ...event.sourceUrls.map((sourceUrl) => (
      `<a class="chip-link" href="${escapeHtml(sourceUrl)}" rel="noreferrer" target="_blank">出典</a>`
    )),
  ].join('')
  const overviewSection = `<section class="page-card">
      <h2>開催概要</h2>
      <div class="page-grid">
        <div class="page-card--soft">
          <dl class="page-meta">
            <div><dt>開催期間</dt><dd>${escapeHtml(event.period)}</dd></div>
            <div><dt>状態</dt><dd>${escapeHtml(getEventStatusLabel(event.status))}</dd></div>
            <div><dt>メインプラン</dt><dd>${escapeHtml(PLAN_LABELS[event.mainPlan])}</dd></div>
            <div><dt>サブプラン</dt><dd>${escapeHtml(PLAN_LABELS[event.subPlan])}</dd></div>
          </dl>
        </div>
        <div class="page-card--soft">
          <h3>補足</h3>
          <p>${escapeHtml(event.notes ?? '公開情報ベースで開催回データを整理しています。')}</p>
        </div>
      </div>
    </section>`
  const featuredSection = featuredCards.length > 0
    ? `<section class="page-card">
        <h2>特別出現カード</h2>
        <ul class="page-links">
          ${featuredCards.map((card) => `
            <li>
              <strong><a href="${escapeHtml(buildInternalPath(site.basePath, getCardPagePath(card.id)))}">${escapeHtml(card.name)}</a></strong>
              <small>${escapeHtml(PLAN_LABELS[card.plan])} / ${escapeHtml(card.rarity)}</small>
            </li>
          `).join('')}
        </ul>
      </section>`
    : ''
  const boostedSection = boostedCards.length > 0
    ? `<section class="page-card">
        <h2>選出率上昇カード</h2>
        <ul class="page-links">
          ${boostedCards.map((card) => `
            <li>
              <strong><a href="${escapeHtml(buildInternalPath(site.basePath, getCardPagePath(card.id)))}">${escapeHtml(card.name)}</a></strong>
              <small>${escapeHtml(PLAN_LABELS[card.plan])} / ${escapeHtml(card.rarity)}</small>
            </li>
          `).join('')}
        </ul>
      </section>`
    : ''
  const body = renderBasePageShell(
    site,
    {
      actions,
      eyebrow: 'Event',
      lead,
      title: event.label,
    },
    [overviewSection, featuredSection, boostedSection].filter(Boolean),
  )

  return renderDocument({
    body,
    canonicalUrl: pageUrl,
    description,
    jsonLd,
    ogImageUrl,
    pathWithinSite: pagePath,
    title,
  }, site, stylesheetHref)
}

function renderCardsIndexPage(site: SiteConfig, stylesheetHref: string | null): string {
  const pagePath = getCardsIndexPath()
  const pageUrl = buildSiteUrl(site.origin, site.basePath, pagePath)
  const homeUrl = buildSiteUrl(site.origin, site.basePath)
  const groupedCards = new Map<string, Card[]>()

  cards.forEach((card) => {
    const group = groupedCards.get(card.plan) ?? []
    group.push(card)
    groupedCards.set(card.plan, group)
  })

  const groupsHtml = Array.from(groupedCards.entries()).map(([planKey, planCards]) => `
    <section class="page-card">
      <h2>${escapeHtml(PLAN_LABELS[planKey as keyof typeof PLAN_LABELS])}</h2>
      <ul class="page-links">
        ${planCards.map((card) => `
          <li>
            <strong><a href="${escapeHtml(buildInternalPath(site.basePath, getCardPagePath(card.id)))}">${escapeHtml(card.name)}</a></strong>
            <small>${escapeHtml(card.rarity)} / ${card.isMemoryEligible ? 'メモリー候補' : '候補外'}</small>
          </li>
        `).join('')}
      </ul>
    </section>
  `)
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      dateModified: metadata.syncedAt,
      description: '学マスのスキルカード個別ページ一覧です。',
      inLanguage: 'ja-JP',
      name: '学マス スキルカード一覧',
      url: pageUrl,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: cards.map((card, index) => ({
        '@type': 'ListItem',
        name: card.name,
        position: index + 1,
        url: buildSiteUrl(site.origin, site.basePath, getCardPagePath(card.id)),
      })),
    },
    getBreadcrumbJsonLd(homeUrl, [
      { name: 'ホーム', url: homeUrl },
      { name: 'カード一覧', url: pageUrl },
    ]),
  ]
  const body = renderBasePageShell(
    site,
    {
      actions: `<a class="page-action" href="${escapeHtml(`${buildInternalPath(site.basePath)}#tool`)}">検索ツールを開く</a>`,
      eyebrow: 'Cards',
      lead: '学マスのスキルカード個別ページをプラン別にまとめています。',
      title: 'スキルカード一覧',
    },
    groupsHtml,
  )

  return renderDocument({
    body,
    canonicalUrl: pageUrl,
    description: '学マスのスキルカード個別ページ一覧です。',
    jsonLd,
    ogImageUrl: buildSiteUrl(site.origin, site.basePath, 'og-default.png'),
    pathWithinSite: pagePath,
    title: '学マス スキルカード一覧 | メモリー厳選ツール',
  }, site, stylesheetHref)
}

function renderEventsIndexPage(site: SiteConfig, stylesheetHref: string | null): string {
  const pagePath = getEventsIndexPath()
  const pageUrl = buildSiteUrl(site.origin, site.basePath, pagePath)
  const homeUrl = buildSiteUrl(site.origin, site.basePath)
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      dateModified: metadata.syncedAt,
      description: 'あさり先生のプロデュースゼミ開催回ページ一覧です。',
      inLanguage: 'ja-JP',
      name: '学マス 開催回一覧',
      url: pageUrl,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: events.map((event, index) => ({
        '@type': 'ListItem',
        name: event.label,
        position: index + 1,
        url: buildSiteUrl(site.origin, site.basePath, getEventPagePath(event.eventId)),
      })),
    },
    getBreadcrumbJsonLd(homeUrl, [
      { name: 'ホーム', url: homeUrl },
      { name: '開催回一覧', url: pageUrl },
    ]),
  ]
  const eventsSection = `<section class="page-card">
      <h2>開催回一覧</h2>
      <ul class="page-links">
        ${events.map((event) => `
          <li>
            <strong><a href="${escapeHtml(buildInternalPath(site.basePath, getEventPagePath(event.eventId)))}">${escapeHtml(event.label)}</a></strong>
            <small>${escapeHtml(event.period)} / ${escapeHtml(getEventStatusLabel(event.status))}</small>
          </li>
        `).join('')}
      </ul>
    </section>`
  const body = renderBasePageShell(
    site,
    {
      actions: `<a class="page-action" href="${escapeHtml(`${buildInternalPath(site.basePath)}#tool`)}">検索ツールを開く</a>`,
      eyebrow: 'Events',
      lead: 'あさり先生のプロデュースゼミ開催回ページを時系列でまとめています。',
      title: '開催回一覧',
    },
    [eventsSection],
  )

  return renderDocument({
    body,
    canonicalUrl: pageUrl,
    description: 'あさり先生のプロデュースゼミ開催回ページ一覧です。',
    jsonLd,
    ogImageUrl: buildSiteUrl(site.origin, site.basePath, 'og-default.png'),
    pathWithinSite: pagePath,
    title: '学マス 開催回一覧 | メモリー厳選ツール',
  }, site, stylesheetHref)
}

async function writePage(filePath: string, html: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, html, 'utf8')
}

async function renderRasterAssets(site: SiteConfig): Promise<void> {
  const faviconSvg = await readFile(path.join(PUBLIC_DIR, 'favicon.svg'))
  const ogDefaultSvg = await readFile(path.join(PUBLIC_DIR, 'og-default.svg'))
  const rasterOutputs = [
    { fileName: 'favicon-48.png', height: 48, width: 48 },
    { fileName: 'apple-touch-icon.png', height: 180, width: 180 },
    { fileName: 'icon-192.png', height: 192, width: 192 },
    { fileName: 'icon-512.png', height: 512, width: 512 },
  ]

  await Promise.all(rasterOutputs.map(async (output) => {
    const targetPath = path.join(DIST_DIR, output.fileName)
    await sharp(faviconSvg)
      .resize(output.width, output.height)
      .png()
      .toFile(targetPath)
  }))

  await sharp(ogDefaultSvg)
    .resize(1200, 630)
    .png()
    .toFile(path.join(DIST_DIR, 'og-default.png'))

  const manifestPath = path.join(DIST_DIR, 'site.webmanifest')
  const manifest = {
    background_color: '#f7f0e0',
    description: SITE_DESCRIPTION,
    display: 'standalone',
    icons: [
      {
        src: buildInternalPath(site.basePath, 'icon-192.png'),
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: buildInternalPath(site.basePath, 'icon-512.png'),
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    name: SITE_NAME,
    scope: site.basePath,
    short_name: SITE_SHORT_NAME,
    start_url: site.basePath,
    theme_color: '#fff8eb',
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
}

async function writeSitemap(site: SiteConfig): Promise<void> {
  const urlEntries = [
    buildSiteUrl(site.origin, site.basePath),
    buildSiteUrl(site.origin, site.basePath, getCardsIndexPath()),
    buildSiteUrl(site.origin, site.basePath, getEventsIndexPath()),
    ...cards.map((card) => buildSiteUrl(site.origin, site.basePath, getCardPagePath(card.id))),
    ...events.map((event) => buildSiteUrl(site.origin, site.basePath, getEventPagePath(event.eventId))),
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.map((url) => `  <url>
    <loc>${escapeHtml(url)}</loc>
    <lastmod>${formatDateForSitemap(metadata.syncedAt)}</lastmod>
  </url>`).join('\n')}
</urlset>
`

  await writeFile(path.join(DIST_DIR, 'sitemap.xml'), sitemap, 'utf8')
}

async function writeRobots(site: SiteConfig): Promise<void> {
  const robots = `User-agent: *
Allow: /

Sitemap: ${buildSiteUrl(site.origin, site.basePath, 'sitemap.xml')}
`

  await writeFile(path.join(DIST_DIR, 'robots.txt'), robots, 'utf8')
}

async function main(): Promise<void> {
  const site = getSiteConfig()
  process.env.BASE_PATH = site.basePath

  await renderRasterAssets(site)

  const indexPath = path.join(DIST_DIR, 'index.html')
  const originalIndex = await readFile(indexPath, 'utf8')
  const stylesheetHref = originalIndex.match(/<link rel="stylesheet"[^>]+href="([^"]+)"/)?.[1] ?? null
  const ogImageUrl = buildSiteUrl(site.origin, site.basePath, 'og-default.png')
  const prerenderedApp = renderToString(<AppShell />)
  const updatedIndex = originalIndex
    .replace('<!-- SEO_HEAD -->', renderHomeHead(site, ogImageUrl))
    .replace('<div id="root"></div>', `<div id="root">${prerenderedApp}</div>`)

  await writeFile(indexPath, updatedIndex, 'utf8')
  await writeFile(path.join(DIST_DIR, '404.html'), updatedIndex, 'utf8')

  await writePage(
    path.join(DIST_DIR, 'cards', 'index.html'),
    renderCardsIndexPage(site, stylesheetHref),
  )
  await writePage(
    path.join(DIST_DIR, 'events', 'index.html'),
    renderEventsIndexPage(site, stylesheetHref),
  )

  await Promise.all(cards.map((card) => (
    writePage(
      path.join(DIST_DIR, 'cards', card.id, 'index.html'),
      renderCardPage(card, site, stylesheetHref),
    )
  )))

  await Promise.all(events.map((event) => (
    writePage(
      path.join(DIST_DIR, 'events', event.eventId, 'index.html'),
      renderEventPage(event, site, stylesheetHref),
    )
  )))

  await writeSitemap(site)
  await writeRobots(site)

  const liveEvent = getLiveEvent(events)
  console.log(
    `SEO assets generated for ${site.origin}${site.basePath} (${cards.length} cards, ${events.length} events${liveEvent ? `, live: ${liveEvent.label}` : ''}).`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
