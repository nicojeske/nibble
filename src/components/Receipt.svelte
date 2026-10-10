<script lang="ts">
  import type { Snippet } from 'svelte'

  let { children, big = false }: { children: Snippet; big?: boolean } = $props()
</script>

<div class="receipt mono" class:big>{@render children()}</div>

<style>
  .receipt {
    background: var(--paper);
    color: var(--ink);
    border-radius: 6px 6px 0 0;
    border-bottom: 3px dashed var(--bg);
    box-shadow: var(--paper-edge);
    padding: 18px 18px 16px;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 0;
  }
  .receipt.big {
    padding: 24px 20px 28px;
    font-size: 14px;
    gap: 10px;
  }
  .receipt :global(.r-row) {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }
  .receipt :global(.r-rule) {
    border-top: 1px dashed var(--rule);
    margin: 4px 0;
  }
  .receipt :global(.r-dim) {
    color: var(--ink-2);
  }
  .receipt :global(.r-name) {
    font-family: var(--sans);
    font-weight: 700;
    font-size: 22px;
    line-height: 1.1;
  }
  .receipt :global(.r-now) {
    background: var(--ink);
    color: var(--paper);
    margin: 2px -6px;
    padding: 3px 6px;
  }
</style>
