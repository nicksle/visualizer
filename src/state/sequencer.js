/* Sequencer — timed preset chains for live performance.
   A sequence = ordered steps, each with a preset name + hold duration.
   Supports loop/play-once and crossfade transitions. */

const SEQ_KEY = 'hardreset.sequences.v1';

/* ---- localStorage ---- */
function lsLoad(){
  try { return JSON.parse(localStorage.getItem(SEQ_KEY) || '{}') || {}; } catch(e){ return {}; }
}
function lsSave(obj){
  try { localStorage.setItem(SEQ_KEY, JSON.stringify(obj)); return true; } catch(e){ return false; }
}

export function getSavedSequences(){
  const all = lsLoad();
  return Object.keys(all).sort().map(n => ({ name:n, data:all[n] }));
}

export function saveSequence(name, steps){
  const all = lsLoad();
  all[name] = { name, steps, ts:Date.now() };
  return lsSave(all);
}

export function deleteSequence(name){
  const all = lsLoad();
  delete all[name];
  lsSave(all);
}

export function loadSequence(name){
  const all = lsLoad();
  return all[name] || null;
}

/* ---- Sequencer runtime ----
   Returns a controller object. Call start() to begin, stop() to halt.
   onStep(stepIndex) is called when a new step becomes active.
   onCrossfadeStart() is called when crossfade dip should begin.
   onDone() is called when a non-looping sequence finishes. */
export function createSequencer(){
  let timer = null;
  let fadeTimer = null;
  let running = false;
  let currentIndex = -1;
  let steps = [];
  let opts = { loop:true, crossfade:false, crossfadeDuration:1 };
  let callbacks = {};

  function scheduleStep(idx){
    if(idx >= steps.length){
      if(opts.loop){
        idx = 0;
      } else {
        running = false;
        currentIndex = -1;
        callbacks.onDone?.();
        callbacks.onTick?.({ running:false, currentIndex:-1, elapsed:0 });
        return;
      }
    }
    currentIndex = idx;
    const step = steps[idx];
    callbacks.onStep?.(idx, step);
    callbacks.onTick?.({ running:true, currentIndex:idx, elapsed:0 });

    // schedule crossfade dip before next step
    if(opts.crossfade && opts.crossfadeDuration > 0){
      const fadeStart = Math.max(0, step.duration - opts.crossfadeDuration / 2);
      fadeTimer = setTimeout(() => {
        callbacks.onCrossfadeStart?.(opts.crossfadeDuration);
      }, fadeStart * 1000);
    }

    timer = setTimeout(() => {
      scheduleStep(idx + 1);
    }, step.duration * 1000);
  }

  return {
    start(seqSteps, options, cbs){
      this.stop();
      steps = seqSteps;
      opts = { ...opts, ...options };
      callbacks = cbs || {};
      if(!steps.length) return;
      running = true;
      scheduleStep(0);
    },
    stop(){
      clearTimeout(timer);
      clearTimeout(fadeTimer);
      timer = null;
      fadeTimer = null;
      running = false;
      currentIndex = -1;
    },
    isRunning(){ return running; },
    getCurrentIndex(){ return currentIndex; },
  };
}
