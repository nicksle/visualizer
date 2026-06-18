import { useCallback, useRef } from 'react';
import { useLayerCanvas } from '../engine/useLayerCanvas';
import { cssBlend } from '../engine/blendMap';

/* Turn a vanilla-style type def {type,name,tag,blend,opacity,makeState,init,draw,controls}
   into a real React layer component + manifest. The draw body is used verbatim, so
   output matches the vanilla build pixel-for-pixel. Control params live on `s`
   (exactly like vanilla L.state), assigned fresh each frame so live edits apply. */
export function makeLayer(def){
  function LayerComp({ id, opacity = def.opacity, blend = def.blend, enabled = true, fx, params, originX = 0, originY = 0, scale = 100, rotation = 0 }){
    const paramsRef = useRef(params); paramsRef.current = params;

    const onResize = useCallback((W, H, s) => {
      if(!s._seeded){ Object.assign(s, def.makeState ? def.makeState() : {}); s._seeded = true; }
      if(def.init) def.init(W, H, s);
    }, []);

    const draw = useCallback((ctx, t, dt, W, H, lvl, s) => {
      if(paramsRef.current) Object.assign(s, paramsRef.current);   // control values on s, like vanilla
      def.draw(ctx, t, dt, W, H, lvl, s);
    }, []);

    const { canvasRef } = useLayerCanvas(id, draw, { fx, onResize });

    return (
      <canvas
        ref={canvasRef}
        style={{
          position:'absolute', inset:0, width:'100%', height:'100%',
          opacity, mixBlendMode: cssBlend(blend), pointerEvents:'none',
          display: enabled ? 'block' : 'none',
          transform: (originX || originY || scale !== 100 || rotation) ? `translate(${originX}%, ${originY}%) scale(${scale/100}) rotate(${rotation}deg)` : undefined,
        }}
      />
    );
  }
  LayerComp.displayName = def.type;
  LayerComp.manifest = {
    type: def.type, label: def.name, tag: def.tag,
    defaultBlend: def.blend, defaultOpacity: def.opacity,
    controls: def.controls || [],
  };
  return LayerComp;
}
