import { useState, useEffect } from 'react';
import MasterPanel from './MasterPanel';
import GradePanel from './GradePanel';
import BackdropPanel from './BackdropPanel';
import ExportPanel from './ExportPanel';
import BuildPanel from './BuildPanel';
import SequencerPanel from './SequencerPanel';

/* Left rail — tabbed: Build (preset workspace) | Sequence. */
export function LeftRail({ layers, dispatch, selectedId, onSelect, addMenuOpen, setAddMenuOpen, applyPreset, crossfadeDip, stageRef }){
  const [tab, setTab] = useState('build');

  return (
    <div className="rail rail-left">
      <div className="left-tabs">
        <button className={'left-tab' + (tab === 'build' ? ' active' : '')} onClick={() => setTab('build')}>Build</button>
        <button className={'left-tab' + (tab === 'sequence' ? ' active' : '')} onClick={() => setTab('sequence')}>Sequence</button>
      </div>

      {tab === 'build' && (
        <BuildPanel
          layers={layers} dispatch={dispatch} applyPreset={applyPreset}
          selectedId={selectedId} onSelect={onSelect}
          addMenuOpen={addMenuOpen} setAddMenuOpen={setAddMenuOpen}
          stageRef={stageRef}
        />
      )}

      {tab === 'sequence' && (
        <SequencerPanel applyPreset={applyPreset} crossfadeDip={crossfadeDip} />
      )}
    </div>
  );
}

import BaseQueue from './BaseQueue';

/* Bottom toolbar — Master, Grade, Backdrop, Export, Base Video as expandable buttons. */
const ASPECTS = [
  { key:'fill',  label:'Fill' },
  { key:'16:9',  label:'16:9',  ratio:16/9 },
  { key:'4:3',   label:'4:3',   ratio:4/3 },
  { key:'1:1',   label:'1:1',   ratio:1 },
  { key:'9:16',  label:'9:16',  ratio:9/16 },
  { key:'21:9',  label:'21:9',  ratio:21/9 },
];

function DisplayPanel({ stageRef }){
  const [aspect, setAspect] = useState('fill');

  useEffect(() => {
    const el = stageRef?.current; if(!el) return;
    const chosen = ASPECTS.find(a => a.key === aspect);
    if(!chosen || !chosen.ratio){
      el.style.aspectRatio = '';
      el.style.maxWidth = '';
      el.style.maxHeight = '';
      el.style.margin = '12px';
    } else {
      el.style.aspectRatio = `${chosen.ratio}`;
      el.style.maxWidth = '100%';
      el.style.maxHeight = '100%';
      el.style.margin = '12px auto';
    }
  }, [aspect, stageRef]);

  return (
    <div className="row" style={{gap:6, flexWrap:'wrap'}}>
      <span className="label">Aspect</span>
      {ASPECTS.map(a => (
        <button key={a.key} className={'btn' + (aspect === a.key ? ' on' : '')}
          onClick={() => setAspect(a.key)} style={{fontSize:9, padding:'3px 8px'}}>
          {a.label}
        </button>
      ))}
    </div>
  );
}

export function BottomBar({ layers, dispatch, recorder, stageRef, videoRef }){
  const [open, setOpen] = useState(null);
  const toggle = (key) => setOpen(o => o === key ? null : key);

  const tabs = [
    { key:'master',   label:'Master' },
    { key:'grade',    label:'Grade' },
    { key:'backdrop', label:'Backdrop' },
    { key:'export',   label:'Export' },
    { key:'base',     label:'Base Video' },
    { key:'display',  label:'Display' },
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
          {open === 'display' && <DisplayPanel stageRef={stageRef} />}
        </div>
      )}
    </div>
  );
}
