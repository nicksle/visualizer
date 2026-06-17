import { useState, useRef, useEffect, useCallback } from 'react';
import { getOrderedPresets, loadAllPresets } from '../state/presets';
import { createSequencer, getSavedSequences, saveSequence, deleteSequence, loadSequence } from '../state/sequencer';

export default function SequencerPanel({ applyPreset, crossfadeDip }){
  const [steps, setSteps] = useState([]);           // [{name, duration}]
  const [running, setRunning] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [loop, setLoop] = useState(true);
  const [crossfade, setCrossfade] = useState(false);
  const [crossfadeDur, setCrossfadeDur] = useState(1);
  const [seqName, setSeqName] = useState('');
  const [savedSeqs, setSavedSeqs] = useState([]);
  const [presetNames, setPresetNames] = useState([]);
  const [addPick, setAddPick] = useState('');

  const seq = useRef(createSequencer());

  // load available presets and saved sequences
  useEffect(() => {
    const names = getOrderedPresets().map(p => p.name);
    setPresetNames(names);
    if(names.length && !addPick) setAddPick(names[0]);
    setSavedSeqs(getSavedSequences());
  }, []);

  const refreshSeqs = () => setSavedSeqs(getSavedSequences());

  const addStep = () => {
    if(!addPick) return;
    setSteps(s => [...s, { name:addPick, duration:10 }]);
  };

  const removeStep = (i) => setSteps(s => s.filter((_, j) => j !== i));

  const setDuration = (i, dur) => {
    setSteps(s => s.map((step, j) => j === i ? { ...step, duration:Math.max(1, dur) } : step));
  };

  const stepsRef = useRef(null);

  const onPlay = () => {
    if(!steps.length) return;
    const allPresets = loadAllPresets();

    seq.current.start(steps, { loop, crossfade, crossfadeDuration:crossfadeDur }, {
      onStep(idx, step){
        setCurrentIdx(idx);
        setRunning(true);
        const p = allPresets[step.name];
        if(p) applyPreset(p);
      },
      onCrossfadeStart(dur){
        crossfadeDip?.(dur);
      },
      onDone(){
        setRunning(false);
        setCurrentIdx(-1);
      },
    });
    setRunning(true);
  };

  const onStop = () => {
    seq.current.stop();
    setRunning(false);
    setCurrentIdx(-1);
  };

  const onSaveSeq = () => {
    const n = seqName.trim(); if(!n || !steps.length) return;
    saveSequence(n, steps);
    refreshSeqs();
  };

  const onLoadSeq = (name) => {
    const data = loadSequence(name);
    if(data && data.steps){ setSteps(data.steps); setSeqName(name); }
  };

  const onDeleteSeq = (name) => {
    deleteSequence(name);
    refreshSeqs();
  };

  // cleanup on unmount
  useEffect(() => () => seq.current.stop(), []);

  return (
    <div className="section">
      <div className="head"><span className="label">Sequencer</span></div>
      <div className="body">
        {/* Transport */}
        <div className="row">
          {!running
            ? <button className="btn" onClick={onPlay} disabled={!steps.length}>▶ Play</button>
            : <button className="btn on" onClick={onStop}>■ Stop</button>
          }
          <span className="label" style={{flex:1, textAlign:'right'}}>
            {running ? `step ${currentIdx + 1}/${steps.length}` : `${steps.length} steps`}
          </span>
        </div>

        {/* Options */}
        <div className="row">
          <button className={'btn' + (loop ? ' on' : '')} onClick={() => setLoop(l => !l)} style={{fontSize:9, padding:'3px 6px'}}>
            {loop ? 'Loop' : 'Once'}
          </button>
          <button className={'btn' + (crossfade ? ' on' : '')} onClick={() => setCrossfade(c => !c)} style={{fontSize:9, padding:'3px 6px'}}>
            Fade
          </button>
          {crossfade && (
            <span className="row" style={{gap:4}}>
              <input type="range" min="0.5" max="3" step="0.1" value={crossfadeDur}
                onChange={e => setCrossfadeDur(+e.target.value)}
                style={{width:50, accentColor:'var(--accent)'}} />
              <span className="val">{crossfadeDur}s</span>
            </span>
          )}
        </div>

        {/* Step list — drag to reorder */}
        <div className="seq-steps" ref={stepsRef}
          onDragOver={e => {
            const list = stepsRef.current; if(!list) return;
            const dragging = list.querySelector('.seq-step.dragging'); if(!dragging) return;
            e.preventDefault();
            const items = [...list.querySelectorAll('.seq-step:not(.dragging)')];
            let best = null, bestOff = -Infinity;
            for(const el of items){
              const b = el.getBoundingClientRect();
              const off = e.clientY - b.top - b.height / 2;
              if(off < 0 && off > bestOff){ bestOff = off; best = el; }
            }
            if(best == null) list.appendChild(dragging);
            else list.insertBefore(dragging, best);
          }}
          onDrop={e => e.preventDefault()}
        >
          {steps.map((step, i) => (
            <div key={i} className={'seq-step' + (i === currentIdx ? ' active' : '')} data-sidx={i}>
              <span
                className="drag-handle" draggable
                onDragStart={e => {
                  e.dataTransfer.effectAllowed = 'move';
                  const row = e.target.closest('.seq-step');
                  if(row) row.classList.add('dragging');
                }}
                onDragEnd={() => {
                  const list = stepsRef.current; if(!list) return;
                  const row = list.querySelector('.seq-step.dragging');
                  if(row) row.classList.remove('dragging');
                  const newOrder = [...list.querySelectorAll('.seq-step[data-sidx]')].map(el => +el.dataset.sidx);
                  setSteps(prev => newOrder.map(idx => prev[idx]));
                }}
                title="Drag to reorder"
              >{'\u2807'}</span>
              <span className="seq-step-name">{step.name}</span>
              <input
                type="number" min="1" max="999" value={step.duration}
                onChange={e => setDuration(i, +e.target.value)}
                className="seq-step-dur" title="seconds"
              />
              <span className="label">s</span>
              <button className="iconbtn" onClick={() => removeStep(i)} title="remove">✕</button>
            </div>
          ))}
        </div>

        {/* Add step */}
        <div className="row">
          <select value={addPick} onChange={e => setAddPick(e.target.value)}
            style={{flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid var(--rim)', borderRadius:'var(--rad-sm)', padding:4, fontSize:10}}>
            {presetNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <button className="btn" onClick={addStep} disabled={!addPick} style={{fontSize:9, padding:'3px 6px'}}>+ Step</button>
        </div>

        {/* Save/Load sequences */}
        <div className="row" style={{marginTop:4}}>
          <input
            type="text" value={seqName} onChange={e => setSeqName(e.target.value)}
            placeholder="sequence name"
            style={{flex:1, background:'var(--panel)', border:'1px solid var(--line)', borderRadius:3, padding:'3px 6px', fontSize:10}}
          />
          <button className="btn" onClick={onSaveSeq} disabled={!seqName.trim() || !steps.length} style={{fontSize:9, padding:'3px 6px'}}>Save</button>
        </div>
        {savedSeqs.length > 0 && (
          <div className="seq-saved">
            {savedSeqs.map(({ name:n }) => (
              <div key={n} className="seq-saved-item">
                <span className="seq-saved-name" onClick={() => onLoadSeq(n)} title="Load">{n}</span>
                <button className="obtn del" onClick={() => onDeleteSeq(n)} title="Delete">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
