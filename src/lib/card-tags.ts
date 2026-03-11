const TAG_KEYWORDS = [
  '好調',
  '絶好調',
  '集中',
  '好印象',
  'やる気',
  '強気',
  '全力',
  '温存',
  '開幕時',
  '開始時',
  'スコア',
  '元気',
  '体力回復',
  '保留',
  '指針',
]

export const TAG_GROUPS = {
  sense: ['好調', '絶好調', '集中'],
  logic: ['好印象', 'やる気'],
  anomaly: ['強気', '全力', '温存'],
} as const

export function deriveTags(effectText: string): string[] {
  const tags = new Set<string>()

  for (const keyword of TAG_KEYWORDS) {
    if (effectText.includes(keyword)) {
      tags.add(keyword)
    }
  }

  return [...tags]
}

export function normalizeName(value: string): string {
  return value
    .replace(/\s+/g, '')
    .replace(/[！!]/g, '！')
    .replace(/[＆&]/g, '＆')
    .replace(/[♪♫]/g, '')
    .trim()
}
