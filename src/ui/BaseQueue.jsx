import { useEffect, useRef, useState, useCallback } from 'react';
import { useEngine } from '../engine/EngineContext';

const LOOPS = ['queue','one','once'];

/* Base video queue: load clips, transport, loop modes, and brightness/contrast/
   saturation. The <video> element itself is rendered by App inside the stage
   (behind the layers); this panel drives it through the shared ref. */
export default function BaseQueue({ videoRef }){
  const engine = useEngine();
  const [queue, setQueue] = useState([]);     // [{url,name}]
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState('queue');
  const [filter, setFilter] = useState({ bright:100, contrast:100, sat:100 });
  const loopRef = useRef(loop); loopRef.current = loop;
  const idxRef = useRef(idx); idxRef.current = idx;
  const qRef = useRef(queue); qRef.current = queue;

  const applyFilter = useCallback((f) => {
    const v = videoRef.current; if(v) v.style.filter = `brightness(${f.bright}%) contrast(${f.contrast}%) saturate(${f.sat}%)`;
    engine.setBaseFilter(f);
  }, [engine, videoRef]);

  useEffect(() => { applyFilter(filter); }, [filter, applyFilter]);

  const playIndex = useCallback((i) => {
    const v = videoRef.current, q = qRef.current; if(!v || !q[i]) return;
    v.src = q[i].url; v.style.display = 'block';
    v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    setIdx(i);
  }, [videoRef]);

  const onLoad = (e) => {
    const items = [...e.target.files].map(f => ({ url:URL.createObjectURL(f), name:f.name }));
    if(!items.length) return;
    const wasEmpty = qRef.current.length === 0;
    const next = [...qRef.current, ...items];
    setQueue(next); qRef.current = next;
    if(wasEmpty){ setTimeout(() => playIndex(0), 0); }
  };

  useEffect(() => {
    const v = videoRef.current; if(!v) return;
    const onEnded = () => {
      const mode = loopRef.current, i = idxRef.current, n = qRef.current.length;
      if(mode === 'one'){ v.currentTime = 0; v.play().catch(()=>{}); }
      else if(mode === 'once'){ if(i < n-1) playIndex(i+1); else setPlaying(false); }
      else { playIndex((i+1) % n); }   // queue: wrap
    };
    v.addEventListener('ended', onEnded);
    return () => v.removeEventListener('ended', onEnded);
  }, [videoRef, playIndex]);

  const toggle = () => {
    const v = videoRef.current; if(!v) return;
    if(v.paused){ v.play().then(()=>setPlaying(true)).catch(()=>{}); } else { v.pause(); setPlaying(false); }
  };
  const step = (d) => { const n = qRef.current.length; if(!n) return; playIndex((idx + d + n) % n); };
  const fset = (k, val) => setFilter(f => ({ ...f, [k]:val }));

  return (
    <div className="row" style={{flexWrap:'wrap', gap:10, alignItems:'center'}}>
      <span className="label">Base</span>
      <label className="btn" style={{cursor:'pointer'}}>
        + Clips<input type="file" accept="video/*" multiple style={{display:'none'}} onChange={onLoad} />
      </label>
      <button className="btn" onClick={() => step(-1)} disabled={!queue.length}>⏮</button>
      <button className="btn" onClick={toggle} disabled={!queue.length}>{playing ? '❚❚' : '►'}</button>
      <button className="btn" onClick={() => step(1)} disabled={!queue.length}>⏭</button>
      <select value={loop} onChange={e => setLoop(e.target.value)} title="loop mode"
        style={{background:'var(--panel2)', border:'1px solid var(--line)', borderRadius:3, padding:4}}>
        {LOOPS.map(l => <option key={l} value={l}>loop: {l}</option>)}
      </select>
      <span className="label" style={{maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
        {queue.length ? `${idx+1}/${queue.length} · ${queue[idx]?.name || ''}` : 'no clips'}
      </span>
      <span className="row" style={{gap:8}}>
        {[['bright','BRT'],['contrast','CON'],['sat','SAT']].map(([k,lab]) => (
          <span className="row" key={k} style={{gap:4}}>
            <span className="label">{lab}</span>
            <input type="range" min="0" max="200" value={filter[k]} onChange={e => fset(k, +e.target.value)} style={{width:70, accentColor:'var(--accent)'}} />
          </span>
        ))}
      </span>
    </div>
  );
}
