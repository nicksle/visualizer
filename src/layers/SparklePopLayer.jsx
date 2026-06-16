import { makeLayer } from './_factory';
import { glint, PRIDE } from './_helpers';

export default makeLayer({
  type:'glints', name:'Sparkle Pop', tag:'ANIM', blend:'screen', opacity:1,
  makeState:()=>({items:[], acc:0}),
  init(W,H,s){ s.items=[]; s.acc=0; },
  draw(ctx,t,dt,W,H,lvl,s){
    if(!W||!H) return;
    const palette=s.palette||'white';
    const baseR=Math.min(W,H)*((s.size??12)/100);
    const life=Math.max(0.4,(s.life??2.2));
    const target=Math.max(1, Math.round((s.count??12)*(0.5+lvl*0.9)));
    const shimmer=(s.shimmer??60)/100;
    const spin=(s.spin??25)/100;
    const glow=(s.glow??50)/100;
    const want=target - s.items.length;
    if(want>0 && Math.random() < (1.8*want)*dt){
      const R=baseR*(0.6+Math.random()*0.9), m=R*0.7;
      let col = palette==='pride' ? PRIDE[(Math.random()*PRIDE.length)|0]
              : palette==='single' ? (s.color||'#ffffff') : '#ffffff';
      s.items.push({
        x:m+Math.random()*(W-2*m), y:m+Math.random()*(H-2*m), R, col,
        born:t, life:life*(0.6+Math.random()*0.8),
        rot:Math.random()*6.28, spin:(Math.random()*2-1)*spin*1.4,
        ph:Math.random()*6.28, ex:0.85+Math.random()*0.3, ey:1.05+Math.random()*0.35
      });
    }
    for(let i=s.items.length-1;i>=0;i--){
      const p=s.items[i], u=(t-p.born)/p.life;
      if(u>=1){ s.items.splice(i,1); continue; }
      let env = u<0.18 ? u/0.18 : u>0.62 ? 1-(u-0.62)/0.38 : 1;
      env = env*env*(3-2*env);
      const fl = 1 - shimmer*0.5*(0.5+0.5*Math.sin(t*7*(0.6+spin)+p.ph));
      const pulse = 1 + 0.06*Math.sin(t*5+p.ph);
      const a = env*fl*(0.85+lvl*0.15);
      glint(ctx, p.x, p.y, p.R*pulse, p.rot+p.spin*(t-p.born), a, p.col, p.ex, p.ey, glow*(0.7+0.3*env));
    }
  },
  controls:[
    {type:'range',key:'count',label:'DENSITY',min:1,max:40,def:12},
    {type:'range',key:'size',label:'SIZE',min:4,max:30,def:12,suffix:'%'},
    {type:'range',key:'life',label:'LIFETIME',min:0.5,max:6,step:0.1,def:2.2,suffix:'s'},
    {type:'range',key:'shimmer',label:'SHIMMER',min:0,max:100,def:60,suffix:'%'},
    {type:'range',key:'spin',label:'SPIN',min:0,max:100,def:25,suffix:'%'},
    {type:'range',key:'glow',label:'GLOW',min:0,max:100,def:50,suffix:'%'},
    {type:'select',key:'palette',label:'PALETTE',options:['white','pride','single'],def:'white'},
    {type:'color',key:'color',label:'COLOR',def:'#ffffff'}
  ]
});
