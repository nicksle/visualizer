import { makeLayer } from './_factory';
import { hexA, PRIDE, ringPath } from './_helpers';

export default makeLayer({
  type:'wormhole', name:'Wormhole', tag:'ANIM', blend:'screen', opacity:1,
  makeState:()=>({phase:0}),
  init(_,__,s){ s.phase=0; },
  draw(ctx,t,dt,W,H,lvl,s){
    if(!W||!H) return;
    const cx=W/2, cy=H/2;
    const maxR=Math.hypot(W,H)/2*1.12, minR=maxR*0.02;
    const dens=(s.density??45)/100;
    const R=1.5-dens*0.4;
    const dir=(s.direction==='out')?-1:1;
    const speed=((s.speed??40)/100)*(0.5+lvl*1.2);
    const swirl=((s.swirl??40)/100)*2.4;
    const spokes=Math.round(s.spokes??24);
    const square=((s.shape||'square')==='square');
    const pride=((s.palette||'mono')==='pride');
    const PN=PRIDE.length, baseCol=s.color||'#86e1ff';
    ctx.lineWidth=Math.max(0.6,(s.width??18)/10); ctx.lineJoin='round'; ctx.lineCap='round';
    s.phase=(s.phase||0)+dir*speed*dt;
    const ph=s.phase, frac=ph-Math.floor(ph), rot=ph*0.15, ringIdx=Math.floor(ph);
    const twist=(r)=> swirl*Math.log(maxR/Math.max(minR,r));
    for(let k=0;;k++){
      const rr=maxR*Math.pow(R,-(k-frac));
      if(rr<minR) break;
      const fade=Math.max(0,Math.min(1,(rr-minR)/(maxR*0.10)));
      const col=pride?PRIDE[(((ringIdx+k)%PN)+PN)%PN]:baseCol;
      ctx.strokeStyle=hexA(col,0.85*fade);
      ringPath(ctx,cx,cy,rr,rot+twist(rr),square);
    }
    if(spokes>0){
      for(let m=0;m<spokes;m++){
        const base=(m/spokes)*Math.PI*2+rot;
        ctx.strokeStyle=hexA(pride?PRIDE[m%PN]:baseCol,0.55);
        ctx.beginPath();
        let first=true;
        for(let rr=maxR; rr>minR; rr*=0.9){
          const a=base+twist(rr), x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr;
          if(first){ ctx.moveTo(x,y); first=false; } else ctx.lineTo(x,y);
        }
        ctx.stroke();
      }
    }
  },
  controls:[
    {type:'range',key:'density',label:'GRID',min:0,max:100,def:45,suffix:'%'},
    {type:'range',key:'spokes',label:'SPOKES',min:0,max:64,def:24},
    {type:'range',key:'swirl',label:'SWIRL',min:0,max:100,def:40,suffix:'%'},
    {type:'range',key:'speed',label:'PULL SPD',min:0,max:100,def:40,suffix:'%'},
    {type:'select',key:'direction',label:'DIRECTION',options:['in','out'],def:'in'},
    {type:'select',key:'shape',label:'SHAPE',options:['square','round'],def:'square'},
    {type:'range',key:'width',label:'LINE',min:6,max:60,def:18},
    {type:'select',key:'palette',label:'PALETTE',options:['mono','pride'],def:'mono'},
    {type:'color',key:'color',label:'COLOR',def:'#86e1ff'}
  ]
});
