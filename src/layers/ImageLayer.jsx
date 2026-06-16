import { makeLayer } from './_factory';
import { hexA, PRIDE } from './_helpers';
import { SIG } from '../engine/signal';

export default makeLayer({
  type:'image', name:'Image / Logo', tag:'ASSET', blend:'normal', opacity:1,
  makeState:()=>({imgs:null,idx:0,prev:0,swapT:0,fade:1,fit:'contain',scale:80,tint:'off',tintColor:'#ffffff',tintRate:100,bounce:'off',bounceAmt:30,bounceSpeed:100,shimmer:'off',shimSpeed:100,shimColor:'#ffffff'}),
  init(_,__,s){ s.idx=0; s.prev=0; s.swapT=0; s.fade=1; },
  draw(ctx,t,dt,W,H,lvl,s){
    const imgs = (s.imgs && s.imgs.length) ? s.imgs : (s.img ? [s.img] : null);
    if(!imgs) return;
    const mode = s.swap || 'off';
    if(mode!=='off' && imgs.length>1){
      const cad = Math.max(0.1, s.cadence ?? 2);
      s.swapT = (s.swapT||0) + dt;
      if(s.swapT >= cad){
        s.swapT = (s.swapT - cad > cad) ? 0 : s.swapT - cad;
        s.prev = s.idx||0;
        s.idx = ((s.idx||0) + 1) % imgs.length;
        s.fade = 0;
      }
      if(mode==='fade'){
        const fadeDur = Math.min(cad*0.4, 0.6);
        if(s.fade < 1) s.fade = Math.min(1, (s.fade||0) + dt/Math.max(0.05,fadeDur));
      } else { s.fade = 1; }
    } else { s.idx=0; s.prev=0; s.fade=1; }
    const cur = imgs[(s.idx||0) % imgs.length];
    const paint = (img, alpha) => {
      if(!img||!img.complete||!img.naturalWidth) return;
      const iw=img.naturalWidth,ih=img.naturalHeight,cover=s.fit==='cover';
      let sc=s.scale/100;
      if(s.bounce && s.bounce!=='off'){
        const amt=(s.bounceAmt||0)/100;
        const spd=(s.bounceSpeed||100)/100;
        const hump=Math.abs(Math.sin(t*Math.PI*spd));
        const drive=s.bounce==='beat' ? hump*0.4+SIG.audio*1.4 : hump;
        sc*=1+amt*drive;
      }
      const k=(cover?Math.max(W/iw,H/ih):Math.min(W/iw,H/ih))*sc;
      const dw=iw*k,dh=ih*k,dx=(W-dw)/2,dy=(H-dh)/2;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(img,dx,dy,dw,dh);
      if(s.shimmer && s.shimmer!=='off'){
        const spd=(s.shimSpeed||100)/100;
        const phase=(t*spd*0.5)%1;
        const ang=0.39,dirx=Math.cos(ang),diry=Math.sin(ang);
        const span=Math.abs(dw*dirx)+Math.abs(dh*diry);
        const band=span*0.16, bw=s.shimmer==='rainbow'?band*2.5:band;
        const mx=dx+dw/2,my=dy+dh/2,off=(-1+phase*2)*(span*0.5+bw);
        const ax=mx+dirx*(off-bw),ay=my+diry*(off-bw);
        const bx=mx+dirx*(off+bw),by=my+diry*(off+bw);
        const g=ctx.createLinearGradient(ax,ay,bx,by);
        if(s.shimmer==='rainbow'){
          g.addColorStop(0,hexA(PRIDE[0],0));
          for(let i=0;i<PRIDE.length;i++) g.addColorStop((i+0.5)/PRIDE.length,hexA(PRIDE[i],0.6));
          g.addColorStop(1,hexA(PRIDE[PRIDE.length-1],0));
        } else {
          const col=s.shimColor||'#ffffff';
          g.addColorStop(0,hexA(col,0)); g.addColorStop(0.5,hexA(col,0.55)); g.addColorStop(1,hexA(col,0));
        }
        ctx.globalCompositeOperation='source-atop';
        ctx.fillStyle=g; ctx.fillRect(dx,dy,dw,dh);
      }
      ctx.restore();
    };
    if(mode==='fade' && s.fade<1 && imgs[(s.prev||0)%imgs.length]){
      paint(imgs[(s.prev||0)%imgs.length], 1-s.fade);
      paint(cur, s.fade);
    } else {
      paint(cur, 1);
    }
    const tint=s.tint||'off';
    if(tint!=='off'){
      const rate=Math.max(0.05,(s.tintRate??100)/100);
      let col;
      if(tint==='single')      col=s.tintColor||'#ffffff';
      else if(tint==='pride')  col=PRIDE[Math.floor(t*rate*0.6)%PRIDE.length];
      else                     col=`hsl(${(t*rate*60)%360},90%,58%)`;
      ctx.save();
      ctx.globalCompositeOperation='source-in';
      ctx.fillStyle=col; ctx.fillRect(0,0,W,H);
      ctx.restore();
    }
  },
  controls:[
    {type:'images',key:'imgs',label:'IMAGES'},
    {type:'select',key:'swap',label:'SWAP',options:['off','cut','fade'],def:'off'},
    {type:'range',key:'cadence',label:'EVERY',min:0.25,max:10,step:0.25,def:2,suffix:'s'},
    {type:'select',key:'tint',label:'TINT',options:['off','single','pride','rainbow'],def:'off'},
    {type:'color',key:'tintColor',label:'TINT COL',def:'#ffffff'},
    {type:'range',key:'tintRate',label:'TINT SPD',min:20,max:300,def:100,suffix:'%'},
    {type:'select',key:'fit',label:'FIT',options:['contain','cover'],def:'contain'},
    {type:'range',key:'scale',label:'SCALE',min:10,max:150,def:80,suffix:'%'},
    {type:'select',key:'bounce',label:'BOUNCE',options:['off','pulse','beat'],def:'off'},
    {type:'range',key:'bounceAmt',label:'AMOUNT',min:0,max:100,def:30,suffix:'%'},
    {type:'range',key:'bounceSpeed',label:'SPEED',min:20,max:300,def:100,suffix:'%'},
    {type:'select',key:'shimmer',label:'SHIMMER',options:['off','sheen','rainbow'],def:'off'},
    {type:'range',key:'shimSpeed',label:'SHIM SPD',min:20,max:300,def:100,suffix:'%'},
    {type:'color',key:'shimColor',label:'SHEEN',def:'#ffffff'}
  ]
});
