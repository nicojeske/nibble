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

<label class="field">
  <span>Barcode (optional)</span>
  <div class="row">
    <input class="grow" inputmode="numeric" placeholder="Scan or type" value={value?.value ?? ''} oninput={onInput} />
    <button type="button" class="btn" onclick={() => (scanning = true)}>Scan</button>
  </div>
</label>

{#if scanning}
  <Scanner
    onresult={(code) => {
      scanning = false
      value = code
      onscan?.(code)
    }}
    onclose={() => (scanning = false)}
  />
{/if}
