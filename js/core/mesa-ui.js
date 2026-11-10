// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Interface da mesa virtual. Em retrato: um canal por vez, com gesto de deslizar. Em paisagem: a mesa inteira.

import { h, loop, seg, clamp, fmt, toast, vib } from './ui.js';
import { knob, vfader } from './widgets.js';
import { log } from './store.js';
import { getCtx, unlock, dryOut, onStopAll } from '../audio/engine.js';
import { createMixer, defaultState, readMeter, MISSIONS } from '../audio/mixer.js';
import { VOICE_COLORS, VOICE_NAMES } from '../music/theory.js';

/**
 * opts: { buffers: AudioBuffer[], names, state, missions (bool), onChange(state) }
 * Devolve { el, stop(), state, play() }.
 */
export function mesaUI({ buffers, names = VOICE_NAMES, state, missions = true, onChange }) {
  const n = buffers.length; const S = state || defaultState(n);
  let mx = null, srcs = [], playing = false, off = null, mission = null;
  const stats = { prePeak: new Array(n).fill(-90), clipAt: new Array(n).fill(-1e9), postRms: new Array(n).fill(-90), L: -90, R: -90 };
  const ctl = S.ch.map(() => ({})); const refreshers = [];
  const changed = () => { if (mx) mx.apply(S); onChange && onChange(S); };
  const col = (i) => VOICE_COLORS[n === 6 ? i : Math.round((i / Math.max(1, n - 1)) * 5)];

  const playBtn = h('button.btn.primary', 'Tocar');
  const stop = () => { srcs.forEach((s) => { try { s.stop(); } catch {} }); srcs = []; playing = false; playBtn.textContent = 'Tocar'; off && off(); off = null; };
  const play = async () => {
    await unlock(); const c = getCtx(); if (!mx) { mx = createMixer(c, dryOut(), n); }
    mx.apply(S, c.currentTime, 0);
    if (playing) return; const t = c.currentTime + 0.05;
    srcs = buffers.map((b, i) => { const s = c.createBufferSource(); s.buffer = b; s.loop = true; s.connect(mx.inputs[i]); s.start(t); return s; });
    playing = true; playBtn.textContent = 'Parar'; off = onStopAll(stop);
  };
  playBtn.onclick = () => (playing ? stop() : play());

  // --- canal completo (uma página do carrossel) ---
  const K = (i, key, label, o) => { const k = knob(label, o, (v) => { S.ch[i][key] = v; changed(); }); k.style.setProperty('--c', col(i)); ctl[i][key] = k; return k; };
  const T = (i, key, label, onColor) => { const b = h('button.sq', { type: 'button', 'aria-pressed': String(!!S.ch[i][key]), 'aria-label': `${label} · ${names[i]}`, css: onColor ? { '--on': onColor } : null, onclick: () => { S.ch[i][key] = !S.ch[i][key]; refresh(); changed(); } }, label); (ctl[i][key + 'Btns'] = ctl[i][key + 'Btns'] || []).push(b); return b; };
  const dbf = (v) => `${v > 0 ? '+' : ''}${fmt(v, 0)} dB`, sendf = (v) => (v <= -60 ? '−∞' : `${fmt(v, 0)} dB`);
  const strips = S.ch.map((x, i) => {
    const clip = h('span.clip', { title: 'Luz de clip' }); ctl[i].clip = [clip];
    const fd = vfader(`Fader · ${names[i]}`, x.fader, (v) => { S.ch[i].fader = v; ctl[i].faders.forEach((f) => f !== fd && f.set(v)); changed(); }); fd.style.setProperty('--c', col(i)); ctl[i].faders = [fd];
    return h('section.strip', { css: { '--c': col(i) }, 'aria-label': `Canal ${i + 1}: ${names[i]}` },
      h('h3', h('span', `${i + 1} · ${names[i]}`), h('span.row', h('span.small.muted', 'clip'), clip)),
      h('div.knobs',
        h('span.sec', 'Entrada'), K(i, 'gain', 'Ganho', { min: -20, max: 30, value: x.gain, fmtv: dbf, def: 0 }), T(i, 'hpf', 'HPF 100'), h('span'),
        h('span.sec', 'Equalizador'), K(i, 'hi', 'Agudos', { min: -15, max: 15, value: x.hi, fmtv: dbf, def: 0 }), K(i, 'mid', 'Médios', { min: -15, max: 15, value: x.mid, fmtv: dbf, def: 0 }), K(i, 'midF', 'Freq.', { min: 200, max: 6000, step: 50, value: x.midF, def: 1000, fmtv: (v) => (v >= 1000 ? `${fmt(v / 1000, 1)} kHz` : `${v} Hz`) }),
        K(i, 'lo', 'Graves', { min: -15, max: 15, value: x.lo, fmtv: dbf, def: 0 }), K(i, 'comp', 'Comp.', { min: 0, max: 100, step: 5, value: x.comp, fmtv: (v) => `${v}%`, def: 0 }), h('span'),
        h('span.sec', 'Auxiliares e pan'), K(i, 'mon', 'Monitor (pré)', { min: -60, max: 6, step: 2, value: x.mon, fmtv: sendf, def: -60 }), K(i, 'rev', 'Reverb (pós)', { min: -60, max: 6, step: 2, value: x.rev, fmtv: sendf, def: -60 }), K(i, 'pan', 'Pan', { min: -1, max: 1, step: 0.05, value: x.pan, def: 0, fmtv: (v) => (Math.abs(v) < 0.03 ? 'C' : `${v < 0 ? 'E' : 'D'} ${Math.round(Math.abs(v) * 100)}`) })),
      h('div.side', T(i, 'mute', 'MUTE', 'var(--bad)'), T(i, 'solo', 'SOLO', 'var(--v5)'), fd));
  });
  // master
  const mFd = vfader('Fader master', S.master, (v) => { S.master = v; mOv.set(v); changed(); }), mOv = vfader('Fader master', S.master, (v) => { S.master = v; mFd.set(v); changed(); }, { height: 120 });
  const listen = seg([{ v: 'master', label: 'Master (PA)' }, { v: 'monitor', label: 'Monitor (aux pré)' }], S.listen, (v) => { S.listen = v; changed(); }, { label: 'Saída que você ouve' });
  const lufsEl = h('p.small.muted', 'Medidores E e D do master ao lado do fader.');
  const masterStrip = h('section.strip', { css: { '--c': '#f4ecdc' }, 'aria-label': 'Master' }, h('h3', h('span', 'Master'), h('span')),
    h('div.col', h('div.eyebrow', 'Ouvir'), listen, h('p.small.dim', 'O auxiliar de monitor é pré-fader: a mixagem do retorno não muda quando você mexe nos faders. O de reverb é pós-fader: acompanha o canal.'), lufsEl,
      h('button.btn.small', { onclick: () => { const d = defaultState(n); S.ch.forEach((x, i) => Object.assign(x, d.ch[i])); S.master = 0; refresh(); changed(); toast('Mesa zerada.'); } }, 'Zerar a mesa')),
    h('div.side', mFd));
  const pager = h('div.pager', { tabindex: 0, 'aria-label': 'Canais: deslize para os lados' }, ...strips, masterStrip);
  const dots = h('div.dots', [...S.ch.map((_, i) => i), 'M'].map((k, idx) => h('button', { type: 'button', 'aria-label': k === 'M' ? 'Master' : `Canal ${k + 1}: ${names[k]}`, css: { '--c': k === 'M' ? '#f4ecdc' : col(k) }, onclick: () => pager.children[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }) }, h('i'))));
  const markDot = () => { const w = pager.clientWidth || 1, idx = Math.round(pager.scrollLeft / (w + 12)); [...dots.children].forEach((d, i) => d.setAttribute('aria-current', String(i === idx))); };
  pager.addEventListener('scroll', markDot, { passive: true }); queueMicrotask(markDot);

  // --- visão geral (paisagem): a mesa inteira ---
  const overview = h('div.overview', ...S.ch.map((x, i) => {
    const clip = h('span.clip'); ctl[i].clip.push(clip);
    const fd = vfader(`Fader · ${names[i]}`, x.fader, (v) => { S.ch[i].fader = v; ctl[i].faders.forEach((f) => f !== fd && f.set(v)); changed(); }, { height: 120 }); fd.style.setProperty('--c', col(i)); ctl[i].faders.push(fd);
    return h('div.ov', { css: { '--c': col(i) } }, h('button.nm', { style: { background: 'none', border: 0, color: 'inherit', minHeight: '44px', minWidth: '44px' }, 'aria-label': `Abrir canal ${i + 1}`, onclick: () => pager.children[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }) }, names[i]), clip, T(i, 'mute', 'M', 'var(--bad)'), T(i, 'solo', 'S', 'var(--v5)'), fd);
  }), h('div.ov', { css: { '--c': '#f4ecdc' } }, h('span.nm', { style: { minHeight: '44px', display: 'grid', placeItems: 'center' } }, 'Master'), h('span', { style: { flex: 1 } }), mOv));

  function refresh() { S.ch.forEach((x, i) => { for (const k of ['gain', 'hi', 'mid', 'midF', 'lo', 'comp', 'mon', 'rev', 'pan']) ctl[i][k].set(x[k]); for (const k of ['hpf', 'mute', 'solo']) ctl[i][k + 'Btns'].forEach((b) => b.setAttribute('aria-pressed', String(!!x[k]))); ctl[i].faders.forEach((f) => f.set(x.fader)); }); mFd.set(S.master); mOv.set(S.master); listen.set(S.listen); }

  // --- missões ---
  const missionBox = h('div.card.col');
  const paintMission = () => {
    if (!missions) return;
    if (!mission) { missionBox.replaceChildren(h('h3', 'Missões guiadas'), h('p.small.dim', 'Cada missão bagunça a mesa de um jeito. Você conserta, e o app confere sozinho.'), h('div.seg.wrap', MISSIONS.map((m) => h('button.chip', { onclick: async () => { const d = defaultState(n); S.ch.forEach((x, i) => Object.assign(x, d.ch[i])); S.master = 0; m.init(S); mission = { m, done: false, okSince: 0 }; refresh(); changed(); paintMission(); await play(); } }, m.title)))); return; }
    const list = h('ul.checks'); mission.list = list;
    missionBox.replaceChildren(h('div.row.between', h('h3', mission.m.title), h('button.btn.small.ghost', { onclick: () => { mission = null; paintMission(); } }, 'Sair')), h('p.small', mission.m.text), list, mission.msg = h('p.small', { 'aria-live': 'polite' }));
  };
  paintMission();
  const el = h('div.mesa.col', missions ? missionBox : null, h('div.row', playBtn, h('span.small.muted', 'Arraste os botões para cima e para baixo. Toque duplo volta ao padrão.')), overview, pager, dots);

  // --- medidores e verificação ---
  let frame = 0;
  loop(el, (t) => {
    if (!mx || !playing) { if (frame++ % 30 === 0) { ctl.forEach((c) => c.faders.forEach((f) => f.setMeter(-90, -90))); mFd.setMeter(-90, -90); mOv.setMeter(-90, -90); } return; }
    S.ch.forEach((x, i) => {
      const pre = readMeter(mx.meters.pre[i]), post = readMeter(mx.meters.post[i]);
      stats.prePeak[i] = Math.max(stats.prePeak[i] - 0.12, pre.peak); if (pre.peak >= -0.2) stats.clipAt[i] = t;
      stats.postRms[i] += (Math.max(-90, post.rms) - stats.postRms[i]) * 0.04;
      const on = t - stats.clipAt[i] < 1.5; ctl[i].clip.forEach((c) => c.classList.toggle('on', on));
      ctl[i].faders.forEach((f) => f.setMeter(post.peak, post.rms));
    });
    const L = readMeter(mx.meters.L), R = readMeter(mx.meters.R); stats.L += (Math.max(-90, L.rms) - stats.L) * 0.05; stats.R += (Math.max(-90, R.rms) - stats.R) * 0.05;
    mFd.setMeter(Math.max(L.peak, R.peak), Math.max(L.rms, R.rms)); mOv.setMeter(Math.max(L.peak, R.peak), Math.max(L.rms, R.rms));
    if (frame++ % 12 === 0) {
      lufsEl.textContent = `Master: E ${fmt(stats.L, 1)} dB · D ${fmt(stats.R, 1)} dB (RMS). Pico pré-EQ dos canais: ${stats.prePeak.map((p) => fmt(Math.max(-60, p), 0)).join(' · ')} dBFS.`;
      if (mission && !mission.done) {
        const m = { ...stats, clipAgo: stats.clipAt.map((c) => t - c) }; const checks = mission.m.checks(S, m);
        mission.list.replaceChildren(...checks.map((c) => h('li' + (c.ok ? '.ok' : ''), c.label)));
        if (checks.every((c) => c.ok)) { if (!mission.okSince) mission.okSince = t; if (t - mission.okSince > 1.5) { mission.done = true; vib([30, 40, 30]); mission.msg.textContent = 'Missão cumprida! Registrada na Evolução.'; log('studio', { mission: mission.m.id }); } } else mission.okSince = 0;
      }
    }
  });
  void clamp;
  return { el, stop, play, state: S, refresh, stats, startMission: (id) => { const b = [...missionBox.querySelectorAll('.chip')].find((x) => x.textContent === MISSIONS.find((m) => m.id === id).title); b && b.click(); } };
}
