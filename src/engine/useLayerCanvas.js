import { useRef, useEffect, useCallback } from 'react';
import { useEngine, useFrame } from './EngineContext';
import { runFxChain } from './fx';

/* Every animated layer reuses this. Handles: canvas creation, DPR sizing,
   per-frame draw, the optional FX chain, error isolation (one failing layer
   can't kill the clock), and registering the canvas for export. */
export function useLayerCanvas(id, draw, { fx, onResize } = {}){
  const canvasRef = useRef(null);
  const stateRef  = useRef({});            // per-instance animation state (the vanilla `s`)
  const sizeRef   = useRef({ w:0, h:0 });
  const fxScratch = useRef({});
  const fxRef     = useRef(fx);
  fxRef.current   = fx;                     // always read the latest fx chain
  const engine = useEngine();

  useEffect(() => {
    const c = canvasRef.current; if(!c) return;
    const unregister = engine.registerCanvas(id, c);
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const parent = c.parentElement; if(!parent) return;
      const w = parent.clientWidth, h = parent.clientHeight;
      c.width = Math.max(1, Math.round(w*dpr));
      c.height = Math.max(1, Math.round(h*dpr));
      const ctx = c.getContext('2d');
      ctx.setTransform(dpr,0,0,dpr,0,0);
      sizeRef.current = { w, h };
      try { onResize?.(w, h, stateRef.current); } catch(e){ console.error('layer resize error', e); }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); unregister(); };
  }, [engine, id, onResize]);

  useFrame(useCallback(({ t, dt, lvl }) => {
    const c = canvasRef.current; if(!c) return;
    const ctx = c.getContext('2d');
    const { w, h } = sizeRef.current; if(!w || !h) return;
    const s = stateRef.current;
    try {
      const chain = fxRef.current;
      if(chain && chain.length){
        runFxChain(ctx, (buf) => draw(buf, t, dt, w, h, lvl, s), chain, t, dt, w, h, lvl, fxScratch.current);
      } else {
        ctx.clearRect(0,0,w,h);
        draw(ctx, t, dt, w, h, lvl, s);
      }
    } catch(err){
      console.error('layer draw/fx error (skipped this frame):', err);   // freeze prevention
    }
  }, [draw]));

  return { canvasRef, stateRef };
}
