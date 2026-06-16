import { REGISTRY } from '../layers/registry';

/* Compact layer row for the left panel list. Click to select, drag to reorder. */
export default function LayerCard({ layer, dispatch, selected, onSelect, onDragStart, onDragEnd }){
  const m = REGISTRY[layer.type]?.manifest;
  const set = (patch) => dispatch({ type:'SET', id:layer.id, patch });

  return (
    <div
      className={'layerrow' + (layer.enabled ? '' : ' disabled') + (selected ? ' selected' : '')}
      data-lid={layer.id}
      onClick={() => onSelect?.(layer.id)}
    >
      <span
        className="drag-handle" draggable
        onDragStart={e => { e.stopPropagation(); onDragStart?.(layer.id, e); }}
        onDragEnd={onDragEnd}
        title="Drag to reorder"
      >{'\u2807'}</span>
      <input
        type="checkbox" checked={layer.enabled}
        onChange={e => { e.stopPropagation(); set({ enabled:e.target.checked }); }}
        title="enable"
      />
      <span className="layerrow-name">{m?.label || layer.type}</span>
      <span className="tag">{m?.tag}</span>
      <button className="iconbtn" onClick={e => { e.stopPropagation(); dispatch({ type:'REMOVE', id:layer.id }); }} title="delete">✕</button>
    </div>
  );
}
