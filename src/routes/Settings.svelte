<script lang="ts">
  import { store } from '../lib/store.svelte'
  import { toast } from '../lib/toast.svelte'

  let persisted = $state<boolean | null>(null)
  navigator.storage?.persisted?.().then((p) => (persisted = p))

  function exportData() {
    const blob = new Blob([store.exportJson()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `nibble-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function importData(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    try {
      store.importJson(await file.text())
      toast.show('Backup imported')
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Import failed', 3500)
    }
    input.value = ''
  }
</script>

<h1>Settings</h1>

<div class="card stack">
  <h3>Backup</h3>
  <p class="muted">Your data lives only in this browser. Export now and then to keep a copy.</p>
  <button class="btn block" onclick={exportData}>Export JSON</button>
  <label class="btn block">
    Import JSON
    <input type="file" accept="application/json,.json" hidden onchange={importData} />
  </label>
</div>

<div class="card stack">
  <h3>Cleanup</h3>
  <p class="muted">{store.finished.length} finished, {store.open.length} open items.</p>
  <button class="btn block" disabled={store.finished.length === 0} onclick={() => store.clearFinished()}>
    Delete finished items
  </button>
</div>

<div class="card stack">
  <h3>Storage</h3>
  <p class="muted">
    {#if persisted}
      Persistent storage granted. The browser won't clear your data on its own.
    {:else}
      Storage is not marked persistent. Install the app (Add to Home Screen) so the browser keeps your data.
    {/if}
  </p>
</div>

<style>
  .stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 12px;
  }
  h3 {
    margin: 0;
  }
  p {
    margin: 0;
  }
</style>
