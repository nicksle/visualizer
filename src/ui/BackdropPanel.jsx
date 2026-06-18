import { useState, useEffect } from 'react';
import { useEngine } from '../engine/EngineContext';
import { BACKDROPS, BACKDROP_KEYS } from '../engine/backdrops';

export default function BackdropPanel(){
  const engine = useEngine();
  const [key, setKey] = useState('ember');
  const [color, setColor] = useState('#000000');

  useEffect(() => {
    engine.setBackdrop({
      active: key !== 'none',
      key,
      opts: { color },
    });
  }, [engine, key, color]);

  return (
    <div className="section">
      <div className="head">
        <span className="label">Backdrop</span>
      </div>
      <div className="body">
        <div className="ctrl">
          <label>Style</label>
          <select value={key} onChange={e => setKey(e.target.value)}>
            {BACKDROP_KEYS.map(k => <option key={k} value={k}>{BACKDROPS[k].label}</option>)}
          </select>
        </div>
        {key === 'solid' && (
          <div className="ctrl">
            <label>Color</label>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} />
            <span style={{flex:1}} />
          </div>
        )}
      </div>
    </div>
  );
}
