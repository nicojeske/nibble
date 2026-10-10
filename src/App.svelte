<script lang="ts">
  import { router } from './lib/router.svelte'
  import { store } from './lib/store.svelte'
  import { toast } from './lib/toast.svelte'
  import Home from './routes/Home.svelte'
  import ItemPage from './routes/Item.svelte'
  import History from './routes/History.svelte'
  import Settings from './routes/Settings.svelte'

  const tabs = [
    { name: 'home', href: '#/', label: 'Open' },
    { name: 'history', href: '#/history', label: 'History' },
    { name: 'settings', href: '#/settings', label: 'Settings' },
  ]
</script>

<main>
  {#if router.route.name === 'item' && router.route.param}
    {#key router.route.param}
      <ItemPage id={router.route.param} />
    {/key}
  {:else if router.route.name === 'history'}
    <History />
  {:else if router.route.name === 'settings'}
    <Settings />
  {:else}
    <Home />
  {/if}
</main>

{#if store.undo}
  <div class="undo">
    <span>{store.undo.label}</span>
    <button class="link" onclick={() => store.undoLast()}>Undo</button>
    <button class="link dim" aria-label="Dismiss" onclick={() => (store.undo = null)}>✕</button>
  </div>
{/if}

{#if toast.message}
  <div class="toast" role="status">{toast.message}</div>
{/if}

<nav>
  {#each tabs as tab}
    <a href={tab.href} class:active={router.route.name === tab.name || (tab.name === 'home' && router.route.name === 'item')}>
      {tab.label}
    </a>
  {/each}
</nav>

<style>
  main {
    max-width: 560px;
    margin: 0 auto;
    padding: 16px 16px calc(140px + env(safe-area-inset-bottom));
  }
  nav {
    position: fixed;
    inset: auto 0 0 0;
    display: flex;
    background: var(--surface);
    border-top: 1px solid var(--border);
    padding-bottom: env(safe-area-inset-bottom);
  }
  nav a {
    flex: 1;
    text-align: center;
    padding: 16px 0;
    color: var(--muted);
    text-decoration: none;
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
    bottom: calc(72px + env(safe-area-inset-bottom));
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
  }
  .toast {
    bottom: calc(130px + env(safe-area-inset-bottom));
  }
  .undo span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .undo .link {
    color: var(--accent-on-dark);
  }
  .undo .dim {
    color: inherit;
    opacity: 0.6;
  }
</style>
