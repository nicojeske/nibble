export interface Weigh {
  id: string
  at: number
  grams: number
  logged: boolean
}

export interface Barcode {
  value: string
  format: string
}

export interface Item {
  id: string
  name: string
  createdAt: number
  finishedAt?: number
  barcode?: Barcode
  /** weighs[0] is the starting weight */
  weighs: Weigh[]
}

export interface AppData {
  version: 1
  items: Item[]
}

export interface Entry {
  item: Item
  weigh: Weigh
  eaten: number
}
