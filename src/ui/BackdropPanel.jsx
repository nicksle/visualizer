import { useState, useEffect } from 'react';
import { useEngine } from '../engine/EngineContext';
import { BACKDROPS, BACKDROP_KEYS } from '../engine/backdrops';

export default function BackdropPanel(){
  const engine = useEngine();
  const [active, setActive] = useState(true);
  const [key, setKey] = useState('ember');

  useEffect(() => {
    engine.setBackdrop({ active, key });
  }, [engine, active, key]);

  return (
    <div className="section">
      <div className="head">
        <span className="label">Backdrop</span>
        <button className={'btn' + (active ? ' on' : '')} onClick={() => setActive(a => !a)} style={{fontSize:9, padding:'3px 6px'}}>
          {active ? 'On' : 'Off'}
        </button>
      </div>
      <div className="body">
        <div className="ctrl">
          <label>Style</label>
          <select value={key} onChange={e => setKey(e.target.value)}>
            {BACKDROP_KEYS.map(k => <option key={k} value={k}>{BACKDROPS[k].label}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
