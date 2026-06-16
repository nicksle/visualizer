/* GRADE — global tone curve over the entire composite.
   Ported verbatim from reference/hard-reset-visualizer_17.html ~line 1846.
   Shared by both the live SVG filter and the export LUT so they can never drift. */

export function gradeCurve(x, grade){
  const ev=grade.exposure/100, c=grade.contrast/100, hi=grade.highlights/100,
        sh=grade.shadows/100, wh=grade.whites/100, bl=grade.blacks/100;
  let v=x*Math.pow(2, ev*1.1);                       // exposure (EV-ish, multiplicative)
  const lo=Math.min(1,Math.max(0,1-v)), up=Math.min(1,Math.max(0,v));
  v += sh*0.5*lo*lo;                                 // shadows  — lifts/drops lower tones
  v += hi*0.5*up*up;                                 // highlights — upper tones
  v += bl*0.45*Math.pow(lo,4);                        // blacks   — deepest values (black point)
  v += wh*0.45*Math.pow(up,4);                        // whites   — brightest values (white point)
  v=(v-0.5)*(1+c)+0.5;                               // contrast about mid-grey
  return Math.min(1,Math.max(0,v));
}

export const GRADE_DEFAULTS = { exposure:0, contrast:0, highlights:0, shadows:0, whites:0, blacks:0 };

export function isGradeActive(grade){
  return Object.keys(grade).some(k => Math.abs(grade[k]) > 0.5);
}

/* 33-entry table for the live SVG feComponentTransfer */
export function gradeTableValues(grade){
  let tv = '';
  for(let i = 0; i < 33; i++) tv += (i ? ' ' : '') + gradeCurve(i/32, grade).toFixed(4);
  return tv;
}

/* 256-entry LUT for the export pixel bake */
export function gradeLUT(grade){
  const lut = new Uint8ClampedArray(256);
  for(let i = 0; i < 256; i++) lut[i] = Math.round(gradeCurve(i/255, grade) * 255);
  return lut;
}
