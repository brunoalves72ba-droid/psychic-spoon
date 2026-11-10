// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Imersão: tela cheia em que cada voz é uma fita de onda cujo comprimento acompanha a altura da nota.
import { h, s, canvas, loop, slider, toggle, sheet, wake, fullscreen, reducedMotion, lerp } from '../core/ui.js';
import { voiceChips, voiceMap, isMuted } from '../core/widgets.js';
import { roteiro, kv } from '../core/store.js';
import { choirChord, Sequencer, unlock, mediaSession, mediaState } from '../audio/engine.js';
import { ARRANGEMENTS, getArrangement } from '../music/arrangements.js';
import { VOICE_COLORS, VOICE_NAMES, prettyChord, midiToFreq, noteName, parseChord, degreeOf, degShort } from '../music/theory.js';

export default async function imersao(el, [idArg]) {
  document.body.classList.add('immersive');
  const saved = await kv.get('imersao', {});
  let arr = getArrangement(idArg || saved.arr), tempo = saved.tempo && !idArg ? saved.tempo : arr.tempo, repeat = saved.repeat ?? true, seq = null, startedAt = 0, counted = false;
  const state = { mute: new Array(6).fill(false), solo: null };
  const cv = canvas(300); cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  const chord = h('div.big', '—'), legend = h('p', { style: { minHeight: '4.2em', margin: 0 } }, arr.about), title = h('div.eyebrow', arr.title);
  const mapBox = h('div', { style: { height: '96px' } }); let map = null;
  const btn = h('button.btn.primary.round', { 'aria-label': 'Tocar' }, '▶');
  const lam = new Array(6).fill(120), amp = new Array(6).fill(0), ph = new Array(6).fill(0), cur = new Array(6).fill(null);
  const persist = () => kv.set('imersao', { arr: arr.id, tempo, repeat });
  const setMap = () => { map = voiceMap(arr.steps, { height: 96 }); mapBox.replaceChildren(map); };
  const stop = () => { if (seq) seq.stop(); seq = null; btn.textContent = '▶'; btn.setAttribute('aria-label', 'Tocar'); wake.off(); mediaState('paused'); };
  const start = () => {
    seq = new Sequencer({ steps: arr.steps, tempo, loop: repeat,
      play: (st, i, t, d) => choirChord(st.n, t, d * 0.97, { gain: 0.13, mute: st.n.map((_, v) => isMuted(state, v)) }),
      onStep: (i) => { const st = arr.steps[i]; chord.textContent = prettyChord(st.c); legend.textContent = [st.t, st.auto].filter(Boolean).join(' '); },
      onEnd: () => { stop(); } });
    seq.start(); startedAt = performance.now(); btn.textContent = '❚❚'; btn.setAttribute('aria-label', 'Pausar'); wake.on(); mediaState('playing');
    mediaSession(`${arr.title} · Imersão`, { play: () => { if (!seq) start(); }, pause: stop });
  };
  btn.onclick = async () => { await unlock(); seq ? stop() : start(); };
  const still = reducedMotion();
  loop(cv, (t) => {
    const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh);
    const pos = seq ? seq.position() : null; const st = pos ? arr.steps[pos.i] : null;
    if (seq && !counted && performance.now() - startedAt > 45000) { counted = true; roteiro.mark('imersao'); }
    const band = hh / 6;
    for (let v = 0; v < 6; v++) {
      const on = !!st && !isMuted(state, v); const m = st ? st.n[v] : cur[v]; if (st) cur[v] = st.n[v];
      const tgt = m != null ? Math.max(18, w * 62 / midiToFreq(m)) : lam[v];
      lam[v] = lerp(lam[v], tgt, 0.12); amp[v] = lerp(amp[v], on ? 1 : 0.06, 0.1); if (!still) ph[v] += on ? 0.05 + v * 0.004 : 0.004;
      const yc = hh - band * (v + 0.5), A = band * 0.3 * amp[v] + 1.5;
      g.beginPath();
      for (let x = 0; x <= w; x += 3) { const y = yc + Math.sin((x / lam[v]) * 2 * Math.PI - ph[v]) * A; x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.strokeStyle = VOICE_COLORS[v]; g.globalAlpha = 0.25 + 0.75 * amp[v]; g.lineWidth = 3 + 7 * amp[v]; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
      g.globalAlpha = 0.5 + 0.5 * amp[v]; g.fillStyle = VOICE_COLORS[v]; g.font = '600 12px Figtree, sans-serif';
      const d = st ? degreeOf(parseChord(st.c), st.n[v]) : null;
      g.fillText(`${VOICE_NAMES[v]}${m != null ? ' · ' + noteName(m) + (d ? ' · ' + degShort(d) : '') : ''}`, 10, yc - band * 0.33);
    }
    g.globalAlpha = 1;
    if (map) map.draw(pos, state);
    void t;
  });
  const openSettings = () => {
    const close = sheet([
      h('h2', 'Imersão'),
      h('label.field', 'Arranjo', h('select', { onchange: (e) => { stop(); arr = getArrangement(e.target.value); tempo = arr.tempo; title.textContent = arr.title; legend.textContent = arr.about; chord.textContent = '—'; setMap(); persist(); close(); } }, ARRANGEMENTS.map((a) => h('option', { value: a.id, selected: a.id === arr.id }, a.title)))),
      slider('Andamento', { min: 36, max: 132, value: tempo, unit: 'bpm' }, (v) => { tempo = v; if (seq) seq.tempo = v; persist(); }),
      toggle('Repetir', repeat, (v) => { repeat = v; if (seq) seq.loop = v; persist(); }),
      h('p.small.muted', 'Vozes: toque para silenciar; segure para isolar.'),
      voiceChips(6, state, () => {}),
      h('div.row.wrap', h('button.btn.small', { onclick: () => fullscreen(document.documentElement, !document.fullscreenElement) }, 'Tela cheia'), h('a.btn.small', { href: `#/harmonia/cante/${arr.id}`, onclick: () => close() }, 'Cantar uma voz'), h('button.btn.small.primary', { onclick: () => close() }, 'Fechar')),
    ]);
  };
  setMap();
  el.style.cssText = 'height:100dvh;display:flex;flex-direction:column;gap:0;padding:calc(var(--sat) + 6px) calc(var(--sar) + 12px) calc(var(--sab) + 10px) calc(var(--sal) + 12px)';
  el.append(
    h('div.row.between', h('a.back', { href: '#/harmonia', 'aria-label': 'Sair da imersão', style: { marginLeft: '-6px' } }, s('svg', { viewBox: '0 0 24 24' }, s('path', { d: 'M6 6l12 12M18 6L6 18' }))), title, h('button.back', { 'aria-label': 'Arranjo, andamento e vozes', style: { marginLeft: 0, marginRight: '-6px' }, onclick: openSettings }, s('svg', { viewBox: '0 0 24 24' }, s('path', { d: 'M4 7h10M18 7h2M4 12h4M12 12h8M4 17h12M20 17h0' }), s('circle', { cx: 16, cy: 7, r: 2 }), s('circle', { cx: 10, cy: 12, r: 2 }), s('circle', { cx: 18, cy: 17, r: 2 })))),
    h('div.grow', { style: { minHeight: '180px', position: 'relative' } }, cv),
    h('div.row', { style: { alignItems: 'flex-start', gap: '12px', padding: '6px 0' } }, btn, h('div.grow', chord, legend)),
    mapBox,
  );
  return () => { stop(); };
}
