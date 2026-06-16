import { useState } from 'react';

const SIZES = [['canvas','Stage'],['1280x720','720p'],['1920x1080','1080p'],['3840x2160','4K']];
const FPSES = [24,30,60];

export default function ExportPanel({ recorder, stageRef }){
  const [size, setSize] = useState('1920x1080');
  const [fps, setFps] = useState(30);
  const [quality, setQuality] = useState(16);
  const [fmt, setFmt] = useState('');
  const [msg, setMsg] = useState('');
  const formats = recorder.formats;
  const fmtId = fmt || (formats[0]?.id);

  const onRecord = () => {
    if(recorder.recording){ recorder.stop(); return; }
    const el = stageRef.current;
    const r = recorder.start({
      formatId: fmtId, size, fps, quality,
      stageW: el?.clientWidth || 1920, stageH: el?.clientHeight || 1080,
    });
    if(!r.ok) setMsg(r.msg); else setMsg('');
  };

  return (
    <div className="section">
      <div className="head"><span className="label">Export</span>
        {recorder.recording && <span className="fpsbadge low">● {String(Math.floor(recorder.elapsed/60)).padStart(2,'0')}:{String(recorder.elapsed%60).padStart(2,'0')}</span>}
      </div>
      <div className="body">
        <div className="ctrl"><label>Format</label>
          <select value={fmtId} onChange={e => setFmt(e.target.value)}>
            {formats.length ? formats.map(f => <option key={f.id} value={f.id}>{f.label}</option>) : <option>unsupported here</option>}
          </select>
        </div>
        <div className="ctrl"><label>Size</label>
          <select value={size} onChange={e => setSize(e.target.value)}>
            {SIZES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="ctrl"><label>FPS</label>
          <select value={fps} onChange={e => setFps(+e.target.value)}>
            {FPSES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="ctrl"><label>Quality</label>
          <input type="range" min="2" max="48" value={quality} onChange={e => setQuality(+e.target.value)} />
          <span className="val">{quality}M</span>
        </div>
        <button className={'btn wide' + (recorder.recording ? ' on' : '')} onClick={onRecord}>
          {recorder.recording ? '■ Stop' : '● Record'}
        </button>
        {msg && <div className="err">{msg}</div>}
      </div>
    </div>
  );
}
