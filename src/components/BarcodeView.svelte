<script lang="ts">
  import JsBarcode from 'jsbarcode'
  import { jsBarcodeFormat } from '../lib/barcode'
  import type { Barcode } from '../lib/types'
  import { copy, fmtNum } from '../lib/util'
  import { toast } from '../lib/toast.svelte'

  let { code, name, eaten, onclose }: { code: Barcode; name: string; eaten?: number; onclose: () => void } = $props()

  let svg: SVGSVGElement

  $effect(() => {
    const opts = { width: 3, height: 140, margin: 16, displayValue: false, background: '#ffffff', lineColor: '#000000' }
    try {
      JsBarcode(svg, code.value, { ...opts, format: jsBarcodeFormat(code) })
    } catch {
      // invalid checksum etc. – CODE128 can encode anything
      JsBarcode(svg, code.value, { ...opts, format: 'CODE128' })
    }
  })

  async function copyText(e: MouseEvent, text: string, done: string) {
    e.stopPropagation()
    toast.show((await copy(text)) ? done : 'Copy failed')
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="overlay" role="dialog" aria-label="Barcode" tabindex="-1" onclick={onclose}>
  <div class="top">
    <span class="hint">Tap anywhere to close</span>
    <button class="close" aria-label="Close" onclick={onclose}>✕</button>
  </div>
  <div class="name">{name}</div>
  <svg bind:this={svg}></svg>
  <div class="digits mono">{code.value}</div>
  <div class="actions">
    <button class="btn light" onclick={(e) => copyText(e, code.value, 'Barcode copied')}>Copy number</button>
    {#if eaten !== undefined && eaten > 0}
      <button class="btn dark" onclick={(e) => copyText(e, String(eaten), `Copied ${fmtNum(eaten)}`)}>
        Copy {fmtNum(eaten)} g
      </button>
    {/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: #fff;
    color: #000;
    z-index: 20;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: calc(16px + env(safe-area-inset-top)) 16px calc(20px + env(safe-area-inset-bottom));
  }
  .top {
    align-self: stretch;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 15px;
  }
  .hint {
    color: #777;
  }
  .close {
    background: none;
    border: none;
    color: #000;
    font-weight: 600;
    padding: 4px;
  }
  .name {
    margin-top: auto;
    font-weight: 600;
    font-size: 22px;
    text-align: center;
  }
  svg {
    margin-top: 24px;
    width: 100%;
    max-width: 560px;
    height: auto;
  }
  .digits {
    margin-top: 20px;
    font-size: 26px;
    letter-spacing: 0.15em;
  }
  .actions {
    margin-top: auto;
    align-self: stretch;
    display: flex;
    gap: 10px;
  }
  .actions .btn {
    flex: 1;
    min-height: 60px;
  }
  .light {
    background: #f1f1f1;
    color: #000;
    border-color: #ddd;
  }
  .dark {
    background: #000;
    color: #fff;
    border-color: #000;
  }
</style>
