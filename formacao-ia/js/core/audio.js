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
const VEL_PADRAO = 1.25;
const lerVel = () => { try { const v = +localStorage.getItem('fia-vel'); return VELOCIDADES.includes(v) ? v : VEL_PADRAO; } catch { return VEL_PADRAO; } };
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

const lerAuto = () => { try { return localStorage.getItem('fia-audio-auto') !== '0'; } catch { return true; } };
const gravarAuto = (v) => { try { localStorage.setItem('fia-audio-auto', v ? '1' : '0'); } catch {} };
// vozes que devolvem o tempo exato de cada parte (marcas SSML); as outras têm cortes estimados
const exato = (voz) => /Neural2|Wavenet|Standard|Studio|Polyglot/i.test(voz || '');

/** Ajusta os cortes estimados para as pausas reais do áudio (guarda o resultado para não refazer). */
async function cortesReais(id, info, blob) {
  const est = (info.capitulos || []).map((c) => c.t);
  if (est.length < 2 || info.cortes === 'exatos' || exato(info.voz)) return est;
  const chave = `fia-cortes:${id}:${info.bytes}`;
  try { const g = JSON.parse(localStorage.getItem(chave) || 'null'); if (Array.isArray(g) && g.length === est.length) return g; } catch {}
  try {
    const { energia, silencios, ajustarCortes } = await import('./cortes.js');
    const ctx = new OfflineAudioContext(1, 1, 16000);
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    const cortes = ajustarCortes(est, silencios(energia(buf.getChannelData(0), buf.sampleRate)));
    try { localStorage.setItem(chave, JSON.stringify(cortes)); } catch {}
    return cortes;
  } catch { return est; }
}

/**
 * Player de uma aula. O MP3 é um só, mas toca por partes: `parte('passo-1')` mostra e toca só a Ideia,
 * do começo ao fim dela (com "tocar ao abrir" ligado, começa sozinho). `parte(null)` esconde e pausa
 * (passos sem áudio: exercício, quiz, fim). Controles: play/pausa, barra da parte, tempo, 1x/1,25x/1,5x.
 */
export function playerAula(id, info, { titulo = '' } = {}) {
  const audio = new Audio();
  audio.preload = 'none';
  let blobUrl = null, carregado = false, carregando = null;
  let partes = (info.capitulos || []).map((c, i, a) => ({ id: c.id, nome: c.nome, ini: c.t, fim: a[i + 1] ? a[i + 1].t : Infinity }));
  let atual = null;     // parte em exibição
  const btn = h('button.btn.primary.play', { type: 'button', 'aria-label': 'Ouvir esta parte' }, icon('play'));
  const rotulo = h('span.parte-nome');
  const barra = h('input.prog-audio', { type: 'range', min: 0, max: 1, step: 0.1, value: 0, 'aria-label': 'Posição do áudio nesta parte' });
  const tempo = h('span.small.muted.num', '0:00');
  const vels = h('div.vels', { role: 'group', 'aria-label': 'Velocidade' });
  const auto = h('button.vel.auto', { type: 'button', title: 'Começar o áudio sozinho ao abrir cada parte da aula' });
  const aviso = h('p.small.muted.hide');
  const el = h('section.player-aula', { 'aria-label': 'Áudio desta parte da aula' },
    h('div.row.player-linha', btn, h('div.grow.col', h('div.row.between', rotulo, auto), barra, h('div.row.between', tempo, vels))), aviso);

  const pintarVel = () => { vels.textContent = ''; for (const v of VELOCIDADES) vels.append(h('button.vel', { type: 'button', 'aria-pressed': String(audio.playbackRate === v), onclick: () => { audio.playbackRate = v; gravarVel(v); pintarVel(); } }, `${String(v).replace('.', ',')}x`)); };
  const pintarAuto = () => { auto.setAttribute('aria-pressed', String(lerAuto())); auto.textContent = lerAuto() ? 'Tocar ao abrir: sim' : 'Tocar ao abrir: não'; };
  auto.onclick = () => { gravarAuto(!lerAuto()); pintarAuto(); };
  audio.playbackRate = lerVel(); audio.defaultPlaybackRate = audio.playbackRate; pintarVel(); pintarAuto();
  const fimDe = (p) => Math.min(p.fim, audio.duration || info.duracao || Infinity);
  const pintarTempo = () => {
    if (!atual) return;
    const dur = Math.max(0.1, fimDe(atual) - atual.ini), pos = Math.min(dur, Math.max(0, audio.currentTime - atual.ini));
    barra.max = dur.toFixed(1); if (!barra.matches(':active')) barra.value = pos.toFixed(1);
    tempo.textContent = `${fmtDur(pos)} / ${fmtDur(dur)}`;
  };

  async function garantir() {
    if (carregado) return true;
    if (!carregando) carregando = (async () => {
      btn.disabled = true; btn.classList.add('carregando');
      try {
        // baixa o arquivo inteiro (o service worker guarda para usar sem internet) e toca da memória
        const r = await fetch(url(info));
        if (!r.ok) throw new Error(String(r.status));
        const blob = await r.blob();
        const cortes = await cortesReais(id, info, blob);
        partes = partes.map((p, i) => ({ ...p, ini: cortes[i], fim: cortes[i + 1] ?? Infinity }));
        if (atual) atual = partes.find((p) => p.id === atual.id) || atual;
        blobUrl = URL.createObjectURL(blob);
        audio.src = blobUrl; audio.playbackRate = lerVel();
        await new Promise((ok) => { if (audio.readyState >= 1) ok(); else { audio.addEventListener('loadedmetadata', ok, { once: true }); audio.addEventListener('error', ok, { once: true }); } });
        carregado = true;
      } catch {
        aviso.textContent = navigator.onLine ? 'Não deu para carregar o áudio agora. O texto continua aqui.' : 'Sem internet: o áudio desta aula ainda não foi baixado. O texto continua aqui.';
        aviso.classList.remove('hide');
      } finally { btn.disabled = false; btn.classList.remove('carregando'); carregando = null; }
      return carregado;
    })();
    return carregando;
  }

  // para no fim da parte (vigiado a cada quadro enquanto toca: o timeupdate é lento demais)
  let quadro = 0;
  const vigiar = () => {
    cancelAnimationFrame(quadro);
    if (audio.paused || !atual) return;
    if (audio.currentTime >= fimDe(atual) - 0.05) { audio.pause(); audio.currentTime = fimDe(atual); el.classList.add('terminou'); }
    pintarTempo();
    quadro = requestAnimationFrame(vigiar);
  };
  async function tocar() {
    if (!atual || !(await garantir())) return;
    if (audio.currentTime < atual.ini - 0.2 || audio.currentTime >= fimDe(atual) - 0.15) audio.currentTime = atual.ini;
    el.classList.remove('terminou');
    try { await audio.play(); } catch {}
    if ('mediaSession' in navigator) { try { navigator.mediaSession.metadata = new MediaMetadata({ title: `${titulo || `Lição ${id}`} · ${atual.nome}`, artist: 'Formação IA' }); } catch {} }
  }
  btn.onclick = () => (audio.paused ? tocar() : audio.pause());
  const pintarBtn = () => { btn.replaceChildren(icon(audio.paused ? 'play' : 'pausa')); btn.setAttribute('aria-label', audio.paused ? (el.classList.contains('terminou') ? 'Ouvir de novo' : 'Ouvir esta parte') : 'Pausar'); el.classList.toggle('tocando', !audio.paused); if (!audio.paused) vigiar(); };
  audio.addEventListener('play', pintarBtn); audio.addEventListener('pause', pintarBtn); audio.addEventListener('ended', pintarBtn);
  // a mascote não pisca durante a leitura com áudio
  const marcar = () => document.body.classList.toggle('audio-tocando', !audio.paused);
  audio.addEventListener('play', marcar); audio.addEventListener('pause', marcar); audio.addEventListener('ended', marcar);
  audio.addEventListener('timeupdate', pintarTempo);
  barra.addEventListener('input', async () => { if (atual && (await garantir())) { audio.currentTime = atual.ini + +barra.value; el.classList.remove('terminou'); pintarTempo(); } });

  /** Mostra a parte `pid` (ou esconde, com null). Com `auto` e "tocar ao abrir" ligado, toca do começo dela. */
  async function parte(pid, { auto: tocarSozinho = false } = {}) {
    const p = pid && partes.find((x) => x.id === pid);
    if (!p) { audio.pause(); atual = null; el.hidden = true; return; }
    const outra = !atual || atual.id !== p.id;
    atual = p; el.hidden = false; el.dataset.parte = p.id;
    rotulo.textContent = `Ouvir: ${p.nome}`;
    if (outra) { audio.pause(); el.classList.remove('terminou'); if (carregado) audio.currentTime = p.ini; }
    pintarTempo();
    if (tocarSozinho && lerAuto() && outra) await tocar();
  }
  const parar = () => { cancelAnimationFrame(quadro); audio.pause(); document.body.classList.remove('audio-tocando'); if (blobUrl) URL.revokeObjectURL(blobUrl); };
  return { el, parar, audio, parte, partes: () => partes };
}
