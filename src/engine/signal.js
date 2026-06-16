/* Master signal — mirrors the vanilla global SIG so layers that read audio
   (lightning beat, image 'beat' bounce) port verbatim. Read-only for layers;
   the engine clock is the only writer. */
export const SIG = { intensity: 0.55, audio: 0 };
export const level = () => Math.min(1, SIG.intensity + SIG.audio);
