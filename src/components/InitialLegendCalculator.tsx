import { useState } from 'react'

import {
  calculateInitialLegendEvaluation,
  type FinalExamRank,
  type InitialLegendInput,
  type TargetRankResult,
} from '../lib/initial-legend-evaluation'

const STAT_FIELDS = [
  { key: 'preVo', label: 'Vocal' },
  { key: 'preDa', label: 'Dance' },
  { key: 'preVi', label: 'Visual' },
] as const satisfies Array<{ key: keyof Pick<InitialLegendInput, 'preVo' | 'preDa' | 'preVi'>; label: string }>

const ABILITY_FIELDS = [
  { key: 'abiVo', label: 'Vocal' },
  { key: 'abiDa', label: 'Dance' },
  { key: 'abiVi', label: 'Visual' },
] as const satisfies Array<{ key: keyof Pick<InitialLegendInput, 'abiVo' | 'abiDa' | 'abiVi'>; label: string }>

const INITIAL_FORM_VALUES: Record<keyof InitialLegendInput, string> = {
  abiDa: '',
  abiVi: '',
  abiVo: '',
  finalRank: '0',
  finalScore: '',
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
    useState<Record<keyof InitialLegendInput, string>>(INITIAL_FORM_VALUES)

  const input: InitialLegendInput = {
    abiDa: toNumber(formValues.abiDa),
    abiVi: toNumber(formValues.abiVi),
    abiVo: toNumber(formValues.abiVo),
    finalRank: toNumber(formValues.finalRank) as FinalExamRank,
    finalScore: toNumber(formValues.finalScore),
    midScore: toNumber(formValues.midScore),
    preDa: toNumber(formValues.preDa),
    preVi: toNumber(formValues.preVi),
    preVo: toNumber(formValues.preVo),
  }
  const result = calculateInitialLegendEvaluation(input)

  function handleValueChange(field: keyof InitialLegendInput, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }))
  }

  return (
    <section className="legend-calculator">
      <div className="panel-header">
        <div className="legend-calculator__header">
          <h2>初レジェンド評価値計算機</h2>
          <p>初レジェ通常モード専用。現在評価値と目標評価値に必要な最終試験スコアを確認できます。</p>
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
              <p>例: ふわもこ完凸編成時、Da を 17</p>
            </div>
            <div className="legend-calculator__stat-grid">
              {ABILITY_FIELDS.map((field) => (
                <label className="legend-calculator__field" key={field.key}>
                  <span>{field.label}</span>
                  <input
                    aria-label={`試験終了時アビ点数 ${field.label}`}
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
              <h3>試験スコア</h3>
              <p>最終試験スコアを入れると現在評価値も確認できます。</p>
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
              <label className="legend-calculator__field">
                <span>最終試験スコア</span>
                <input
                  aria-label="最終試験スコア"
                  inputMode="numeric"
                  min={0}
                  onChange={(event) => handleValueChange('finalScore', event.target.value)}
                  placeholder="0"
                  type="number"
                  value={formValues.finalScore}
                />
              </label>
              <label className="legend-calculator__field legend-calculator__field--full">
                <span>最終試験順位</span>
                <select
                  aria-label="最終試験順位"
                  onChange={(event) => handleValueChange('finalRank', event.target.value)}
                  value={formValues.finalRank}
                >
                  <option value="0">不合格</option>
                  <option value="1">1位</option>
                  <option value="2">2位</option>
                  <option value="3">3位</option>
                </select>
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
