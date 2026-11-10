// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Microfone: abre com echoCancellation, noiseSuppression e autoGainControl desligados,
// analisa a altura em AudioWorklet (com alternativa em ScriptProcessor) e captura PCM cru.

import { getCtx, unlock } from './engine.js';
import { createMicCore } from './pitch-core.js';
import { h, sheet } from '../core/ui.js';
import { prefs } from '../core/store.js';

let stream = null, source = null, node = null, sink = null, mode = null;
const subs = { pitch: new Set(), pcm: new Set(), level: new Set() };
let cfg = { pitch: false, pcm: false, spec: false };
let workletReady = null;
let flushWait = null;

export const micSupported = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
export const micOpen = () => !!stream;
export const micMode = () => mode;

/** Junta o núcleo e o processador em um só módulo (funciona offline e sem import em worklet). */
async function loadWorklet(ctx) {
  if (!ctx.audioWorklet || typeof AudioWorkletNode === 'undefined') throw new Error('sem AudioWorklet');
  if (!workletReady) {
    workletReady = (async () => {
      const base = new URL('.', import.meta.url);
      const [a, b] = await Promise.all(['pitch-core.js', 'mic-worklet.js'].map((f) => fetch(new URL(f, base)).then((r) => { if (!r.ok) throw new Error('falha ao carregar ' + f); return r.text(); })));
      const code = a.replace(/^export\s+/gm, '') + '\n' + b;
      const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
      try { await ctx.audioWorklet.addModule(url); } finally { URL.revokeObjectURL(url); }
    })();
    workletReady.catch(() => { workletReady = null; });
  }
  return workletReady;
}

function dispatch(msg) {
  if (msg.type === 'pitch') { subs.pitch.forEach((f) => f(msg)); subs.level.forEach((f) => f(msg.peak, msg.rms)); }
  else if (msg.type === 'pcm') subs.pcm.forEach((f) => f(msg.data, msg.at, msg.t));
  else if (msg.type === 'level') subs.level.forEach((f) => f(msg.peak, 0));
  else if (msg.type === 'flushed' && flushWait) { flushWait(); flushWait = null; }
}
function pushConfig() {
  const want = { pitch: subs.pitch.size > 0, pcm: subs.pcm.size > 0, spec: [...subs.pitch].some((f) => f.spec) };
  cfg = want;
  if (!node) return;
  if (mode === 'worklet') node.port.postMessage({ config: want }); else node._core.config(want);
}

/** Abre o microfone (pede permissão na primeira vez). Lança erro com mensagem em português. */
export async function openMic() {
  if (stream) return true;
  if (!micSupported()) throw new Error('Este navegador não dá acesso ao microfone. Use https ou localhost em um navegador atual.');
  const ctx = getCtx(); await unlock();
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 }, video: false });
  } catch (e) {
    stream = null;
    const n = e && e.name;
    if (n === 'NotAllowedError' || n === 'SecurityError') throw new Error('O microfone foi bloqueado. Libere a permissão nas configurações do site e tente de novo.');
    if (n === 'NotFoundError' || n === 'OverconstrainedError') throw new Error('Nenhum microfone encontrado neste aparelho.');
    throw new Error('Não consegui abrir o microfone (' + (n || 'erro') + ').');
  }
  source = ctx.createMediaStreamSource(stream);
  sink = ctx.createGain(); sink.gain.value = 0; sink.connect(ctx.destination); // mantém o grafo vivo, sem som
  try {
    await loadWorklet(ctx);
    node = new AudioWorkletNode(ctx, 'sexteto-mic', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], channelCount: 1, channelCountMode: 'explicit' });
    node.port.onmessage = (e) => dispatch(e.data);
    mode = 'worklet';
  } catch {
    // alternativa: ScriptProcessor rodando o mesmo núcleo na página
    const sp = ctx.createScriptProcessor(1024, 1, 1);
    const core = createMicCore(ctx.sampleRate, (m) => dispatch(m));
    sp.onaudioprocess = (e) => core.process(e.inputBuffer.getChannelData(0), e.playbackTime || ctx.currentTime);
    sp._core = core; node = sp; mode = 'script';
  }
  source.connect(node); node.connect(sink);
  pushConfig();
  return true;
}

/** Fecha o microfone e solta o aparelho. */
export function closeMic() {
  subs.pitch.clear(); subs.pcm.clear(); subs.level.clear();
  try { if (node && mode === 'worklet') node.port.postMessage({ close: true }); } catch {}
  try { source && source.disconnect(); node && node.disconnect(); sink && sink.disconnect(); } catch {}
  if (node && mode === 'script') node.onaudioprocess = null;
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = source = node = sink = null; mode = null;
}

/** Assina leituras de altura: fn({f, c, rms, peak, t, h1h2?, tilt?, hf?}). Retorna função para cancelar. */
export function onPitch(fn, { spec = false } = {}) { fn.spec = spec; subs.pitch.add(fn); pushConfig(); return () => { subs.pitch.delete(fn); pushConfig(); }; }
/** Assina PCM cru: fn(Float32Array, posição em amostras, instante do relógio de áudio da primeira amostra). */
export function onPcm(fn) { subs.pcm.add(fn); pushConfig(); return () => { subs.pcm.delete(fn); pushConfig(); }; }
export function onLevel(fn) { subs.level.add(fn); pushConfig(); return () => { subs.level.delete(fn); pushConfig(); }; }
/** Pede o resto do PCM que ainda está no processador. */
export function flushPcm() {
  if (!node) return Promise.resolve();
  if (mode === 'script') { node._core.flush(); return Promise.resolve(); }
  return new Promise((res) => { flushWait = res; node.port.postMessage({ flush: true }); setTimeout(() => { if (flushWait) { flushWait = null; res(); } }, 400); });
}
export const micSampleRate = () => getCtx().sampleRate;
/** Configurações reais que o navegador aplicou (para conferir se o processamento ficou desligado). */
export function micSettings() { try { return stream.getAudioTracks()[0].getSettings(); } catch { return {}; } }

/**
 * Botão padrão de "ligar microfone" com mensagem de erro e aviso de fones.
 * onReady() é chamado quando o microfone abre. playsToo: o app toca e escuta ao mesmo tempo.
 */
export function micGate(onReady, { playsToo = false, label = 'Ligar microfone' } = {}) {
  const msg = h('p.small.muted');
  const box = h('div.col');
  const go = async () => {
    btn.disabled = true; msg.textContent = 'Abrindo o microfone…';
    try { await openMic(); box.replaceChildren(); onReady(); }
    catch (e) { msg.textContent = e.message; btn.disabled = false; }
  };
  const btn = h('button.btn.primary.block', { type: 'button', onclick: () => {
    if (playsToo && !prefs.get('fones')) {
      const close = sheet([
        h('h2', 'Coloque os fones'),
        h('p', 'Aqui o app toca e escuta ao mesmo tempo. Sem fones, o microfone capta o som do alto-falante e a leitura da sua voz fica errada.'),
        h('button.btn.primary', { onclick: () => { prefs.set('fones', true); close(); go(); } }, 'Estou de fones'),
        h('button.btn.ghost', { onclick: () => { close(); go(); } }, 'Continuar sem fones'),
      ]);
    } else go();
  } }, label);
  box.append(playsToo ? h('div.banner', h('span', '🎧'), h('span', h('b', 'Use fones. '), 'O app toca e escuta ao mesmo tempo.')) : null, btn, msg);
  if (micOpen()) queueMicrotask(() => { box.replaceChildren(); onReady(); });
  return box;
}
