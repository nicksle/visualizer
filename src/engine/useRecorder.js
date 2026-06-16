import { useRef, useState, useCallback, useEffect } from 'react';
import { useEngine, useFrame } from './EngineContext';
import { BLEND2OP } from './blendMap';
import { isGradeActive, gradeLUT } from './grade';

const FORMATS = [
  {id:'webm-vp9', label:'WebM · VP9',        ext:'webm', mime:'video/webm', types:['video/webm;codecs=vp9','video/webm;codecs=vp09.00.10.08']},
  {id:'mp4-h264', label:'MP4 · H.264',       ext:'mp4',  mime:'video/mp4',  types:['video/mp4;codecs=avc1.640028','video/mp4;codecs=avc1.4d002a','video/mp4;codecs=avc1','video/mp4;codecs=h264','video/mp4']},
  {id:'webm-av1', label:'WebM · AV1 (slow)', ext:'webm', mime:'video/webm', types:['video/webm;codecs=av01.0.08M.08','video/webm;codecs=av01']},
  {id:'webm-vp8', label:'WebM · VP8',        ext:'webm', mime:'video/webm', types:['video/webm;codecs=vp8','video/webm']},
];

function supportedFormats(){
  if(typeof window === 'undefined' || !window.MediaRecorder) return [];
  return FORMATS.map(f => {
    const t = f.types.find(x => { try { return MediaRecorder.isTypeSupported(x); } catch(e){ return false; } });
    return t ? { ...f, type:t } : null;
  }).filter(Boolean);
}

/* Owns the capture canvas. While recording, composites base video (+ its filter)
   and every enabled layer in z-order using the same blend ops as the live stage,
   so the export matches what's on screen. (GRADE LUT bake lands in push 2.) */
export function useRecorder(layersRef){
  const engine = useEngine();
  const [formats] = useState(supportedFormats);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const cap = useRef(null);
  if(!cap.current && typeof document !== 'undefined'){
    cap.current = document.createElement('canvas');
  }
  const rec = useRef({ mr:null, chunks:[], meta:{ext:'webm',mime:'video/webm'}, start:0, timer:null, on:false });

  const composite = useCallback(() => {
    const c = cap.current; if(!c) return;
    const ctx = c.getContext('2d'); const W = c.width, H = c.height;
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.clearRect(0,0,W,H);
    const base = engine.getBase();
    let hasVid = false;
    const vid = base.video, f = base.filter || {bright:100,contrast:100,sat:100};
    ctx.filter = `brightness(${f.bright}%) contrast(${f.contrast}%) saturate(${f.sat}%)`;
    if(vid && vid.style.display !== 'none' && vid.readyState >= 2 && vid.videoWidth){
      const iw=vid.videoWidth, ih=vid.videoHeight, k=Math.max(W/iw,H/ih), dw=iw*k, dh=ih*k;
      ctx.drawImage(vid,(W-dw)/2,(H-dh)/2,dw,dh); hasVid = true;
    }
    ctx.filter = 'none';
    // backdrop wash — screen over video, source-over if no video
    const bd = engine.getBackdrop();
    if(bd.active && bd.canvas){
      ctx.globalCompositeOperation = hasVid ? 'screen' : 'source-over';
      ctx.drawImage(bd.canvas, 0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }
    (layersRef.current || []).forEach(L => {
      if(!L.enabled || L.opacity <= 0) return;
      const lc = engine.getCanvas(L.id); if(!lc) return;
      ctx.globalAlpha = L.opacity;
      ctx.globalCompositeOperation = BLEND2OP[L.blend] || 'source-over';
      ctx.drawImage(lc, 0, 0, W, H);
    });
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    // GRADE LUT bake
    const gradeState = engine.getGrade();
    if(isGradeActive(gradeState)){
      try {
        const lut = gradeLUT(gradeState);
        const img = ctx.getImageData(0, 0, W, H), d = img.data;
        for(let i = 0; i < d.length; i += 4){ d[i]=lut[d[i]]; d[i+1]=lut[d[i+1]]; d[i+2]=lut[d[i+2]]; }
        ctx.putImageData(img, 0, 0);
      } catch(e){} // skip if cross-origin taint
    }
  }, [engine, layersRef]);

  useFrame(useCallback(() => { if(rec.current.on) composite(); }, [composite]));

  const start = useCallback(({ formatId, size, fps=30, quality=16, stageW, stageH }) => {
    if(!formats.length) return { ok:false, msg:'Recording isn’t supported in this view — open the built app in Chrome/Edge.' };
    const fmt = formats.find(f => f.id === formatId) || formats[0];
    const c = cap.current;
    if(size === 'canvas'){ c.width = stageW; c.height = stageH; }
    else { const [w,h] = size.split('x').map(Number); c.width = w; c.height = h; }
    const px = c.width*c.height, refPx = 1920*1080;
    const bps = Math.round(Math.max(2, quality*(px/refPx)*(fps/30))*1e6);
    let mr;
    try { mr = new MediaRecorder(c.captureStream(fps), { mimeType:fmt.type, videoBitsPerSecond:bps }); }
    catch(err){ return { ok:false, msg:'Couldn’t start with that combination — try WebM · VP9, smaller size, or lower fps.' }; }
    const R = rec.current;
    R.mr = mr; R.chunks = []; R.meta = { ext:fmt.ext, mime:fmt.mime };
    mr.ondataavailable = e => { if(e.data && e.data.size) R.chunks.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(R.chunks, { type:R.meta.mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
      a.href = url; a.download = `hard-reset_${stamp}.${R.meta.ext}`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    };
    mr.start(); R.on = true; R.start = performance.now();
    setRecording(true);
    R.timer = setInterval(() => setElapsed(Math.floor((performance.now()-R.start)/1000)), 250);
    return { ok:true };
  }, [formats]);

  const stop = useCallback(() => {
    const R = rec.current; R.on = false;
    if(R.mr && R.mr.state !== 'inactive') R.mr.stop();
    clearInterval(R.timer); setRecording(false); setElapsed(0);
  }, []);

  useEffect(() => () => { const R = rec.current; if(R.mr && R.mr.state !== 'inactive') R.mr.stop(); clearInterval(R.timer); }, []);

  return { formats, recording, elapsed, start, stop };
}
