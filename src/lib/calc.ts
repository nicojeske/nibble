import type { Entry, Item } from './types'

/** Grams eaten at weighs[index] (since the previous weigh). 0 for the starting weight. */
export function eatenAt(item: Item, index: number): number {
  if (index <= 0) return 0
  return round(item.weighs[index - 1].grams - item.weighs[index].grams)
}

export function lastWeight(item: Item): number {
  return item.weighs[item.weighs.length - 1].grams
}

export function totalEaten(item: Item): number {
  return round(item.weighs[0].grams - lastWeight(item))
}

/** All non-starting weighs across items, newest first. */
export function entries(items: Item[]): Entry[] {
  const out: Entry[] = []
  for (const item of items) {
    item.weighs.forEach((weigh, i) => {
      if (i > 0) out.push({ item, weigh, eaten: eatenAt(item, i) })
    })
  }
  return out.sort((a, b) => b.weigh.at - a.weigh.at)
}

export interface Day {
  key: string
  total: number
  entries: Entry[]
}

export function groupByDay(list: Entry[]): Day[] {
  const days = new Map<string, Day>()
  for (const e of list) {
    const key = dayKey(e.weigh.at)
    let day = days.get(key)
    if (!day) days.set(key, (day = { key, total: 0, entries: [] }))
    day.entries.push(e)
    day.total = round(day.total + e.eaten)
  }
  return [...days.values()]
}

export function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function parseGrams(input: string): number | null {
  const n = Number(input.trim().replace(',', '.'))
  return input.trim() !== '' && Number.isFinite(n) && n >= 0 ? round(n) : null
}

export function round(n: number): number {
  return Math.round(n * 10) / 10
}
