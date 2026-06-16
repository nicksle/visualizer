import { Component } from 'react';

/* Wraps each layer so a render crash takes out only that layer, never the set.
   Pairs with the per-frame try/catch in useLayerCanvas (which guards the draw loop). */
export class LayerErrorBoundary extends Component {
  constructor(p){ super(p); this.state = { failed:false }; }
  static getDerivedStateFromError(){ return { failed:true }; }
  componentDidCatch(err){ console.error('layer crashed:', this.props.label, err); }
  render(){ return this.state.failed ? null : this.props.children; }
}
