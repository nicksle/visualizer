import { REGISTRY } from '../layers/registry';
import { LayerErrorBoundary } from './ErrorBoundary';

/* Renders layers in array order — index 0 at the bottom, last on top. Each layer
   is isolated in an error boundary. */
export default function Stage({ layers }){
  return (
    <div className="stage">
      {layers.map(L => {
        const entry = REGISTRY[L.type]; if(!entry) return null;
        const C = entry.Component;
        return (
          <LayerErrorBoundary key={L.id} label={L.type}>
            <C id={L.id} opacity={L.opacity} blend={L.blend} enabled={L.enabled} fx={L.fx} params={L.params} originX={L.originX} originY={L.originY} scale={L.scale} rotation={L.rotation} />
          </LayerErrorBoundary>
        );
      })}
    </div>
  );
}
