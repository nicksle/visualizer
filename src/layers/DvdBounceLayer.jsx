import { makeLayer } from './_factory';
import { hexA, PRIDE } from './_helpers';

export default makeLayer({
  type:'dvd', name:'DVD Bounce', tag:'ANIM', blend:'screen', opacity:1,
  makeState:()=>({}),
  init(){},
  draw(ctx,t,dt,W,H,lvl,s){
    if(s.x==null){
      s.x=W*(0.2+Math.random()*0.6);
      s.y=H*(0.2+Math.random()*0.6);
      s.vx=Math.random()<0.5?-1:1;
      s.vy=Math.random()<0.5?-1:1;
      s.ci=0; s.ii=0; s.glow=0;
    }
    const imgs = (Array.isArray(s.imgs)&&s.imgs.length) ? s.imgs : (s.img ? [s.img] : null);
    const useImg = s.source==='image' && imgs;
    if(s.ii==null) s.ii=0;
    const cur = useImg ? imgs[s.ii % imgs.length] : null;
    const hasImg = useImg && cur && cur.complete && cur.naturalWidth;
    const col = s.palette==='single' ? (s.color||'#ffffff') : PRIDE[s.ci % PRIDE.length];
    const target = (Math.max(10, s.size??22)/100) * Math.min(W,H);
    let boxW, boxH;
    if(hasImg){
      const k=target/Math.max(cur.naturalWidth,cur.naturalHeight);
      boxW=cur.naturalWidth*k; boxH=cur.naturalHeight*k;
    } else { boxH=target*0.5; boxW=target*1.35; }
    if(boxW>W){ const r=W/boxW; boxW=W; boxH*=r; }
    if(boxH>H){ const r=H/boxH; boxH=H; boxW*=r; }
    const spd=(Math.max(10,s.speed??80)/100)*240*(0.6+lvl*0.9);
    const step=(spd*dt)/Math.SQRT2;
    s.x+=s.vx*step; s.y+=s.vy*step;
    let bx=false,by=false;
    if(s.x<=0){ s.x=0; s.vx=1; bx=true; }
    else if(s.x+boxW>=W){ s.x=W-boxW; s.vx=-1; bx=true; }
    if(s.y<=0){ s.y=0; s.vy=1; by=true; }
    else if(s.y+boxH>=H){ s.y=H-boxH; s.vy=-1; by=true; }
    if(bx||by){ s.ci=(s.ci+1)%PRIDE.length; if(useImg && s.swapHit!=='off' && imgs.length>1) s.ii=(s.ii+1)%imgs.length; }
    if(bx&&by) s.glow=1;
    s.glow=Math.max(0,s.glow-dt*1.4);
    if(s.corner!=='off' && s.glow>0.01){ ctx.fillStyle=hexA(col,s.glow*0.5); ctx.fillRect(0,0,W,H); }
    if(hasImg){
      ctx.drawImage(cur,s.x,s.y,boxW,boxH);
    } else {
      const r=Math.min(boxH/2,22);
      ctx.fillStyle=col;
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(s.x,s.y,boxW,boxH,r); else ctx.rect(s.x,s.y,boxW,boxH);
      ctx.fill();
      ctx.fillStyle='#0a0a0b';
      ctx.font=`800 ${Math.floor(boxH*0.34)}px 'JetBrains Mono', ui-monospace, monospace`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('HARD RESET', s.x+boxW/2, s.y+boxH/2);
    }
  },
  controls:[
    {type:'select',key:'source',label:'SOURCE',options:['mark','image'],def:'mark'},
    {type:'images',key:'imgs',label:'IMAGES'},
    {type:'select',key:'swapHit',label:'SWAP ON HIT',options:['on','off'],def:'on'},
    {type:'select',key:'palette',label:'PALETTE',options:['pride','single'],def:'pride'},
    {type:'color',key:'color',label:'COLOR',def:'#ffffff'},
    {type:'range',key:'size',label:'SIZE',min:10,max:60,def:22,suffix:'%'},
    {type:'range',key:'speed',label:'SPEED',min:10,max:200,def:80,suffix:'%'},
    {type:'select',key:'corner',label:'CORNERS',options:['flash','off'],def:'flash'}
  ]
});
