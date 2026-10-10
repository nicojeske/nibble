<script lang="ts">
  import { store } from '../lib/store.svelte'
  import { toast } from '../lib/toast.svelte'

  const EXPORT_KEY = 'nibble:lastExport'

  let persisted = $state<boolean | null>(null)
  navigator.storage?.persisted?.().then((p) => (persisted = p))

  let lastExport = $state(readLastExport())

  function readLastExport() {
    try {
      return Number(localStorage.getItem(EXPORT_KEY)) || null
    } catch {
      return null
    }
  }

  function exportData() {
    const blob = new Blob([store.exportJson()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `nibble-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    lastExport = Date.now()
    try {
      localStorage.setItem(EXPORT_KEY, String(lastExport))
    } catch {
      // not critical
    }
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

<div class="screen">
  <div class="bar"><span class="title">Settings</span></div>

  {#if persisted === false}
    <p class="warn">Storage isn't persistent. Add Nibble to your Home Screen so the browser keeps your data.</p>
  {/if}

  <div class="head label">Backup</div>
  <div class="list">
    <button class="item" onclick={exportData}>
      <span>Export JSON</span>
      <span class="muted small">
        last: {lastExport ? new Date(lastExport).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'never'}
      </span>
    </button>
    <label class="item">
      <span>Import JSON</span>
      <span class="muted">›</span>
      <input type="file" accept="application/json,.json" hidden onchange={importData} />
    </label>
  </div>

  <div class="head label">Cleanup</div>
  <div class="list">
    <button class="item" disabled={store.finished.length === 0} onclick={() => store.clearFinished()}>
      <span>Delete finished items</span>
      <span class="mono muted">{store.finished.length}</span>
    </button>
  </div>

  <p class="foot muted">
    Your data lives only in this browser. {store.open.length} open, {store.finished.length} finished items.
  </p>
</div>

<style>
  .warn {
    margin: 18px 20px 0;
    padding: 14px 16px;
    border-radius: 14px;
    background: var(--warn-bg);
    color: var(--warn);
    font-size: 14px;
    line-height: 1.45;
  }
  .head {
    padding: 26px 20px 8px;
  }
  .list {
    border-top: 1px solid var(--border);
  }
  .item {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border: none;
    border-bottom: 1px solid var(--border);
    background: none;
    color: var(--text);
    font-size: 1rem;
    text-align: left;
    cursor: pointer;
  }
  .item:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .small {
    font-size: 14px;
  }
  .foot {
    padding: 20px 20px 0;
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
  }
</style>
