<script lang="ts">
  import { untrack } from 'svelte'
  import BarcodeField from '../components/BarcodeField.svelte'
  import Numpad from '../components/Numpad.svelte'
  import { parseGrams } from '../lib/calc'
  import { go } from '../lib/router.svelte'
  import { store } from '../lib/store.svelte'
  import { toast } from '../lib/toast.svelte'
  import type { Barcode } from '../lib/types'
  import { fmtNum } from '../lib/util'

  let { grams: initial }: { grams?: string } = $props()

  let name = $state('')
  // The route is keyed on the param, so reading it once is enough.
  const prefill = untrack(() => parseGrams(initial ?? ''))
  let typed = $state(prefill === null ? '' : String(prefill).replace('.', ','))
  let barcode = $state<Barcode | undefined>()

  const grams = $derived(parseGrams(typed))
  const open = $derived(new Set(store.open.map((i) => i.name)))
  const suggestions = $derived(
    store.knownNames
      .filter((n) => !open.has(n) && n !== name && n.toLowerCase().includes(name.trim().toLowerCase()))
      .slice(0, 6),
  )

  function onScan(code: Barcode) {
    const known = store.byBarcode(code.value)
    if (known && !name.trim()) name = known.name
  }

  function start() {
    if (grams === null || grams <= 0) return
    const id = store.addItem(name, grams, barcode)
    toast.show(`Tracking ${store.get(id)?.name} at ${fmtNum(grams)} g`)
    go('/')
  }

  function focus(node: HTMLInputElement) {
    if (!initial) return
    node.focus()
  }
</script>

<div class="screen">
  <div class="bar">
    <a class="link dim" href="#/">Cancel</a>
    <span class="heading">New item</span>
    <span class="spacer"></span>
  </div>

  <div class="form">
    <input bind:value={name} placeholder="What is it?" autocomplete="off" enterkeyhint="done" use:focus />
    {#if suggestions.length}
      <div class="chips">
        {#each suggestions as s}
          <button class="chip" onclick={() => (name = s)}>{s}</button>
        {/each}
      </div>
    {/if}
    <BarcodeField bind:value={barcode} onscan={onScan} />
  </div>

  <div class="weight">
    <span class="label">Starting weight</span>
    <span class="num mono" class:dim={!typed}>{typed || '0'}<span class="unit">&nbsp;g</span></span>
  </div>

  <div class="bottom">
    <Numpad bind:value={typed} size={60} onenter={start} />
    <button class="btn primary block" disabled={grams === null || grams <= 0} onclick={start}>Start tracking</button>
  </div>
</div>

<style>
  .heading {
    font-weight: 600;
  }
  .spacer {
    width: 48px;
  }
  .form {
    padding: 20px 20px 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .form > input {
    font-size: 18px;
  }
  .chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .chip {
    font-size: 13px;
    padding: 6px 10px;
    border-radius: 999px;
    border: none;
    background: var(--surface);
    color: var(--muted);
  }
  .weight {
    padding: 30px 20px 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }
  .num {
    font-size: 76px;
    font-weight: 500;
    line-height: 1;
  }
  .num.dim {
    color: var(--digit-dim);
  }
  .unit {
    font-size: 28px;
    color: var(--muted);
  }
</style>
