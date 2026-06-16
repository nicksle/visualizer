import { makeLayer } from './_factory';
import { drawBolt, PRIDE } from './_helpers';
import { SIG } from '../engine/signal';

export default makeLayer({
  type:'lightning', name:'Lightning', tag:'ANIM', blend:'screen', opacity:1,
  makeState:()=>({bolts:[],last:0,ci:0,pa:0,pop:0,seedKey:''}),
  init(_,__,s){ s.bolts=[]; s.last=0; s.seedKey=''; },
  draw(ctx,t,dt,W,H,lvl,s){
    if(!W||!H) return;
    const mode=s.mode||'strike';
    const baseH=H*((s.size??45)/100);
    const count=Math.max(1,Math.round(s.count??10));
    const spd=Math.max(0.1,(s.speed??100)/100);
    const outline=s.outline==='on';
    const pickCol=()=> s.palette==='pride' ? PRIDE[(s.ci=(s.ci+1)%PRIDE.length)] : (s.color||'#f7a81b');
    const audio=SIG.audio;
    const beatHit=(s.beat!=='off') && audio>0.32 && (s.pa||0)<=0.32;
    s.pa=audio;
    if(mode==='strike'){
      if(s.seedKey!=='strike'){ s.bolts=[]; s.seedKey='strike'; }
      const spawn=()=>s.bolts.push({fx:0.08+Math.random()*0.84,fy:0.05+Math.random()*0.7,hf:0.6+Math.random()*0.8,rot:(Math.random()-0.5)*0.6,col:pickCol(),life:0,max:0.16+Math.random()*0.22});
      const interval=Math.max(0.04,(0.55-lvl*0.4)/spd);
      if(t-(s.last||0)>interval && s.bolts.length<count){ spawn(); s.last=t; }
      if(beatHit){ const n=2+Math.floor(Math.random()*3); for(let k=0;k<n;k++) spawn(); }
      for(let i=s.bolts.length-1;i>=0;i--){
        const b=s.bolts[i]; b.life+=dt; const k=b.life/b.max;
        if(k>=1){ s.bolts.splice(i,1); continue; }
        const pop=k<0.16?1.18-(k/0.16)*0.18:1;
        const a=k>0.65?1-(k-0.65)/0.35:1;
        ctx.globalAlpha=a; drawBolt(ctx,b.fx*W,b.fy*H,baseH*b.hf*pop,b.rot,b.col,outline);
      }
      ctx.globalAlpha=1;
      if(s.bolts.length>140) s.bolts.splice(0,s.bolts.length-140);
    }
    else if(mode==='rain'){
      const key='rain|'+count;
      if(s.seedKey!==key){ s.bolts=Array.from({length:count},()=>({fx:Math.random(),fy:Math.random(),hf:0.4+Math.random()*0.6,rot:(Math.random()-0.5)*0.3,col:pickCol(),vf:0.35+Math.random()*0.5})); s.seedKey=key; }
      for(const b of s.bolts){
        b.fy += b.vf*dt*spd*(0.4+lvl);
        if(b.fy*H-baseH*b.hf>H){ b.fy=-(baseH*b.hf)/H; b.fx=Math.random(); b.col=pickCol(); }
        drawBolt(ctx,b.fx*W,b.fy*H,baseH*b.hf,b.rot,b.col,outline);
      }
    }
    else {
      const key='scatter|'+count;
      if(s.seedKey!==key){ s.bolts=Array.from({length:count},()=>({fx:0.08+Math.random()*0.84,fy:0.1+Math.random()*0.8,hf:0.6+Math.random()*0.7,rot:(Math.random()-0.5)*0.7,col:pickCol(),ph:Math.random()*6.28})); s.seedKey=key; }
      s.pop=Math.max((s.pop||0)*Math.pow(0.0015,dt), beatHit?1:0);
      for(const b of s.bolts){
        const fl=0.82+0.18*Math.abs(Math.sin(t*2+b.ph));
        const sc=1+lvl*0.12+(s.pop||0)*0.18;
        ctx.globalAlpha=fl; drawBolt(ctx,b.fx*W,b.fy*H,baseH*b.hf*sc,b.rot,b.col,outline);
      }
      ctx.globalAlpha=1;
    }
  },
  controls:[
    {type:'select',key:'mode',label:'MODE',options:['strike','rain','scatter'],def:'strike'},
    {type:'select',key:'palette',label:'PALETTE',options:['single','pride'],def:'single'},
    {type:'color',key:'color',label:'COLOR',def:'#f7a81b'},
    {type:'range',key:'size',label:'SIZE',min:10,max:100,def:45,suffix:'%'},
    {type:'range',key:'count',label:'COUNT',min:1,max:40,def:10},
    {type:'range',key:'speed',label:'SPEED',min:20,max:300,def:100,suffix:'%'},
    {type:'select',key:'beat',label:'ON BEAT',options:['on','off'],def:'on'},
    {type:'select',key:'outline',label:'OUTLINE',options:['off','on'],def:'off'}
  ]
});
