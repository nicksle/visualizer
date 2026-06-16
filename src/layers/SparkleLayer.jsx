import { makeLayer } from './_factory';
import { sparkle } from './_helpers';

export default makeLayer({
  type:'sparkles', name:'Sparkle Field', tag:'ANIM', blend:'screen', opacity:0.9,
  makeState:()=>({pts:[]}),
  init(W,H,s){ s.pts=Array.from({length:140},()=>({x:Math.random()*W,y:Math.random()*H,r:1+Math.random()*3,ph:Math.random()*6.28,sp:0.2+Math.random()*0.8,vy:-(4+Math.random()*16)})); },
  draw(ctx,t,dt,W,H,lvl,s){ const n=Math.min(s.pts.length, Math.floor(40+s.pts.length*lvl));
    for(let i=0;i<n;i++){const p=s.pts[i];p.y+=p.vy*dt*(0.4+lvl);if(p.y<-10){p.y=H+10;p.x=Math.random()*W;}
      const tw=0.35+0.65*Math.abs(Math.sin(t*p.sp+p.ph));sparkle(ctx,p.x,p.y,p.r*(1+lvl*0.8),tw*(0.4+lvl*0.6),s.color||'#ffffff');} },
  controls:[{type:'color',key:'color',label:'COLOR',def:'#ffffff'}]
});
