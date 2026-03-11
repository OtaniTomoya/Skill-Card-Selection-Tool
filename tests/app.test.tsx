import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { AppShell } from '../src/App'
import type {
  Card,
  CardCustomizationSpec,
  EventSnapshot,
  SyncMetadata,
} from '../src/types'

const metadata: SyncMetadata = {
  downloadedImages: 0,
  syncedAt: '2026-03-11T00:00:00.000Z',
  totalCards: 3,
  totalEvents: 2,
}

const cards: Card[] = [
  {
    effectText: '好調+4\n強化後\n好調+7',
    id: 'sense-1',
    imageSet: { defaultImagePath: 'assets/cards/sense-1.png', idolVariants: [] },
    isMemoryEligible: true,
    isUnique: false,
    name: 'シュプレヒコール',
    plan: 'sense',
    rarity: 'SSR',
    sourceUrl: 'https://example.com/1',
    tags: ['好調', '指針'],
    unlockLevel: 30,
    unlockSource: 'produce-level',
  },
  {
    effectText: '全力値+3',
    id: 'anomaly-r',
    imageSet: { defaultImagePath: 'assets/cards/anomaly-r.png', idolVariants: [] },
    isMemoryEligible: true,
    isUnique: false,
    name: '勢い任せ',
    plan: 'anomaly',
    rarity: 'R',
    sourceUrl: 'https://example.com/2',
    tags: ['全力'],
    unlockLevel: undefined,
    unlockSource: 'unknown',
  },
  {
    effectText: 'やる気+4',
    id: 'logic-r',
    imageSet: { defaultImagePath: 'assets/cards/logic-r.png', idolVariants: [] },
    isMemoryEligible: true,
    isUnique: false,
    name: '勇気の一歩',
    plan: 'logic',
    rarity: 'R',
    sourceUrl: 'https://example.com/3',
    tags: ['やる気'],
    unlockLevel: undefined,
    unlockSource: 'unknown',
  },
]

const customizations: CardCustomizationSpec[] = [
  {
    cardId: 'sense-1',
    maxSelections: 1,
    slots: [
      {
        label: 'コスト',
        slotKey: 'A',
        tiers: [
          { label: '集中消費1', tierKey: '1' },
          { label: '集中消費2', tierKey: '2' },
          { label: '集中消費3', tierKey: '3' },
        ],
      },
      {
        label: '効果',
        slotKey: 'B',
        tiers: [{ label: '手札をすべてレッスン中強化', tierKey: '1' }],
      },
    ],
  },
  {
    cardId: 'anomaly-r',
    maxSelections: 3,
    slots: [
      {
        label: 'バフ',
        slotKey: 'A',
        tiers: [
          { label: '好調4', tierKey: '1' },
          { label: '好調5', tierKey: '2' },
          { label: '好調7', tierKey: '3' },
        ],
      },
      {
        label: 'コスト',
        slotKey: 'B',
        tiers: [{ label: '1', tierKey: '1' }],
      },
      {
        label: '元気',
        slotKey: 'C',
        tiers: [{ label: '9', tierKey: '1' }],
      },
    ],
  },
]

const events: EventSnapshot[] = [
  {
    boostedCardIds: ['sense-1'],
    eventId: 'event-a',
    featuredCardIds: [],
    label: '第5回',
    mainPlan: 'anomaly',
    period: '2026年3月',
    sourceUrls: ['https://example.com/event-a'],
    status: 'live',
    subPlan: 'sense',
  },
  {
    boostedCardIds: [],
    eventId: 'event-b',
    featuredCardIds: [],
    label: '第4回',
    mainPlan: 'logic',
    period: '2026年2月',
    sourceUrls: ['https://example.com/event-b'],
    status: 'archived',
    subPlan: 'sense',
  },
]

describe('AppShell', () => {
  it('toggles selections when any part of the card tile is clicked', async () => {
    const user = userEvent.setup()

    const { container } = render(<AppShell cards={cards} events={events} metadata={metadata} />)
    const catalogPanel = container.querySelector('.catalog-panel')
    const resultPanel = container.querySelector('.result-panel')

    expect(catalogPanel).not.toBeNull()
    expect(resultPanel).not.toBeNull()
    if (!catalogPanel || !resultPanel) {
      return
    }

    await user.click(within(catalogPanel).getByText('シュプレヒコール'))
    expect(within(resultPanel).queryByText('選択済みカード')).not.toBeInTheDocument()
    expect(within(resultPanel).queryByText('R枠候補')).not.toBeInTheDocument()
    expect(
      within(resultPanel).getByRole('button', { name: 'シュプレヒコール (未強化)を詳細表示' }),
    ).toBeInTheDocument()
    expect(
      within(resultPanel).getByRole('button', { name: '勢い任せを詳細表示' }),
    ).toBeInTheDocument()

    await user.click(within(catalogPanel).getByText('シュプレヒコール'))
    expect(
      within(resultPanel).queryByRole('button', { name: 'シュプレヒコール (未強化)を詳細表示' }),
    ).not.toBeInTheDocument()
    expect(
      within(resultPanel).getByRole('button', { name: '勢い任せを詳細表示' }),
    ).toBeInTheDocument()
  })

  it('shows selected cards and clears invalid selections when the event changes', async () => {
    const user = userEvent.setup()

    const { container } = render(<AppShell cards={cards} events={events} metadata={metadata} />)
    const resultPanel = container.querySelector('.result-panel')

    expect(resultPanel).not.toBeNull()
    if (!resultPanel) {
      return
    }

    await user.click(screen.getByRole('button', { name: 'シュプレヒコールを候補に追加' }))
    expect(
      within(resultPanel).getByRole('button', { name: 'シュプレヒコール (未強化)を詳細表示' }),
    ).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('開催回'), 'event-b')

    expect(
      within(resultPanel).queryByRole('button', { name: 'シュプレヒコール (未強化)を詳細表示' }),
    ).not.toBeInTheDocument()
    expect(
      within(resultPanel).getByRole('button', { name: '勇気の一歩を詳細表示' }),
    ).toBeInTheDocument()
  })

  it('does not render idol-unique cards in the selectable list', () => {
    render(
      <AppShell
        cards={[
          ...cards,
          {
            ...cards[0],
            id: 'unique-1',
            isMemoryEligible: false,
            isUnique: true,
            name: '受け取ってくれる？',
            unlockSource: 'idol-unique',
          },
        ]}
        events={events}
        metadata={{ ...metadata, totalCards: 4 }}
      />,
    )

    expect(screen.queryByText('受け取ってくれる？')).not.toBeInTheDocument()
  })

  it('does not render support-card-derived cards in the selectable list', () => {
    render(
      <AppShell
        cards={[
          ...cards,
          {
            ...cards[0],
            id: 'support-1',
            isMemoryEligible: false,
            isUnique: false,
            name: '雨宿りのバス停',
            unlockSource: 'support-event',
          },
        ]}
        events={events}
        metadata={{ ...metadata, totalCards: 4 }}
      />,
    )

    expect(screen.queryByText('雨宿りのバス停')).not.toBeInTheDocument()
  })

  it('does not render starter deck cards in the selectable list', () => {
    render(
      <AppShell
        cards={[
          ...cards,
          {
            ...cards[1],
            id: 'starter-1',
            isMemoryEligible: true,
            isUnique: false,
            name: 'メントレの基本',
            rarity: 'N',
            unlockSource: 'unknown',
          },
        ]}
        events={events}
        metadata={{ ...metadata, totalCards: 4 }}
      />,
    )

    expect(screen.queryByText('メントレの基本')).not.toBeInTheDocument()
  })

  it('shows random-default R cards in the catalog and lets them move into the selected section', async () => {
    const user = userEvent.setup()
    const randomDefaultRCard: Card = {
      ...cards[1],
      id: 'starter-r',
      isMemoryEligible: false,
      name: 'スターライト',
      sourceUrl: 'https://example.com/starlight',
      unlockSource: 'random-default',
    }

    const { container } = render(
      <AppShell
        cards={[...cards, randomDefaultRCard]}
        events={events}
        metadata={{ ...metadata, totalCards: 4 }}
      />,
    )
    const catalogPanel = container.querySelector('.catalog-panel')
    const resultPanel = container.querySelector('.result-panel')

    expect(catalogPanel).not.toBeNull()
    expect(resultPanel).not.toBeNull()
    if (!catalogPanel || !resultPanel) {
      return
    }

    expect(within(catalogPanel).getByText('スターライト')).toBeInTheDocument()
    expect(
      within(resultPanel).getByRole('button', { name: 'スターライトを詳細表示' }),
    ).toBeInTheDocument()

    await user.click(within(catalogPanel).getByText('スターライト'))

    expect(within(resultPanel).getByText('選択したスキルカード')).toBeInTheDocument()
    expect(
      within(resultPanel).getByRole('button', { name: 'スターライト (未強化)を詳細表示' }),
    ).toBeInTheDocument()
  })

  it('filters cards by PLv and clears selections that are no longer unlocked', async () => {
    const user = userEvent.setup()

    const { container } = render(<AppShell cards={cards} events={events} metadata={metadata} />)
    const producerLevelSelect = container.querySelector('select[aria-label="PLv"]')
    const resultPanel = container.querySelector('.result-panel')

    expect(resultPanel).not.toBeNull()
    if (!resultPanel) {
      return
    }
    await user.click(screen.getByRole('button', { name: 'シュプレヒコールを候補に追加' }))
    expect(
      within(resultPanel).getByRole('button', { name: 'シュプレヒコール (未強化)を詳細表示' }),
    ).toBeInTheDocument()

    expect(producerLevelSelect).not.toBeNull()
    if (!producerLevelSelect) {
      return
    }

    await user.selectOptions(producerLevelSelect, '29')

    expect(within(container).queryByText('シュプレヒコール')).not.toBeInTheDocument()
    expect(
      within(resultPanel).queryByRole('button', { name: 'シュプレヒコール (未強化)を詳細表示' }),
    ).not.toBeInTheDocument()
    expect(
      within(resultPanel).getByRole('button', { name: '勢い任せを詳細表示' }),
    ).toBeInTheDocument()
  })

  it('opens filter settings on demand and filters the catalog by plan', async () => {
    const user = userEvent.setup()

    const { container } = render(<AppShell cards={cards} events={events} metadata={metadata} />)
    const catalogPanel = container.querySelector('.catalog-panel')

    expect(within(container).queryByRole('radio', { name: 'センス' })).not.toBeInTheDocument()
    expect(catalogPanel).not.toBeNull()
    if (!catalogPanel) {
      return
    }

    await user.click(within(container).getByRole('button', { name: '絞り込みを管理' }))
    await user.click(within(container).getByRole('radio', { name: 'アノマリー' }))

    expect(within(catalogPanel).getByText('勢い任せ')).toBeInTheDocument()
    expect(within(catalogPanel).queryByText('シュプレヒコール')).not.toBeInTheDocument()
  })

  it('switches skill cards between old and new variants', async () => {
    const user = userEvent.setup()

    const switchCards: Card[] = [
      {
        effectText: '好調+2',
        id: 'sense-old',
        imageSet: { defaultImagePath: 'assets/cards/sense-old.png', idolVariants: [] },
        isMemoryEligible: true,
        isUnique: false,
        name: 'バランス感覚',
        plan: 'sense',
        rarity: 'R',
        sourceUrl: 'https://example.com/sense-old',
        tags: ['好調'],
        unlockLevel: undefined,
        unlockSource: 'unknown',
      },
      {
        effectText: '好調+3',
        id: 'sense-new',
        imageSet: { defaultImagePath: 'assets/cards/sense-new.png', idolVariants: [] },
        isMemoryEligible: true,
        isUnique: false,
        name: '軌道修正',
        plan: 'sense',
        rarity: 'R',
        sourceUrl: 'https://example.com/sense-new',
        tags: ['好調'],
        unlockLevel: 51,
        unlockSource: 'produce-level',
      },
    ]
    const switchEvents: EventSnapshot[] = [
      {
        boostedCardIds: [],
        eventId: 'switch-event',
        featuredCardIds: [],
        label: '第6回',
        mainPlan: 'sense',
        period: '2026年4月',
        sourceUrls: ['https://example.com/switch-event'],
        status: 'live',
        subPlan: 'logic',
      },
    ]

    const { container } = render(
      <AppShell
        cards={switchCards}
        events={switchEvents}
        metadata={{ ...metadata, totalCards: 2, totalEvents: 1 }}
      />,
    )
    const catalogPanel = container.querySelector('.catalog-panel')

    expect(catalogPanel).not.toBeNull()
    if (!catalogPanel) {
      return
    }

    expect(within(catalogPanel).queryByText('バランス感覚')).not.toBeInTheDocument()
    expect(within(catalogPanel).getByText('軌道修正')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '切り替え設定を開く' }))
    await user.click(
      within(
        screen.getByRole('group', {
          name: 'バランス感覚 と 軌道修正 の切り替え',
        }),
      ).getByRole('button', { name: '旧カード' }),
    )

    expect(within(catalogPanel).getByText('バランス感覚')).toBeInTheDocument()
    expect(within(catalogPanel).queryByText('軌道修正')).not.toBeInTheDocument()

    await user.click(
      within(
        screen.getByRole('group', {
          name: 'バランス感覚 と 軌道修正 の切り替え',
        }),
      ).getByRole('button', { name: '新カード' }),
    )

    expect(within(catalogPanel).queryByText('バランス感覚')).not.toBeInTheDocument()
    expect(within(catalogPanel).getByText('軌道修正')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '新カードに戻す' }))

    expect(within(catalogPanel).queryByText('バランス感覚')).not.toBeInTheDocument()
    expect(within(catalogPanel).getByText('軌道修正')).toBeInTheDocument()
  })

  it('lets selected memories switch between base and upgraded states', async () => {
    const user = userEvent.setup()

    const { container } = render(
      <AppShell
        cards={cards}
        customizations={customizations}
        events={events}
        metadata={metadata}
      />,
    )
    const resultPanel = container.querySelector('.result-panel')

    expect(resultPanel).not.toBeNull()
    if (!resultPanel) {
      return
    }
    await user.click(screen.getByRole('button', { name: 'シュプレヒコールを候補に追加' }))

    expect(screen.getByText('好調+4')).toBeInTheDocument()
    expect(
      within(resultPanel).getByRole('button', { name: 'シュプレヒコール (未強化)を詳細表示' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '強化済み' }))

    expect(screen.getByText('好調+7')).toBeInTheDocument()
    expect(
      within(resultPanel).getByRole('button', { name: 'シュプレヒコール (強化済み)を詳細表示' }),
    ).toBeInTheDocument()
    expect(
      within(resultPanel)
        .getByRole('button', { name: 'シュプレヒコール (強化済み)を詳細表示' })
        .querySelector('.memory-candidate-tile__state-mark--plus'),
    ).not.toBeNull()
  })

  it('enforces customization limits by the total tier count and cycles to the next valid state', async () => {
    const user = userEvent.setup()

    const { container } = render(
      <AppShell
        cards={cards}
        customizations={customizations}
        events={events}
        metadata={metadata}
      />,
    )
    const resultPanel = container.querySelector('.result-panel')

    expect(resultPanel).not.toBeNull()
    if (!resultPanel) {
      return
    }
    await user.click(screen.getByRole('button', { name: '勢い任せを候補に追加' }))
    await user.click(screen.getByRole('button', { name: 'カスタマイズ済み' }))
    await user.click(screen.getByRole('button', { name: '好調0回' }))
    await user.click(screen.getByRole('button', { name: '好調1回' }))

    expect(screen.getAllByText('好調2回')).toHaveLength(2)
    expect(screen.getByText('カスタマイズ選択 2/3')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '使用コスト0回' }))

    expect(screen.getAllByText('使用コスト1回')).toHaveLength(2)
    expect(
      within(resultPanel).getByRole('button', {
        name: '勢い任せ (カスタマイズ済み（好調2回 / 使用コスト1回）)を詳細表示',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('カスタマイズ選択 3/3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '元気0回' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '好調2回' }))

    expect(
      within(resultPanel).getByRole('button', {
        name: '勢い任せ (カスタマイズ済み（使用コスト1回）)を詳細表示',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('カスタマイズ選択 1/3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '元気0回' })).toBeEnabled()
  })

  it('disables customized state when customization data is unavailable', async () => {
    const user = userEvent.setup()

    render(
      <AppShell
        cards={cards}
        customizations={[]}
        events={events}
        metadata={metadata}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'シュプレヒコールを候補に追加' }))

    expect(screen.getByRole('button', { name: 'カスタマイズ済み' })).toBeDisabled()
  })

  it('shows candidate details in the result-side detail panel when a candidate is clicked', async () => {
    const user = userEvent.setup()

    const { container } = render(<AppShell cards={cards} events={events} metadata={metadata} />)
    const resultWorkspace = container.querySelector('.result-workspace')

    expect(resultWorkspace).not.toBeNull()
    if (!resultWorkspace) {
      return
    }

    expect(resultWorkspace.classList.contains('result-workspace--with-detail')).toBe(false)
    expect(resultWorkspace.querySelector('.detail-panel')).toBeNull()
    expect(
      within(resultWorkspace).queryByText('取得候補をクリックすると、右側に詳細を表示します。'),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '勢い任せを詳細表示' }))

    const resultDetailPanel = resultWorkspace.querySelector('.detail-panel')

    expect(resultWorkspace.classList.contains('result-workspace--with-detail')).toBe(true)
    expect(resultDetailPanel).not.toBeNull()
    if (!resultDetailPanel) {
      return
    }

    expect(within(resultDetailPanel).getByText('勢い任せ')).toBeInTheDocument()
    expect(within(resultDetailPanel).getByText('全力値+3')).toBeInTheDocument()
  })

  it('renders the initial legend calculator and updates evaluation targets', async () => {
    const user = userEvent.setup()

    render(<AppShell cards={cards} events={events} metadata={metadata} />)

    expect(screen.getByRole('heading', { name: '初レジェンド評価値計算機' })).toBeInTheDocument()
    expect(screen.getByLabelText('現在の評価値')).toHaveTextContent('0')
    expect(screen.getByLabelText('SSSに必要な最終試験スコア')).toHaveTextContent('-')
    expect(screen.getByLabelText('SSS+に必要な最終試験スコア')).toHaveTextContent('-')
    expect(screen.getByLabelText('S4に必要な最終試験スコア')).toHaveTextContent('-')

    await user.type(screen.getByLabelText('最終試験前 Vocal'), '1800')
    await user.type(screen.getByLabelText('最終試験前 Dance'), '1800')
    await user.type(screen.getByLabelText('最終試験前 Visual'), '1800')
    await user.type(screen.getByLabelText('試験終了時アビ点数 Vocal'), '100')
    await user.type(screen.getByLabelText('試験終了時アビ点数 Dance'), '100')
    await user.type(screen.getByLabelText('試験終了時アビ点数 Visual'), '100')
    await user.type(screen.getByLabelText('中間試験スコア'), '30000')
    await user.type(screen.getByLabelText('最終試験スコア'), '250000')
    await user.selectOptions(screen.getByLabelText('最終試験順位'), '1')

    expect(screen.getByLabelText('現在の評価値')).toHaveTextContent('20,576')
    expect(screen.getByLabelText('現在ランク')).toHaveTextContent('SSS')
    expect(screen.getByLabelText('SSSに必要な最終試験スコア')).toHaveTextContent('211,600 pt')
    expect(screen.getByLabelText('SSS+に必要な最終試験スコア')).toHaveTextContent('467,400 pt')
    expect(screen.getByLabelText('S4に必要な最終試験スコア')).toHaveTextContent('不可能')
  })

  it('renders upgrade and customization markers on candidate images', async () => {
    const user = userEvent.setup()

    const { container } = render(
      <AppShell
        cards={cards}
        customizations={customizations}
        events={events}
        metadata={metadata}
      />,
    )
    const resultPanel = container.querySelector('.result-panel')

    expect(resultPanel).not.toBeNull()
    if (!resultPanel) {
      return
    }

    await user.click(screen.getByRole('button', { name: 'シュプレヒコールを候補に追加' }))
    await user.click(screen.getByRole('button', { name: '強化済み' }))

    const upgradedCandidate = within(resultPanel).getByRole('button', {
      name: 'シュプレヒコール (強化済み)を詳細表示',
    })

    expect(
      upgradedCandidate.querySelector('.memory-candidate-tile__state-mark--plus'),
    ).not.toBeNull()

    await user.click(screen.getByRole('button', { name: '勢い任せを候補に追加' }))
    await user.click(screen.getByRole('button', { name: 'カスタマイズ済み' }))

    const customizedCandidate = within(resultPanel).getByRole('button', {
      name: '勢い任せ (カスタマイズ済み（未選択）)を詳細表示',
    })

    expect(
      customizedCandidate.querySelector('.memory-candidate-tile__state-mark--custom'),
    ).not.toBeNull()
  })

  it('renders detail text without the card image or the 指針 tag badge', () => {
    render(<AppShell cards={cards} events={events} metadata={metadata} />)

    expect(screen.queryByAltText(/詳細画像/)).not.toBeInTheDocument()
    expect(screen.queryByText('指針')).not.toBeInTheDocument()
  })
})
