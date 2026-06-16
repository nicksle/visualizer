/* Shared drawing helpers — ported verbatim from the vanilla build so layer
   output is pixel-identical. Pure functions of (ctx, params); no engine state. */

export const PRIDE = ['#e40303','#ff8c00','#ffed00','#008026','#004dff','#750787'];

export function hexA(hex, a){
  const h = hex.replace('#','');
  const r = parseInt(h.substr(0,2),16), g = parseInt(h.substr(2,2),16), b = parseInt(h.substr(4,2),16);
  return `rgba(${r},${g},${b},${a})`;
}

export const CELL_ASPECT = { square:1, landscape:1.6, portrait:0.66, wide:2.6 };

export function pickImg(n, count, mode){
  if(count<=1) return 0;
  if(mode==='shuffle') return (Math.imul((n^0x9e3779b9)|0, 2654435761) >>> 0) % count;
  return ((n%count)+count)%count;
}

export function sparkle(ctx,x,y,r,alpha,color){
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.fillStyle=color;ctx.beginPath();
  const inner=r*0.16;
  for(let i=0;i<8;i++){const ang=(Math.PI/4)*i-Math.PI/2;const rad=(i%2===0)?r:inner;
    ctx[i===0?'moveTo':'lineTo'](Math.cos(ang)*rad,Math.sin(ang)*rad);}
  ctx.closePath();ctx.fill();ctx.restore();
}

export function glint(ctx,x,y,R,rot,alpha,color,ex,ey,glow){
  if(alpha<=0.001||R<=0) return;
  ctx.save();
  ctx.translate(x,y); if(rot) ctx.rotate(rot);
  ctx.globalAlpha=Math.min(1,alpha);
  if(glow>0){
    const gr=R*(1.1+glow*1.7);
    const g=ctx.createRadialGradient(0,0,0,0,0,gr);
    g.addColorStop(0,hexA(color,0.55*glow)); g.addColorStop(0.5,hexA(color,0.12*glow)); g.addColorStop(1,hexA(color,0));
    ctx.globalCompositeOperation='lighter';
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,gr,0,6.2832); ctx.fill();
    ctx.globalCompositeOperation='source-over';
  }
  const inner=0.13;
  const tips=[[-Math.PI/2,ey],[0,ex],[Math.PI/2,ey],[Math.PI,ex]];
  ctx.beginPath();
  for(let i=0;i<4;i++){
    const a0=tips[i][0], f0=tips[i][1], a1=tips[(i+1)%4][0], f1=tips[(i+1)%4][1];
    const x0=Math.cos(a0)*R*f0, y0=Math.sin(a0)*R*f0;
    const x1=Math.cos(a1)*R*f1, y1=Math.sin(a1)*R*f1;
    const cda=a0+Math.PI/4;
    const cx=Math.cos(cda)*R*inner, cy=Math.sin(cda)*R*inner;
    if(i===0) ctx.moveTo(x0,y0);
    ctx.quadraticCurveTo(cx,cy,x1,y1);
  }
  ctx.closePath();
  ctx.fillStyle=color; ctx.fill();
  ctx.restore();
}

export function ringPath(ctx,cx,cy,r,a0,square){
  ctx.beginPath();
  if(!square){ ctx.arc(cx,cy,r,0,Math.PI*2); }
  else{
    const c=Math.cos(a0), sn=Math.sin(a0), p=[[-r,-r],[r,-r],[r,r],[-r,r]];
    for(let i=0;i<4;i++){ const x=cx+p[i][0]*c-p[i][1]*sn, y=cy+p[i][0]*sn+p[i][1]*c; i?ctx.lineTo(x,y):ctx.moveTo(x,y); }
    ctx.closePath();
  }
  ctx.stroke();
}

export const BOLT=[[0,0],[0,0.55],[0.15,0.55],[0.15,1.0],[0.5,0.4],[0.3,0.4],[0.5,0]];
export function drawBolt(ctx,cx,cy,h,rot,color,outline){
  ctx.save();
  ctx.translate(cx,cy); if(rot) ctx.rotate(rot);
  ctx.beginPath();
  for(let i=0;i<BOLT.length;i++){ const x=(BOLT[i][0]-0.25)*h, y=(BOLT[i][1]-0.5)*h; if(i) ctx.lineTo(x,y); else ctx.moveTo(x,y); }
  ctx.closePath();
  if(outline){ ctx.lineJoin='round'; ctx.lineWidth=Math.max(1.5,h*0.03); ctx.strokeStyle='#0a0a0b'; ctx.stroke(); }
  ctx.fillStyle=color; ctx.fill();
  ctx.restore();
}

export function groundColor(bg,dot){ if(bg==='white')return '#f4f1ea'; if(bg==='black')return '#0a0a0a'; return dot; }
export function drawShape(g,x,y,r,shape){
  if(r<=0.2) return;
  switch(shape){
    case 'square': g.fillRect(x-r,y-r,r*2,r*2); break;
    case 'diamond':
      g.beginPath();g.moveTo(x,y-r);g.lineTo(x+r,y);g.lineTo(x,y+r);g.lineTo(x-r,y);g.closePath();g.fill(); break;
    case 'triangle':
      g.beginPath();g.moveTo(x,y-r);g.lineTo(x+r*0.866,y+r*0.55);g.lineTo(x-r*0.866,y+r*0.55);g.closePath();g.fill(); break;
    case 'cross':{ const t=r*0.42; g.fillRect(x-t,y-r,t*2,r*2); g.fillRect(x-r,y-t,r*2,t*2); break; }
    case 'ring':
      g.beginPath();g.arc(x,y,r*0.78,0,6.2832);g.strokeStyle=g.fillStyle;g.lineWidth=Math.max(1,r*0.34);g.stroke(); break;
    case 'star':{
      g.beginPath();
      for(let i=0;i<8;i++){ const a=(Math.PI/4)*i-Math.PI/2, rr=(i%2===0)?r:r*0.42, px=x+Math.cos(a)*rr, py=y+Math.sin(a)*rr; i?g.lineTo(px,py):g.moveTo(px,py); }
      g.closePath();g.fill(); break;
    }
    default: g.beginPath();g.arc(x,y,r,0,6.2832);g.fill();
  }
}
export function drawDots(g,w,h,cell,angle,color,radiusFn,shape){
  const cx=w/2,cy=h/2,cos=Math.cos(angle),sin=Math.sin(angle),half=Math.hypot(w,h)/2+cell;
  const cf=(typeof color==='function'); shape=shape||'dot';
  g.save();g.translate(cx,cy);g.rotate(angle); if(!cf) g.fillStyle=color;
  for(let gy=-half;gy<=half;gy+=cell){
    for(let gx=-half;gx<=half;gx+=cell){
      const sx=cx+gx*cos-gy*sin, sy=cy+gx*sin+gy*cos, r=radiusFn(sx,sy);
      if(r<=0.2) continue;
      if(cf) g.fillStyle=color(sx,sy);
      drawShape(g,gx,gy,r,shape);
    }
  }
  g.restore();
}
export function buildFlat(w,h,cell,angle,color,bg,baseR,shape){
  const off=document.createElement('canvas');off.width=w;off.height=h;
  const g=off.getContext('2d');
  if(bg!=='transparent'){ g.fillStyle=groundColor(bg,color); g.fillRect(0,0,w,h); }
  drawDots(g,w,h,cell,angle,color,()=>baseR,shape);
  return off;
}
