import { createContext, useContext, useRef, useEffect, useCallback } from 'react';
import { SIG, level } from './signal';
import { GRADE_DEFAULTS } from './grade';

const EngineContext = createContext(null);

export function EngineProvider({ children }){
  const subs   = useRef(new Set());                 // Set<fn({t,dt,lvl,audio})>
  const canvases = useRef(new Map());               // id -> visible <canvas> (for export z-order)
  const analyser = useRef(null);                    // set by useMic
  const micData  = useRef(null);
  const base = useRef({ video:null, filter:{bright:100,contrast:100,sat:100} });
  const grade = useRef({ ...GRADE_DEFAULTS });
  const backdrop = useRef({ active:false, key:'ember', canvas:null });
  const fps  = useRef({ ema:60, last:0 });

  useEffect(() => {
    let raf, last = performance.now()/1000;
    const tick = (nowMs) => {
      const now = nowMs/1000;
      const dt = Math.min(0.05, now - last); last = now;
      // mic -> SIG.audio
      if(analyser.current && micData.current){
        analyser.current.getByteFrequencyData(micData.current);
        let sum=0; const d=micData.current; for(let i=0;i<d.length;i++) sum+=d[i];
        SIG.audio = (sum/d.length/255)*0.7;
      } else { SIG.audio = 0; }
      // fps ema
      if(dt>0){ const inst=1/dt; fps.current.ema = fps.current.ema*0.9 + inst*0.1; }
      const lvl = level();
      const frame = { t:now, dt, lvl, audio:SIG.audio };
      subs.current.forEach(fn => { try{ fn(frame); }catch(e){ /* isolated below too */ } });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const api = useRef({
    subscribe(fn){ subs.current.add(fn); return () => subs.current.delete(fn); },
    registerCanvas(id, el){ canvases.current.set(id, el); return () => canvases.current.delete(id); },
    getCanvas(id){ return canvases.current.get(id); },
    setIntensity(v){ SIG.intensity = v; },
    setAnalyser(an, data){ analyser.current = an; micData.current = data; },
    setBaseVideo(el){ base.current.video = el; },
    setBaseFilter(f){ base.current.filter = f; },
    getBase(){ return base.current; },
    setGrade(g){ grade.current = g; },
    getGrade(){ return grade.current; },
    setBackdrop(b){ Object.assign(backdrop.current, b); },
    getBackdrop(){ return backdrop.current; },
    getFps(){ return fps.current.ema; },
  }).current;

  return <EngineContext.Provider value={api}>{children}</EngineContext.Provider>;
}

export function useEngine(){ return useContext(EngineContext); }

/* subscribe to the shared clock. Wrap `fn` in useCallback at the call site. */
export function useFrame(fn){
  const engine = useEngine();
  useEffect(() => engine.subscribe(fn), [engine, fn]);
}
