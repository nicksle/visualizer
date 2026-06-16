import { makeLayer } from './_factory';

export default makeLayer({
  type:'zoomquilt', name:'Zoomquilt', tag:'ANIM', blend:'normal', opacity:1,
  makeState:()=>({imgs:null, zoom:1, idx:0}),
  init(_,__,s){ s.zoom=1; s.idx=0; },
  draw(ctx,t,dt,W,H,lvl,s){
    const imgs = (s.imgs && s.imgs.length) ? s.imgs : (s.img ? [s.img] : null);
    if(!imgs || !W || !H) return;
    const M=imgs.length;
    const R=1+Math.max(0.3,(s.ratio??120)/100);
    const dir=s.direction==='out' ? -1 : 1;
    const sp=((s.speed??50)/100)*(0.45+lvl*0.9);
    const DEPTH=6;
    const hole=(s.hole??35)/100, feather=(s.feather??30)/100;
    const ss=(e0,e1,x)=>{ x=Math.max(0,Math.min(1,(x-e0)/(e1-e0))); return x*x*(3-2*x); };
    s.zoom=s.zoom||1; s.idx=s.idx||0;
    s.zoom *= Math.pow(R, dir*sp*dt);
    while(s.zoom>=R){ s.zoom/=R; s.idx=(s.idx+1)%M; }
    while(s.zoom<1){ s.zoom*=R; s.idx=(s.idx-1+M)%M; }
    const fz=(s.zoom-1)/(R-1);
    const useMask=(hole>0.001 || feather>0.001);
    let sc, sx;
    if(useMask){ sc=s._sc||(s._sc=document.createElement('canvas'));
      if(sc.width!==W||sc.height!==H){ sc.width=W; sc.height=H; } sx=sc.getContext('2d'); }
    const maxR=Math.hypot(W,H)/2;
    for(let i=DEPTH-1;i>=0;i--){
      const scale=s.zoom/Math.pow(R,i);
      const img=imgs[((s.idx+i)%M+M)%M];
      if(!img||!img.complete||!img.naturalWidth) continue;
      const iw=img.naturalWidth, ih=img.naturalHeight;
      const k=Math.max(W/iw,H/ih)*scale, dw=iw*k, dh=ih*k;
      if(dw<2||dh<2) continue;
      const dx=(W-dw)/2, dy=(H-dh)/2;
      let a=1;
      if(i===0)       a=1-ss(0.72,1.0,fz);
      if(i===DEPTH-1) a=ss(0.0,0.28,fz);
      if(a<=0.001) continue;
      if(useMask){
        sx.setTransform(1,0,0,1,0,0); sx.globalAlpha=1; sx.globalCompositeOperation='source-over';
        sx.clearRect(0,0,W,H);
        sx.drawImage(img,dx,dy,dw,dh);
        const g=sx.createRadialGradient(W/2,H/2,0,W/2,H/2,maxR);
        const h0=Math.min(0.95,hole), h1=Math.min(0.98,hole+feather+0.02);
        g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(h0,'rgba(0,0,0,1)');
        g.addColorStop(h1,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,0)');
        sx.globalCompositeOperation='destination-out'; sx.fillStyle=g; sx.fillRect(0,0,W,H);
        sx.globalCompositeOperation='source-over';
        ctx.globalAlpha=a; ctx.drawImage(sc,0,0); ctx.globalAlpha=1;
      } else {
        ctx.globalAlpha=a; ctx.drawImage(img,dx,dy,dw,dh); ctx.globalAlpha=1;
      }
    }
  },
  controls:[
    {type:'images',key:'imgs',label:'IMAGES'},
    {type:'range',key:'speed',label:'ZOOM SPD',min:0,max:200,def:50,suffix:'%'},
    {type:'range',key:'ratio',label:'ZOOM STEP',min:60,max:240,def:120,suffix:'%'},
    {type:'range',key:'hole',label:'CENTER',min:0,max:90,def:35,suffix:'%'},
    {type:'range',key:'feather',label:'FEATHER',min:0,max:80,def:30,suffix:'%'},
    {type:'select',key:'direction',label:'DIRECTION',options:['in','out'],def:'in'}
  ]
});
