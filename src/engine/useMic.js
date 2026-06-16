import { useState, useRef, useCallback, useEffect } from 'react';
import { useEngine } from './EngineContext';

/* Mic reactivity. When on, feeds an analyser to the engine clock, which writes
   SIG.audio every frame. Cleans up the stream + context when off/unmounted. */
export function useMic(){
  const engine = useEngine();
  const [active, setActive] = useState(false);
  const [error, setError] = useState(null);
  const ref = useRef({ ctx:null, stream:null });

  const stop = useCallback(() => {
    const r = ref.current;
    engine.setAnalyser(null, null);
    if(r.stream){ r.stream.getTracks().forEach(t => t.stop()); r.stream = null; }
    if(r.ctx){ r.ctx.close().catch(()=>{}); r.ctx = null; }
    setActive(false);
  }, [engine]);

  const start = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const srcNode = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      srcNode.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      ref.current = { ctx, stream };
      engine.setAnalyser(analyser, data);
      setActive(true);
    } catch(err){
      setError(err?.message || 'mic unavailable');
      setActive(false);
    }
  }, [engine]);

  const toggle = useCallback(() => { active ? stop() : start(); }, [active, start, stop]);
  useEffect(() => () => stop(), [stop]);

  return { active, error, toggle, start, stop };
}
