import { makeLayer } from './_factory';

export default makeLayer({
  type:'motion', name:'Video / GIF', tag:'MOTION', blend:'normal', opacity:1,
  makeState:()=>({kind:null,vid:null,gif:null,img:null,fit:'contain',scale:80}),
  init(){},
  draw(ctx,t,dt,W,H,lvl,s){
    let src=null,iw=0,ih=0;
    if(s.kind==='video' && s.vid && s.vid.readyState>=2 && s.vid.videoWidth){
      src=s.vid; iw=s.vid.videoWidth; ih=s.vid.videoHeight;
    } else if(s.kind==='gif' && s.gif && s.gif.frames.length){
      const g=s.gif; g.acc=(g.acc||0)+dt; let guard=0;
      while(g.frames.length>1 && g.acc>=g.frames[g.i].dur && guard++<300){ g.acc-=g.frames[g.i].dur; g.i=(g.i+1)%g.frames.length; }
      const f=g.frames[g.i]; src=f.bmp; iw=f.bmp.width; ih=f.bmp.height;
    } else if(s.img && s.img.complete && s.img.naturalWidth){
      src=s.img; iw=s.img.naturalWidth; ih=s.img.naturalHeight;
    }
    if(!src||!iw||!ih) return;
    const cover=s.fit==='cover', sc=(s.scale??80)/100;
    const k=(cover?Math.max(W/iw,H/ih):Math.min(W/iw,H/ih))*sc;
    const dw=iw*k, dh=ih*k;
    ctx.drawImage(src,(W-dw)/2,(H-dh)/2,dw,dh);
  },
  controls:[
    {type:'motion',key:'motion',label:'FILE'},
    {type:'select',key:'fit',label:'FIT',options:['contain','cover'],def:'contain'},
    {type:'range',key:'scale',label:'SCALE',min:10,max:150,def:80,suffix:'%'}
  ]
});
