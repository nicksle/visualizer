import { useRef, useEffect, useCallback } from 'react';
import { useEngine, useFrame } from '../engine/EngineContext';
import { BACKDROPS } from '../engine/backdrops';

/* Backdrop canvas — sits between the base video and layers in the stage.
   Driven by the engine clock; the engine stores a ref so the exporter can composite it. */
export default function Backdrop(){
  const engine = useEngine();
  const canvasRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current; if(!c) return;
    engine.setBackdrop({ canvas:c });
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const p = c.parentElement; if(!p) return;
      c.width = Math.max(1, Math.round(p.clientWidth * dpr));
      c.height = Math.max(1, Math.round(p.clientHeight * dpr));
      c.getContext('2d').setTransform(dpr,0,0,dpr,0,0);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); engine.setBackdrop({ canvas:null }); };
  }, [engine]);

  useFrame(useCallback(({ t, lvl }) => {
    const c = canvasRef.current; if(!c) return;
    const bd = engine.getBackdrop();
    const ctx = c.getContext('2d');
    const p = c.parentElement; if(!p) return;
    const W = p.clientWidth, H = p.clientHeight;
    if(!bd.active){
      ctx.clearRect(0,0,W,H);
      return;
    }
    const entry = BACKDROPS[bd.key] || BACKDROPS.ember;
    entry.draw(ctx, t, W, H, lvl, bd.opts);
  }, [engine]));

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:'absolute', inset:0, width:'100%', height:'100%',
        zIndex:1, pointerEvents:'none', mixBlendMode:'screen',
      }}
    />
  );
}
