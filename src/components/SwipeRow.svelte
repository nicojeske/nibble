<script lang="ts">
  import type { Snippet } from 'svelte'

  let { onswipe, children }: { onswipe: () => void; children: Snippet } = $props()

  const THRESHOLD = 90
  let startX = 0
  let startY = 0
  let dx = $state(0)
  let dragging = $state(false)
  let moved = false
  let pointerId: number | null = null

  function down(e: PointerEvent) {
    if (e.button !== 0) return
    pointerId = e.pointerId
    startX = e.clientX
    startY = e.clientY
    moved = false
  }

  function move(e: PointerEvent) {
    if (e.pointerId !== pointerId) return
    const x = e.clientX - startX
    const y = e.clientY - startY
    if (!dragging) {
      if (Math.abs(y) > 10 && Math.abs(y) > Math.abs(x)) return up()
      if (x < 10) return
      dragging = true
      moved = true
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    dx = Math.max(0, Math.min(x, 160))
  }

  function up() {
    if (dragging && dx >= THRESHOLD) {
      navigator.vibrate?.(20)
      onswipe()
    }
    pointerId = null
    dragging = false
    dx = 0
  }

  /** Swallow the click that ends a swipe, so it doesn't also open the item. */
  function click(e: MouseEvent) {
    if (moved) {
      e.stopPropagation()
      e.preventDefault()
      moved = false
    }
  }
</script>

<div class="swipe" class:armed={dx >= THRESHOLD}>
  <div class="under" aria-hidden="true">✓ Logged</div>
  <div
    class="over"
    class:dragging
    style:transform="translateX({dx}px)"
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={up}
    onclickcapture={click}
    role="presentation">
    {@render children()}
  </div>
</div>

<style>
  .swipe {
    position: relative;
    overflow: hidden;
    background: var(--border);
  }
  .swipe.armed {
    background: var(--good);
  }
  .under {
    position: absolute;
    left: 20px;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    font-weight: 700;
    color: #fff;
  }
  .over {
    position: relative;
    background: var(--surface);
    touch-action: pan-y;
    transition: transform 0.2s ease;
  }
  .over.dragging {
    transition: none;
  }
</style>
