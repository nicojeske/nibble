<script lang="ts">
  import BarcodeView from '../components/BarcodeView.svelte'
  import Receipt from '../components/Receipt.svelte'
  import { copyAndLog } from '../lib/actions'
  import { eatenAt, todayTotal, totalEaten } from '../lib/calc'
  import { go } from '../lib/router.svelte'
  import { store } from '../lib/store.svelte'
  import { toast } from '../lib/toast.svelte'
  import { fmtNum, fmtStamp } from '../lib/util'

  let { itemId, weighId }: { itemId: string; weighId: string } = $props()

  let showBarcode = $state(false)

  const item = $derived(store.get(itemId))
  const index = $derived(item?.weighs.findIndex((w) => w.id === weighId) ?? -1)
  const weigh = $derived(item && index > 0 ? item.weighs[index] : undefined)
  const eaten = $derived(item && weigh ? eatenAt(item, index) : 0)

  function undo() {
    store.undoLast()
    go(`/item/${itemId}`)
  }

  function done() {
    store.undo = null
    go('/')
  }

  async function retry() {
    if (!(await copyAndLog(itemId, weighId, eaten))) toast.show('Copy failed')
  }
</script>

<div class="screen">
  <div class="bar">
    <a href="#/" class="link" onclick={done}>‹ Scale</a>
    {#if weigh && store.undo}<button class="link dim" onclick={undo}>Undo</button>{/if}
  </div>

  {#if item && weigh}
    <div class="slip">
      <Receipt big>
        <div class="r-name" style:font-size="26px" style:line-height="1">{item.name}</div>
        <div class="r-dim">{fmtStamp(weigh.at)}{item.finishedAt === weigh.at ? ' · finished' : ''}</div>
        <div class="r-rule"></div>
        <div class="r-row"><span>Before</span><span>{fmtNum(item.weighs[index - 1].grams)} g</span></div>
        <div class="r-row"><span>Now</span><span>{fmtNum(weigh.grams)} g</span></div>
        <div class="r-rule"></div>
        <div class="r-row"><span>EATEN</span><span class="eaten">{fmtNum(eaten)} g</span></div>
        <div class="r-rule"></div>
        <div class="r-row r-dim"><span>Item total</span><span>{fmtNum(totalEaten(item))} g</span></div>
        <div class="r-row r-dim"><span>Today</span><span>{fmtNum(todayTotal(store.data.items))} g</span></div>
      </Receipt>
    </div>

    {#if eaten <= 0}
      <p class="status">Nothing to log</p>
    {:else if weigh.logged}
      <p class="status"><span class="check">✓</span>{fmtNum(eaten)} copied and marked logged</p>
    {:else}
      <button class="status retry" onclick={retry}>Copy {fmtNum(eaten)} &amp; mark logged</button>
    {/if}

    <div class="bottom row">
      {#if item.barcode}
        <button class="btn grow tall" onclick={() => (showBarcode = true)}>Show barcode</button>
      {/if}
      <button class="btn primary grow" onclick={done}>Done</button>
    </div>

    {#if showBarcode && item.barcode}
      <BarcodeView code={item.barcode} name={item.name} {eaten} onclose={() => (showBarcode = false)} />
    {/if}
  {:else}
    <p class="muted status">This weigh was undone.</p>
    <div class="bottom"><button class="btn primary block" onclick={done}>Back to the scale</button></div>
  {/if}
</div>

<style>
  .slip {
    margin: 28px 16px 0;
  }
  .eaten {
    font-size: 56px;
    font-weight: 600;
    line-height: 1;
  }
  .status {
    margin: 0;
    padding: 16px 20px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 14px;
    color: var(--text-2);
  }
  .retry {
    background: none;
    border: none;
    width: 100%;
    color: var(--accent);
    font-weight: 600;
  }
  .check {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--accent);
    color: var(--on-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
  }
  .bottom.row {
    flex-direction: row;
    gap: 10px;
    padding: 12px 16px 20px;
  }
  .tall,
  .bottom .btn.primary {
    min-height: 60px;
  }
</style>
