import { makeLayer } from './_factory';
import { PRIDE, groundColor, drawDots, drawShape, buildFlat } from './_helpers';

export default makeLayer({
  type:'benday', name:'Ben Day Dots', tag:'ANIM', blend:'multiply', opacity:1,
  makeState:()=>({}),
  init(){},
  draw(ctx,t,dt,W,H,lvl,s){
    if(!W||!H) return;
    const base=Math.min(W,H);
    const mode=s.mode??'flat';
    const angle=(s.angle??15)*Math.PI/180;
    const color=s.color??'#111111';
    const bg=s.bg??'transparent';
    const cell=Math.max(4, base*(0.022+(s.scale??0.3)*0.1));
    const dotFrac=(s.dotSize??0.45)*1.2;
    const baseR=cell*dotFrac*0.5;
    const cx=W/2, cy=H/2;
    const palette=s.palette||'mono';
    const pride=palette==='pride';
    const multi=palette==='multi';
    const PN=PRIDE.length;
    const multiColors=(Array.isArray(s.multiColors)&&s.multiColors.length)?s.multiColors:['#ff0000','#00ff00','#0000ff'];
    const MN=multiColors.length||1;
    const prideFn=(sx,sy)=>{ let f=sy/H + t*0.04; f-=Math.floor(f); return PRIDE[Math.min(PN-1,(f*PN)|0)]; };
    const multiFn=(sx,sy)=>{ let f=sy/H + t*0.04; f-=Math.floor(f); return multiColors[Math.min(MN-1,(f*MN)|0)]; };
    const dotColor=pride?prideFn:multi?multiFn:color;
    const shape=s.shape||'dot';
    if(mode==='flat'){
      if(pride||multi){
        if(bg!=='transparent'){ ctx.fillStyle=groundColor(bg,color); ctx.fillRect(0,0,W,H); }
        drawDots(ctx,W,H,cell,angle,pride?prideFn:multiFn,()=>baseR*(1+lvl*0.04),shape);
        return;
      }
      const sig=[W,H,cell,baseR,s.angle,color,bg,shape].join('|');
      if(s.sig!==sig){ s.off=buildFlat(W,H,cell,angle,color,bg,baseR,shape); s.sig=sig; }
      const breath=1+lvl*0.04;
      ctx.save();
      ctx.translate(cx,cy);ctx.scale(breath,breath);ctx.translate(-cx,-cy);
      ctx.drawImage(s.off,0,0,W,H);
      ctx.restore();
      return;
    }
    if(bg!=='transparent'){ ctx.fillStyle=groundColor(bg,color); ctx.fillRect(0,0,W,H); }
    if(mode==='radial'){
      const ringStep=cell, maxRad=Math.hypot(W,H)/2+cell, freq=(Math.PI*2)/(base*0.18), speed=1.5+lvl*3;
      for(let ring=1; ring*ringStep<maxRad; ring++){
        const rad=ring*ringStep, n=Math.max(6,Math.round((2*Math.PI*rad)/cell));
        const wv=0.5+0.5*Math.sin(rad*freq - t*speed), r=baseR*(0.3+1.05*wv)*(0.6+lvl*0.6);
        if(r<0.3) continue;
        ctx.fillStyle = pride ? PRIDE[ring%PN] : multi ? multiColors[ring%MN] : color;
        const rot=ring*0.15 + t*0.06*((ring%2)?1:-1);
        for(let k=0;k<n;k++){
          const a=(k/n)*Math.PI*2+rot, x=cx+Math.cos(a)*rad, y=cy+Math.sin(a)*rad;
          if(x<-r||x>W+r||y<-r||y>H+r) continue;
          drawShape(ctx,x,y,r,shape);
        }
      }
      return;
    }
    let radiusFn;
    if(mode==='pulse'){
      const freq=(Math.PI*2)/(base*0.18), speed=1.5+lvl*3.5;
      radiusFn=(sx,sy)=>{ const d=Math.hypot(sx-cx,sy-cy); const wv=0.5+0.5*Math.sin(d*freq-t*speed); return baseR*(0.25+0.95*wv)*(0.6+lvl*0.7); };
    } else {
      const freq=(Math.PI*2)/(base*0.5), drift=0.4+lvl*1.3, da=0.6, ca=Math.cos(da), sa=Math.sin(da);
      radiusFn=(sx,sy)=>{ const proj=sx*ca+sy*sa; const tone=0.5+0.5*Math.sin(proj*freq+t*drift); return baseR*(0.15+1.0*tone); };
    }
    drawDots(ctx,W,H,cell,angle,dotColor,radiusFn,shape);
  },
  controls:[
    {type:'range',key:'scale',label:'SCALE',min:0,max:1,step:0.01,def:0.3},
    {type:'range',key:'dotSize',label:'DOT SIZE',min:0,max:1,step:0.01,def:0.45},
    {type:'range',key:'angle',label:'ANGLE',min:0,max:90,step:1,def:15,suffix:'°'},
    {type:'select',key:'mode',label:'MODE',options:['flat','halftone','pulse','radial'],def:'flat'},
    {type:'select',key:'palette',label:'PALETTE',options:['mono','pride','multi'],def:'mono'},
    {type:'colorlist',key:'multiColors',label:'COLORS',def:['#ff0000','#00ff00','#0000ff'],showWhen:{key:'palette',is:'multi'}},
    {type:'select',key:'shape',label:'SHAPE',options:['dot','square','diamond','triangle','cross','ring','star'],def:'dot'},
    {type:'color',key:'color',label:'DOT',def:'#111111'},
    {type:'select',key:'bg',label:'GROUND',options:['transparent','white','black'],def:'transparent'}
  ]
});
