<script lang="ts">
  import { entries, groupByDay } from '../lib/calc'
  import { store } from '../lib/store.svelte'
  import { toast } from '../lib/toast.svelte'
  import { copy, fmtDay, fmtGrams, fmtTime } from '../lib/util'

  const days = $derived(groupByDay(entries(store.data.items)))
  const unlogged = $derived(entries(store.data.items).filter((e) => !e.weigh.logged).length)

  async function copyGrams(n: number, itemId: string, weighId: string, logged: boolean) {
    if (await copy(String(n))) {
      toast.show(`Copied ${n}`)
      if (!logged) store.toggleLogged(itemId, weighId)
    }
  }
</script>

<h1>History</h1>

{#if unlogged > 0}
  <p class="banner">{unlogged} {unlogged === 1 ? 'entry' : 'entries'} not logged yet</p>
{/if}

{#each days as day (day.key)}
  <h2><span>{fmtDay(day.key)}</span><span>{fmtGrams(day.total)}</span></h2>
  <ul>
    {#each day.entries as e (e.weigh.id)}
      <li class:unlogged={!e.weigh.logged}>
        <a class="grow" href="#/item/{e.item.id}">
          <div class="name">{e.item.name}</div>
          <div class="muted small">{fmtTime(e.weigh.at)}{e.item.finishedAt === e.weigh.at ? ' · finished' : ''}</div>
        </a>
        <button class="pill" onclick={() => copyGrams(e.eaten, e.item.id, e.weigh.id, e.weigh.logged)}>{fmtGrams(e.eaten)}</button>
        <button
          class="tick"
          class:on={e.weigh.logged}
          aria-label="Toggle logged"
          onclick={() => store.toggleLogged(e.item.id, e.weigh.id)}>✓</button>
      </li>
    {/each}
  </ul>
{:else}
  <p class="muted">No weighs yet.</p>
{/each}

<style>
  h2 {
    display: flex;
    justify-content: space-between;
  }
  .banner {
    background: var(--unlogged);
    border-radius: 12px;
    padding: 10px 14px;
    font-weight: 600;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
  }
  li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-top: 1px solid var(--border);
  }
  li:first-child {
    border-top: none;
  }
  li a {
    color: inherit;
    text-decoration: none;
  }
  .name {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .unlogged {
    background: var(--unlogged);
  }
  .small {
    font-size: 0.85rem;
  }
  .pill {
    border: 1px solid var(--border);
    background: var(--bg);
    border-radius: 999px;
    padding: 6px 12px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }
  .tick {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid var(--muted);
    background: none;
    color: transparent;
    font-weight: 800;
    cursor: pointer;
  }
  .tick.on {
    border-color: var(--good);
    background: var(--good);
    color: var(--surface);
  }
</style>
