<script lang="ts">
  import { router } from './lib/router.svelte'
  import { store } from './lib/store.svelte'
  import { toast } from './lib/toast.svelte'
  import Home from './routes/Home.svelte'
  import ItemPage from './routes/Item.svelte'
  import NewItem from './routes/New.svelte'
  import Done from './routes/Done.svelte'
  import History from './routes/History.svelte'
  import Settings from './routes/Settings.svelte'

  const tabs = [
    { name: 'home', href: '#/', label: 'Scale' },
    { name: 'history', href: '#/history', label: 'History' },
    { name: 'settings', href: '#/settings', label: 'Settings' },
  ]

  const name = $derived(router.route.name)
  const showTabs = $derived(tabs.some((t) => t.name === name) || !['item', 'new', 'done'].includes(name))
</script>

<div class="app">
  <main>
    {#if name === 'item' && router.route.param}
      {#key router.route.param}
        <ItemPage id={router.route.param} />
      {/key}
    {:else if name === 'new'}
      {#key router.route.param}
        <NewItem grams={router.route.param} />
      {/key}
    {:else if name === 'done' && router.route.params.length === 2}
      <Done itemId={router.route.params[0]} weighId={router.route.params[1]} />
    {:else if name === 'history'}
      <History />
    {:else if name === 'settings'}
      <Settings />
    {:else}
      <Home />
    {/if}
  </main>

  {#if store.undo && name !== 'done'}
    <div class="undo">
      <span>{store.undo.label}</span>
      <button class="link" onclick={() => store.undoLast()}>Undo</button>
      <button class="link dim" aria-label="Dismiss" onclick={() => (store.undo = null)}>✕</button>
    </div>
  {/if}

  {#if toast.message}
    <div class="toast" role="status">{toast.message}</div>
  {/if}

  {#if showTabs}
    <nav>
      {#each tabs as tab}
        <a href={tab.href} class:active={name === tab.name || (tab.name === 'home' && !tabs.some((t) => t.name === name))}>
          {tab.label}
        </a>
      {/each}
    </nav>
  {/if}
</div>

<style>
  .app {
    max-width: 560px;
    margin: 0 auto;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }
  main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  nav {
    flex: none;
    display: flex;
    justify-content: space-around;
    padding: 8px 0 14px;
  }
  nav a {
    padding: 8px 16px;
    color: var(--muted);
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
  }
  nav a.active {
    color: var(--accent);
  }
  .undo,
  .toast {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    top: calc(12px + env(safe-area-inset-top));
    background: var(--text);
    color: var(--bg);
    border-radius: 12px;
    padding: 10px 14px;
    display: flex;
    gap: 12px;
    align-items: center;
    max-width: calc(100% - 32px);
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.25);
    z-index: 5;
    font-size: 14px;
  }
  .undo + .toast {
    top: calc(64px + env(safe-area-inset-top));
  }
  .undo span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .undo .link {
    color: var(--bg);
    text-decoration: underline;
  }
  .undo .dim {
    color: inherit;
    opacity: 0.6;
    text-decoration: none;
  }
</style>
