import { useState } from 'react';
import { FX, FX_ADDABLE } from '../engine/fx';

/* Per-layer FX chain: add / remove / reorder, plus each FX's own params.
   FX run as a compositor pass over the layer's pixels (see useLayerCanvas). */
export default function FxControls({ layer, dispatch }){
  const [pick, setPick] = useState(FX_ADDABLE[0]);
  const fx = layer.fx || [];
  const commit = (next) => dispatch({ type:'SET_FX', id:layer.id, fx:next });

  const add = () => {
    const def = FX[pick]; if(!def) return;
    const params = {}; (def.controls||[]).forEach(c => { if(c.def !== undefined) params[c.key] = c.def; });
    commit([...fx, { type:pick, params, _s:{} }]);
  };
  const remove = (i) => commit(fx.filter((_, j) => j !== i));
  const move = (i, dir) => {
    const j = i + dir; if(j < 0 || j >= fx.length) return;
    const next = fx.slice(); [next[i], next[j]] = [next[j], next[i]]; commit(next);
  };
  const setParam = (i, key, value) => {
    const next = fx.map((f, j) => j === i ? { ...f, params:{ ...f.params, [key]:value } } : f);
    commit(next);
  };

  return (
    <div style={{display:'flex', flexDirection:'column', gap:6}}>
      <div className="row">
        <span className="label" style={{flex:1}}>FX</span>
        <select value={pick} onChange={e => setPick(e.target.value)} style={{background:'var(--panel)', border:'1px solid var(--line)', borderRadius:3, padding:3}}>
          {FX_ADDABLE.map(id => <option key={id} value={id}>{FX[id].name}</option>)}
        </select>
        <button className="iconbtn" onClick={add} title="Add FX">+</button>
      </div>
      {fx.map((f, i) => {
        const def = FX[f.type]; if(!def) return null;
        return (
          <div key={i} className="section" style={{background:'var(--panel)'}}>
            <div className="head" style={{cursor:'default'}}>
              <span className="tag" style={{color:'var(--accent)'}}>{def.name}</span>
              <span className="row">
                <button className="iconbtn" onClick={() => move(i,-1)} title="up">↑</button>
                <button className="iconbtn" onClick={() => move(i,1)} title="down">↓</button>
                <button className="iconbtn" onClick={() => remove(i)} title="remove">✕</button>
              </span>
            </div>
            <div className="body">
              {(def.controls||[]).map(c => (
                <div className="ctrl" key={c.key}>
                  <label>{c.label}</label>
                  {c.type === 'range'
                    ? <><input type="range" min={c.min} max={c.max} step={c.step||1}
                        value={f.params[c.key] ?? c.def} onChange={e => setParam(i, c.key, +e.target.value)} />
                        <span className="val">{f.params[c.key] ?? c.def}{c.suffix||''}</span></>
                    : c.type === 'color'
                    ? <input type="color" value={f.params[c.key] ?? c.def} onChange={e => setParam(i, c.key, e.target.value)} />
                    : <select value={f.params[c.key] ?? c.def} onChange={e => setParam(i, c.key, e.target.value)}>
                        {(c.options||[]).map(o => <option key={o} value={o}>{o}</option>)}
                      </select>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
