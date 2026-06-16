import { useReducer, useRef, useEffect, useState } from 'react';
import { EngineProvider, useEngine } from './engine/EngineContext';
import { useRecorder } from './engine/useRecorder';
import { layersReducer, initialLayers } from './state/layersReducer';
import { useStageGlow } from './engine/useStageGlow';
import Stage from './ui/Stage';
import Backdrop from './ui/Backdrop';
import { LeftRail, RightRail, BottomBar } from './ui/Console';
import AddLayerMenu from './ui/AddLayerMenu';

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

  // auto-clear selection if the selected layer is removed
  useEffect(() => {
    if(selectedId && !layers.find(L => L.id === selectedId)) setSelectedId(null);
  }, [layers, selectedId]);

  return (
    <div className={'app' + (solo ? ' solo' : '')}>
      <LeftRail layers={layers} dispatch={dispatch} selectedId={selectedId} onSelect={setSelectedId} addMenuOpen={addMenuOpen} setAddMenuOpen={setAddMenuOpen} />
      <div className="stagewrap" ref={stageRef}>
        <video ref={videoRef} className="basevideo" muted playsInline />
        <Backdrop />
        <Stage layers={layers} />
        {addMenuOpen && (
          <AddLayerMenu
            onAdd={(type) => { dispatch({ type:'ADD', layerType:type }); }}
            onClose={() => setAddMenuOpen(false)}
          />
        )}
        {solo && <div className="solohint">press H to exit projection</div>}
      </div>
      <RightRail layers={layers} dispatch={dispatch} selectedId={selectedId} />
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
