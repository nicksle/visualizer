/* Presets — save / recall the full look.
   Ported from reference/hard-reset-visualizer_17.html ~line 2024-2267. */
import { REGISTRY } from '../layers/registry';
import { SIG } from '../engine/signal';

const PRESET_KEY = 'hardreset.presets.v12';
const PRESET_VER = 12;
const PRESET_ORDER_KEY = 'hardreset.presetOrder.v12';

/* ---- localStorage helpers ---- */
export function lsAvailable(){
  try { const k='__hr_test__'; localStorage.setItem(k,'1'); localStorage.removeItem(k); return true; } catch(e){ return false; }
}
function lsLoadAll(){
  try { return JSON.parse(localStorage.getItem(PRESET_KEY)||'{}') || {}; } catch(e){ return {}; }
}
function lsSaveAll(obj){
  try { localStorage.setItem(PRESET_KEY, JSON.stringify(obj)); return true; } catch(e){ return false; }
}
function lsLoadOrder(){
  try { const a = JSON.parse(localStorage.getItem(PRESET_ORDER_KEY)||'[]'); return Array.isArray(a)?a:[]; } catch(e){ return []; }
}
function lsSaveOrder(arr){
  try { localStorage.setItem(PRESET_ORDER_KEY, JSON.stringify(arr)); } catch(e){}
}

export function orderedPresetNames(all){
  const names = Object.keys(all);
  const saved = lsLoadOrder().filter(n => names.includes(n));
  const rest = names.filter(n => !saved.includes(n)).sort((a,b) => a.localeCompare(b));
  return saved.concat(rest);
}

/* ---- image baking ---- */
function imgToDataURL(img){
  if(!img || !img.complete || !img.naturalWidth) return null;
  try {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    return c.toDataURL('image/png');
  } catch(e){ return null; }
}
function dataURLToImg(d){
  const im = new Image(); im.src = d; return im;
}

/* ---- serialize one layer ---- */
function serializeLayer(L){
  const m = REGISTRY[L.type]?.manifest;
  const state = {};
  (m?.controls || []).forEach(c => {
    if(c.type === 'image' || c.type === 'images' || c.type === 'motion') return;
    if(L.params[c.key] !== undefined) state[c.key] = L.params[c.key];
  });
  const images = {};
  if(L.params.img) images.img = imgToDataURL(L.params.img);
  if(Array.isArray(L.params.imgs) && L.params.imgs.length)
    images.imgs = L.params.imgs.map(imgToDataURL).filter(Boolean);
  return {
    typeId: L.type, name: m?.label || L.type,
    blend: L.blend, enabled: L.enabled, opacity: L.opacity,
    state, images,
    fx: (L.fx || []).map(f => ({ type:f.type, params:{...f.params} })),
  };
}

/* ---- capture preset ---- */
export function capturePreset(name, layers, intensity){
  return {
    app: 'hard-reset', kind: 'preset', v: PRESET_VER,
    name: name || 'preset', ts: Date.now(),
    master: { intensity: intensity ?? SIG.intensity },
    layers: layers.map(serializeLayer),
  };
}

/* ---- deserialize layers for HYDRATE ---- */
export function deserializeLayers(savedLayers){
  return savedLayers.map(sl => {
    // scrollgridv compat: map legacy type to scrollgrid with vertical orientation
    let type = sl.typeId;
    let extraParams = {};
    if(type === 'scrollgridv'){
      type = 'scrollgrid';
      extraParams.orientation = 'vertical';
    }
    if(!REGISTRY[type]) return null;
    const params = { ...(sl.state || {}), ...extraParams };
    // rebuild images from data URLs
    if(sl.images){
      if(sl.images.img) params.img = dataURLToImg(sl.images.img);
      if(Array.isArray(sl.images.imgs) && sl.images.imgs.length)
        params.imgs = sl.images.imgs.map(dataURLToImg);
    }
    return {
      type,
      name: sl.name,
      blend: sl.blend || 'normal',
      enabled: sl.enabled !== false,
      opacity: typeof sl.opacity === 'number' ? sl.opacity : 1,
      fx: Array.isArray(sl.fx) ? sl.fx.filter(f => f.type).map(f => ({ type:f.type, params:{...(f.params||{})}, _s:{} })) : [],
      params,
    };
  }).filter(Boolean);
}

/* ---- localStorage slot ops ---- */
export function loadAllPresets(){ return lsLoadAll(); }

export function savePresetSlot(name, layers, intensity){
  const all = lsLoadAll();
  all[name] = capturePreset(name, layers, intensity);
  const ok = lsSaveAll(all);
  if(ok) lsSaveOrder(orderedPresetNames(all));
  return ok;
}

export function deletePreset(name){
  const all = lsLoadAll();
  delete all[name];
  lsSaveAll(all);
  lsSaveOrder(orderedPresetNames(all));
}

export function getOrderedPresets(){
  const all = lsLoadAll();
  return orderedPresetNames(all).map(n => ({ name:n, data:all[n] }));
}

export function reorderPresets(names){
  lsSaveOrder(names);
}

/* ---- JSON export/import ---- */
export function downloadPreset(p){
  if(!p) return;
  const blob = new Blob([JSON.stringify(p, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safe = ((p.name || 'preset').replace(/[^\w-]+/g, '_').slice(0, 40)) || 'preset';
  a.href = url; a.download = `hard-reset_${safe}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function exportPresetBundle(selectedNames){
  const all = lsLoadAll();
  const presets = {}, order = [];
  orderedPresetNames(all).forEach(n => {
    if(selectedNames.includes(n) && all[n]){ presets[n] = all[n]; order.push(n); }
  });
  if(!order.length) return;
  const bundle = { type:'hardreset-preset-bundle', version:PRESET_VER, count:order.length, order, presets };
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `hard-reset_bundle_${order.length}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return order.length;
}

export function importPresetFile(file){
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => {
      let p;
      try { p = JSON.parse(r.result); } catch(err){ resolve({ ok:false, msg:'Could not read that file as a preset.' }); return; }
      // bundle
      if(p && p.presets && (p.type === 'hardreset-preset-bundle' || typeof p.presets === 'object')){
        const all = lsLoadAll();
        const names = Array.isArray(p.order) ? p.order : Object.keys(p.presets);
        let added = 0;
        names.forEach(n => { if(p.presets[n]){ all[n] = p.presets[n]; added++; } });
        lsSaveAll(all);
        const ord = lsLoadOrder();
        names.forEach(n => { if(p.presets[n] && !ord.includes(n)) ord.push(n); });
        lsSaveOrder(ord.filter(n => all[n]));
        resolve({ ok:true, bundle:true, count:added });
        return;
      }
      // single preset
      if(p && Array.isArray(p.layers)){
        if(p.name){
          const all = lsLoadAll(); all[p.name] = p; lsSaveAll(all);
          lsSaveOrder(orderedPresetNames(lsLoadAll()));
        }
        resolve({ ok:true, bundle:false, preset:p });
        return;
      }
      resolve({ ok:false, msg:'That doesn\'t look like a HARD RESET preset.' });
    };
    r.readAsText(file);
  });
}
