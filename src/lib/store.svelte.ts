import type { AppData, Barcode, Item } from './types'

const KEY = 'nibble:data'

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data?.version === 1 && Array.isArray(data.items)) return data
    }
  } catch {
    // fall through to empty data
  }
  return { version: 1, items: [] }
}

const uid = () => crypto.randomUUID()

class Store {
  data = $state<AppData>(load())
  /** Snapshot taken before the last change, for a single-step undo. */
  undo = $state<{ label: string; snapshot: string } | null>(null)

  get open() {
    return this.data.items.filter((i) => !i.finishedAt).sort((a, b) => lastAt(b) - lastAt(a))
  }

  get finished() {
    return this.data.items.filter((i) => i.finishedAt).sort((a, b) => b.finishedAt! - a.finishedAt!)
  }

  get(id: string) {
    return this.data.items.find((i) => i.id === id)
  }

  /** Most recent item that used this barcode, to prefill the name. */
  byBarcode(value: string) {
    return this.data.items
      .filter((i) => i.barcode?.value === value)
      .sort((a, b) => b.createdAt - a.createdAt)[0]
  }

  get knownNames() {
    return [...new Set(this.data.items.map((i) => i.name))].sort()
  }

  private change(label: string, fn: () => void) {
    this.undo = { label, snapshot: JSON.stringify(this.data) }
    fn()
    this.save()
  }

  private save() {
    localStorage.setItem(KEY, JSON.stringify(this.data))
  }

  addItem(name: string, grams: number, barcode?: Barcode): string {
    const now = Date.now()
    const item: Item = {
      id: uid(),
      name: name.trim() || 'Unnamed',
      createdAt: now,
      barcode,
      weighs: [{ id: uid(), at: now, grams, logged: true }],
    }
    this.change(`Added ${item.name}`, () => this.data.items.push(item))
    return item.id
  }

  addWeigh(id: string, grams: number, finish: boolean) {
    const item = this.get(id)
    if (!item) return
    this.change(finish ? `Finished ${item.name}` : `Weighed ${item.name}`, () => {
      const now = Date.now()
      item.weighs.push({ id: uid(), at: now, grams, logged: false })
      if (finish) item.finishedAt = now
    })
  }

  update(id: string, patch: Partial<Pick<Item, 'name' | 'barcode'>>) {
    const item = this.get(id)
    if (!item) return
    Object.assign(item, patch)
    this.save()
  }

  reopen(id: string) {
    const item = this.get(id)
    if (!item) return
    this.change(`Reopened ${item.name}`, () => delete item.finishedAt)
  }

  removeItem(id: string) {
    const item = this.get(id)
    if (!item) return
    this.change(`Deleted ${item.name}`, () => {
      this.data.items = this.data.items.filter((i) => i.id !== id)
    })
  }

  removeWeigh(itemId: string, weighId: string) {
    const item = this.get(itemId)
    if (!item || item.weighs[0].id === weighId) return
    this.change(`Removed weigh`, () => {
      item.weighs = item.weighs.filter((w) => w.id !== weighId)
    })
  }

  toggleLogged(itemId: string, weighId: string) {
    const w = this.get(itemId)?.weighs.find((w) => w.id === weighId)
    if (!w) return
    w.logged = !w.logged
    this.save()
  }

  clearFinished() {
    this.change('Cleared finished items', () => {
      this.data.items = this.data.items.filter((i) => !i.finishedAt)
    })
  }

  undoLast() {
    if (!this.undo) return
    this.data = JSON.parse(this.undo.snapshot)
    this.undo = null
    this.save()
  }

  exportJson() {
    return JSON.stringify(this.data, null, 2)
  }

  importJson(text: string) {
    const data = JSON.parse(text)
    if (data?.version !== 1 || !Array.isArray(data.items)) throw new Error('Not a nibble backup')
    this.change('Imported backup', () => (this.data = data))
  }
}

function lastAt(item: Item) {
  return item.weighs[item.weighs.length - 1].at
}

export const store = new Store()
