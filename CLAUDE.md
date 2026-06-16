# HARD RESET — Layer Engine

Browser-based VJ / compositing tool for a live Pride launch party. React + Vite
port of a mature vanilla single-file build. This is a **live-performance** tool —
robustness and never freezing matter as much as features.

## The golden rule: faithful ports
Anything that already exists in the vanilla build is ported **verbatim**. Copy the
draw/logic body exactly so output is pixel-identical — do not "improve", refactor,
or re-derive it. The authoritative source of truth is:

    reference/hard-reset-visualizer_17.html

When porting a feature, open that file, find the function, and match its behavior
exactly. `grep` it for names (e.g. `gradeCurve`, `BACKDROPS`, `PRESET_KEY`).

## Validation gate (do this before calling anything done)
Run a real production build — it's the robustness gate that catches broken imports,
JSX, and bad module graph:

    npm run build      # must be green

For features that use `localStorage` or SVG filters, ALSO verify in real Chrome via
`npm run dev` — those don't render in sandboxed previews but work in a real browser.

## Architecture
- **Clock**: one rAF loop in `src/engine/EngineContext.jsx`. Subscribe via `useFrame(fn)`.
- **Signal**: `src/engine/signal.js` exports mutable `SIG {intensity, audio}` and
  `level() = min(1, intensity+audio)`. The clock is the ONLY writer; layers may READ
  `SIG` (lightning beat, image 'beat' bounce, strobe punch).
- **Layer canvas**: `useLayerCanvas(id, draw, {fx, onResize})` — DPR sizing, per-frame
  draw wrapped in try/catch (freeze prevention), runs the FX chain when `fx` present,
  registers the canvas for export. Draw signature is `(ctx, t, dt, W, H, lvl, s)` —
  identical to the vanilla `draw()`, which is why ports are 1:1.
- **A layer** = `makeLayer({type,name,tag,blend,opacity,makeState,init,draw,controls})`
  in `src/layers/_factory.jsx`. Returns a component + `.manifest`. Control param values
  live ON the state object `s` (assigned each frame), exactly like the vanilla `L.state`.
- **Registry**: `src/layers/registry.js`. To add a layer: write the component, import it,
  add to `COMPONENTS`. That drives the Add menu, controls UI, Stage, and exporter.
- **FX**: `src/engine/fx.js`. Per-layer offscreen-buffer pass (acid, glitch); `runFxChain`
  ping-pongs buffers. FX can only transform a layer's own pixels — never the base video
  or layers below.
- **State**: `src/state/layersReducer.js`. Instance = `{id,type,enabled,opacity,blend,
  collapsed,fx,params}`. Actions: ADD / REMOVE / MOVE / SET / SET_PARAM / SET_FX / PANIC.
  React state is the source of truth — feature work goes through the reducer.
- **Export**: `src/engine/useRecorder.js`. Format auto-detect (VP9/H.264/AV1/VP8), z-order
  capture compositor that mirrors the live stage, bitrate scaling. **The composite here is
  where any global effect (GRADE, backdrops) must also be applied so exports match.**
- **Mic**: `src/engine/useMic.js` → analyser → engine writes `SIG.audio` each frame.

## Conventions
- Design tokens (use the CSS vars in `src/styles.css`): JetBrains Mono; bg `#0a0a0b`,
  panels `#121214`/`#161618`; accent amber `#ffb000`; 4px radius; wide-tracked uppercase
  labels. Match this look for any new UI.
- Helpers in `src/layers/_helpers.js`: `hexA`, `PRIDE`, `sparkle`, `glint`, `ringPath`,
  `BOLT`/`drawBolt`, `groundColor`/`drawShape`/`drawDots`/`buildFlat`, `CELL_ASPECT`, `pickImg`.
- Slot-indexed stable selection (`pickImg(n,count,mode)`) keys image/colour content to the
  integer slot index so tiles don't flicker on wrap. Reuse this pattern for grids.
- Always clamp particle counts. Layer draws are already try/catch-wrapped — keep it that way
  so one failing layer can't kill the rAF loop.
- Aesthetic is **cartoony > realistic** (e.g. the flat angular amber lightning bolt).
- IP pattern: build native equivalents, never clone a named/branded thing.

## What's built (push 1)
Engine + all 15 layers (Scroll Grid H+V merged into ONE component with an `orientation`
param) + FX + base video queue + mic + export + projection mode (press **H**).

## What's next (push 2 — your task)
GRADE, animated backdrops, and presets + bundles. See `docs/PUSH2.md` for the full brief,
source line regions, and integration points. Port each from `reference/hard-reset-visualizer_17.html`,
keep `npm run build` green, and verify GRADE + presets in real Chrome.
