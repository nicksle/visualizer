import { REGISTRY, ADDABLE } from '../layers/registry';

export default function AddLayerMenu({ onAdd, onClose }){
  return (
    <div className="addlayer-popover">
      <div className="addlayer-header">
        <span className="label">Add Layer</span>
        <button className="iconbtn" onClick={onClose} title="Close">✕</button>
      </div>
      <div className="addlayer-grid">
        {ADDABLE.map(type => {
          const m = REGISTRY[type].manifest;
          return (
            <div key={type} className="add-item" onClick={() => { onAdd(type); }} title={m.label}>
              {m.label} <span className="tag" style={{color:'var(--accent)'}}>{m.tag}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
