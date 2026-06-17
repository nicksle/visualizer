import { useReducer, useRef, useEffect, useState, useCallback } from 'react';
import { EngineProvider, useEngine } from './engine/EngineContext';
import { useRecorder } from './engine/useRecorder';
import { layersReducer, initialLayers } from './state/layersReducer';
import { useStageGlow } from './engine/useStageGlow';
import { deserializeLayers } from './state/presets';
import { SIG } from './engine/signal';
import Stage from './ui/Stage';
import Backdrop from './ui/Backdrop';
import { LeftRail, BottomBar } from './ui/Console';
import AddLayerMenu from './ui/AddLayerMenu';
import LayerDetail from './ui/LayerDetail';

function Workspace(){
  const engine = useEngine();
  const [layers, dispatch] = useReducer(layersReducer, initialLayers);
  const layersRef = useRef(layers); layersRef.current = layers;
  const recorder = useRecorder(layersRef);
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const [solo, setSolo] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const applyPreset = useCallback((p) => {
    if(!p || !Array.isArray(p.layers)) return;
    const deserialized = deserializeLayers(p.layers);
    dispatch({ type:'HYDRATE', layers:deserialized });
    if(p.master && typeof p.master.intensity === 'number'){
      SIG.intensity = Math.max(0, Math.min(1, p.master.intensity));
      engine.setIntensity(SIG.intensity);
    }
  }, [engine, dispatch]);

  const crossfadeDip = useCallback((duration) => {
    const el = stageRef.current; if(!el) return;
    el.style.transition = `opacity ${duration/2}s`;
    el.style.opacity = '0.7';
    setTimeout(() => {
      el.style.opacity = '1';
      setTimeout(() => { el.style.transition = ''; }, duration/2 * 1000);
    }, duration/2 * 1000);
  }, []);

  useEffect(() => { engine.setBaseVideo(videoRef.current); }, [engine]);
  useStageGlow(stageRef);
  useEffect(() => {
    const onKey = (e) => {
      if(e.key === 'h' && !e.metaKey && !e.ctrlKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT'){
        setSolo(s => !s);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // auto-select newly added layer
  useEffect(() => {
    if(selectedId === '__pending__' && layers.length){
      setSelectedId(layers[layers.length - 1].id);
    }
  }, [layers, selectedId]);

  // auto-clear selection if the selected layer is removed
  useEffect(() => {
    if(selectedId && selectedId !== '__pending__' && !layers.find(L => L.id === selectedId)) setSelectedId(null);
  }, [layers, selectedId]);

  return (
    <div className={'app' + (solo ? ' solo' : '')}>
      <LeftRail layers={layers} dispatch={dispatch} selectedId={selectedId} onSelect={setSelectedId} addMenuOpen={addMenuOpen} setAddMenuOpen={setAddMenuOpen} applyPreset={applyPreset} crossfadeDip={crossfadeDip} />
      <div className="stagewrap" ref={stageRef}>
        <video ref={videoRef} className="basevideo" muted playsInline />
        <Backdrop />
        <Stage layers={layers} />
        {selectedId && !solo && (
          <div
            className="stage-drag-overlay"
            onMouseDown={e => {
              const rect = stageRef.current.getBoundingClientRect();
              const startX = e.clientX, startY = e.clientY;
              const layer = layers.find(L => L.id === selectedId);
              if(!layer) return;
              const origOX = layer.originX || 0, origOY = layer.originY || 0;
              const onMove = (ev) => {
                const dx = ((ev.clientX - startX) / rect.width) * 100;
                const dy = ((ev.clientY - startY) / rect.height) * 100;
                dispatch({ type:'SET', id:selectedId, patch:{
                  originX: Math.round(Math.max(-100, Math.min(100, origOX + dx))),
                  originY: Math.round(Math.max(-100, Math.min(100, origOY + dy))),
                }});
              };
              const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
          />
        )}
        {solo && <div className="solohint">press H to exit projection</div>}
      </div>
      {addMenuOpen && (
        <AddLayerMenu
          onAdd={(type) => { dispatch({ type:'ADD', layerType:type }); setSelectedId('__pending__'); }}
          onClose={() => setAddMenuOpen(false)}
        />
      )}
      {selectedId && layers.find(L => L.id === selectedId) && (
        <div className="layer-detail-popover">
          <div className="addlayer-header">
            <span className="label">Layer Settings</span>
            <button className="iconbtn" onClick={() => setSelectedId(null)} title="Close">✕</button>
          </div>
          <div className="layer-detail-scroll">
            <LayerDetail layer={layers.find(L => L.id === selectedId)} dispatch={dispatch} />
          </div>
        </div>
      )}
      <BottomBar layers={layers} dispatch={dispatch} recorder={recorder} stageRef={stageRef} videoRef={videoRef} />
    </div>
  );
}

export default function App(){
  return (
    <EngineProvider>
      <Workspace />
    </EngineProvider>
  );
}
