// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Áudio das aulas: MP3 gerado uma vez com voz neural (tools/audio/gerar-audio.mjs) e tocado aqui.
// audio/indice.json diz quais aulas têm áudio (sem áudio, a aula aparece só com o texto, sem erro).
// O MP3 é baixado na primeira vez que a aula é tocada e fica guardado no aparelho (funciona sem internet).
import { h, icon, fmtDur } from './ui.js';

let indice = null;
export async function carregarIndice() {
  if (indice) return indice;
  try { const r = await fetch('audio/indice.json'); indice = r.ok ? await r.json() : {}; } catch { indice = {}; }
  return indice;
}
export const infoAudio = async (id) => (await carregarIndice())[id] || null;

const CACHE = 'fia-audio';
const url = (info) => 'audio/' + info.arquivo;
const VELOCIDADES = [1, 1.25, 1.5];
const lerVel = () => { try { const v = +localStorage.getItem('fia-vel'); return VELOCIDADES.includes(v) ? v : 1; } catch { return 1; } };
const gravarVel = (v) => { try { localStorage.setItem('fia-vel', String(v)); } catch {} };

/** Quantos áudios já estão guardados neste aparelho. */
export async function baixados() {
  const ind = await carregarIndice();
  if (!('caches' in window)) return { total: Object.keys(ind).length, baixados: 0, mb: 0 };
  const c = await caches.open(CACHE);
  const nomes = new Set((await c.keys()).map((r) => new URL(r.url).pathname.split('/').pop()));
  const ids = Object.keys(ind);
  return { total: ids.length, baixados: ids.filter((id) => nomes.has(ind[id].arquivo)).length, mb: ids.reduce((a, id) => a + (ind[id].bytes || 0), 0) / 1048576 };
}
/** Baixa todos os áudios de uma vez (para estudar sem internet). */
export async function baixarTodos(progresso) {
  const ind = await carregarIndice(), ids = Object.keys(ind);
  const c = await caches.open(CACHE);
  let n = 0, falhas = 0;
  for (const id of ids) {
    try { if (!(await c.match(url(ind[id])))) { const r = await fetch(url(ind[id])); if (r.ok) await c.put(url(ind[id]), r); else falhas++; } } catch { falhas++; }
    progresso && progresso(++n, ids.length);
  }
  return { falhas };
}

/**
 * Player de uma aula: play/pausa, barra de progresso (arrastável), tempo, velocidades 1x/1,25x/1,5x
 * e capítulos (Começo, Ideia, Exemplo, Erro comum). Devolve { el, parar }.
 */
export function playerAula(id, info, { titulo = '' } = {}) {
  const audio = new Audio();
  audio.preload = 'none';
  let blobUrl = null, carregado = false, carregando = null;
  const btn = h('button.btn.primary.play', { type: 'button', 'aria-label': 'Ouvir a aula' }, icon('play'));
  const barra = h('input.prog-audio', { type: 'range', min: 0, max: Math.max(1, Math.round(info.duracao || 1)), step: 1, value: 0, 'aria-label': 'Posição do áudio' });
  const tempo = h('span.small.muted.num', `0:00 / ${fmtDur(info.duracao || 0)}`);
  const vels = h('div.vels', { role: 'group', 'aria-label': 'Velocidade' });
  const caps = h('div.caps', { role: 'group', 'aria-label': 'Capítulos do áudio' });
  const aviso = h('p.small.muted.hide');
  const el = h('section.player-aula', { 'aria-label': 'Áudio da aula' }, h('div.row.player-linha', btn, h('div.grow.col', barra, h('div.row.between', tempo, vels))), caps, aviso);

  const pintarVel = () => { vels.textContent = ''; for (const v of VELOCIDADES) vels.append(h('button.vel', { type: 'button', 'aria-pressed': String(audio.playbackRate === v), onclick: () => { audio.playbackRate = v; gravarVel(v); pintarVel(); } }, `${String(v).replace('.', ',')}x`)); };
  audio.playbackRate = lerVel(); audio.defaultPlaybackRate = audio.playbackRate; pintarVel();
  const capAtual = () => { let a = null; for (const c of info.capitulos || []) if (audio.currentTime + 0.3 >= c.t) a = c.id; return a; };
  const pintarCaps = () => { for (const b of caps.children) b.setAttribute('aria-current', String(b.dataset.cap === capAtual())); };
  for (const c of info.capitulos || []) caps.append(h('button.chip.cap', { type: 'button', data: { cap: c.id }, onclick: async () => { await garantir(); audio.currentTime = c.t; if (audio.paused) tocar(); pintarCaps(); } }, c.nome));

  async function garantir() {
    if (carregado) return true;
    if (!carregando) carregando = (async () => {
      btn.disabled = true; btn.classList.add('carregando');
      try {
        // baixa o arquivo inteiro (o service worker guarda para usar sem internet) e toca da memória
        const r = await fetch(url(info));
        if (!r.ok) throw new Error(String(r.status));
        blobUrl = URL.createObjectURL(await r.blob());
        audio.src = blobUrl; audio.playbackRate = lerVel();
        carregado = true;
      } catch {
        aviso.textContent = navigator.onLine ? 'Não deu para carregar o áudio agora. O texto continua aqui.' : 'Sem internet: o áudio desta aula ainda não foi baixado. O texto continua aqui.';
        aviso.classList.remove('hide');
      } finally { btn.disabled = false; btn.classList.remove('carregando'); carregando = null; }
      return carregado;
    })();
    return carregando;
  }
  async function tocar() {
    if (!(await garantir())) return;
    try { await audio.play(); } catch {}
    if ('mediaSession' in navigator) { try { navigator.mediaSession.metadata = new MediaMetadata({ title: titulo || `Lição ${id}`, artist: 'Formação IA' }); } catch {} }
  }
  btn.onclick = () => (audio.paused ? tocar() : audio.pause());
  const pintarBtn = () => { btn.replaceChildren(icon(audio.paused ? 'play' : 'pausa')); btn.setAttribute('aria-label', audio.paused ? 'Ouvir a aula' : 'Pausar'); el.classList.toggle('tocando', !audio.paused); };
  audio.addEventListener('play', pintarBtn); audio.addEventListener('pause', pintarBtn); audio.addEventListener('ended', pintarBtn);
  audio.addEventListener('timeupdate', () => { if (!barra.matches(':active')) barra.value = Math.round(audio.currentTime); tempo.textContent = `${fmtDur(audio.currentTime)} / ${fmtDur(audio.duration || info.duracao || 0)}`; pintarCaps(); });
  audio.addEventListener('loadedmetadata', () => { barra.max = Math.max(1, Math.round(audio.duration)); });
  barra.addEventListener('input', async () => { if (await garantir()) audio.currentTime = +barra.value; });
  const parar = () => { audio.pause(); if (blobUrl) URL.revokeObjectURL(blobUrl); };
  return { el, parar, audio };
}
