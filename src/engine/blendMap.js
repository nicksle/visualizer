/* Single source of truth: CSS mix-blend-mode <-> canvas globalCompositeOperation.
   Live layers use the CSS key on the <canvas> style; the exporter uses the op.
   Keeping both here means live and exported output can't drift. */
export const BLEND_MODES = ['normal','add','screen','overlay','lighten','difference','multiply','color-dodge'];

export const BLEND2OP = {
  normal:'source-over', add:'lighter', screen:'screen', overlay:'overlay',
  lighten:'lighten', difference:'difference', multiply:'multiply', 'color-dodge':'color-dodge',
};

/* 'add' isn't a real CSS blend mode; map it to 'lighter'-equivalent 'plus-lighter'
   for the live canvas so on-screen matches the exported frame. */
export const cssBlend = (b) => (b === 'add' ? 'plus-lighter' : b);
