import { useRef, useCallback } from 'react';
import { useEngine, useFrame } from './EngineContext';

/* Samples the live stage into a tiny canvas every few frames, averages edge
   pixels, and applies the result as a dynamic box-shadow on the stage wrapper. */
export function useStageGlow(stageRef){
  const engine = useEngine();
  const sample = useRef(null);
  const frame = useRef(0);

  if(!sample.current && typeof document !== 'undefined'){
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    sample.current = { canvas:c, ctx:c.getContext('2d', { willReadFrequently:true }) };
  }

  useFrame(useCallback(({ t }) => {
    // sample every 6 frames (~10 Hz at 60fps) to keep it cheap
    if(++frame.current % 6 !== 0) return;
    const wrap = stageRef?.current; if(!wrap) return;
    const s = sample.current; if(!s) return;
    const { ctx, canvas:sc } = s;
    const W = 16, H = 16;

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    // draw backdrop
    const bd = engine.getBackdrop();
    if(bd.active && bd.canvas){
      ctx.drawImage(bd.canvas, 0, 0, W, H);
    }

    // draw layer canvases
    // we don't have the layers array here, but we can iterate registered canvases
    // Instead, just grab all canvas elements from the stage DOM
    const stage = wrap.querySelector('.stage');
    if(stage){
      const canvases = stage.querySelectorAll('canvas');
      canvases.forEach(c => {
        if(c.style.display === 'none' || !c.width || !c.height) return;
        const op = parseFloat(c.style.opacity);
        if(op <= 0) return;
        ctx.globalAlpha = isNaN(op) ? 1 : op;
        const blend = c.style.mixBlendMode;
        ctx.globalCompositeOperation = blend === 'plus-lighter' ? 'lighter'
          : (blend || 'source-over');
        try { ctx.drawImage(c, 0, 0, W, H); } catch(e){}
      });
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // sample edges
    let data;
    try { data = ctx.getImageData(0, 0, W, H).data; } catch(e){ return; }

    let rT=0, gT=0, bT=0, nT=0; // top
    let rB=0, gB=0, bB=0, nB=0; // bottom
    let rL=0, gL=0, bL=0, nL=0; // left
    let rR=0, gR=0, bR=0, nR=0; // right

    for(let x = 0; x < W; x++){
      // top 2 rows
      for(let y = 0; y < 2; y++){
        const i = (y*W+x)*4;
        rT+=data[i]; gT+=data[i+1]; bT+=data[i+2]; nT++;
      }
      // bottom 2 rows
      for(let y = H-2; y < H; y++){
        const i = (y*W+x)*4;
        rB+=data[i]; gB+=data[i+1]; bB+=data[i+2]; nB++;
      }
    }
    for(let y = 0; y < H; y++){
      // left 2 cols
      for(let x = 0; x < 2; x++){
        const i = (y*W+x)*4;
        rL+=data[i]; gL+=data[i+1]; bL+=data[i+2]; nL++;
      }
      // right 2 cols
      for(let x = W-2; x < W; x++){
        const i = (y*W+x)*4;
        rR+=data[i]; gR+=data[i+1]; bR+=data[i+2]; nR++;
      }
    }

    // overall average for the main glow
    const n = nT+nB+nL+nR;
    const r = Math.round((rT+rB+rL+rR)/n);
    const g = Math.round((gT+gB+gL+gR)/n);
    const b = Math.round((bT+bB+bL+bR)/n);

    // boost brightness so dim content still glows visibly
    const mx = Math.max(r, g, b, 1);
    const boost = Math.min(2.5, 120 / mx);
    const br = Math.min(255, Math.round(r * boost));
    const bg = Math.min(255, Math.round(g * boost));
    const bb = Math.min(255, Math.round(b * boost));

    wrap.style.boxShadow =
      `0 0 30px 6px rgba(${br},${bg},${bb},0.12), ` +
      `0 0 80px 12px rgba(${br},${bg},${bb},0.06)`;
  }, [engine, stageRef]));
}
