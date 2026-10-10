<script lang="ts">
  import JsBarcode from 'jsbarcode'
  import { jsBarcodeFormat } from '../lib/barcode'
  import type { Barcode } from '../lib/types'
  import { copy } from '../lib/util'
  import { toast } from '../lib/toast.svelte'

  let { code, name, onclose }: { code: Barcode; name: string; onclose: () => void } = $props()

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

  async function copyDigits(e: MouseEvent) {
    e.stopPropagation()
    toast.show((await copy(code.value)) ? 'Barcode copied' : 'Copy failed')
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="overlay" role="dialog" aria-label="Barcode" tabindex="-1" onclick={onclose}>
  <div class="name">{name}</div>
  <svg bind:this={svg}></svg>
  <div class="digits">{code.value}</div>
  <button class="btn" onclick={copyDigits}>Copy number</button>
  <div class="hint">Tap anywhere to close</div>
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
    justify-content: center;
    gap: 16px;
    padding: 16px;
  }
  svg {
    width: 100%;
    max-width: 560px;
    height: auto;
  }
  .name {
    font-weight: 600;
    font-size: 1.2rem;
    text-align: center;
  }
  .digits {
    font-family: ui-monospace, monospace;
    font-size: 1.6rem;
    letter-spacing: 0.15em;
  }
  .btn {
    background: #f1f1f1;
    color: #000;
    border-color: #ddd;
  }
  .hint {
    color: #777;
    font-size: 0.9rem;
  }
</style>
