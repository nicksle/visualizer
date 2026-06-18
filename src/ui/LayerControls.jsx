import { REGISTRY } from '../layers/registry';

/* Renders a layer's controls from its manifest schema. Handles the standard
   types (range/select/color/checkbox) plus the custom asset loaders
   (images -> HTMLImageElement[]; motion -> video/image element).

   Smart grouping: when a select control has 'off' as an option and its current
   value is 'off', subsequent controls are hidden until the next select/checkbox
   (i.e. the next "toggle"). This keeps the panel clean. */
export default function LayerControls({ layer, dispatch }){
  const controls = REGISTRY[layer.type]?.manifest.controls || [];
  const set = (key, value) => dispatch({ type:'SET_PARAM', id:layer.id, key, value });
  const val = (c) => (layer.params[c.key] ?? c.def);

  const loadImages = (e) => {
    const files = [...e.target.files];
    Promise.all(files.map(f => new Promise(res => {
      const img = new Image();
      img.onload = () => res(img); img.onerror = () => res(null);
      img.src = URL.createObjectURL(f);
    }))).then(imgs => set('imgs', imgs.filter(Boolean)));
  };
  const loadMotion = (e) => {
    const f = e.target.files[0]; if(!f) return;
    const url = URL.createObjectURL(f);
    if(f.type.startsWith('video')){
      const v = document.createElement('video');
      v.src = url; v.loop = true; v.muted = true; v.playsInline = true;
      v.play().catch(()=>{});
      set('kind', 'video'); set('vid', v);
    } else {
      const img = new Image();
      img.onload = () => { set('kind', null); set('img', img); };
      img.src = url;
    }
  };

  // figure out which controls are hidden based on parent toggle state or showWhen
  const visible = [];
  let suppressed = false;
  for(const c of controls){
    // explicit showWhen — check independently of suppression
    if(c.showWhen){
      const dep = layer.params[c.showWhen.key] ?? controls.find(x => x.key === c.showWhen.key)?.def;
      if(dep !== c.showWhen.is) continue;
      visible.push(c);
      continue;
    }
    // select with 'off' option or checkbox = a toggle point
    const isToggle = (c.type === 'select' && c.options?.includes('off')) || c.type === 'checkbox';
    if(isToggle){
      suppressed = (c.type === 'select' && val(c) === 'off') || (c.type === 'checkbox' && !val(c));
      visible.push(c); // always show the toggle itself
    } else {
      if(!suppressed) visible.push(c);
    }
  }

  return (
    <>
      {visible.map(c => {
        if(c.type === 'range') return (
          <div className="ctrl" key={c.key}>
            <label>{c.label}</label>
            <input type="range" min={c.min} max={c.max} step={c.step || 1}
              value={val(c)} onChange={e => set(c.key, +e.target.value)} />
            <span className="val">{val(c)}{c.suffix || ''}</span>
          </div>
        );
        if(c.type === 'color') return (
          <div className="ctrl" key={c.key}>
            <label>{c.label}</label>
            <input type="color" value={val(c)} onChange={e => set(c.key, e.target.value)} />
            <span style={{flex:1}} />
          </div>
        );
        if(c.type === 'select') return (
          <div className="ctrl" key={c.key}>
            <label>{c.label}</label>
            <select value={val(c)} onChange={e => set(c.key, e.target.value)}>
              {c.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        );
        if(c.type === 'checkbox') return (
          <div className="ctrl" key={c.key}>
            <label>{c.label}</label>
            <input type="checkbox" checked={!!val(c)} onChange={e => set(c.key, e.target.checked)} />
            <span style={{flex:1}} />
          </div>
        );
        if(c.type === 'colorlist'){
          const colors = Array.isArray(layer.params[c.key]) ? layer.params[c.key] : (c.def || []);
          const update = (next) => set(c.key, next);
          return (
            <div className="ctrl" key={c.key} style={{alignItems:'flex-start'}}>
              <label>{c.label}</label>
              <div className="colorlist">
                {colors.map((col, i) => (
                  <div key={i} className="colorlist-item"
                    draggable
                    onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      const from = +e.dataTransfer.getData('text/plain');
                      if(isNaN(from) || from === i) return;
                      const next = colors.slice();
                      const [moved] = next.splice(from, 1);
                      next.splice(i, 0, moved);
                      update(next);
                    }}
                  >
                    <input type="color" value={col} onChange={e => { const next = colors.slice(); next[i] = e.target.value; update(next); }} />
                    {colors.length > 1 && <button className="colorlist-x" onClick={() => update(colors.filter((_, j) => j !== i))}>✕</button>}
                  </div>
                ))}
                <button className="colorlist-add" onClick={() => update([...colors, '#ffffff'])}>+</button>
              </div>
            </div>
          );
        }
        if(c.type === 'images') return (
          <div className="ctrl" key={c.key} style={{alignItems:'flex-start'}}>
            <label>{c.label}</label>
            <div style={{flex:1, display:'flex', flexDirection:'column', gap:5}}>
              <input type="file" accept="image/*" multiple onChange={loadImages} />
              {Array.isArray(layer.params.imgs) && layer.params.imgs.length > 0 &&
                <div className="thumbs">
                  {layer.params.imgs.map((im, i) => <img key={i} src={im.src} alt="" />)}
                </div>}
            </div>
          </div>
        );
        if(c.type === 'motion') return (
          <div className="ctrl" key={c.key} style={{alignItems:'flex-start'}}>
            <label>{c.label}</label>
            <div style={{flex:1}}>
              <input type="file" accept="video/*,image/*" onChange={loadMotion} />
              {layer.params.kind === 'video' && <div className="label" style={{marginTop:4}}>video loaded</div>}
              {layer.params.img && <div className="label" style={{marginTop:4}}>image loaded</div>}
            </div>
          </div>
        );
        return null;
      })}
    </>
  );
}
