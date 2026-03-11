import { describe, expect, it } from 'vitest'

import { normalizeName } from '../src/lib/card-tags'

describe('normalizeName', () => {
  it('treats ampersand variants as the same card name', () => {
    expect(normalizeName('コール&レスポンス')).toBe(normalizeName('コール＆レスポンス'))
  })

  it('ignores musical note suffixes in card names', () => {
    expect(normalizeName('ラッキー')).toBe(normalizeName('ラッキー♪'))
  })
})
