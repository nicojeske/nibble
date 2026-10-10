export async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function fmtGrams(n: number): string {
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 1 })} g`
}

export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function fmtWhen(ts: number): string {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date(Date.now() - 864e5)
  if (d.toDateString() === today.toDateString()) return `today ${fmtTime(ts)}`
  if (d.toDateString() === yesterday.toDateString()) return `yesterday ${fmtTime(ts)}`
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ` ${fmtTime(ts)}`
}

export function fmtDay(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === new Date(Date.now() - 864e5).toDateString()) return 'Yesterday'
  return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Receipt-style stamp: "SAT 10 OCT 18:02", or "SAT 18:02" when `short`. */
export function fmtStamp(ts: number, short = false): string {
  const d = new Date(ts)
  const weekday = d.toLocaleDateString(undefined, { weekday: 'short' }).replace('.', '')
  const date = short ? '' : ` ${d.getDate()} ${d.toLocaleDateString(undefined, { month: 'short' }).replace('.', '')}`
  return `${weekday}${date} ${fmtTime(ts)}`.toUpperCase()
}

/** Number only, for the clipboard and big readouts: "44" or "12.5". */
export function fmtNum(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 1, useGrouping: false })
}
