import { makeLayer } from './_factory';
import { PRIDE, CELL_ASPECT, pickImg } from './_helpers';

/* Merged Scroll Grid — horizontal and vertical unified under one `orientation`
   param (the sanctioned Sprint-1 cleanup). Both code paths are the verbatim
   vanilla draws; `lanes` = rows (horizontal) or cols (vertical); direction is
   forward/reverse (right/down vs left/up). */
export default makeLayer({
  type:'scrollgrid', name:'Scroll Grid', tag:'ANIM', blend:'screen', opacity:0.9,
  makeState:()=>({scroll:0}),
  init(_,__,s){ s.scroll=0; },
  draw(ctx,t,dt,W,H,lvl,s){
    if(!W||!H) return;
    const vert = (s.orientation||'horizontal')==='vertical';
    const imgs = (s.source==='image' && s.imgs && s.imgs.length) ? s.imgs : null;
    const lanes = Math.max(1, Math.round(s.lanes ?? 1));
    const alt = s.alternate==='on';
    const speed = ((s.speed ?? 60)/100) * 140 * (0.4 + lvl);
    const fwd = s.direction !== 'reverse';

    if(!vert){
      const dir = fwd ? 1 : -1;                                  // right / left
      s.scroll = (s.scroll ?? 0) + dir*speed*dt;
      const rows = lanes, rowPitch = H/rows;
      const cellH = rowPitch * ((s.size ?? 60)/100);
      const cellAspect = imgs ? (CELL_ASPECT[s.cell] ?? 1) : 2.6;
      const cellW = cellH * cellAspect;
      const period = cellW * (1 + (s.gap ?? 40)/100);
      const radius = Math.min(cellH/2, 18);
      const fontPx = Math.floor(cellH*0.34);
      for(let r=0;r<rows;r++){
        const rdir = (alt && r%2===1) ? -1 : 1;
        const stagger = (r%2===1) ? period*0.5 : 0;
        const shift = s.scroll*rdir + stagger;
        const cy = rowPitch*r + rowPitch/2;
        const first = Math.floor((-shift - period)/period);
        const last  = Math.ceil((-shift + W + period)/period);
        for(let n=first;n<=last;n++){
          const x = n*period + shift + (period - cellW)/2;
          const y = cy - cellH/2;
          if(imgs){
            const img = imgs[pickImg(n + r, imgs.length, s.distribute)];
            if(img && img.complete && img.naturalWidth){
              const iw=img.naturalWidth, ih=img.naturalHeight, k=Math.min(cellW/iw, cellH/ih);
              const dw=iw*k, dh=ih*k;
              ctx.drawImage(img, x+(cellW-dw)/2, y+(cellH-dh)/2, dw, dh);
            }
            continue;
          }
          const col = s.palette==='single' ? (s.color||'#ffffff')
            : PRIDE[((n%PRIDE.length)+PRIDE.length)%PRIDE.length];
          ctx.fillStyle=col; ctx.beginPath();
          if(ctx.roundRect) ctx.roundRect(x,y,cellW,cellH,radius); else ctx.rect(x,y,cellW,cellH);
          ctx.fill();
          ctx.fillStyle='#0a0a0b';
          ctx.font=`800 ${fontPx}px 'JetBrains Mono', ui-monospace, monospace`;
          ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText('HARD RESET', x+cellW/2, cy);
        }
      }
      return;
    }

    // vertical
    const dir = fwd ? 1 : -1;                                    // down / up
    s.scroll = (s.scroll ?? 0) + dir*speed*dt;
    const cols = lanes, colPitch = W/cols;
    const cellW = colPitch * ((s.size ?? 60)/100);
    const cellAspect = imgs ? (CELL_ASPECT[s.cell] ?? 1) : 2.6;
    const cellH = cellW / cellAspect;
    const period = cellH * (1 + (s.gap ?? 40)/100);
    const radius = Math.min(cellH/2, 18);
    const fontPx = Math.floor(cellH*0.42);
    for(let c=0;c<cols;c++){
      const cdir = (alt && c%2===1) ? -1 : 1;
      const stagger = (c%2===1) ? period*0.5 : 0;
      const shift = s.scroll*cdir + stagger;
      const cx = colPitch*c + colPitch/2;
      const first = Math.floor((-shift - period)/period);
      const last  = Math.ceil((-shift + H + period)/period);
      for(let n=first;n<=last;n++){
        const y = n*period + shift + (period - cellH)/2;
        const x = cx - cellW/2;
        if(imgs){
          const img = imgs[pickImg(n + c, imgs.length, s.distribute)];
          if(img && img.complete && img.naturalWidth){
            const iw=img.naturalWidth, ih=img.naturalHeight, k=Math.min(cellW/iw, cellH/ih);
            const dw=iw*k, dh=ih*k;
            ctx.drawImage(img, x+(cellW-dw)/2, y+(cellH-dh)/2, dw, dh);
          }
          continue;
        }
        const col = s.palette==='single' ? (s.color||'#ffffff')
          : PRIDE[((n%PRIDE.length)+PRIDE.length)%PRIDE.length];
        ctx.fillStyle=col; ctx.beginPath();
        if(ctx.roundRect) ctx.roundRect(x,y,cellW,cellH,radius); else ctx.rect(x,y,cellW,cellH);
        ctx.fill();
        ctx.fillStyle='#0a0a0b';
        ctx.font=`800 ${fontPx}px 'JetBrains Mono', ui-monospace, monospace`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('HARD RESET', cx, y+cellH/2);
      }
    }
  },
  controls:[
    {type:'select',key:'orientation',label:'ORIENT',options:['horizontal','vertical'],def:'horizontal'},
    {type:'select',key:'source',label:'SOURCE',options:['mark','image'],def:'mark'},
    {type:'images',key:'imgs',label:'IMAGES'},
    {type:'select',key:'distribute',label:'SPREAD',options:['cycle','shuffle'],def:'cycle'},
    {type:'select',key:'cell',label:'CELL',options:['square','landscape','portrait','wide'],def:'square'},
    {type:'select',key:'palette',label:'PALETTE',options:['pride','single'],def:'pride'},
    {type:'color',key:'color',label:'COLOR',def:'#ffffff'},
    {type:'range',key:'lanes',label:'LANES',min:1,max:6,def:1},
    {type:'range',key:'size',label:'SIZE',min:20,max:100,def:60,suffix:'%'},
    {type:'range',key:'gap',label:'GAP',min:0,max:200,def:40,suffix:'%'},
    {type:'range',key:'speed',label:'SPEED',min:0,max:200,def:60,suffix:'%'},
    {type:'select',key:'direction',label:'DIR',options:['forward','reverse'],def:'forward'},
    {type:'select',key:'alternate',label:'ALT LANES',options:['off','on'],def:'off'}
  ]
});
