<script lang="ts">
  import Numpad from '../components/Numpad.svelte'
  import Ring from '../components/Ring.svelte'
  import { saveWeigh } from '../lib/actions'
  import { lastWeight, matches, parseGrams, todayTotal, unloggedCount } from '../lib/calc'
  import { go } from '../lib/router.svelte'
  import { store } from '../lib/store.svelte'
  import type { Item } from '../lib/types'
  import { fmtNum, fmtTime } from '../lib/util'

  let typed = $state('')
  let pickedId = $state<string | null>(null)

  const grams = $derived(parseGrams(typed))
  const found = $derived(grams === null ? null : matches(store.open, grams))
  const selected = $derived(found ? (found.fits.find((m) => m.item.id === pickedId) ?? found.fits[0]) : undefined)
  const today = $derived(todayTotal(store.data.items))
  const toLog = $derived(unloggedCount(store.data.items))

  const hiddenNote = $derived.by(() => {
    if (!found || grams === null || found.hidden.length === 0) return ''
    if (found.hidden.length > 1) return `${found.hidden.length} hidden · lighter than ${fmtNum(grams)}`
    const h = found.hidden[0]
    return `${h.name} hidden · ${fmtNum(lastWeight(h))} < ${fmtNum(grams)}`
  })

  function when(item: Item) {
    const ts = item.weighs.at(-1)!.at
    const d = new Date(ts).toDateString()
    if (d === new Date().toDateString()) return fmtTime(ts)
    if (d === new Date(Date.now() - 864e5).toDateString()) return 'yesterday'
    return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  }

  function save() {
    if (!selected || grams === null) return
    saveWeigh(selected.item.id, grams)
  }

  function newItem() {
    go(grams === null ? '/new' : `/new/${typed.replace(',', '.')}`)
  }
</script>

<div class="screen">
  <div class="bar">
    <span class="title">Nibble</span>
    <a class="status mono" href="#/history">{fmtNum(today)} g · <span class="caps">{toLog ? `${toLog} to log` : 'today'}</span></a>
  </div>

  <div class="scale">
    <span class="label">What's on the scale?</span>
    <div class="readout mono" class:typing={grams !== null}>
      <span class="num" class:dim={!typed}>{typed || '0'}</span><span class="unit">&nbsp;g</span>
    </div>
  </div>

  <div class="head label">
    {#if found}
      <span>Which one?</span>
      <span class="ellipsis">{hiddenNote}</span>
    {:else}
      <span>Open · {store.open.length}</span>
      <button class="link label new" onclick={newItem}>+ New</button>
    {/if}
  </div>

  <div class="cards">
    {#if found && grams !== null}
      {#each found.fits as m (m.item.id)}
        {@const active = m.item.id === selected?.item.id}
        <button class="card" class:active onclick={() => (pickedId = m.item.id)}>
          <Ring
            pct={grams / m.item.weighs[0].grams}
            label={`−${fmtNum(m.delta)}`}
            variant={active ? 'active' : 'dim'} />
          <span class="name">{m.item.name}</span>
          <span class="sub mono">{fmtNum(lastWeight(m.item))} → {fmtNum(grams)}</span>
        </button>
      {/each}
      <button class="card dashed" onclick={newItem}>
        <span class="plus">+</span>
        <span class="name">New item at {fmtNum(grams)} g</span>
      </button>
    {:else}
      {#each store.open as item (item.id)}
        <button class="card" onclick={() => go(`/item/${item.id}`)}>
          <Ring pct={lastWeight(item) / item.weighs[0].grams} label={fmtNum(lastWeight(item))} />
          <span class="name">{item.name}</span>
          <span class="sub">
            {item.weighs.length > 1 ? `of ${fmtNum(item.weighs[0].grams)} g · ${when(item)}` : 'untouched'}
          </span>
        </button>
      {:else}
        <p class="empty muted">
          Nothing open. Weigh a pack before you start eating, type the weight and add it as a new item.
        </p>
      {/each}
    {/if}
  </div>

  <div class="bottom">
    <Numpad bind:value={typed} onenter={save} />
    {#if selected}
      <button class="btn primary block" onclick={save}>
        <span class="ellipsis">Save to {selected.item.name}</span><span class="nowrap">· −{fmtNum(selected.delta)} g</span>
      </button>
    {:else if found}
      <button class="btn primary block" onclick={newItem}>Start new item at {fmtNum(grams ?? 0)} g</button>
    {/if}
  </div>
</div>

<style>
  .status {
    color: var(--accent);
    font-size: 12px;
    white-space: nowrap;
    text-decoration: none;
  }
  .caps {
    text-transform: uppercase;
  }
  .scale {
    padding: 22px 20px 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .readout {
    display: flex;
    justify-content: flex-end;
    align-items: baseline;
    border-bottom: 1px solid var(--border);
    padding-bottom: 8px;
  }
  .readout.typing {
    border-color: var(--accent);
  }
  .num {
    font-size: 72px;
    font-weight: 500;
    line-height: 1;
  }
  .num.dim {
    color: var(--digit-dim);
  }
  .unit {
    font-size: 26px;
    color: var(--muted);
  }
  .head {
    padding: 20px 20px 10px;
    display: flex;
    justify-content: space-between;
    gap: 16px;
  }
  .new {
    padding: 0;
    color: var(--accent);
  }
  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
  .cards {
    display: flex;
    gap: 10px;
    padding: 0 20px 4px;
    overflow-x: auto;
    scrollbar-width: none;
    flex: none;
  }
  .card {
    flex: none;
    width: 140px;
    background: var(--surface);
    color: var(--text);
    border: none;
    border-radius: 22px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    text-align: left;
  }
  .card .name {
    font-weight: 600;
    font-size: 15px;
    margin-bottom: -12px;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sub {
    font-size: 12px;
    color: var(--muted);
  }
  .card.active {
    background: var(--accent);
    color: var(--on-accent);
  }
  .card.active .name {
    font-weight: 700;
  }
  .card.active .sub {
    color: inherit;
  }
  .card.dashed {
    background: none;
    border: 1.5px dashed var(--border);
    color: var(--muted);
    justify-content: center;
    gap: 4px;
  }
  .card.dashed .name {
    white-space: normal;
    margin: 0;
  }
  .plus {
    font-size: 28px;
    line-height: 1;
  }
  .empty {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
  }
  .nowrap {
    white-space: nowrap;
  }
  .btn.primary {
    min-height: 60px;
    min-width: 0;
  }
</style>
