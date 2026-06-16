import { useRef, useState } from 'react';
import AddLayerMenu from './AddLayerMenu';
import MasterPanel from './MasterPanel';
import GradePanel from './GradePanel';
import BackdropPanel from './BackdropPanel';
import ExportPanel from './ExportPanel';
import PresetPanel from './PresetPanel';
import LayerCard from './LayerCard';
import LayerDetail from './LayerDetail';

/* Left rail — Presets + Layer list (Figma-style). */
export function LeftRail({ layers, dispatch, selectedId, onSelect, addMenuOpen, setAddMenuOpen }){
  const listRef = useRef(null);

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
    const newOrder = domIds.slice().reverse();
    dispatch({ type:'REORDER', order:newOrder });
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

  return (
    <div className="rail rail-left">
      <PresetPanel layers={layers} dispatch={dispatch} />
      <div className="section">
        <div className="head">
          <span className="label">Layers · {layers.length}</span>
          <button className="btn" onClick={() => setAddMenuOpen(o => !o)} style={{fontSize:9, padding:'3px 8px'}}>
            {addMenuOpen ? '− Close' : '+ Add'}
          </button>
        </div>
        <div className="body">
          <div className="layer-list" ref={listRef} onDragOver={onDragOver} onDrop={e => e.preventDefault()}>
            {layers.length === 0 && <div className="label">no layers — press + Add</div>}
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
    </div>
  );
}

/* Right rail — selected layer detail only. */
export function RightRail({ layers, dispatch, selectedId }){
  const selectedLayer = layers.find(L => L.id === selectedId) || null;

  return (
    <div className="rail rail-right">
      <LayerDetail layer={selectedLayer} dispatch={dispatch} />
    </div>
  );
}

import BaseQueue from './BaseQueue';

/* Bottom toolbar — Master, Grade, Backdrop, Export, Base Video as expandable buttons. */
export function BottomBar({ layers, dispatch, recorder, stageRef, videoRef }){
  const [open, setOpen] = useState(null);
  const toggle = (key) => setOpen(o => o === key ? null : key);

  const tabs = [
    { key:'master',   label:'Master' },
    { key:'grade',    label:'Grade' },
    { key:'backdrop', label:'Backdrop' },
    { key:'export',   label:'Export' },
    { key:'base',     label:'Base Video' },
  ];

  return (
    <div className="bottombar">
      <div className="bottombar-tabs">
        {tabs.map(t => (
          <button key={t.key} className={'bottombar-tab' + (open === t.key ? ' active' : '')} onClick={() => toggle(t.key)}>{t.label}</button>
        ))}
      </div>
      {open && (
        <div className="bottombar-panel">
          {open === 'master' && <MasterPanel onPanic={() => dispatch({ type:'PANIC' })} />}
          {open === 'grade' && <GradePanel stageRef={stageRef} />}
          {open === 'backdrop' && <BackdropPanel />}
          {open === 'export' && <ExportPanel recorder={recorder} stageRef={stageRef} />}
          {open === 'base' && <BaseQueue videoRef={videoRef} />}
        </div>
      )}
    </div>
  );
}
