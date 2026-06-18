/* Animated backdrops — ported verbatim from reference/hard-reset-visualizer_17.html ~line 1741.
   Each entry: { label, draw(ctx, t, W, H, lvl) }. */
import { PRIDE } from '../layers/_helpers';

export const BACKDROPS = {
  none: { label:'None', draw(ctx,t,W,H,lvl){
    ctx.clearRect(0,0,W,H);
  }},
  solid: { label:'Solid Color', draw(ctx,t,W,H,lvl,opts){
    ctx.fillStyle = opts?.color || '#000000';
    ctx.fillRect(0,0,W,H);
  }},
  ember: { label:'Ember', draw(ctx,t,W,H,lvl){
    const g=ctx.createLinearGradient(0,0,W,H),a=Math.sin(t*0.2)*0.5+0.5;
    g.addColorStop(0,`hsl(${20+a*15},80%,${4+lvl*4}%)`);
    g.addColorStop(0.5,`hsl(0,0%,${3+lvl*3}%)`);
    g.addColorStop(1,`hsl(${30+a*20},70%,${5+lvl*5}%)`);
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  }},
  rainbow: { label:'Rainbow', draw(ctx,t,W,H,lvl){
    const g=ctx.createLinearGradient(0,0,W,H), base=(t*22)%360;
    for(let i=0;i<=6;i++) g.addColorStop(i/6,`hsl(${(base+i*60)%360},72%,${4+lvl*5}%)`);
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  }},
  pride: { label:'Pride Flag', draw(ctx,t,W,H,lvl){
    ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
    const sway=Math.sin(t*0.18)*0.12*W;
    const g=ctx.createLinearGradient(sway,0,W*0.55+sway,H);
    for(let i=0;i<PRIDE.length;i++) g.addColorStop(i/(PRIDE.length-1),PRIDE[i]);
    ctx.globalAlpha=0.12+lvl*0.16; ctx.fillStyle=g; ctx.fillRect(0,0,W,H); ctx.globalAlpha=1;
  }},
  space: { label:'Deep Space', draw(ctx,t,W,H,lvl){
    const a=Math.sin(t*0.12)*0.5+0.5;
    const g=ctx.createRadialGradient(W*0.5,H*0.45,0, W*0.5,H*0.5,Math.hypot(W,H)*0.62);
    g.addColorStop(0,`hsl(${258+a*30},64%,${5+lvl*5}%)`);
    g.addColorStop(0.5,`hsl(${225+a*20},58%,${3+lvl*4}%)`);
    g.addColorStop(1,`hsl(230,55%,${1+lvl*2}%)`);
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  }},
  aurora: { label:'Aurora', draw(ctx,t,W,H,lvl){
    const a=Math.sin(t*0.3)*0.5+0.5, b=Math.sin(t*0.22+1)*0.5+0.5;
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,`hsl(${160+a*40},66%,${3+lvl*4}%)`);
    g.addColorStop(0.5,`hsl(${188+b*40},62%,${5+lvl*5}%)`);
    g.addColorStop(1,`hsl(${280+a*30},58%,${4+lvl*4}%)`);
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  }},
};

export const BACKDROP_KEYS = Object.keys(BACKDROPS);
