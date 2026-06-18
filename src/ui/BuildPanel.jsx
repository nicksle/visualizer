import { useState, useRef, useCallback, useEffect } from 'react';
import { SIG } from '../engine/signal';
import {
  getOrderedPresets, savePresetSlot, deletePreset,
  downloadPreset, capturePreset, importPresetFile,
} from '../state/presets';
import LayerCard from './LayerCard';
import BuildThumb from './BuildThumb';

/* Build tab — preset-first workflow.
   Create or pick a preset, then add/edit layers inside it. Auto-saves. */
export default function BuildPanel({ layers, dispatch, applyPreset, selectedId, onSelect, addMenuOpen, setAddMenuOpen, stageRef }){
  const [presets, setPresets] = useState([]);
  const [activePreset, setActivePreset] = useState(null); // name of the preset being edited
  const [menuOpen, setMenuOpen] = useState(null); // name of preset whose menu is open
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState('');
  const previewRef = useRef(null); // stores layers snapshot before hover preview
  const importRef = useRef(null);
  const listRef = useRef(null);

  const refresh = useCallback(() => setPresets(getOrderedPresets()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const captureThumb = useCallback(() => {
    const wrap = stageRef?.current; if(!wrap) return null;
    try {
      const canvases = wrap.querySelectorAll('.stage canvas, canvas');
      if(!canvases.length) return null;
      const tmp = document.createElement('canvas');
      const size = 72;
      tmp.width = size; tmp.height = size;
      const ctx = tmp.getContext('2d');
      ctx.fillStyle = '#0a0a0b';
      ctx.fillRect(0, 0, size, size);
      canvases.forEach(c => {
        if(!c.width || !c.height || c.style.display === 'none') return;
        const op = parseFloat(c.style.opacity);
        if(op <= 0) return;
        ctx.globalAlpha = isNaN(op) ? 1 : op;
        try { ctx.drawImage(c, 0, 0, size, size); } catch(e){}
      });
      ctx.globalAlpha = 1;
      return tmp.toDataURL('image/png', 0.6);
    } catch(e){ return null; }
  }, [stageRef]);

  // auto-save: whenever layers change and we have an active preset, save it
  useEffect(() => {
    if(!activePreset) return;
    const thumb = captureThumb();
    savePresetSlot(activePreset, layers, SIG.intensity, thumb);
    refresh();
  }, [layers, activePreset]);

  const onCreate = () => {
    const existing = presets.map(p => p.name);
    let i = 1;
    while(existing.includes(`Build ${i}`)) i++;
    const n = `Build ${i}`;
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

  const onRename = () => {
    const n = renameVal.trim();
    if(!n || !activePreset || n === activePreset) { setRenaming(false); return; }
    savePresetSlot(n, layers, SIG.intensity);
    deletePreset(activePreset);
    setActivePreset(n);
    setRenaming(false);
    refresh();
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

  const onHoverPreview = (data) => {
    if(!previewRef.current) previewRef.current = { layers, intensity: SIG.intensity };
    applyPreset(data);
  };
  const onHoverEnd = () => {
    if(previewRef.current){
      dispatch({ type:'HYDRATE', layers: previewRef.current.layers });
      SIG.intensity = previewRef.current.intensity;
      previewRef.current = null;
    }
  };

  // no active preset — show create / pick UI
  if(!activePreset){
    return (
      <div className="section">
        <div className="body" style={{gap:10}}>
          <button className="btn wide" onClick={onCreate}>+ New Build</button>
          {presets.length > 0 && (
            <>
              <div className="section-divider" />
              <span className="label">or open existing</span>
              <div className="preset-list">
                {presets.map(({ name:n, data }) => (
                  <div key={n} className="preset-item"
                    onClick={() => { previewRef.current = null; onSwitch(n); }}
                    onMouseEnter={() => data && onHoverPreview(data)}
                    onMouseLeave={onHoverEnd}
                  >
                    <BuildThumb presetData={data} size={36} />
                    <span className="preset-name">{n}</span>
                    <div style={{position:'relative'}}>
                      <button className="obtn" onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === n ? null : n); }} title="Options">{'\u2026'}</button>
                      {menuOpen === n && (
                        <div className="preset-menu">
                          <button onClick={e => { e.stopPropagation(); const p = presets.find(x => x.name === n); if(p?.data) downloadPreset(p.data); setMenuOpen(null); }}>Export</button>
                          <button className="danger" onClick={e => { e.stopPropagation(); deletePreset(n); setMenuOpen(null); refresh(); }}>Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="row">
            <button className="btn" onClick={() => importRef.current?.click()} title="Import build or bundle">{'\u2912'} Import</button>
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
        <button className="iconbtn" onClick={() => { setActivePreset(null); setRenaming(false); }} title="Back to builds">{'<'}</button>
        {renaming ? (
          <input
            type="text" value={renameVal} onChange={e => setRenameVal(e.target.value)}
            onKeyDown={e => { if(e.key === 'Enter') onRename(); if(e.key === 'Escape') setRenaming(false); }}
            onBlur={onRename}
            autoFocus
            className="preset-title-input"
          />
        ) : (
          <span className="preset-title" onClick={() => { setRenaming(true); setRenameVal(activePreset); }} title="Click to rename">{activePreset}</span>
        )}
      </div>
      <div className="body">
        <div className="row">
          <button className="btn" onClick={() => setAddMenuOpen(o => !o)} style={{fontSize:9, padding:'3px 8px'}}>
            {addMenuOpen ? '− Close' : '+ Add Layer'}
          </button>
          <span style={{flex:1}} />
          <button className="obtn" onClick={onExport} title="Export">{'\u2913'}</button>
          <button className="obtn del" onClick={onDelete} title="Delete build">{'\u2715'}</button>
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
