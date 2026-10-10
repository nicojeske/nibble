import { describe, expect, it } from 'vitest'
import { eatenAt, entries, groupByDay, parseGrams, totalEaten } from './calc'
import type { Item } from './types'

const day1 = new Date(2026, 9, 9, 20).getTime()
const day2 = new Date(2026, 9, 10, 20).getTime()

const chips: Item = {
  id: 'a',
  name: 'Chips',
  createdAt: day1,
  weighs: [
    { id: 'w0', at: day1, grams: 200, logged: false },
    { id: 'w1', at: day1 + 1000, grams: 150, logged: true },
    { id: 'w2', at: day2, grams: 120, logged: false },
    { id: 'w3', at: day2 + 1000, grams: 8, logged: false },
  ],
}

describe('calc', () => {
  it('computes eaten per weigh', () => {
    expect([0, 1, 2, 3].map((i) => eatenAt(chips, i))).toEqual([0, 50, 30, 112])
    expect(totalEaten(chips)).toBe(192)
  })

  it('groups entries by day, newest first', () => {
    const days = groupByDay(entries([chips]))
    expect(days.map((d) => [d.key, d.total])).toEqual([
      ['2026-10-10', 142],
      ['2026-10-09', 50],
    ])
  })

  it('parses grams with comma or dot', () => {
    expect(parseGrams('12,5')).toBe(12.5)
    expect(parseGrams(' 80 ')).toBe(80)
    expect(parseGrams('')).toBeNull()
    expect(parseGrams('-3')).toBeNull()
    expect(parseGrams('abc')).toBeNull()
  })

  it('avoids float noise', () => {
    const item: Item = { ...chips, weighs: [chips.weighs[0], { ...chips.weighs[1], grams: 199.9 }] }
    expect(eatenAt(item, 1)).toBe(0.1)
  })
})
