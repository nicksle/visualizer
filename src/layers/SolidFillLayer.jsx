import { makeLayer } from './_factory';

export default makeLayer({
  type:'fill', name:'Solid Fill', tag:'DIMMER', blend:'normal', opacity:0.4,
  makeState:()=>({color:'#000000'}),
  init(){}, draw(ctx,t,dt,W,H,lvl,s){ ctx.fillStyle=s.color||'#000000';ctx.fillRect(0,0,W,H); },
  controls:[{type:'color',key:'color',label:'COLOR',def:'#000000'}]
});
