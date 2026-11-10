// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Processador do microfone no AudioWorklet. É carregado concatenado a pitch-core.js
// (veja mic.js), por isso usa createMicCore sem import.
/* global AudioWorkletProcessor, registerProcessor, sampleRate, currentTime, createMicCore */
class SextetoMic extends AudioWorkletProcessor {
  constructor() {
    super();
    this.core = createMicCore(sampleRate, (msg, transfer) => this.port.postMessage(msg, transfer || []));
    this.alive = true;
    this.port.onmessage = (e) => {
      if (e.data.config) this.core.config(e.data.config);
      if (e.data.flush) { this.core.flush(); this.port.postMessage({ type: 'flushed' }); }
      if (e.data.close) this.alive = false;
    };
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) this.core.process(ch, currentTime);
    return this.alive;
  }
}
registerProcessor('sexteto-mic', SextetoMic);
