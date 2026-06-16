import { makeLayer } from './_factory';
import { hexA } from './_helpers';
import { SIG } from '../engine/signal';

export default makeLayer({
  type:'strobe', name:'Strobe / Flash', tag:'ANIM', blend:'screen', opacity:0.8,
  makeState:()=>({flash:0,pa:0}),
  init(_,__,s){ s.flash=0; s.pa=0; },
  draw(ctx,t,dt,W,H,lvl,s){
    // mic punch on a loud rising edge (vanilla did this from the frame loop; kept self-contained here)
    const audio=SIG.audio;
    if(audio>0.6 && (s.pa||0)<=0.6) s.flash=Math.max(s.flash,(audio-0.6)*1.5);
    s.pa=audio;
    s.flash=Math.max(0,s.flash-dt*4);
    if(s.flash>0.01){ctx.fillStyle=hexA(s.color||'#ffffff',s.flash);ctx.fillRect(0,0,W,H);} },
  controls:[{type:'color',key:'color',label:'COLOR',def:'#ffffff'}]
});
