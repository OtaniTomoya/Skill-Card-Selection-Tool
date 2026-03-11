import type { Plan, SkillSwitchMode, SkillSwitchPair } from '../types'
import { getSkillSwitchMode, isSkillSwitchUnlocked } from '../lib/skill-card-switches'

interface SkillSwitchPanelProps {
  onChangeMode: (pairId: string, mode: SkillSwitchMode) => void
  onReset: () => void
  producerLevel: number
  switchedPairIds: Set<string>
  pairs: SkillSwitchPair[]
}

const PLAN_LABELS: Record<Plan, string> = {
  anomaly: 'アノマリー',
  logic: 'ロジック',
  sense: 'センス',
}

export function SkillSwitchPanel({
  onChangeMode,
  onReset,
  producerLevel,
  switchedPairIds,
  pairs,
}: SkillSwitchPanelProps) {
  const groupedPairs = {
    sense: pairs.filter((pair) => pair.plan === 'sense'),
    logic: pairs.filter((pair) => pair.plan === 'logic'),
    anomaly: pairs.filter((pair) => pair.plan === 'anomaly'),
  } satisfies Record<Plan, SkillSwitchPair[]>

  return (
    <div className="skill-switch-panel">
      <div className="skill-switch-panel__header">
        <div>
          <span className="filter-toolbar__label">切り替え設定</span>
          <p>旧カードか新カードのどちらを出現対象にするかを指定できます。</p>
        </div>
        <button className="filter-toggle" onClick={onReset} type="button">
          新カードに戻す
        </button>
      </div>

      <div className="skill-switch-groups">
        {Object.entries(groupedPairs).map(([plan, planPairs]) => {
          if (planPairs.length === 0) {
            return null
          }

          return (
            <section className="skill-switch-group" key={plan}>
              <div className="skill-switch-group__header">
                <h3>{PLAN_LABELS[plan as Plan]}</h3>
                <p>{planPairs.length} 組</p>
              </div>

              <div className="skill-switch-grid">
                {planPairs.map((pair) => {
                  const unlocked = isSkillSwitchUnlocked(pair, producerLevel)
                  const mode = getSkillSwitchMode(pair, switchedPairIds, producerLevel)

                  return (
                    <article
                      className={`skill-switch-card${mode === 'switched' ? ' is-switched' : ''}${unlocked ? '' : ' is-locked'}`}
                      key={pair.id}
                    >
                      <div className="skill-switch-card__meta">
                        <p className="skill-switch-card__unlock">
                          PLv {pair.unlockLevel}
                          {unlocked ? ' で切り替え可能' : ` で解放`}
                        </p>
                        <p className="skill-switch-card__names">
                          <span>旧: {pair.originalCardName}</span>
                          <span>新: {pair.switchedCardName}</span>
                        </p>
                      </div>

                      <div
                        aria-label={`${pair.originalCardName} と ${pair.switchedCardName} の切り替え`}
                        className="skill-switch-card__actions"
                        role="group"
                      >
                        <button
                          aria-pressed={mode === 'original'}
                          className={mode === 'original' ? 'is-active' : ''}
                          onClick={() => onChangeMode(pair.id, 'original')}
                          type="button"
                        >
                          旧カード
                        </button>
                        <button
                          aria-pressed={mode === 'switched'}
                          className={mode === 'switched' ? 'is-active' : ''}
                          disabled={!unlocked}
                          onClick={() => onChangeMode(pair.id, 'switched')}
                          type="button"
                        >
                          新カード
                        </button>
                      </div>

                      <p className="skill-switch-card__hint">
                        {unlocked
                          ? mode === 'switched'
                            ? `${pair.switchedCardName} が出現し、${pair.originalCardName} は出現しません。`
                            : `${pair.originalCardName} が出現し、${pair.switchedCardName} は出現しません。`
                          : `PLv ${pair.unlockLevel} までは ${pair.originalCardName} のままです。`}
                      </p>
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
