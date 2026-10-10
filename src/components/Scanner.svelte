<script lang="ts">
  import { onMount } from 'svelte'
  import { getDetector } from '../lib/barcode'
  import type { Barcode } from '../lib/types'

  let { onresult, onclose }: { onresult: (code: Barcode) => void; onclose: () => void } = $props()

  let video: HTMLVideoElement
  let error = $state<string | null>(null)
  let starting = $state(true)

  onMount(() => {
    let stream: MediaStream | undefined
    let stopped = false
    let timer: ReturnType<typeof setTimeout>

    ;(async () => {
      try {
        const [detector, s] = await Promise.all([
          getDetector(),
          navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          }),
        ])
        stream = s
        if (stopped) return stream.getTracks().forEach((t) => t.stop())
        video.srcObject = stream
        await video.play()
        starting = false

        const tick = async () => {
          if (stopped) return
          if (video.readyState >= 2) {
            try {
              const [hit] = await detector.detect(video)
              if (hit && !stopped) {
                navigator.vibrate?.(60)
                onresult({ value: hit.rawValue, format: hit.format })
                return
              }
            } catch {
              // transient decode errors are fine, keep scanning
            }
          }
          timer = setTimeout(tick, 150)
        }
        tick()
      } catch (e) {
        starting = false
        error =
          e instanceof DOMException && e.name === 'NotAllowedError'
            ? 'Camera permission denied. Allow camera access for this site and try again.'
            : `Could not start the scanner: ${e instanceof Error ? e.message : e}`
      }
    })()

    return () => {
      stopped = true
      clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  })
</script>

<div class="overlay">
  <!-- svelte-ignore a11y_media_has_caption -->
  <video bind:this={video} playsinline muted></video>
  <div class="frame"></div>
  <div class="status">
    {#if error}
      {error}
    {:else if starting}
      Starting camera…
    {:else}
      Point the camera at the barcode
    {/if}
  </div>
  <button class="btn close" onclick={onclose}>Cancel</button>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: #000;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .frame {
    position: relative;
    width: min(80vw, 420px);
    aspect-ratio: 2 / 1;
    border: 3px solid rgb(255 255 255 / 0.9);
    border-radius: 16px;
    box-shadow: 0 0 0 100vmax rgb(0 0 0 / 0.45);
  }
  .status {
    position: absolute;
    top: calc(24px + env(safe-area-inset-top));
    left: 16px;
    right: 16px;
    text-align: center;
    color: #fff;
    font-weight: 600;
  }
  .close {
    position: absolute;
    bottom: calc(32px + env(safe-area-inset-bottom));
    background: #fff;
    color: #000;
    border: none;
    min-width: 160px;
  }
</style>
