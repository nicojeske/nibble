<script lang="ts">
  import SwipeRow from '../components/SwipeRow.svelte'
  import { copyAndLog } from '../lib/actions'
  import { dayKey, entries, groupByDay, lastNDays, round } from '../lib/calc'
  import { go } from '../lib/router.svelte'
  import { store } from '../lib/store.svelte'
  import { toast } from '../lib/toast.svelte'
  import type { Entry } from '../lib/types'
  import { copy, fmtDay, fmtNum, fmtTime, fmtWhen } from '../lib/util'

  const all = $derived(entries(store.data.items))
  const toLog = $derived(all.filter((e) => !e.weigh.logged))
  const toLogSum = $derived(toLog.reduce((s, e) => round(s + Math.max(0, e.eaten)), 0))
  const days = $derived(groupByDay(all).filter((d) => d.entries.some((e) => e.weigh.logged)))
  const week = $derived(lastNDays(store.data.items, 7))
  const max = $derived(Math.max(1, ...week.map((d) => d.total)))
  const todayKey = dayKey(Date.now())

  function weekday(key: string) {
    const [y, m, d] = key.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'narrow' })
  }

  function finished(e: Entry) {
    return e.item.finishedAt === e.weigh.at ? ' · finished' : ''
  }

  function log(e: Entry) {
    store.toggleLogged(e.item.id, e.weigh.id)
    toast.show(`${e.item.name} logged`)
  }

  async function copyOne(e: Entry) {
    toast.show((await copyAndLog(e.item.id, e.weigh.id, e.eaten)) ? `Copied ${fmtNum(e.eaten)}` : 'Copy failed')
  }

  async function copyAll() {
    const list = toLog
    if (!(await copy(String(toLogSum)))) return toast.show('Copy failed')
    for (const e of list) store.toggleLogged(e.item.id, e.weigh.id)
    toast.show(`Copied ${fmtNum(toLogSum)} · ${list.length} logged`)
  }

  function unlog(e: Entry) {
    store.toggleLogged(e.item.id, e.weigh.id)
    toast.show(`${e.item.name} back to log`)
  }
</script>

<div class="screen">
  <div class="bar"><span class="title">History</span></div>

  <div class="chart" aria-label="Last 7 days">
    {#each week as d (d.key)}
      <div class="col" title="{fmtDay(d.key)}: {fmtNum(d.total)} g">
        <div class="barfill" class:today={d.key === todayKey} style:height="{Math.max(4, (d.total / max) * 84)}px"></div>
        <span class:today={d.key === todayKey}>{weekday(d.key)}</span>
      </div>
    {/each}
  </div>

  {#if toLog.length}
    <div class="head label">
      <span class="accent">To log · {toLog.length}</span>
      <button class="link label" onclick={copyAll}>Copy all {fmtNum(toLogSum)}</button>
    </div>
    <div class="list">
      {#each toLog as e (e.weigh.id)}
        <SwipeRow onswipe={() => log(e)}>
          <div class="entry">
            <button class="open" onclick={() => go(`/item/${e.item.id}`)}>
              <span class="name">{e.item.name}</span>
              <span class="when">{fmtWhen(e.weigh.at)}{finished(e)}</span>
            </button>
            <button class="grams mono" onclick={() => copyOne(e)}>{fmtNum(e.eaten)} g</button>
          </div>
        </SwipeRow>
      {/each}
    </div>
    <p class="hint muted">Swipe right to mark logged, tap the grams to copy.</p>
  {/if}

  {#each days as day (day.key)}
    <div class="head label">
      <span>{fmtDay(day.key)}</span>
      <span class="mono">{fmtNum(day.total)} g</span>
    </div>
    <div class="list">
      {#each day.entries.filter((e) => e.weigh.logged) as e (e.weigh.id)}
        <div class="entry plain">
          <button class="open" onclick={() => go(`/item/${e.item.id}`)}>
            <span class="name">{e.item.name}</span>
            <span class="when">{fmtTime(e.weigh.at)}{finished(e)}</span>
          </button>
          <button class="grams mono muted" onclick={() => unlog(e)} aria-label="Mark not logged">{fmtNum(e.eaten)} g ✓</button>
        </div>
      {/each}
    </div>
  {:else}
    {#if !toLog.length}
      <p class="muted empty">No weighs yet. Once you weigh an item again, what you ate shows up here.</p>
    {/if}
  {/each}
  <div class="pad"></div>
</div>

<style>
  .chart {
    margin: 18px 20px 0;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
    align-items: end;
    height: 110px;
    flex: none;
  }
  .col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .col span {
    font-size: 11px;
    color: var(--muted);
  }
  .col span.today {
    color: var(--text);
    font-weight: 600;
  }
  .barfill {
    width: 100%;
    background: var(--border);
    border-radius: 4px;
  }
  .barfill.today {
    background: var(--accent);
  }
  .head {
    padding: 22px 20px 8px;
    display: flex;
    justify-content: space-between;
  }
  .head .link {
    padding: 0;
    color: var(--muted);
  }
  .head .mono {
    text-transform: none;
  }
  .accent {
    color: var(--accent);
  }
  .list {
    border-top: 1px solid var(--border);
  }
  .list > :global(*) {
    border-bottom: 1px solid var(--border);
  }
  .entry {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 20px;
  }
  .open {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    background: none;
    border: none;
    padding: 14px 0;
    color: inherit;
    text-align: left;
  }
  .name {
    font-weight: 600;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .when {
    font-size: 13px;
    color: var(--muted);
  }
  .grams {
    background: none;
    border: none;
    padding: 14px 0;
    font-size: 20px;
    color: inherit;
  }
  .grams.muted {
    color: var(--muted);
  }
  .hint {
    margin: 8px 20px 0;
    font-size: 12px;
  }
  .empty {
    padding: 20px;
    margin: 0;
  }
  .pad {
    height: 16px;
    flex: none;
  }
</style>
