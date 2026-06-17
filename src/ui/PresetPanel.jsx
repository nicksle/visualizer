import { useState, useRef, useCallback, useEffect } from 'react';
import { SIG } from '../engine/signal';
import {
  lsAvailable, getOrderedPresets, savePresetSlot, deletePreset,
  reorderPresets, downloadPreset, capturePreset, exportPresetBundle,
  importPresetFile,
} from '../state/presets';

export default function PresetPanel({ layers, dispatch, applyPreset }){
  const [name, setName] = useState('');
  const [presets, setPresets] = useState([]);
  const [sel, setSel] = useState(new Set());
  const [hint, setHint] = useState('');
  const anchorRef = useRef(null);
  const importRef = useRef(null);
  const listRef = useRef(null);
  const storageOk = useRef(lsAvailable());

  const refresh = useCallback(() => setPresets(getOrderedPresets()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const flash = (msg) => {
    setHint(msg);
    setTimeout(() => setHint(''), 1800);
  };

  const onSave = () => {
    const n = name.trim();
    if(!n){ flash('type a name first'); return; }
    if(savePresetSlot(n, layers, SIG.intensity)){
      refresh(); flash('saved · ' + n);
    } else {
      flash('storage blocked — use export');
    }
  };

  const onExportCurrent = () => {
    const n = (name.trim()) || 'preset';
    downloadPreset(capturePreset(n, layers, SIG.intensity));
    flash('exported · ' + n);
  };

  const onImport = async (e) => {
    const f = e.target.files?.[0]; e.target.value = ''; if(!f) return;
    const result = await importPresetFile(f);
    if(!result.ok){ flash(result.msg); return; }
    if(result.bundle){ refresh(); flash('imported bundle · ' + result.count); }
    else {
      if(result.preset) applyPreset(result.preset);
      if(result.preset?.name) setName(result.preset.name);
      refresh(); flash('imported' + (result.preset?.name ? ' · ' + result.preset.name : ''));
    }
  };

  const onClickPreset = (n, ev) => {
    const names = presets.map(p => p.name);
    if(ev.shiftKey){
      ev.preventDefault();
      setSel(prev => {
        const next = new Set(prev);
        if(anchorRef.current){
          const a = names.indexOf(anchorRef.current), b = names.indexOf(n);
          if(a >= 0 && b >= 0) for(let k = Math.min(a,b); k <= Math.max(a,b); k++) next.add(names[k]);
          else next.add(n);
        } else { next.add(n); anchorRef.current = n; }
        return next;
      });
      return;
    }
    if(ev.metaKey || ev.ctrlKey){
      ev.preventDefault();
      setSel(prev => { const next = new Set(prev); next.has(n) ? next.delete(n) : next.add(n); return next; });
      anchorRef.current = n;
      return;
    }
    // plain click → load
    setSel(new Set()); anchorRef.current = n;
    const p = presets.find(x => x.name === n);
    if(p?.data){ applyPreset(p.data); setName(n); flash('loaded · ' + n); }
  };

  const onDelete = (n) => {
    deletePreset(n);
    setSel(prev => { const next = new Set(prev); next.delete(n); return next; });
    refresh();
  };

  const onBundleExport = () => {
    const count = exportPresetBundle([...sel]);
    if(count) flash('exported bundle · ' + count);
  };

  /* drag-to-reorder */
  const dragName = useRef(null);
  const onDragStart = (n, e) => {
    dragName.current = n;
    e.dataTransfer.effectAllowed = 'move';
    const row = e.target.closest('.preset-item');
    if(row) row.classList.add('dragging');
  };
  const onDragEnd = () => {
    const list = listRef.current; if(!list) return;
    const row = list.querySelector('.preset-item.dragging');
    if(row) row.classList.remove('dragging');
    const order = [...list.querySelectorAll('.preset-item')].map(el => el.dataset.pname).filter(Boolean);
    reorderPresets(order);
    refresh();
    dragName.current = null;
  };
  const onDragOver = (e) => {
    const list = listRef.current; if(!list) return;
    const dragging = list.querySelector('.preset-item.dragging'); if(!dragging) return;
    e.preventDefault();
    const items = [...list.querySelectorAll('.preset-item:not(.dragging)')];
    let best = null, bestOff = -Infinity;
    for(const el of items){
      const b = el.getBoundingClientRect();
      const off = e.clientY - b.top - b.height / 2;
      if(off < 0 && off > bestOff){ bestOff = off; best = el; }
    }
    if(best == null) list.appendChild(dragging);
    else list.insertBefore(dragging, best);
  };

  const defaultHint = storageOk.current
    ? 'Shift / \u2318-click presets to multi-select, then \u2913 bundle to export them together.'
    : 'Storage is blocked here. Use \u2913 EXPORT / \u2912 IMPORT files.';

  return (
    <>
      <div className="head"><span className="label">Presets {presets.length ? `[${presets.length}]` : ''}</span></div>
      <div className="body">
        <div className="row">
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => { if(e.key === 'Enter') onSave(); }}
            placeholder="preset name"
            style={{ flex:1, background:'var(--panel)', border:'1px solid var(--line)', borderRadius:3, padding:'4px 6px', fontSize:10 }}
          />
          <button className="btn" onClick={onSave}>Save</button>
        </div>
        <div className="row">
          <button className="btn" onClick={onExportCurrent} title="Export current state as JSON">{'\u2913'} Export</button>
          <button className="btn" onClick={() => importRef.current?.click()} title="Import preset or bundle">{'\u2912'} Import</button>
          <input ref={importRef} type="file" accept=".json" style={{display:'none'}} onChange={onImport} />
        </div>
        <div className="preset-hint">{hint || defaultHint}</div>
        {sel.size > 0 && (
          <div className="preset-selbar">
            <span className="selbar-lbl">{sel.size} selected</span>
            <button className="obtn" onClick={onBundleExport}>{'\u2913'} bundle</button>
            <button className="obtn" onClick={() => { setSel(new Set()); anchorRef.current = null; }}>clear</button>
          </div>
        )}
        <div className="preset-list" ref={listRef} onDragOver={onDragOver} onDrop={e => e.preventDefault()}>
          {presets.length === 0 && <div className="preset-empty">no saved presets yet</div>}
          {presets.map(({ name:n }) => (
            <div key={n} className={'preset-item' + (sel.has(n) ? ' selected' : '')} data-pname={n}>
              <span
                className="drag-handle" draggable
                onDragStart={e => onDragStart(n, e)} onDragEnd={onDragEnd}
                title="Drag to reorder"
              >{'\u2807'}</span>
              <span className="preset-name" onClick={ev => onClickPreset(n, ev)} title="Click to load · Shift / \u2318-click to multi-select">{n}</span>
              <button className="obtn" onClick={() => { const p = presets.find(x => x.name === n); if(p?.data) downloadPreset(p.data); }} title="Download">{'\u2913'}</button>
              <button className="obtn del" onClick={() => onDelete(n)} title="Delete">{'\u2715'}</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
