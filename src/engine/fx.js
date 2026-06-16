/* ======================================================================
   LAYER FX — transforms applied to a SINGLE layer's rendered output.
   Ported verbatim from vanilla. A layer with fx=[{type,params,_s}] renders
   into an offscreen buffer, then each FX warps that buffer onto the visible
   canvas (chained ping-pong). Adding an FX = one apply() + one FX[] entry.
   apply(ctx, src, t, dt, W, H, lvl, p, s)
   ====================================================================== */

export function applyAcid(ctx,src,t,dt,W,H,lvl,p,s){
  const hue    = (p.hue ?? 70) * t * (0.4 + lvl);
  const sat    = 100 + (p.sat ?? 90) * (0.4 + lvl);
  const warp   = (p.warp ?? 16) * (0.3 + lvl);
  const wspd   = (p.warpSpeed ?? 100) / 100;
  const fringe = (p.fringe ?? 8) * (0.3 + lvl);
  const trails = Math.min(0.95, (p.trails ?? 40) / 100);

  let buf=s.buf || (s.buf=document.createElement('canvas'));
  if(buf.width!==W||buf.height!==H){ buf.width=W; buf.height=H; }
  const b=buf.getContext('2d'); b.setTransform(1,0,0,1,0,0); b.filter='none';

  if(trails>0){
    b.globalCompositeOperation='destination-out'; b.globalAlpha=1;
    b.fillStyle=`rgba(0,0,0,${1-trails})`; b.fillRect(0,0,W,H);
    b.globalCompositeOperation='source-over';
  } else { b.clearRect(0,0,W,H); }

  const STRIPS=56, sh=H/STRIPS;
  for(let i=0;i<STRIPS;i++){
    const y=i*sh;
    const dx=Math.sin(y*0.028 + t*1.7*wspd)*warp + Math.sin(y*0.013 - t*1.1*wspd)*warp*0.5;
    if(fringe>0){
      b.globalCompositeOperation='lighter'; b.globalAlpha=0.55;
      b.filter=`hue-rotate(${hue+130}deg) saturate(${sat}%)`;
      b.drawImage(src,0,y,W,sh, dx-fringe,y,W,sh);
      b.filter=`hue-rotate(${hue-130}deg) saturate(${sat}%)`;
      b.drawImage(src,0,y,W,sh, dx+fringe,y,W,sh);
      b.globalAlpha=1;
    }
    b.globalCompositeOperation='source-over';
    b.filter=`hue-rotate(${hue}deg) saturate(${sat}%)`;
    b.drawImage(src,0,y,W,sh, dx,y,W,sh);
  }
  b.filter='none'; b.globalCompositeOperation='source-over';
  ctx.clearRect(0,0,W,H); ctx.drawImage(buf,0,0,W,H);
}

export function applyGlitch(ctx,src,t,dt,W,H,lvl,p,s){
  const split  = (p.split ?? 6) * (0.4 + lvl);
  const jitter = (p.jitter ?? 50) / 100;
  const drop   = (p.dropout ?? 30) / 100;

  let out=s.out || (s.out=document.createElement('canvas'));
  if(out.width!==W||out.height!==H){ out.width=W; out.height=H; }
  const o=out.getContext('2d'); o.setTransform(1,0,0,1,0,0);
  o.globalCompositeOperation='source-over'; o.globalAlpha=1; o.clearRect(0,0,W,H);

  let ch=s.ch || (s.ch=document.createElement('canvas'));
  if(ch.width!==W||ch.height!==H){ ch.width=W; ch.height=H; }
  const cc=ch.getContext('2d');

  const channel=(color,ox)=>{
    cc.setTransform(1,0,0,1,0,0); cc.globalAlpha=1;
    cc.globalCompositeOperation='source-over'; cc.clearRect(0,0,W,H); cc.drawImage(src,0,0);
    cc.globalCompositeOperation='multiply'; cc.fillStyle=color; cc.fillRect(0,0,W,H);
    cc.globalCompositeOperation='destination-in'; cc.drawImage(src,0,0);
    cc.globalCompositeOperation='source-over';
    o.globalCompositeOperation='lighter'; o.drawImage(ch,ox,0);
  };
  channel('#ff0000',-split); channel('#00ff00',0); channel('#0000ff',split);
  o.globalCompositeOperation='source-over';

  if(jitter>0.001){
    cc.setTransform(1,0,0,1,0,0); cc.globalAlpha=1; cc.globalCompositeOperation='source-over';
    cc.clearRect(0,0,W,H); cc.drawImage(out,0,0);
    const slices=16, sh=H/slices;
    for(let i=0;i<slices;i++){
      if(Math.random()<0.35*jitter){
        const sy=i*sh, off=(Math.random()-0.5)*60*jitter;
        o.clearRect(0,sy,W,sh); o.drawImage(ch,0,sy,W,sh, off,sy,W,sh);
      }
    }
  }
  if(drop>0.001 && Math.random()<drop*0.6){
    const by=Math.random()*H, bh=4+Math.random()*30*drop;
    o.globalCompositeOperation='source-over';
    o.fillStyle = Math.random()<0.5 ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.25)';
    o.fillRect(0,by,W,bh);
  }
  ctx.clearRect(0,0,W,H); ctx.drawImage(out,0,0,W,H);
}

export const FX = {
  acid:{ type:'acid', name:'Acid Trip', tag:'FX', apply:applyAcid, controls:[
    {type:'range',key:'hue',      label:'HUE SPD',  min:0,  max:240,def:70},
    {type:'range',key:'sat',      label:'SATURATE', min:0,  max:200,def:90, suffix:'%'},
    {type:'range',key:'warp',     label:'WARP',     min:0,  max:60, def:16, suffix:'px'},
    {type:'range',key:'warpSpeed',label:'FLOW',     min:20, max:300,def:100,suffix:'%'},
    {type:'range',key:'fringe',   label:'FRINGE',   min:0,  max:30, def:8,  suffix:'px'},
    {type:'range',key:'trails',   label:'TRAILS',   min:0,  max:95, def:40, suffix:'%'},
  ]},
  glitch:{ type:'glitch', name:'Glitch', tag:'FX', apply:applyGlitch, controls:[
    {type:'range',key:'split',  label:'RGB SPLIT',min:0,max:30, def:6, suffix:'px'},
    {type:'range',key:'jitter', label:'JITTER',   min:0,max:100,def:50,suffix:'%'},
    {type:'range',key:'dropout',label:'DROPOUT',  min:0,max:100,def:30,suffix:'%'},
  ]},
};
export const FX_ADDABLE = ['acid','glitch'];

/* Run a layer's FX chain: render `drawSelf(buf)` into an offscreen buffer,
   then ping-pong each FX onto the destination ctx. Mirrors the vanilla frame loop. */
export function runFxChain(destCtx, drawSelf, fx, t, dt, W, H, lvl, scratch){
  const buf = scratch.src || (scratch.src = document.createElement('canvas'));
  if(buf.width!==W||buf.height!==H){ buf.width=W; buf.height=H; }
  const sctx = buf.getContext('2d');
  sctx.setTransform(1,0,0,1,0,0); sctx.clearRect(0,0,W,H);
  drawSelf(sctx);
  let from = buf;
  for(let i=0;i<fx.length;i++){
    const def = FX[fx[i].type]; if(!def) continue;
    const fs = fx[i]._s || (fx[i]._s = {});
    if(i===fx.length-1){ def.apply(destCtx, from, t, dt, W, H, lvl, fx[i].params, fs); }
    else {
      const tmp = fs._out || (fs._out = document.createElement('canvas'));
      if(tmp.width!==W||tmp.height!==H){ tmp.width=W; tmp.height=H; }
      const tctx = tmp.getContext('2d'); tctx.setTransform(1,0,0,1,0,0); tctx.clearRect(0,0,W,H);
      def.apply(tctx, from, t, dt, W, H, lvl, fx[i].params, fs); from = tmp;
    }
  }
}
