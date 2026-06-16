import { useEffect, useState } from 'react';
import { useEngine } from '../engine/EngineContext';
import { useMic } from '../engine/useMic';

export default function MasterPanel({ onPanic }){
  const engine = useEngine();
  const mic = useMic();
  const [intensity, setIntensity] = useState(55);
  const [fps, setFps] = useState(60);

  useEffect(() => { engine.setIntensity(intensity/100); }, [engine, intensity]);
  useEffect(() => {
    const id = setInterval(() => setFps(Math.round(engine.getFps())), 500);
    return () => clearInterval(id);
  }, [engine]);

  return (
    <div className="section">
      <div className="head">
        <span className="label">Master</span>
        <span className={'fpsbadge' + (fps < 40 ? ' low' : '')}>FPS <b>{fps}</b></span>
      </div>
      <div className="body">
        <div className="ctrl">
          <label>Intensity</label>
          <input type="range" min="0" max="100" value={intensity} onChange={e => setIntensity(+e.target.value)} />
          <span className="val">{intensity}%</span>
        </div>
        <div className="row">
          <button className={'btn' + (mic.active ? ' on' : '')} onClick={mic.toggle}>
            {mic.active ? '● Mic On' : '○ Mic'}
          </button>
          <button className="btn danger" onClick={onPanic} title="Clear all layers (keeps base video)">⟲ Panic Reset</button>
        </div>
        {mic.error && <div className="err">mic: {mic.error}</div>}
      </div>
    </div>
  );
}
