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

export interface Match {
  item: Item
  delta: number
}

/**
 * Open items that could weigh `grams` now, closest fit first. Items that would have
 * got heavier can't be it, so they're returned separately as `hidden`.
 */
export function matches(items: Item[], grams: number): { fits: Match[]; hidden: Item[] } {
  const fits: Match[] = []
  const hidden: Item[] = []
  for (const item of items) {
    if (item.finishedAt) continue
    const delta = round(lastWeight(item) - grams)
    if (delta >= 0) fits.push({ item, delta })
    else hidden.push(item)
  }
  fits.sort((a, b) => a.delta - b.delta)
  return { fits, hidden }
}

export function todayTotal(items: Item[], now = Date.now()): number {
  const key = dayKey(now)
  return entries(items)
    .filter((e) => dayKey(e.weigh.at) === key)
    .reduce((sum, e) => round(sum + e.eaten), 0)
}

export function unloggedCount(items: Item[]): number {
  return entries(items).filter((e) => !e.weigh.logged).length
}

/** Totals for the last `n` days including today, oldest first. Days without weighs are 0. */
export function lastNDays(items: Item[], n: number, now = Date.now()): Day[] {
  const byKey = new Map(groupByDay(entries(items)).map((d) => [d.key, d]))
  const today = new Date(now)
  const out: Day[] = []
  for (let i = n - 1; i >= 0; i--) {
    const key = dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i).getTime())
    out.push(byKey.get(key) ?? { key, total: 0, entries: [] })
  }
  return out
}
