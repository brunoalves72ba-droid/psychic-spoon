// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Motor da mesa virtual: seis canais e master. Funciona ao vivo e em OfflineAudioContext (exportação).
// Canal: ganho → [medidor/clip] → corte de graves → EQ de 3 bandas (médio semiparamétrico) → compressor
//        → [aux de monitor, pré-fader] → fader → [aux de reverb, pós-fader] → pan → mute/solo → master.

import { makeImpulse } from './engine.js';

export const db2g = (d) => (d <= -60 ? 0 : Math.pow(10, d / 20));
export const CH_DEFAULT = { gain: 0, hpf: false, hi: 0, mid: 0, midF: 1000, lo: 0, comp: 0, mon: -60, rev: -60, pan: 0, mute: false, solo: false, fader: 0 };
export const defaultState = (n = 6) => ({ ch: Array.from({ length: n }, (_, i) => ({ ...CH_DEFAULT, pan: 0 })), master: 0, listen: 'master' });

/**
 * Cria a mesa. dest: nó de saída. opts.meters: cria analisadores (só ao vivo).
 * Devolve { inputs[], apply(state), meters, dispose }.
 */
export function createMixer(c, dest, n = 6, { meters = true } = {}) {
  const A = (size = 1024) => { const a = c.createAnalyser(); a.fftSize = size; a.smoothingTimeConstant = 0.6; return a; };
  const master = c.createGain(), monBus = c.createGain(), revBus = c.createGain(), conv = c.createConvolver(), revRet = c.createGain(), outMaster = c.createGain(), outMon = c.createGain();
  conv.buffer = makeImpulse(c, 2.0, 2.6, 21); revRet.gain.value = 0.9;
  revBus.connect(conv); conv.connect(revRet); revRet.connect(master);
  master.connect(outMaster); outMaster.connect(dest); monBus.connect(outMon); outMon.connect(dest); outMon.gain.value = 0;
  const M = { pre: [], post: [], L: null, R: null, mon: null };
  if (meters) { const sp = c.createChannelSplitter(2); master.connect(sp); M.L = A(); M.R = A(); sp.connect(M.L, 0); sp.connect(M.R, 1); M.mon = A(); monBus.connect(M.mon); }
  const chans = [];
  for (let i = 0; i < n; i++) {
    const inp = c.createGain(), gain = c.createGain(), clip = c.createWaveShaper(); clip.curve = new Float32Array([-1, 1]);
    const hpf = c.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 20; hpf.Q.value = 0.7;
    const lo = c.createBiquadFilter(); lo.type = 'lowshelf'; lo.frequency.value = 100;
    const mid = c.createBiquadFilter(); mid.type = 'peaking'; mid.Q.value = 1.1;
    const hi = c.createBiquadFilter(); hi.type = 'highshelf'; hi.frequency.value = 10000;
    const comp = c.createDynamicsCompressor(); comp.ratio.value = 1; comp.knee.value = 8; comp.attack.value = 0.008; comp.release.value = 0.2; comp.threshold.value = 0;
    const mk = c.createGain(), mon = c.createGain(), fader = c.createGain(), rev = c.createGain(), pan = c.createStereoPanner ? c.createStereoPanner() : c.createGain(), on = c.createGain();
    inp.connect(gain); gain.connect(clip); clip.connect(hpf); hpf.connect(lo); lo.connect(mid); mid.connect(hi); hi.connect(comp); comp.connect(mk);
    mk.connect(mon); mon.connect(monBus);            // pré-fader
    mk.connect(fader); fader.connect(on); on.connect(pan); pan.connect(master);
    on.connect(rev); rev.connect(revBus);            // pós-fader (e pós-mute)
    if (meters) { const a = A(); gain.connect(a); M.pre.push(a); const b = A(); on.connect(b); M.post.push(b); }
    chans.push({ inp, gain, hpf, lo, mid, hi, comp, mk, mon, fader, rev, pan, on });
  }
  function apply(s, t = c.currentTime, tc = 0.015) {
    const anySolo = s.ch.some((x) => x.solo); const set = (p, v) => (tc ? p.setTargetAtTime(v, t, tc) : p.setValueAtTime(v, t));
    s.ch.forEach((x, i) => {
      const k = chans[i]; if (!k) return;
      set(k.gain.gain, Math.pow(10, x.gain / 20)); set(k.hpf.frequency, x.hpf ? 100 : 20);
      set(k.lo.gain, x.lo); set(k.mid.gain, x.mid); set(k.mid.frequency, x.midF); set(k.hi.gain, x.hi);
      // compressor de um botão: 0 a 100% → limiar de 0 a −36 dB, razão de 1 a 4, com compensação
      const am = x.comp / 100; set(k.comp.threshold, -36 * am); set(k.comp.ratio, 1 + 3 * am); set(k.mk.gain, Math.pow(10, (7 * am) / 20));
      set(k.mon.gain, db2g(x.mon)); set(k.fader.gain, db2g(x.fader)); set(k.rev.gain, db2g(x.rev));
      if (k.pan.pan) set(k.pan.pan, x.pan);
      set(k.on.gain, x.mute || (anySolo && !x.solo) ? 0 : 1);
    });
    set(master.gain, db2g(s.master) * 0.5);
    set(outMaster.gain, s.listen === 'master' ? 1 : 0); set(outMon.gain, s.listen === 'monitor' ? 0.5 : 0);
  }
  return { inputs: chans.map((k) => k.inp), chans, apply, meters: M, master, dispose() { try { outMaster.disconnect(); outMon.disconnect(); } catch {} } };
}

const buf = new Float32Array(1024);
/** Pico e RMS em dB de um analisador. */
export function readMeter(a) { a.getFloatTimeDomainData(buf); let p = 0, s = 0; for (let i = 0; i < 1024; i++) { const v = buf[i] < 0 ? -buf[i] : buf[i]; if (v > p) p = v; s += buf[i] * buf[i]; } return { peak: 20 * Math.log10(p + 1e-9), rms: 10 * Math.log10(s / 1024 + 1e-12) }; }

/**
 * Renderiza a mixagem fora do tempo real. buffers: AudioBuffer[] (um por canal). Devolve AudioBuffer estéreo.
 */
export async function renderMix(buffers, state, { sampleRate, tail = 2.5 } = {}) {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const sr = sampleRate || buffers[0].sampleRate, dur = Math.max(...buffers.map((b) => b.duration)) + tail;
  const oc = new OAC(2, Math.ceil(dur * sr), sr);
  const mx = createMixer(oc, oc.destination, buffers.length, { meters: false });
  mx.apply({ ...state, listen: 'master' }, 0, 0);
  buffers.forEach((b, i) => { const s = oc.createBufferSource(); s.buffer = b; s.connect(mx.inputs[i]); s.start(0); });
  return await new Promise((res, rej) => { const p = oc.startRendering(); if (p && p.then) p.then(res, rej); else oc.oncomplete = (e) => res(e.renderedBuffer); });
}

// ---------- missões guiadas: cada uma tem estado inicial e verificação automática ----------
/** stats: { prePeak[], clipAgo[] (s desde o último clip), postRms[], L, R } medidos ao vivo. */
export const MISSIONS = [
  { id: 'ganho', title: 'Acertar o ganho sem clipar', text: 'Os ganhos estão bagunçados: uns baixos demais, outros clipando. Ajuste o GANHO de cada canal até os picos ficarem entre −18 e −6 dBFS, sem acender a luz de clip.',
    init: (s) => { [-16, 14, -10, 18, -14, 9].forEach((g, i) => { s.ch[i].gain = g; }); },
    checks: (s, m) => s.ch.map((x, i) => ({ label: `Canal ${i + 1}: pico entre −18 e −6 dBFS, sem clip`, ok: m.prePeak[i] >= -18 && m.prePeak[i] <= -6 && m.clipAgo[i] > 4 })) },
  { id: 'grave', title: 'Limpar o grave', text: 'Só o baixo precisa de graves profundos. Ligue o CORTE DE GRAVES (HPF) nas cinco vozes de cima, deixe desligado no baixo e não reforce os graves de ninguém.',
    init: (s) => { s.ch.forEach((x, i) => { x.lo = i ? 6 : 0; x.hpf = i === 0; }); },
    checks: (s) => [{ label: 'Baixo com o corte de graves desligado', ok: !s.ch[0].hpf }, { label: 'Corte de graves ligado nas outras cinco vozes', ok: s.ch.slice(1).every((x) => x.hpf) }, { label: 'Nenhum reforço de graves nas vozes de cima', ok: s.ch.slice(1).every((x) => x.lo <= 0) }] },
  { id: 'equilibrio', title: 'Equilibrar as vozes', text: 'Umas vozes estão gritando e outras sumiram. Use os FADERS até todas soarem com volume parecido (diferença de até 3 dB), sem silenciar nenhuma.',
    init: (s) => { [-14, 5, -9, 4, -16, 6].forEach((f, i) => { s.ch[i].fader = f; }); },
    checks: (s, m) => { const act = m.postRms.filter((v) => v > -70); const avg = act.reduce((a, b) => a + b, 0) / (act.length || 1); return [{ label: 'Nenhuma voz em mute ou com o fader no fim', ok: s.ch.every((x) => !x.mute && x.fader > -40) && act.length === s.ch.length }, ...s.ch.map((x, i) => ({ label: `Canal ${i + 1} a até 3 dB da média`, ok: Math.abs(m.postRms[i] - avg) <= 3 }))]; } },
  { id: 'estereo', title: 'Abrir o estéreo', text: 'Tudo está no centro. Deixe o baixo no meio e espalhe as outras vozes com o PAN: pelo menos duas para a esquerda e duas para a direita, mantendo os dois lados com volume parecido.',
    init: (s) => { s.ch.forEach((x) => { x.pan = 0; }); },
    checks: (s, m) => [{ label: 'Baixo no centro', ok: Math.abs(s.ch[0].pan) <= 0.1 }, { label: 'Pelo menos duas vozes à esquerda', ok: s.ch.filter((x) => x.pan <= -0.2).length >= 2 }, { label: 'Pelo menos duas vozes à direita', ok: s.ch.filter((x) => x.pan >= 0.2).length >= 2 }, { label: 'Esquerda e direita com até 2 dB de diferença', ok: Math.abs(m.L - m.R) <= 2 && m.L > -60 }] },
];
