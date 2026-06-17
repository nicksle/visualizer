import { useState, useRef, useCallback, useEffect } from 'react';
import { SIG } from '../engine/signal';
import {
  getOrderedPresets, savePresetSlot, deletePreset,
  downloadPreset, capturePreset, importPresetFile,
} from '../state/presets';
import LayerCard from './LayerCard';

/* Build tab — preset-first workflow.
   Create or pick a preset, then add/edit layers inside it. Auto-saves. */
export default function BuildPanel({ layers, dispatch, applyPreset, selectedId, onSelect, addMenuOpen, setAddMenuOpen }){
  const [presets, setPresets] = useState([]);
  const [activePreset, setActivePreset] = useState(null); // name of the preset being edited
  const [menuOpen, setMenuOpen] = useState(null); // name of preset whose menu is open
  const importRef = useRef(null);
  const listRef = useRef(null);

  const refresh = useCallback(() => setPresets(getOrderedPresets()), []);
  useEffect(() => { refresh(); }, [refresh]);

  // auto-save: whenever layers change and we have an active preset, save it
  useEffect(() => {
    if(!activePreset) return;
    savePresetSlot(activePreset, layers, SIG.intensity);
    refresh();
  }, [layers, activePreset]);

  const onCreate = () => {
    const existing = presets.map(p => p.name);
    let i = 1;
    while(existing.includes(`Preset ${i}`)) i++;
    const n = `Preset ${i}`;
    dispatch({ type:'PANIC' });
    savePresetSlot(n, [], SIG.intensity);
    setActivePreset(n);
    refresh();
  };

  const onSwitch = (name) => {
    const p = presets.find(x => x.name === name);
    if(p?.data){
      applyPreset(p.data);
      setActivePreset(name);
    }
  };

  const onDelete = () => {
    if(!activePreset) return;
    deletePreset(activePreset);
    dispatch({ type:'PANIC' });
    setActivePreset(null);
    refresh();
  };

  const onExport = () => {
    if(!activePreset) return;
    downloadPreset(capturePreset(activePreset, layers, SIG.intensity));
  };

  const onImport = async (e) => {
    const f = e.target.files?.[0]; e.target.value = ''; if(!f) return;
    const result = await importPresetFile(f);
    if(!result.ok) return;
    if(result.bundle){ refresh(); return; }
    if(result.preset){
      applyPreset(result.preset);
      if(result.preset.name) setActivePreset(result.preset.name);
      refresh();
    }
  };

  /* drag reorder layers */
  const onDragStart = (id, e) => {
    e.dataTransfer.effectAllowed = 'move';
    const card = e.target.closest('.layerrow');
    if(card) card.classList.add('dragging');
  };
  const onDragEnd = () => {
    const list = listRef.current; if(!list) return;
    const card = list.querySelector('.layerrow.dragging');
    if(card) card.classList.remove('dragging');
    const domIds = [...list.querySelectorAll('.layerrow[data-lid]')].map(el => el.dataset.lid);
    dispatch({ type:'REORDER', order:domIds.slice().reverse() });
  };
  const onDragOver = (e) => {
    const list = listRef.current; if(!list) return;
    const dragging = list.querySelector('.layerrow.dragging'); if(!dragging) return;
    e.preventDefault();
    const items = [...list.querySelectorAll('.layerrow:not(.dragging)')];
    let best = null, bestOff = -Infinity;
    for(const el of items){
      const b = el.getBoundingClientRect();
      const off = e.clientY - b.top - b.height / 2;
      if(off < 0 && off > bestOff){ bestOff = off; best = el; }
    }
    if(best == null) list.appendChild(dragging);
    else list.insertBefore(dragging, best);
  };

  // no active preset — show create / pick UI
  if(!activePreset){
    return (
      <div className="section">
        <div className="body" style={{gap:10}}>
          <button className="btn wide" onClick={onCreate}>+ New Preset</button>
          {presets.length > 0 && (
            <>
              <div className="section-divider" />
              <span className="label">or open existing</span>
              <div className="preset-list">
                {presets.map(({ name:n }) => (
                  <div key={n} className="preset-item">
                    <span className="preset-name" onClick={() => onSwitch(n)}>{n}</span>
                    <div style={{position:'relative'}}>
                      <button className="obtn" onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === n ? null : n); }} title="Options">{'\u2026'}</button>
                      {menuOpen === n && (
                        <div className="preset-menu">
                          <button onClick={() => { const p = presets.find(x => x.name === n); if(p?.data) downloadPreset(capturePreset(n, [], SIG.intensity)); downloadPreset(p?.data); setMenuOpen(null); }}>Export</button>
                          <button className="danger" onClick={() => { deletePreset(n); setMenuOpen(null); refresh(); }}>Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="row">
            <button className="btn" onClick={() => importRef.current?.click()} title="Import preset or bundle">{'\u2912'} Import</button>
            <input ref={importRef} type="file" accept=".json" style={{display:'none'}} onChange={onImport} />
          </div>
        </div>
      </div>
    );
  }

  // active preset — dropdown + layers
  return (
    <div className="section">
      <div className="head">
        <button className="iconbtn" onClick={() => { setActivePreset(null); }} title="Back to presets">{'<'}</button>
        <span className="preset-title">{activePreset}</span>
      </div>
      <div className="body">
        <div className="row">
          <button className="btn" onClick={() => setAddMenuOpen(o => !o)} style={{fontSize:9, padding:'3px 8px'}}>
            {addMenuOpen ? '− Close' : '+ Add Layer'}
          </button>
          <span style={{flex:1}} />
          <button className="obtn" onClick={onExport} title="Export">{'\u2913'}</button>
          <button className="obtn del" onClick={onDelete} title="Delete preset">{'\u2715'}</button>
        </div>
        <div className="layer-list" ref={listRef} onDragOver={onDragOver} onDrop={e => e.preventDefault()}>
          {layers.length === 0 && <div className="label">no layers — press + Add Layer</div>}
          {layers.slice().reverse().map(L => (
            <LayerCard
              key={L.id} layer={L} dispatch={dispatch}
              selected={L.id === selectedId}
              onSelect={onSelect}
              onDragStart={onDragStart} onDragEnd={onDragEnd}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
