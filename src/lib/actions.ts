import { eatenAt } from './calc'
import { go } from './router.svelte'
import { store } from './store.svelte'
import { copy } from './util'

/**
 * Save a weigh, copy the grams eaten and mark it logged, then show the result slip.
 * Must run inside the tap handler so the clipboard write counts as a user gesture.
 */
export async function saveWeigh(itemId: string, grams: number, finish = false) {
  store.addWeigh(itemId, grams, finish)
  const item = store.get(itemId)
  if (!item) return
  const index = item.weighs.length - 1
  const weigh = item.weighs[index]
  go(`/done/${item.id}/${weigh.id}`)
  await copyAndLog(item.id, weigh.id, eatenAt(item, index))
}

/** Copy `eaten` and mark the weigh logged. Nothing to copy for 0 or less, so it's just marked. */
export async function copyAndLog(itemId: string, weighId: string, eaten: number): Promise<boolean> {
  const ok = eaten <= 0 || (await copy(String(eaten)))
  const w = store.get(itemId)?.weighs.find((w) => w.id === weighId)
  if (ok && w && !w.logged) store.toggleLogged(itemId, weighId)
  return ok
}
