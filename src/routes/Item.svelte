<script lang="ts">
  import BarcodeField from '../components/BarcodeField.svelte'
  import BarcodeView from '../components/BarcodeView.svelte'
  import Numpad from '../components/Numpad.svelte'
  import Receipt from '../components/Receipt.svelte'
  import { saveWeigh } from '../lib/actions'
  import { eatenAt, lastWeight, parseGrams, round, totalEaten } from '../lib/calc'
  import { go } from '../lib/router.svelte'
  import { store } from '../lib/store.svelte'
  import { fmtNum, fmtStamp, fmtTime, fmtWhen } from '../lib/util'

  let { id }: { id: string } = $props()

  const item = $derived(store.get(id))

  let typed = $state('')
  let showBarcode = $state(false)
  let editing = $state(false)
  let now = $state(Date.now())

  const grams = $derived(parseGrams(typed))
  const preview = $derived(item && grams !== null ? round(lastWeight(item) - grams) : null)
  const total = $derived(item ? round(totalEaten(item) + (preview ?? 0)) : 0)
  const lastEaten = $derived(item && item.weighs.length > 1 ? eatenAt(item, item.weighs.length - 1) : undefined)

  $effect(() => {
    const t = setInterval(() => (now = Date.now()), 30_000)
    return () => clearInterval(t)
  })

  function save(finish = false, value = grams) {
    if (!item || value === null) return
    saveWeigh(item.id, value, finish)
  }

  function remove() {
    if (!item) return
    store.removeItem(item.id)
    go('/')
  }
</script>

{#if !item}
  <div class="screen">
    <div class="bar"><a href="#/" class="link">‹ Scale</a></div>
    <p class="muted gone">This item no longer exists.</p>
  </div>
{:else}
  <div class="screen">
    <div class="bar">
      <a href="#/" class="link">‹ Scale</a>
      <span class="row actions">
        {#if item.barcode && !editing}
          <button class="link dim" onclick={() => (showBarcode = true)}>Barcode</button>
          <span class="muted">·</span>
        {/if}
        <button class="link" class:dim={!editing} onclick={() => (editing = !editing)}>{editing ? 'Done' : 'Edit'}</button>
      </span>
    </div>

    <div class="slip">
      <Receipt>
        <div class="r-row">
          <span class="r-name">{item.name}</span>
          {#if item.barcode}<span class="r-dim">EAN …{item.barcode.value.slice(-4)}</span>{/if}
        </div>
        <div class="r-rule"></div>
        <div class="lines">
          <div class="r-row r-dim">
            <span>{fmtStamp(item.weighs[0].at)} · start</span><span>{fmtNum(item.weighs[0].grams)} g</span>
          </div>
          {#each item.weighs.slice(1) as w, i (w.id)}
            {@const eaten = eatenAt(item, i + 1)}
            <div class="r-row line">
              <button class="toggle" onclick={() => store.toggleLogged(id, w.id)} aria-label="Toggle logged">
                <span>{fmtStamp(w.at, true)}{item.finishedAt === w.at ? ' · end' : ''}</span>
                <span>{eaten < 0 ? '+' : '−'}{fmtNum(Math.abs(eaten))} g {w.logged ? '✓' : '·'}</span>
              </button>
              {#if editing}
                <button class="x" aria-label="Remove weigh" onclick={() => store.removeWeigh(id, w.id)}>✕</button>
              {/if}
            </div>
          {/each}
          {#if preview !== null && grams !== null}
            <div class="r-row r-now">
              <span>NOW {fmtTime(now)}</span>
              <span>{fmtNum(grams)} g → {preview < 0 ? '+' : '−'}{fmtNum(Math.abs(preview))} g</span>
            </div>
          {/if}
        </div>
        <div class="r-rule"></div>
        <div class="r-row">
          <span>EATEN TOTAL</span><span class="total">{fmtNum(total)} g</span>
        </div>
      </Receipt>
    </div>

    {#if editing}
      <div class="edit">
        <label class="field">
          <span class="label">Name</span>
          <input value={item.name} oninput={(e) => store.update(item.id, { name: e.currentTarget.value })} />
        </label>
        <BarcodeField bind:value={() => item.barcode, (v) => store.update(item.id, { barcode: v })} />
        <p class="muted hint">Tap a line on the slip to toggle logged, ✕ to remove it.</p>
        <button class="btn block danger" onclick={remove}>Delete item</button>
      </div>
    {:else if item.finishedAt}
      <div class="bottom">
        <div class="finished">
          <span>Finished {fmtWhen(item.finishedAt)}</span>
          <button class="link" onclick={() => store.reopen(item.id)}>Reopen</button>
        </div>
      </div>
    {:else}
      <div class="now">
        <span class="label">Weight now</span>
        <span class="num mono" class:dim={!typed}>{typed || fmtNum(lastWeight(item))}<span class="unit">&nbsp;g</span></span>
      </div>

      <div class="bottom">
        <div class="row">
          <button class="btn grow small" disabled={grams === null} onclick={() => save(true)}>Empty pack · finish</button>
          <button class="btn grow small" onclick={() => save(true, 0)}>It's gone (0 g)</button>
        </div>
        <Numpad bind:value={typed} size={52} onenter={() => save()} />
        <button class="btn primary block" class:warn={preview !== null && preview < 0} disabled={grams === null} onclick={() => save()}>
          {#if preview === null}
            Type the weight now
          {:else if preview < 0}
            Heavier by {fmtNum(-preview)} g · save anyway
          {:else}
            Save &amp; copy {fmtNum(preview)}
          {/if}
        </button>
      </div>
    {/if}
  </div>

  {#if showBarcode && item.barcode}
    <BarcodeView code={item.barcode} name={item.name} eaten={lastEaten} onclose={() => (showBarcode = false)} />
  {/if}
{/if}

<style>
  .gone {
    padding: 20px;
  }
  .actions {
    gap: 6px;
  }
  .slip {
    margin: 16px 16px 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .lines {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 30vh;
    overflow-x: hidden;
    overflow-y: auto;
    /* room for the NOW row's bleed */
    margin: 0 -6px;
    padding: 0 6px;
  }
  .line {
    gap: 8px;
  }
  .toggle {
    flex: 1;
    display: flex;
    justify-content: space-between;
    background: none;
    border: none;
    padding: 0;
    color: inherit;
    font: inherit;
    text-align: left;
  }
  .x {
    background: none;
    border: none;
    padding: 0 2px;
    color: var(--danger);
    font: inherit;
  }
  .total {
    font-size: 26px;
    font-weight: 600;
  }
  .now {
    padding: 14px 20px 0;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .num {
    font-size: 44px;
    font-weight: 500;
    line-height: 1;
  }
  .num.dim {
    color: var(--digit-dim);
  }
  .unit {
    font-size: 20px;
    color: var(--muted);
  }
  .small {
    min-height: 44px;
    border-radius: 12px;
    font-size: 14px;
    color: var(--text-2);
  }
  .btn.primary.warn {
    background: var(--warn);
    border-color: var(--warn);
  }
  .finished {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: 14px;
  }
  .edit {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .edit .field {
    margin: 0;
  }
  .hint {
    margin: 0;
    font-size: 13px;
  }
  .danger {
    color: var(--danger);
    margin-top: 8px;
  }
</style>
