import type { Barcode } from './types'

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf'] as const

interface Detector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string; format: string }[]>
}

let detector: Promise<Detector> | undefined

/** Native BarcodeDetector where available (Chrome Android), zxing-wasm otherwise (iOS, Firefox). */
export function getDetector(): Promise<Detector> {
  return (detector ??= (async () => {
    const Native = (globalThis as { BarcodeDetector?: any }).BarcodeDetector
    if (Native) {
      const supported: string[] = await Native.getSupportedFormats()
      const formats = FORMATS.filter((f) => supported.includes(f))
      if (formats.length) return new Native({ formats })
    }
    const [{ BarcodeDetector, prepareZXingModule }, { default: wasmUrl }] = await Promise.all([
      import('barcode-detector/ponyfill'),
      import('zxing-wasm/reader/zxing_reader.wasm?url'),
    ])
    // Serve the wasm from our own origin so scanning works offline.
    prepareZXingModule({ overrides: { locateFile: () => wasmUrl }, fireImmediately: true })
    return new BarcodeDetector({ formats: [...FORMATS] })
  })())
}

/** JsBarcode format for a stored barcode; falls back to CODE128 which encodes anything. */
export function jsBarcodeFormat(code: Barcode): string {
  const digits = /^\d+$/.test(code.value)
  switch (code.format) {
    case 'ean_13':
      return digits && code.value.length === 13 ? 'EAN13' : 'CODE128'
    case 'ean_8':
      return digits && code.value.length === 8 ? 'EAN8' : 'CODE128'
    case 'upc_a':
      return digits && code.value.length === 12 ? 'UPC' : 'CODE128'
    case 'upc_e':
      return digits && code.value.length === 8 ? 'UPCE' : 'CODE128'
    default:
      return 'CODE128'
  }
}

/** Guess the format of a manually typed code. */
export function guessFormat(value: string): string {
  if (/^\d{13}$/.test(value)) return 'ean_13'
  if (/^\d{12}$/.test(value)) return 'upc_a'
  if (/^\d{8}$/.test(value)) return 'ean_8'
  return 'code_128'
}
