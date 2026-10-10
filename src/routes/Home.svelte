<script lang="ts">
  import BarcodeField from '../components/BarcodeField.svelte'
  import { lastWeight, parseGrams, totalEaten } from '../lib/calc'
  import { go } from '../lib/router.svelte'
  import { store } from '../lib/store.svelte'
  import type { Barcode } from '../lib/types'
  import { fmtGrams, fmtWhen } from '../lib/util'

  let adding = $state(store.data.items.length === 0)
  let name = $state('')
  let grams = $state('')
  let barcode = $state<Barcode | undefined>()

  const parsed = $derived(parseGrams(grams))

  function onScan(code: Barcode) {
    const known = store.byBarcode(code.value)
    if (known && !name.trim()) name = known.name
  }

  function submit(e: SubmitEvent) {
    e.preventDefault()
    if (parsed === null) return
    const id = store.addItem(name, parsed, barcode)
    name = ''
    grams = ''
    barcode = undefined
    adding = false
    go(`/item/${id}`)
  }

  function focus(node: HTMLInputElement) {
    node.focus()
  }
</script>

<h1>Open items</h1>

{#if adding}
  <form class="card new" onsubmit={submit}>
    <label class="field">
      <span>What is it?</span>
      <input bind:value={name} list="names" placeholder="e.g. Paprika chips" autocomplete="off" use:focus />
    </label>
    <datalist id="names">
      {#each store.knownNames as n}<option value={n}></option>{/each}
    </datalist>
    <label class="field">
      <span>Starting weight (g)</span>
      <input bind:value={grams} inputmode="decimal" placeholder="0" />
    </label>
    <BarcodeField bind:value={barcode} onscan={onScan} />
    <div class="row">
      {#if store.data.items.length > 0}
        <button type="button" class="btn" onclick={() => (adding = false)}>Cancel</button>
      {/if}
      <button class="btn primary grow" disabled={parsed === null}>Start tracking</button>
    </div>
  </form>
{:else}
  <button class="btn primary block" onclick={() => (adding = true)}>+ New item</button>
{/if}

<div class="list">
  {#each store.open as item (item.id)}
    <a class="card item" href="#/item/{item.id}">
      <div class="grow">
        <div class="name">{item.name}</div>
        <div class="muted small">
          {item.weighs.length > 1 ? `${fmtGrams(totalEaten(item))} eaten · ` : ''}last weighed {fmtWhen(item.weighs.at(-1)!.at)}
        </div>
      </div>
      <div class="weight">{fmtGrams(lastWeight(item))}</div>
    </a>
  {:else}
    {#if !adding}
      <p class="muted empty">Nothing open. Weigh a package before you start eating and add it here.</p>
    {/if}
  {/each}
</div>

<style>
  .new {
    margin-bottom: 8px;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 16px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 12px;
    color: inherit;
    text-decoration: none;
  }
  .name {
    font-weight: 600;
    font-size: 1.1rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .small {
    font-size: 0.9rem;
  }
  .weight {
    font-size: 1.3rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .empty {
    text-align: center;
    padding: 24px 8px;
  }
</style>
