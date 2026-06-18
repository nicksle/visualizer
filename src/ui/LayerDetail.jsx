import { useState } from 'react';
import { REGISTRY } from '../layers/registry';
import { BLEND_MODES } from '../engine/blendMap';
import LayerControls from './LayerControls';
import FxControls from './FxControls';

function DetailGroup({ label, defaultOpen = true, children }){
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="detail-group">
      <div className="detail-group-head" onClick={() => setOpen(o => !o)}>
        <span className="detail-group-label">{label}</span>
        <span className="collapse-arrow">{open ? '▾' : '▸'}</span>
      </div>
      {open && <div className="detail-group-body">{children}</div>}
    </div>
  );
}

export default function LayerDetail({ layer, dispatch }){
  if(!layer) return (
    <div className="detail-empty">
      <span className="label">select a layer to edit</span>
    </div>
  );

  const m = REGISTRY[layer.type]?.manifest;
  const set = (patch) => dispatch({ type:'SET', id:layer.id, patch });

  return (
    <div className="layer-detail">
      <div className="detail-header">
        <span className="detail-name">{m?.label || layer.type}</span>
        <span className="tag">{m?.tag}</span>
      </div>

      <DetailGroup label="Appearance">
        <div className="ctrl">
          <label>Opacity</label>
          <input type="range" min="0" max="1" step="0.01" value={layer.opacity} onChange={e => set({ opacity:+e.target.value })} />
          <span className="val">{Math.round(layer.opacity*100)}%</span>
        </div>
        <div className="ctrl">
          <label>Scale</label>
          <input type="range" min="10" max="200" step="1" value={layer.scale || 100} onChange={e => set({ scale:+e.target.value })} />
          <span className="val">{layer.scale || 100}%</span>
        </div>
        <div className="ctrl">
          <label>Rotation</label>
          <input type="range" min="0" max="360" step="1" value={layer.rotation || 0} onChange={e => set({ rotation:+e.target.value })} />
          <span className="val">{layer.rotation || 0}°</span>
        </div>
        <div className="ctrl">
          <label>Blend</label>
          <select value={layer.blend} onChange={e => set({ blend:e.target.value })}>
            {BLEND_MODES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </DetailGroup>

      <DetailGroup label="Position">
        <div className="ctrl">
          <label>Origin X</label>
          <input type="range" min="-100" max="100" step="1" value={layer.originX || 0} onChange={e => set({ originX:+e.target.value })} />
          <span className="val">{layer.originX || 0}%</span>
        </div>
        <div className="ctrl">
          <label>Origin Y</label>
          <input type="range" min="-100" max="100" step="1" value={layer.originY || 0} onChange={e => set({ originY:+e.target.value })} />
          <span className="val">{layer.originY || 0}%</span>
        </div>
      </DetailGroup>

      <DetailGroup label="Properties">
        <LayerControls layer={layer} dispatch={dispatch} />
      </DetailGroup>

      <DetailGroup label="Effects" defaultOpen={false}>
        <FxControls layer={layer} dispatch={dispatch} />
      </DetailGroup>
    </div>
  );
}
