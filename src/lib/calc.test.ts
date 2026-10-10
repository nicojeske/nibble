import { describe, expect, it } from 'vitest'
import { eatenAt, entries, groupByDay, lastNDays, matches, parseGrams, todayTotal, totalEaten, unloggedCount } from './calc'
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

  describe('matches', () => {
    const item = (id: string, grams: number, extra: Partial<Item> = {}): Item => ({
      id,
      name: id,
      createdAt: day1,
      weighs: [{ id: `${id}0`, at: day1, grams, logged: true }],
      ...extra,
    })

    it('sorts by closest fit and hides items that would have got heavier', () => {
      const { fits, hidden } = matches([item('cashews', 200), item('choc', 68), item('chips', 142)], 98)
      expect(fits.map((m) => [m.item.id, m.delta])).toEqual([
        ['chips', 44],
        ['cashews', 102],
      ])
      expect(hidden.map((i) => i.id)).toEqual(['choc'])
    })

    it('keeps an exact match and skips finished items', () => {
      const { fits, hidden } = matches([item('same', 98), item('done', 150, { finishedAt: day2 })], 98)
      expect(fits.map((m) => [m.item.id, m.delta])).toEqual([['same', 0]])
      expect(hidden).toEqual([])
    })
  })

  it('totals today and counts unlogged entries', () => {
    expect(todayTotal([chips], day2 + 5000)).toBe(142)
    expect(todayTotal([chips], day2 + 864e5)).toBe(0)
    expect(unloggedCount([chips])).toBe(2)
  })

  it('fills the last n days oldest first', () => {
    const days = lastNDays([chips], 3, day2 + 5000)
    expect(days.map((d) => [d.key, d.total])).toEqual([
      ['2026-10-08', 0],
      ['2026-10-09', 50],
      ['2026-10-10', 142],
    ])
  })
})
