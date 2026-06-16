/* The registry is the single source the Add menu, controls UI, Stage, and the
   exporter all read. Add a layer = import its component + drop it in COMPONENTS;
   its manifest does the rest. Order here = Add-menu order. */
import SparkleLayer     from './SparkleLayer.jsx';
import SparklePopLayer  from './SparklePopLayer.jsx';
import OrbitalRingsLayer from './OrbitalRingsLayer.jsx';
import ScanGridLayer    from './ScanGridLayer.jsx';
import StrobeLayer      from './StrobeLayer.jsx';
import LightningLayer   from './LightningLayer.jsx';
import SolidFillLayer   from './SolidFillLayer.jsx';
import ImageLayer       from './ImageLayer.jsx';
import MotionLayer      from './MotionLayer.jsx';
import ZoomquiltLayer   from './ZoomquiltLayer.jsx';
import WormholeLayer    from './WormholeLayer.jsx';
import BenDayLayer      from './BenDayLayer.jsx';
import DvdBounceLayer   from './DvdBounceLayer.jsx';
import ScrollGridLayer  from './ScrollGridLayer.jsx';

export const COMPONENTS = [
  SparkleLayer, SparklePopLayer, OrbitalRingsLayer, ScanGridLayer, StrobeLayer,
  LightningLayer, SolidFillLayer, ImageLayer, MotionLayer, ZoomquiltLayer,
  WormholeLayer, BenDayLayer, DvdBounceLayer, ScrollGridLayer,
];

export const REGISTRY = Object.fromEntries(
  COMPONENTS.map(C => [C.manifest.type, { Component: C, manifest: C.manifest }])
);

export const ADDABLE = COMPONENTS.map(C => C.manifest.type);

/* default params for a fresh instance, seeded from the manifest control defs */
export function defaultParams(type){
  const m = REGISTRY[type]?.manifest; if(!m) return {};
  const p = {};
  (m.controls||[]).forEach(c => { if(c.def !== undefined) p[c.key] = c.def; });
  return p;
}
