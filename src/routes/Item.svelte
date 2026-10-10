<script lang="ts">
  import BarcodeField from '../components/BarcodeField.svelte'
  import BarcodeView from '../components/BarcodeView.svelte'
  import { eatenAt, lastWeight, parseGrams, totalEaten } from '../lib/calc'
  import { go } from '../lib/router.svelte'
  import { store } from '../lib/store.svelte'
  import { toast } from '../lib/toast.svelte'
  import { copy, fmtGrams, fmtWhen } from '../lib/util'

  let { id }: { id: string } = $props()

  const item = $derived(store.get(id))

  let grams = $state('')
  let finish = $state(false)
  let showBarcode = $state(false)
  let editing = $state(false)
  /** Id of the weigh just saved, to show the result card. */
  let savedId = $state<string | null>(null)

  const parsed = $derived(parseGrams(grams))
  const preview = $derived(item && parsed !== null ? Math.round((lastWeight(item) - parsed) * 10) / 10 : null)
  const saved = $derived.by(() => {
    if (!item || !savedId) return null
    const index = item.weighs.findIndex((w) => w.id === savedId)
    return index > 0 ? { weigh: item.weighs[index], eaten: eatenAt(item, index) } : null
  })

  function submit(e: SubmitEvent) {
    e.preventDefault()
    if (!item || parsed === null) return
    store.addWeigh(item.id, parsed, finish)
    savedId = item.weighs.at(-1)!.id
    grams = ''
    finish = false
  }

  async function copyGrams(n: number, weighId: string) {
    if (await copy(String(n))) {
      toast.show(`Copied ${n}`)
      const w = item?.weighs.find((w) => w.id === weighId)
      if (w && !w.logged) store.toggleLogged(id, weighId)
    } else toast.show('Copy failed')
  }

  function remove() {
    if (!item) return
    store.removeItem(item.id)
    go('/')
  }
</script>

{#if !item}
  <p class="muted">This item no longer exists. <a href="#/">Back</a></p>
{:else}
  <div class="head">
    <a href="#/" class="link back">‹ Back</a>
    <button class="link" onclick={() => (editing = !editing)}>{editing ? 'Done' : 'Edit'}</button>
  </div>

  {#if editing}
    <div class="card">
      <label class="field">
        <span>Name</span>
        <input value={item.name} oninput={(e) => store.update(item.id, { name: e.currentTarget.value })} />
      </label>
      <BarcodeField bind:value={() => item.barcode, (v) => store.update(item.id, { barcode: v })} />
      <button class="btn block danger" onclick={remove}>Delete item</button>
    </div>
  {:else}
    <h1>{item.name}</h1>
  {/if}

  <div class="stats">
    <div><span class="muted">Now</span><b>{fmtGrams(lastWeight(item))}</b></div>
    <div><span class="muted">Started</span><b>{fmtGrams(item.weighs[0].grams)}</b></div>
    <div><span class="muted">Eaten</span><b>{fmtGrams(totalEaten(item))}</b></div>
  </div>

  {#if item.barcode}
    <button class="btn block" onclick={() => (showBarcode = true)}>Show barcode</button>
  {/if}

  {#if saved}
    <div class="card result">
      <div class="muted">Eaten</div>
      <div class="big">{fmtGrams(saved.eaten)}</div>
      <div class="row">
        <button class="btn primary grow" onclick={() => copyGrams(saved.eaten, saved.weigh.id)}>Copy {saved.eaten}</button>
        <button class="btn grow" onclick={() => store.toggleLogged(id, saved.weigh.id)}>
          {saved.weigh.logged ? '✓ Logged' : 'Mark logged'}
        </button>
      </div>
    </div>
  {/if}

  {#if item.finishedAt}
    <div class="card finished">
      <span>Finished {fmtWhen(item.finishedAt)}</span>
      <button class="link" onclick={() => store.reopen(item.id)}>Reopen</button>
    </div>
  {:else}
    <form class="card" onsubmit={submit}>
      <label class="field">
        <span>Weight now (g)</span>
        <input bind:value={grams} inputmode="decimal" placeholder={String(lastWeight(item))} />
      </label>
      {#if preview !== null}
        <p class="preview" class:warn={preview < 0}>
          {#if preview < 0}
            Heavier than last time (+{fmtGrams(-preview)}). Wrong item or refilled?
          {:else}
            You ate <b>{fmtGrams(preview)}</b>
          {/if}
        </p>
      {/if}
      <label class="check">
        <input type="checkbox" bind:checked={finish} />
        <span>Finished. This is the empty packaging (use 0 if it's gone)</span>
      </label>
      <button class="btn primary block" disabled={parsed === null}>{finish ? 'Save & finish' : 'Save weigh'}</button>
    </form>
  {/if}

  <h2>Weighs</h2>
  <ul class="weighs">
    {#each item.weighs.toReversed() as w, ri (w.id)}
      {@const i = item.weighs.length - 1 - ri}
      <li class:unlogged={i > 0 && !w.logged}>
        <div class="grow">
          <div>{fmtGrams(w.grams)} <span class="muted">· {fmtWhen(w.at)}</span></div>
          {#if i === 0}<div class="muted small">start</div>{/if}
        </div>
        {#if i > 0}
          {@const eaten = eatenAt(item, i)}
          <button class="pill" onclick={() => copyGrams(eaten, w.id)} title="Copy">−{fmtGrams(eaten)}</button>
          <button class="tick" class:on={w.logged} aria-label="Toggle logged" onclick={() => store.toggleLogged(id, w.id)}>✓</button>
          {#if editing}
            <button class="link danger-text" onclick={() => store.removeWeigh(id, w.id)}>✕</button>
          {/if}
        {/if}
      </li>
    {/each}
  </ul>

  {#if showBarcode && item.barcode}
    <BarcodeView code={item.barcode} name={item.name} onclose={() => (showBarcode = false)} />
  {/if}
{/if}

<style>
  .head {
    display: flex;
    justify-content: space-between;
  }
  .back {
    text-decoration: none;
    padding-left: 0;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin: 12px 0;
  }
  .stats div {
    display: flex;
    flex-direction: column;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 10px 12px;
  }
  .stats span {
    font-size: 0.85rem;
  }
  .stats b {
    font-size: 1.15rem;
    font-variant-numeric: tabular-nums;
  }
  .card {
    margin-top: 12px;
  }
  .result {
    border-color: var(--accent);
    text-align: center;
  }
  .big {
    font-size: 2.6rem;
    font-weight: 800;
    margin-bottom: 12px;
    font-variant-numeric: tabular-nums;
  }
  .finished {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .preview {
    margin: -4px 0 12px;
    font-size: 1.1rem;
  }
  .preview.warn {
    color: var(--warn);
  }
  .check {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin-bottom: 14px;
    color: var(--muted);
  }
  .check input {
    width: 22px;
    height: 22px;
    flex: none;
    margin: 0;
    accent-color: var(--accent);
  }
  .weighs {
    list-style: none;
    padding: 0;
    margin: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
  }
  .weighs li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-top: 1px solid var(--border);
  }
  .weighs li:first-child {
    border-top: none;
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
  .danger {
    color: #e03131;
  }
  .danger-text {
    color: #e03131;
  }
</style>
