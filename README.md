# HARD RESET — Layer Engine (React / Vite)

Multi-file React port of the vanilla build. Layer draws are ported verbatim,
so on-screen output matches the HTML build pixel-for-pixel.

## Run
```bash
npm install
npm run dev      # local dev server
npm run build    # production build -> dist/
```

## What's in this push (build 1 · push 1)
- Shared rAF engine (`EngineProvider` / `useFrame`), master signal + mic-driven `SIG.audio`
- `useLayerCanvas`: DPR sizing, per-frame draw, **per-layer error isolation** (a failing
  layer is skipped, never kills the clock), and the FX compositor pass
- All **15 layers** (Scroll Grid H+V merged into one `orientation` param):
  Sparkle Field, Sparkle Pop, Orbital Rings, Scan Grid, Strobe/Flash, Lightning,
  Solid Fill, Image/Logo, Video/GIF, Zoomquilt, Wormhole, Ben Day Dots, DVD Bounce, Scroll Grid
- **FX** (Acid Trip, Glitch) as a per-layer offscreen-buffer pass — add/remove/reorder
- Manifest-driven registry → Add menu, controls UI, Stage, exporter all read it
- Base video queue (loop modes queue/one/once, brightness/contrast/saturation)
- Mic reactivity, Master panel (intensity, **panic reset**, **FPS guard readout**)
- Export: format auto-detect (VP9/H.264/AV1/VP8), up to 4K/60, bitrate scaling,
  z-order capture compositor matching the live stage
- Projection/solo mode (press **H**)

## To add a layer
Write a component with `makeLayer({...})` (verbatim draw + controls schema) and drop it
into `COMPONENTS` in `src/layers/registry.js`. The manifest does the rest.

## Next (build 1 · push 2)
GRADE (live SVG `feComponentTransfer` + baked export LUT), animated backdrops,
presets + bundles (save/load, image baking, multi-select, import/export).

## Note
SVG filters and `localStorage` don't render in sandboxed previews — validate in Chrome
(this is why GRADE/presets land their own validated push).
