# Push 2 — GRADE · Backdrops · Presets

Three global systems to port from `reference/hard-reset-visualizer_17.html`, in this
order (presets last, since they must serialize whatever GRADE/backdrop state exists).
Keep `npm run build` green after each. Verify GRADE + presets in real Chrome
(`npm run dev`) — SVG filters and localStorage don't render in sandboxed previews.

Build order tip: do each as its own pass and re-run the build before moving on, so a
break is easy to bisect.

---

## 1. GRADE — global tone curve over the whole composite
Not an overlay layer — a tone curve applied to the entire output (base + all layers).

**Vanilla source** (grep these): `gradeCurve` (~line 1846), `updateGrade` (~1858),
the `<feComponentTransfer>` SVG (~225), and the LUT bake inside `compositeToCapture`
(~1905).

**Controls**: exposure, contrast, highlights, shadows, whites, blacks (all −100..100,
0 = off). Plus a reset.

**Port it as:**
- A shared `src/engine/grade.js` exporting `gradeCurve(x, grade)` (verbatim math) so the
  live filter and the export LUT can NEVER drift — both call the same function.
- Live: build a 33-entry `tableValues` string and feed an SVG `feComponentTransfer`
  (R/G/B `<feFuncX type="table">`) applied to the stage element via a CSS `filter`.
  Only attach the filter when grade is active (any channel ≠ 0).
- Export: in `useRecorder.js`'s `composite()`, AFTER drawing layers, if grade is active,
  build a 256-entry `Uint8ClampedArray` LUT from `gradeCurve` and apply it over the frame
  with `getImageData`/`putImageData`. Wrap in try/catch (a tainted/cross-origin canvas
  throws on readback — skip silently, matching vanilla).
- A `GradePanel` in the rail (top, above Add Layer), styled like the other sections.
- Grade state can live in a small context/store or App state; the recorder needs to read
  it, so expose it on the engine (e.g. `engine.setGrade(grade)` / `engine.getGrade()`).

---

## 2. Animated backdrops — gradient wash behind the stack
Shown behind all layers (and behind/over the base video via screen blend), animated.

**Vanilla source**: `const BACKDROPS = {` (~line 1741) through ~1832, and how it's
composited (`drawBase`, screen blend). Keys include `ember` plus rainbow / pride /
deep space / aurora.

**Port it as:**
- A dedicated backdrop `<canvas>` rendered in the stage BEHIND the layer canvases
  (z-index between the base video and the layers). Drive it from the engine clock.
- Port each `BACKDROPS[key].draw(ctx, t, W, H, lvl)` verbatim.
- A `BackdropPanel`: a style `<select>` (built from `Object.keys(BACKDROPS)`) + an
  on/off toggle. Default like vanilla (shown when no video plays).
- Export: composite the backdrop into `useRecorder.js`'s `composite()` too — screen
  blend over the base video — so exports match the live stage.

---

## 3. Presets + bundles — save / recall the full look
Two stores, one JSON format: localStorage slots (instant, per-browser) and JSON
files (portable export/import). Multi-select + bundle export/import + drag-reorder.

**Vanilla source**: `PRESET_KEY` / `PRESET_VER` (~2024), the serialize/apply/render
functions and bundle handling (~2024–2267).

**Captures**: every layer (type, blend, opacity, enabled, control params, **and baked
images as data URLs**), the base filter, and master intensity.
**Does NOT capture** the video queue (those are temporary blob URLs).

**Port it as:**
- A `src/state/presets.js` serializer that walks the layers reducer state into the JSON
  format, plus an apply path that dispatches a `HYDRATE` action to rebuild instances.
  React state stays the source of truth — restoring goes THROUGH the reducer.
- **Image baking**: `params.imgs` are `HTMLImageElement`s. On save, serialize each
  `img.src` (draw to a canvas → `toDataURL` if it's a blob URL, so it survives reload).
  On load, rebuild `new Image()` objects from the data URLs before putting them in params.
- A `PresetPanel`: save (name), slot list with recall/delete, JSON export/import,
  shift/⌘-click multi-select, bundle export/import, drag-to-reorder.
- Add `HYDRATE` (replace all layers from a serialized set) and reuse `SET`/`SET_PARAM`
  patterns in `layersReducer.js`.

**IMPORTANT compatibility note**: the vanilla format has separate `scrollgrid` and
`scrollgridv` layer types, but this build merged them into one `scrollgrid` with an
`orientation` param. When importing a legacy preset, map any `scrollgridv` layer to
`{ type:'scrollgrid', params:{ ...params, orientation:'vertical' } }`.

---

## Definition of done
- `npm run build` green.
- `npm run dev` in Chrome: grade visibly affects the whole composite; a recorded export
  carries the same grade + backdrop; saving a preset, reloading the page, and recalling
  it restores layers + images + intensity; bundle export/import round-trips.
