import { useState, useEffect, useRef } from 'react';
import { useEngine } from '../engine/EngineContext';
import { GRADE_DEFAULTS, isGradeActive, gradeTableValues } from '../engine/grade';

const CONTROLS = [
  { key:'exposure',   label:'Exposure' },
  { key:'contrast',   label:'Contrast' },
  { key:'highlights', label:'Highlights' },
  { key:'shadows',    label:'Shadows' },
  { key:'whites',     label:'Whites' },
  { key:'blacks',     label:'Blacks' },
];

export default function GradePanel({ stageRef }){
  const engine = useEngine();
  const [grade, setGrade] = useState({ ...GRADE_DEFAULTS });
  const svgRef = useRef(null);

  const active = isGradeActive(grade);

  useEffect(() => {
    engine.setGrade(grade);
    const stage = stageRef?.current;
    if(!stage) return;
    if(active){
      const tv = gradeTableValues(grade);
      ['R','G','B'].forEach(ch => {
        const el = svgRef.current?.querySelector(`#toneFuncGrade${ch}`);
        if(el){ el.setAttribute('type','table'); el.setAttribute('tableValues', tv); }
      });
      stage.style.filter = 'url(#toneFilterGrade)';
    } else {
      stage.style.filter = '';
    }
  }, [grade, engine, active, stageRef]);

  const set = (key, val) => setGrade(g => ({ ...g, [key]: val }));
  const reset = () => setGrade({ ...GRADE_DEFAULTS });

  return (
    <>
      <svg width="0" height="0" style={{position:'absolute',width:0,height:0,overflow:'hidden'}} aria-hidden="true" ref={svgRef}>
        <filter id="toneFilterGrade" colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncR id="toneFuncGradeR" type="table" tableValues="0 1"/>
            <feFuncG id="toneFuncGradeG" type="table" tableValues="0 1"/>
            <feFuncB id="toneFuncGradeB" type="table" tableValues="0 1"/>
          </feComponentTransfer>
        </filter>
      </svg>
      <div className="section">
        <div className="head">
          <span className="label">Grade {active ? '●' : ''}</span>
          <button className="btn" onClick={reset} style={{fontSize:9, padding:'3px 6px'}}>Reset</button>
        </div>
        <div className="body">
          {CONTROLS.map(c => (
            <div className="ctrl" key={c.key}>
              <label>{c.label}</label>
              <input type="range" min="-100" max="100" value={grade[c.key]} onChange={e => set(c.key, +e.target.value)} />
              <span className="val">{grade[c.key]}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
