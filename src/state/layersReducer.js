/* Layer instances live here. An instance = {id,type,enabled,opacity,blend,fx,params}.
   The Stage renders them in array order (index 0 = bottom). */
import { REGISTRY, defaultParams } from '../layers/registry';

let _id = 0;
const uid = () => `L${Date.now().toString(36)}_${(_id++).toString(36)}`;

export function makeLayer(type){
  const m = REGISTRY[type]?.manifest;
  if(!m) return null;
  return {
    id: uid(),
    type,
    enabled: true,
    opacity: m.defaultOpacity ?? 1,
    blend: m.defaultBlend ?? 'normal',
    collapsed: false,
    fx: [],
    params: defaultParams(type),
  };
}

export const initialLayers = [];

export function layersReducer(state, action){
  switch(action.type){
    case 'ADD': {
      const L = makeLayer(action.layerType); if(!L) return state;
      return [...state, L];                              // new layer on top
    }
    case 'REMOVE':
      return state.filter(L => L.id !== action.id);
    case 'MOVE': {                                       // dir -1 down, +1 up (z-order)
      const i = state.findIndex(L => L.id === action.id);
      if(i < 0) return state;
      const j = i + action.dir;
      if(j < 0 || j >= state.length) return state;
      const next = state.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    }
    case 'SET':                                          // patch instance fields (opacity/blend/enabled/collapsed)
      return state.map(L => L.id === action.id ? { ...L, ...action.patch } : L);
    case 'SET_PARAM':
      return state.map(L => L.id === action.id ? { ...L, params: { ...L.params, [action.key]: action.value } } : L);
    case 'SET_FX':                                       // replace the whole fx array for a layer
      return state.map(L => L.id === action.id ? { ...L, fx: action.fx } : L);
    case 'REORDER': {                                    // reorder by id array
      const byId = new Map(state.map(L => [L.id, L]));
      return action.order.map(id => byId.get(id)).filter(Boolean);
    }
    case 'HYDRATE':                                       // replace all layers from a preset
      return (action.layers || []).map(L => ({
        id: uid(),
        type: L.type,
        enabled: L.enabled !== false,
        opacity: typeof L.opacity === 'number' ? L.opacity : 1,
        blend: L.blend || 'normal',
        collapsed: false,
        fx: L.fx || [],
        params: { ...defaultParams(L.type), ...L.params },
      }));
    case 'PANIC':                                        // clear all layers, keep base video
      return [];
    default:
      return state;
  }
}
