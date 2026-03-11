import { useState } from 'react'

import {
  calculateInitialLegendEvaluation,
  type InitialLegendInput,
  type TargetRankResult,
} from '../lib/initial-legend-evaluation'
import {
  calculateInitialLegendSupportTotals,
  INITIAL_LEGEND_SUPPORT_CARDS,
} from '../lib/initial-legend-supports'

const STAT_FIELDS = [
  { key: 'preVo', label: 'Vocal' },
  { key: 'preDa', label: 'Dance' },
  { key: 'preVi', label: 'Visual' },
] as const satisfies Array<{ key: keyof Pick<InitialLegendInput, 'preVo' | 'preDa' | 'preVi'>; label: string }>

const INITIAL_FORM_VALUES: Record<'midScore' | 'preDa' | 'preVi' | 'preVo', string> = {
  midScore: '',
  preDa: '',
  preVi: '',
  preVo: '',
}

function toNumber(value: string): number {
  if (value.trim() === '') {
    return 0
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function formatScoreLabel(target: TargetRankResult): string {
  if (target.status === 'unavailable') {
    return '-'
  }

  if (target.status === 'achieved') {
    return '達成済み'
  }

  if (target.status === 'impossible' || target.requiredFinalScore === null) {
    return '不可能'
  }

  return `${target.requiredFinalScore.toLocaleString('ja-JP')} pt`
}

export function InitialLegendCalculator() {
  const [formValues, setFormValues] =
    useState<Record<'midScore' | 'preDa' | 'preVi' | 'preVo', string>>(INITIAL_FORM_VALUES)
  const [isAbilityBonusEnabled, setIsAbilityBonusEnabled] = useState(false)
  const [selectedSupportIds, setSelectedSupportIds] = useState<string[]>([])
  const supportTotals = isAbilityBonusEnabled
    ? calculateInitialLegendSupportTotals(selectedSupportIds)
    : {
        abiDa: 0,
        abiVi: 0,
        abiVo: 0,
      }

  const input: InitialLegendInput = {
    abiDa: supportTotals.abiDa,
    abiVi: supportTotals.abiVi,
    abiVo: supportTotals.abiVo,
    finalRank: 1,
    finalScore: 0,
    midScore: toNumber(formValues.midScore),
    preDa: toNumber(formValues.preDa),
    preVi: toNumber(formValues.preVi),
    preVo: toNumber(formValues.preVo),
  }
  const result = calculateInitialLegendEvaluation(input)

  function handleValueChange(
    field: keyof Pick<InitialLegendInput, 'midScore' | 'preDa' | 'preVi' | 'preVo'>,
    value: string,
  ) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleSupportToggle(supportId: string) {
    setSelectedSupportIds((current) =>
      current.includes(supportId)
        ? current.filter((id) => id !== supportId)
        : [...current, supportId],
    )
  }

  return (
    <section className="legend-calculator">
      <div className="panel-header">
        <div className="legend-calculator__header">
          <h2>初レジェンド評価値計算機</h2>
          <p>初レジェ通常モード専用。最終試験順位は 1 位前提で固定しています。</p>
        </div>
      </div>

      <div className="legend-calculator__layout">
        <div className="legend-calculator__inputs">
          <section className="legend-calculator__group">
            <div className="legend-calculator__group-header">
              <h3>最終試験前パラメータ</h3>
              <p>合計 {result.preTotal.toLocaleString('ja-JP')}</p>
            </div>
            <div className="legend-calculator__stat-grid">
              {STAT_FIELDS.map((field) => (
                <label className="legend-calculator__field" key={field.key}>
                  <span>{field.label}</span>
                  <input
                    aria-label={`最終試験前 ${field.label}`}
                    inputMode="numeric"
                    max={2800}
                    min={0}
                    onChange={(event) => handleValueChange(field.key, event.target.value)}
                    placeholder="0"
                    type="number"
                    value={formValues[field.key]}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="legend-calculator__group">
            <div className="legend-calculator__group-header">
              <h3>試験終了時アビ点数</h3>
              <label className="legend-calculator__switch">
                <input
                  checked={isAbilityBonusEnabled}
                  onChange={(event) => {
                    const nextChecked = event.target.checked
                    setIsAbilityBonusEnabled(nextChecked)
                    if (!nextChecked) {
                      setSelectedSupportIds([])
                    }
                  }}
                  type="checkbox"
                />
                <span>有効化</span>
              </label>
            </div>
            <p className="legend-calculator__hint">
              OFF のときは試験順位 1 位の固定上昇だけで計算します。ON のときは完凸時のサポカ分を自動加算します。
            </p>
            {isAbilityBonusEnabled ? (
              <>
                <p aria-label="試験終了時アビ点数の合計" className="legend-calculator__support-total">
                  Vocal +{supportTotals.abiVo} / Dance +{supportTotals.abiDa} / Visual +{supportTotals.abiVi}
                </p>
                <div className="legend-calculator__support-grid">
                  {INITIAL_LEGEND_SUPPORT_CARDS.map((supportCard) => (
                    <label className="legend-calculator__support-option" key={supportCard.id}>
                      <input
                        checked={selectedSupportIds.includes(supportCard.id)}
                        onChange={() => handleSupportToggle(supportCard.id)}
                        type="checkbox"
                      />
                      <div>
                        <p>{supportCard.name}</p>
                        <span>
                          {supportCard.rarity} / {supportCard.stat.toUpperCase()} +{supportCard.bonus}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            ) : null}
          </section>

          <section className="legend-calculator__group">
            <div className="legend-calculator__group-header">
              <h3>試験スコア</h3>
            </div>
            <div className="legend-calculator__score-grid">
              <label className="legend-calculator__field">
                <span>中間試験スコア</span>
                <input
                  aria-label="中間試験スコア"
                  inputMode="numeric"
                  min={0}
                  onChange={(event) => handleValueChange('midScore', event.target.value)}
                  placeholder="0"
                  type="number"
                  value={formValues.midScore}
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="legend-calculator__results">
          <section className="legend-calculator__summary-card">
            <p className="legend-calculator__summary-label">現在の評価値</p>
            <div className="legend-calculator__summary-value">
              <span
                aria-label="現在ランク"
                className={`legend-calculator__rank-badge${result.totalEvaluation >= 20000 ? ' is-high' : ''}`}
              >
                {result.currentRank}
              </span>
              <span aria-label="現在の評価値" data-testid="legend-total-evaluation">
                {result.totalEvaluation.toLocaleString('ja-JP')}
              </span>
            </div>
          </section>

          <section className="legend-calculator__target-card">
            <div className="legend-calculator__group-header">
              <h3>目標ランク別 必要最終スコア</h3>
            </div>
            <div className="legend-calculator__targets">
              {result.targets.map((target) => (
                <div className="legend-calculator__target-row" key={target.targetRank}>
                  <span>{target.targetRank} ({target.targetEvaluation.toLocaleString('ja-JP')}pt)</span>
                  <span
                    aria-label={`${target.targetRank}に必要な最終試験スコア`}
                    data-testid={`legend-target-${target.targetRank}`}
                  >
                    {formatScoreLabel(target)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}
