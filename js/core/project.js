// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Projetos do gravador multipista: criação, duração e montagem das pistas (gravadas ou sintetizadas).
import { getRecordingPcm, getRecordingMeta, prefs } from './store.js';
import { stems, bufferFrom } from '../audio/sources.js';
import { getCtx } from '../audio/engine.js';
import { getArrangement, ARRANGEMENTS } from '../music/arrangements.js';
import { VOICE_NAMES } from '../music/theory.js';

export function newProject(arrId, { tempo, bars = 8, name } = {}) {
  const arr = arrId ? getArrangement(arrId) : null;
  return { name: name || (arr ? `${arr.title} · ${new Date().toLocaleDateString('pt-BR')}` : `Projeto livre · ${new Date().toLocaleDateString('pt-BR')}`), arrId: arr ? arr.id : null, tempo: tempo || (arr ? arr.tempo : 80), bars,
    tracks: Array.from({ length: 6 }, (_, v) => ({ name: arr ? VOICE_NAMES[v] : `Pista ${v + 1}`, recId: null, v })), fill: true, mix: null, master: { gain: 6, ceiling: -1 }, created: Date.now() };
}
export const projectArr = (p) => (p.arrId ? ARRANGEMENTS.find((a) => a.id === p.arrId) : null);
/** Duração da música em segundos. */
export function projectSeconds(p) { const a = projectArr(p); return (a ? a.steps.reduce((s, x) => s + x.d, 0) : p.bars * 4) * 60 / p.tempo; }
/** Latência de ida e volta em segundos: calibrada, ou a estimativa do navegador. */
export function latencySeconds() { const ms = prefs.get('latencyMs'); if (ms != null) return ms / 1000; const c = getCtx(); return (c.outputLatency || 0) + (c.baseLatency || 0) + 0.01; }

/**
 * Pistas do projeto como AudioBuffers. Com fill, pistas vazias de um arranjo usam a voz sintetizada.
 * Devolve { buffers, names, recorded: [bool], index: [nº da pista] }.
 */
export async function projectBuffers(p, { fill = p.fill } = {}) {
  const arr = projectArr(p); let syn = null; const buffers = [], names = [], recorded = [], index = [];
  for (const t of p.tracks) {
    if (t.recId) { const [pcm, meta] = await Promise.all([getRecordingPcm(t.recId), getRecordingMeta(t.recId)]); if (pcm && meta) { buffers.push(bufferFrom([pcm], meta.sampleRate)); names.push(t.name); recorded.push(true); index.push(t.v); continue; } }
    if (fill && arr) { if (!syn) syn = await stems(arr.id); buffers.push(await retime(syn[t.v], arr.tempo / p.tempo)); names.push(`${t.name} (app)`); recorded.push(false); index.push(t.v); }
  }
  return { buffers, names, recorded, index };
}
/** As pistas sintetizadas são renderizadas no andamento original; se o projeto mudou o andamento, não há ajuste (mantemos o andamento do arranjo). */
async function retime(buf) { return buf; }
