import { makeLayer } from './_factory';
import { hexA } from './_helpers';

export default makeLayer({
  type:'grid', name:'Scan Grid', tag:'ANIM', blend:'overlay', opacity:0.4,
  makeState:()=>({off:0}),
  init(_,__,s){ s.off=0; },
  draw(ctx,t,dt,W,H,lvl,s){ s.off=(s.off+dt*(20+lvl*120))%48; const c=s.color||'#ffb000';
    ctx.strokeStyle=hexA(c,0.10+lvl*0.18);ctx.lineWidth=1;ctx.beginPath();
    for(let y=-48+s.off;y<H;y+=48){ctx.moveTo(0,y);ctx.lineTo(W,y);}
    for(let x=0;x<W;x+=48){ctx.moveTo(x,0);ctx.lineTo(x,H);}ctx.stroke();
    const sy=(t*(60+lvl*220))%(H+200)-100;const g=ctx.createLinearGradient(0,sy-60,0,sy+60);
    g.addColorStop(0,hexA(c,0));g.addColorStop(.5,hexA(c,0.10+lvl*0.25));g.addColorStop(1,hexA(c,0));
    ctx.fillStyle=g;ctx.fillRect(0,sy-60,W,120); },
  controls:[{type:'color',key:'color',label:'COLOR',def:'#ffb000'}]
});
