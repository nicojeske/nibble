<script lang="ts">
  let {
    value = $bindable(''),
    size = 56,
    onenter,
  }: { value: string; size?: number; onenter?: () => void } = $props()

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'del']

  function press(key: string) {
    navigator.vibrate?.(8)
    // Typing a name with the system keyboard open? Hand control back to the pad.
    if (document.activeElement instanceof HTMLInputElement) document.activeElement.blur()
    if (key === 'del') {
      value = value.slice(0, -1)
      return
    }
    if (key === ',') {
      if (!value.includes(',')) value = (value || '0') + ','
      return
    }
    const [whole, frac] = value.split(',')
    if (frac !== undefined) {
      if (frac.length < 1) value += key
    } else if (whole === '0') {
      value = key
    } else if (whole.length < 5) {
      value += key
    }
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return
    if (/^[0-9]$/.test(e.key)) press(e.key)
    else if (e.key === ',' || e.key === '.') press(',')
    else if (e.key === 'Backspace') press('del')
    else if (e.key === 'Enter' && onenter) onenter()
    else return
    e.preventDefault()
  }
</script>

<svelte:window {onkeydown} />

<div class="pad" style:--h="{size}px">
  {#each keys as key}
    <button type="button" class="key mono" aria-label={key === 'del' ? 'Delete' : key} onclick={() => press(key)}>
      {#if key === 'del'}
        <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">
          <path d="M9 1.5h15.5a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H9L1.5 10z" />
          <path d="M13.5 6.5l7 7M20.5 6.5l-7 7" />
        </svg>
      {:else}
        {key}
      {/if}
    </button>
  {/each}
</div>

<style>
  .pad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .key {
    height: var(--h);
    border: none;
    border-radius: 14px;
    background: var(--surface);
    color: var(--text);
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: manipulation;
    user-select: none;
  }
  .key:active {
    background: var(--border);
  }
  @media (max-height: 700px) {
    .key {
      height: calc(var(--h) - 10px);
    }
  }
</style>
