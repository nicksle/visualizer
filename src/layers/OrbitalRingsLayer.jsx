import { makeLayer } from './_factory';
import { hexA, PRIDE } from './_helpers';

export default makeLayer({
  type:'rings', name:'Orbital Rings', tag:'ANIM', blend:'screen', opacity:0.7,
  makeState:()=>({rings:[],last:0,ci:0,palette:'pride'}),
  init(W,H,s){ s.rings=[];s.last=0;s.ci=0; },
  draw(ctx,t,dt,W,H,lvl,s){ const cx=W/2,cy=H/2,interval=0.9-lvl*0.6;
    if(t-s.last>interval){
      const col = s.palette==='pride' ? PRIDE[s.ci++ % PRIDE.length] : (s.color||'#ffffff');
      s.rings.push({r:0,a:1,c:col}); s.last=t;
    }
    ctx.lineWidth=1.5+lvl*2.5;
    for(let i=s.rings.length-1;i>=0;i--){const r=s.rings[i];r.r+=dt*(120+lvl*260);r.a-=dt*0.45;
      if(r.a<=0){s.rings.splice(i,1);continue;}
      ctx.strokeStyle=hexA(r.c,r.a*0.7);ctx.beginPath();ctx.arc(cx,cy,r.r,0,6.2832);ctx.stroke();} },
  controls:[
    {type:'select',key:'palette',label:'PALETTE',options:['pride','single'],def:'pride'},
    {type:'color',key:'color',label:'COLOR',def:'#ffffff'}
  ]
});
