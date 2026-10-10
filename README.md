# Nibble

Weigh before, weigh after. Nibble is a tiny offline PWA for calorie tracking with a kitchen scale:

1. **New item**: name, starting weight, optionally scan the barcode.
2. **Weigh again** whenever you've eaten some: it shows the grams eaten since the last weigh, ready to copy into your tracking app.
3. **Finish** by weighing the empty packaging (or entering 0).
4. **Show barcode** re-renders the scanned code, so you can scan it with your tracker or copy the number.

History groups everything by day and highlights entries you haven't logged into your tracker yet.

All data lives in your browser's localStorage. Nothing is sent anywhere. Use **Settings → Export** for backups. On iOS, add the app to the Home Screen, otherwise Safari may clear its storage after a week of inactivity.

Live: https://nicojeske.github.io/nibble/

## Development

```sh
npm install
npm run dev      # http://localhost:5173/nibble/
npm test
npm run build
```

Svelte 5 + Vite + vite-plugin-pwa. Barcode scanning uses the native `BarcodeDetector` when available and falls back to [zxing-wasm](https://github.com/Sec-ant/zxing-wasm) (served locally, so it works offline). Barcodes are rendered with [JsBarcode](https://github.com/lindell/JsBarcode).

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.
