import { withBasePath } from '../lib/assets'
import {
  FAQ_ITEMS,
  PLAN_LABELS,
  formatSyncedAtForDisplay,
  getCardPagePath,
  getCardsIndexPath,
  getEventPagePath,
  getEventsIndexPath,
  getEventStatusLabel,
} from '../lib/site'
import type {
  Card,
  EventSnapshot,
  SyncMetadata,
} from '../types'

interface SeoSectionsProps {
  cards: Card[]
  currentEvent: EventSnapshot | null
  events: EventSnapshot[]
  metadata: SyncMetadata
}

export function SeoSections({
  cards,
  currentEvent,
  events,
  metadata,
}: SeoSectionsProps) {
  const memoryEligibleCards = cards.filter((card) => card.isMemoryEligible)
  const liveOrLatestEvent = currentEvent ?? events[0] ?? null
  const highlightedCards = (liveOrLatestEvent
    ? liveOrLatestEvent.featuredCardIds
      .map((cardId) => memoryEligibleCards.find((card) => card.id === cardId) ?? null)
      .filter((card): card is Card => card !== null)
    : memoryEligibleCards
  ).slice(0, 6)
  const latestEvents = events.slice(0, 4)

  return (
    <>
      <section aria-labelledby="overview-title" className="seo-card seo-card--overview">
        <div className="seo-card__header">
          <div>
            <p className="eyebrow">Overview</p>
            <h2 id="overview-title">学マスのメモリー厳選と開催回検索をまとめて確認</h2>
          </div>
          <p className="seo-card__lead">
            学園アイドルマスターの「あさり先生のプロデュースゼミ」で、
            開催回ごとの特別出現カードと選出率上昇カードをもとに、
            欲しいメモリー候補と一緒に拾えるスキルカードを確認できます。
          </p>
        </div>
        <div className="seo-grid">
          <article className="seo-panel">
            <h3>このサイトでできること</h3>
            <ul className="seo-list">
              <li>開催回ごとのピックアップ条件を切り替えて、対象カードを絞り込み</li>
              <li>PLv とスキルカード切り替えを反映したうえでメモリー候補を選択</li>
              <li>同じ開催回で一緒に拾える R カード候補を一覧で確認</li>
            </ul>
          </article>
          <article className="seo-panel">
            <h3>データ更新状況</h3>
            <dl className="seo-facts">
              <div>
                <dt>最終同期</dt>
                <dd>{formatSyncedAtForDisplay(metadata.syncedAt)}</dd>
              </div>
              <div>
                <dt>掲載カード</dt>
                <dd>{metadata.totalCards} 枚</dd>
              </div>
              <div>
                <dt>開催回</dt>
                <dd>{metadata.totalEvents} 件</dd>
              </div>
              <div>
                <dt>メモリー候補</dt>
                <dd>{memoryEligibleCards.length} 枚</dd>
              </div>
            </dl>
          </article>
          <article className="seo-panel">
            <h3>データソース</h3>
            <p className="seo-panel__copy">
              カード情報は Game8、開催回情報は学マスwiki などの公開情報をもとに同期しています。
            </p>
            <ul className="seo-links">
              <li>
                <a href="https://game8.jp/gakuen-idolmaster" rel="noreferrer" target="_blank">
                  Game8 学園アイドルマスター攻略
                </a>
              </li>
              <li>
                <a href="https://seesaawiki.jp/gakumasu/" rel="noreferrer" target="_blank">
                  学マスwiki
                </a>
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section aria-labelledby="hub-title" className="seo-card">
        <div className="seo-card__header">
          <div>
            <p className="eyebrow">Directory</p>
            <h2 id="hub-title">検索しやすい関連ページ</h2>
          </div>
          <p className="seo-card__lead">
            開催回ごとのページと、カード個別ページを用意しています。
            Google から直接見つけやすいように、静的な一覧ページとして公開します。
          </p>
        </div>
        <div className="seo-grid">
          <article className="seo-panel">
            <h3>
              <a href={withBasePath(getEventsIndexPath())}>開催回一覧ページ</a>
            </h3>
            <ul className="seo-links">
              {latestEvents.map((event) => (
                <li key={event.eventId}>
                  <a href={withBasePath(getEventPagePath(event.eventId))}>
                    {event.label} ({getEventStatusLabel(event.status)})
                  </a>
                </li>
              ))}
            </ul>
          </article>
          <article className="seo-panel">
            <h3>
              <a href={withBasePath(getCardsIndexPath())}>スキルカード個別ページ</a>
            </h3>
            <ul className="seo-links">
              {highlightedCards.map((card) => (
                <li key={card.id}>
                  <a href={withBasePath(getCardPagePath(card.id))}>
                    {card.name} / {card.rarity} / {PLAN_LABELS[card.plan]}
                  </a>
                </li>
              ))}
            </ul>
          </article>
          <article className="seo-panel">
            <h3>よくある使い方</h3>
            <dl className="seo-faq">
              {FAQ_ITEMS.map((item) => (
                <div key={item.question}>
                  <dt>{item.question}</dt>
                  <dd>{item.answer}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </section>
    </>
  )
}
