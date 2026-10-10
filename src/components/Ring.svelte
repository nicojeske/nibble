<script lang="ts">
  let {
    pct,
    label,
    variant = 'default',
  }: { pct: number; label: string; variant?: 'default' | 'active' | 'dim' } = $props()

  const deg = $derived(Math.max(0, Math.min(1, pct)) * 100)
</script>

<div class="ring {variant}" style:--p="{deg}%">
  <div class="hole mono">{label}</div>
</div>

<style>
  .ring {
    --fill: var(--accent);
    --track: var(--border);
    --hole: var(--surface);
    width: 68px;
    height: 68px;
    flex: none;
    border-radius: 50%;
    background: conic-gradient(var(--fill) 0 var(--p), var(--track) 0);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ring.active {
    --fill: var(--on-accent);
    --track: color-mix(in srgb, var(--on-accent) 25%, transparent);
    --hole: var(--accent);
  }
  .ring.dim {
    --fill: var(--muted);
  }
  .hole {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--hole);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    font-size: 16px;
  }
  .active .hole {
    font-weight: 600;
    font-size: 15px;
  }
  .dim .hole {
    color: var(--muted);
    font-size: 14px;
  }
</style>
