<script lang="ts">
  import { guessFormat } from '../lib/barcode'
  import type { Barcode } from '../lib/types'
  import Scanner from './Scanner.svelte'

  let { value = $bindable(), onscan }: { value: Barcode | undefined; onscan?: (code: Barcode) => void } = $props()

  let scanning = $state(false)

  function onInput(e: Event) {
    const text = (e.target as HTMLInputElement).value.replace(/\s/g, '')
    value = text ? { value: text, format: guessFormat(text) } : undefined
  }
</script>

<div class="barcode">
  <input
    class="mono"
    inputmode="numeric"
    aria-label="Barcode"
    placeholder="Barcode (optional)"
    value={value?.value ?? ''}
    oninput={onInput} />
  <button type="button" class="link" onclick={() => (scanning = true)}>{value ? 'Rescan' : 'Scan'}</button>
</div>

{#if scanning}
  <Scanner
    onresult={(code) => {
      scanning = false
      value = code
      onscan?.(code)
    }}
    onclose={() => (scanning = false)} />
{/if}

<style>
  .barcode {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 14px;
    border-radius: 14px;
    background: var(--surface);
  }
  input {
    flex: 1;
    min-width: 0;
    border: none;
    background: none;
    padding: 12px 0;
    font-size: 15px;
    letter-spacing: 0.06em;
  }
  input::placeholder {
    font-family: var(--sans);
    letter-spacing: normal;
    color: var(--muted);
  }
  .link {
    font-size: 14px;
  }
</style>
