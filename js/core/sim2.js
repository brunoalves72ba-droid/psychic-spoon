// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Simuladores do curso de produção (parte 2: mixagem e masterização) e jogos de ouvido.

import { h, canvas, loop, slider, seg, toggle, clamp, fmt, vib } from './ui.js';
import { getCtx, makeImpulse } from '../audio/engine.js';
import { voiceBuffer, stems, mixBuffer, bufferFrom } from '../audio/sources.js';
import { measureLoudness, truePeak, samplePeak, limit, compCurve, applyGain } from '../audio/loudness.js';
import { rig, levelOf, analyser, drawMeter, drawSpectrum, db2g, g2db, fx } from './sim.js';
import { log } from './store.js';
import { VOICE_COLORS, VOICE_NAMES } from '../music/theory.js';

const wrap = (...kids) => h('div.col', ...kids);
const stage = (cv) => h('div.stage', cv);
const hint = (t) => h('p.small.muted', t);
const T = () => getCtx().currentTime;
const panner = (c) => (c.createStereoPanner ? c.createStereoPanner() : c.createGain());

// ---------- equilíbrio, panorama e mono ----------
function pan() {
  let width = 0, mono = false; const lv = [0, 0, 0, 0, 0, 0]; const N = { g: [], p: [] };
  const r = rig({ load: () => stems('aurora'), wire: (c, inps, out) => {
    N.bus = c.createGain(); N.bus.gain.value = 0.5; N.split = c.createChannelSplitter(2); N.mL = c.createGain(); N.mR = c.createGain(); N.merge = c.createChannelMerger(2); N.st = c.createGain(); N.mo = c.createGain(); N.aL = analyser(c); N.aR = analyser(c);
    inps.forEach((inp) => { const g = c.createGain(), p = panner(c); inp.connect(g); g.connect(p); p.connect(N.bus); N.g.push(g); N.p.push(p); });
    N.bus.connect(N.st); N.st.connect(out); N.bus.connect(N.split); N.split.connect(N.mL, 0); N.split.connect(N.mL, 1); N.mL.gain.value = 0.5; N.mL.connect(N.merge, 0, 0); N.mL.connect(N.merge, 0, 1); N.merge.connect(N.mo); N.mo.connect(out);
    N.split.connect(N.aL, 0); N.split.connect(N.aR, 1); upd(); } });
  const upd = () => { if (!N.bus) return; N.g.forEach((g, i) => g.gain.setTargetAtTime(db2g(lv[i]), T(), 0.02)); N.p.forEach((p, i) => { if (p.pan) p.pan.setTargetAtTime(i === 0 ? 0 : ((i % 2 ? -1 : 1) * Math.ceil(i / 2) / 3) * width, T(), 0.03); }); N.st.gain.value = mono ? 0 : 1; N.mo.gain.value = mono ? 1 : 0; };
  const cv = canvas(90);
  loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); if (!N.aL) return; drawMeter(g, 8, 16, w - 16, 12, levelOf(N.aL).peak, { label: 'Esquerda (L)' }); drawMeter(g, 8, 56, w - 16, 12, levelOf(N.aR).peak, { label: 'Direita (R)' }); });
  return wrap(stage(cv), slider('Abertura do panorama (pan)', { min: 0, max: 1, step: 0.05, value: 0, fmtv: (v) => `${Math.round(v * 100)}%` }, (v) => { width = v; upd(); }), toggle('Checar em mono', mono, (v) => { mono = v; upd(); }),
    hint('Com tudo no centro, as vozes disputam o mesmo lugar. Abra o panorama e cada uma ganha espaço. O baixo fica no centro. Em mono, confira se nada sumiu.'),
    ...lv.map((_, i) => slider(VOICE_NAMES[i], { min: -24, max: 6, value: 0, unit: 'dB' }, (v) => { lv[i] = v; upd(); })).reverse(), r.row());
}

// ---------- equalizador com analisador ----------
function eqGraph(c, src) {
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 20; const lo = c.createBiquadFilter(); lo.type = 'lowshelf'; lo.frequency.value = 120;
  const mid = c.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 1000; mid.Q.value = 1.2; const hi = c.createBiquadFilter(); hi.type = 'highshelf'; hi.frequency.value = 8000;
  src.connect(hp); hp.connect(lo); lo.connect(mid); mid.connect(hi); return { hp, lo, mid, hi, out: hi, all: [hp, lo, mid, hi] };
}
const FR = new Float32Array(140), MG = new Float32Array(140), PH = new Float32Array(140); for (let i = 0; i < 140; i++) FR[i] = 30 * Math.pow(18000 / 30, i / 139);
function drawEqCurve(g, w, hh, filters, color = '#ffd166') {
  const tot = new Float32Array(140).fill(1); for (const f of filters) { f.getFrequencyResponse(FR, MG, PH); for (let i = 0; i < 140; i++) tot[i] *= MG[i]; }
  g.strokeStyle = 'rgba(244,236,220,.2)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, hh / 2); g.lineTo(w, hh / 2); g.stroke();
  g.strokeStyle = color; g.lineWidth = 2.5; g.beginPath(); for (let i = 0; i < 140; i++) { const y = hh / 2 - clamp(g2db(tot[i]), -24, 24) * (hh / 40); i ? g.lineTo((i / 139) * w, y) : g.moveTo(0, y); } g.stroke();
}
function eq({ source = 'voz' } = {}) {
  const P = { hp: 20, lo: 0, mf: 1000, mg: 0, mq: 1.2, hi: 0 }; let on = true; const N = {};
  const r = rig({ load: source === 'mix' ? mixBuffer : voiceBuffer, wire: (c, inp, out) => { N.e = eqGraph(c, inp); N.an = analyser(c, 4096); N.wet = c.createGain(); N.dry = c.createGain(); N.e.out.connect(N.wet); inp.connect(N.dry); N.wet.connect(N.an); N.dry.connect(N.an); N.an.connect(out); upd(); } });
  const upd = () => { if (!N.e) return; const t = T(); N.e.hp.frequency.setTargetAtTime(P.hp, t, 0.02); N.e.lo.gain.setTargetAtTime(P.lo, t, 0.02); N.e.mid.frequency.setTargetAtTime(P.mf, t, 0.02); N.e.mid.gain.setTargetAtTime(P.mg, t, 0.02); N.e.mid.Q.setTargetAtTime(P.mq, t, 0.02); N.e.hi.gain.setTargetAtTime(P.hi, t, 0.02); N.wet.gain.value = on ? 1 : 0; N.dry.gain.value = on ? 0 : 1; };
  const cv = canvas(170), bands = h('p.small.muted', 'Faixas: abaixo de 100 Hz, peso e ronco · 100–300 Hz, corpo (em excesso, embola) · 300 Hz–2 kHz, presença da voz · 2–6 kHz, clareza e ataque das consoantes · acima de 8 kHz, brilho e “ar”.');
  loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); if (!N.an) { g.fillStyle = 'rgba(244,236,220,.4)'; g.font = '12px Figtree, sans-serif'; g.fillText('Toque em “Tocar” para ver o espectro.', 10, hh / 2); return; } drawSpectrum(g, N.an, 0, 0, w, hh); if (on) drawEqCurve(g, w, hh, N.e.all); });
  const hz = (v) => (v >= 1000 ? `${fmt(v / 1000, 1)} kHz` : `${Math.round(v)} Hz`);
  return wrap(stage(cv), toggle('Equalizador ligado (desligue para comparar)', on, (v) => { on = v; upd(); }),
    slider('Corte de graves (HPF)', { min: 20, max: 400, step: 5, value: P.hp, fmtv: hz }, (v) => { P.hp = v; upd(); }), slider('Graves (low shelf, 120 Hz)', { min: -15, max: 15, step: 0.5, value: 0, unit: 'dB' }, (v) => { P.lo = v; upd(); }),
    slider('Médios: frequência', { min: 200, max: 8000, step: 50, value: P.mf, fmtv: hz }, (v) => { P.mf = v; upd(); }), slider('Médios: ganho', { min: -15, max: 15, step: 0.5, value: 0, unit: 'dB' }, (v) => { P.mg = v; upd(); }), slider('Médios: largura (Q)', { min: 0.4, max: 8, step: 0.1, value: P.mq }, (v) => { P.mq = v; upd(); }),
    slider('Agudos (high shelf, 8 kHz)', { min: -15, max: 15, step: 0.5, value: 0, unit: 'dB' }, (v) => { P.hi = v; upd(); }), bands, r.row());
}

// ---------- jogo: qual faixa foi realçada? ----------
function jogoEq() {
  const BANDS = [[125, 'Graves · 125 Hz'], [250, 'Médio-graves · 250 Hz'], [500, 'Médios · 500 Hz'], [1000, 'Médios · 1 kHz'], [2000, 'Médio-agudos · 2 kHz'], [4000, 'Presença · 4 kHz'], [8000, 'Agudos · 8 kHz']];
  let level = 0, target = null, boosted = true, score = 0, n = 0, locked = false; const N = {};
  const r = rig({ load: mixBuffer, wire: (c, inp, out) => { N.f = c.createBiquadFilter(); N.f.type = 'peaking'; N.f.Q.value = 1.4; N.g = c.createGain(); N.g.gain.value = 0.7; inp.connect(N.f); N.f.connect(N.g); N.g.connect(out); next(); } });
  const pool = () => (level === 0 ? [0, 3, 6] : level === 1 ? [0, 2, 4, 6] : [0, 1, 2, 3, 4, 5, 6]);
  const opts = h('div.quiz'), msg = h('p', { 'aria-live': 'polite', style: { minHeight: '2.6em' } }, 'Toque em “Tocar”, alterne entre original e realçado e diga qual faixa subiu.'), stat = h('span.pill', '0 de 0');
  const set = () => { if (N.f) { N.f.frequency.value = BANDS[target][0]; N.f.gain.setTargetAtTime(boosted ? (level === 2 ? 7 : 10) : 0, T(), 0.02); } };
  const ab = seg([{ v: true, label: 'Realçado' }, { v: false, label: 'Original' }], true, (v) => { boosted = v; set(); }, { label: 'Comparar' });
  function next() { locked = false; const p = pool(); let t; do { t = p[Math.floor(Math.random() * p.length)]; } while (t === target && p.length > 1); target = t; boosted = true; ab.set(true); set();
    opts.replaceChildren(h('div.opts', p.map((i) => h('button.opt', { onclick: (e) => answer(i, e.currentTarget) }, BANDS[i][1])))); }
  const answer = async (i, b) => { if (locked || target == null) return; locked = true; n++; const ok = i === target; if (ok) score++; b.classList.add(ok ? 'ok' : 'no'); vib(ok ? 20 : [30, 40, 30]); msg.textContent = ok ? 'Certo!' : `Era ${BANDS[target][1]}. Alterne original e realçado para fixar o som dessa faixa.`; stat.textContent = `${score} de ${n}`;
    if (n % 8 === 0) { await log('studio', { game: 'eq', ok: score, total: n, level }); if (score / n > 0.75 && level < 2) { level++; msg.textContent += ' Nível novo: mais faixas.'; } }
    setTimeout(() => { if (r.playing()) next(); else locked = false; }, ok ? 900 : 2600); };
  const start = r.btn.onclick; r.btn.onclick = async () => { await start(); };
  return wrap(h('div.row.between', h('span.pill', 'Jogo de ouvido'), stat), msg, ab, opts, r.row());
}

// ---------- compressor ----------
function compressor() {
  const P = { th: -24, ratio: 4, att: 0.01, rel: 0.25, makeup: 0 }; let on = true; const N = {};
  const r = rig({ load: voiceBuffer, wire: (c, inp, out) => { N.c = c.createDynamicsCompressor(); N.c.knee.value = 6; N.mk = c.createGain(); N.wet = c.createGain(); N.dry = c.createGain(); N.aIn = analyser(c); N.aOut = analyser(c); inp.connect(N.aIn); inp.connect(N.c); N.c.connect(N.mk); N.mk.connect(N.wet); inp.connect(N.dry); N.wet.connect(N.aOut); N.dry.connect(N.aOut); N.aOut.connect(out); upd(); } });
  const upd = () => { if (!N.c) return; const t = T(); N.c.threshold.setTargetAtTime(P.th, t, 0.02); N.c.ratio.setTargetAtTime(P.ratio, t, 0.02); N.c.attack.setTargetAtTime(P.att, t, 0.02); N.c.release.setTargetAtTime(P.rel, t, 0.02); N.mk.gain.setTargetAtTime(db2g(P.makeup), t, 0.02); N.wet.gain.value = on ? 1 : 0; N.dry.gain.value = on ? 0 : 1; };
  const cv = canvas(200); let gr = 0;
  loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); const S = Math.min(hh - 8, w * 0.5), x0 = 6, y0 = 4, M = (d) => clamp((d + 60) / 60, 0, 1);
    g.strokeStyle = 'rgba(244,236,220,.15)'; g.strokeRect(x0, y0, S, S); g.beginPath(); g.moveTo(x0, y0 + S); g.lineTo(x0 + S, y0); g.stroke();
    g.strokeStyle = '#ffd166'; g.lineWidth = 2.5; g.beginPath(); for (let d = -60; d <= 0; d += 1) { const o = compCurve(d, { threshold: P.th, ratio: P.ratio, knee: 6, makeup: P.makeup }); const x = x0 + M(d) * S, y = y0 + S - M(Math.min(0, o)) * S; d === -60 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); g.lineWidth = 1;
    g.fillStyle = 'rgba(244,236,220,.5)'; g.font = '10px Figtree, sans-serif'; g.fillText('entrada →', x0 + 4, y0 + S - 4); g.fillText('saída ↑', x0 + 4, y0 + 12); g.strokeStyle = '#5cc8e8'; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(x0 + M(P.th) * S, y0); g.lineTo(x0 + M(P.th) * S, y0 + S); g.stroke(); g.setLineDash([]);
    if (N.c) { const li = levelOf(N.aIn), lo = levelOf(N.aOut); gr += ((on ? -N.c.reduction : 0) - gr) * 0.3; g.fillStyle = '#f4ecdc'; g.beginPath(); g.arc(x0 + M(li.rms) * S, y0 + S - M(lo.rms) * S, 5, 0, 7); g.fill();
      const mx = x0 + S + 14, mw = w - mx - 8; drawMeter(g, mx, 22, mw, 12, li.peak, { label: 'Entrada' }); drawMeter(g, mx, 72, mw, 12, lo.peak, { label: 'Saída' });
      g.fillStyle = '#0a1825'; g.fillRect(mx, 124, mw, 12); g.fillStyle = '#f06a98'; g.fillRect(mx + mw - clamp(gr / 20, 0, 1) * mw, 124, clamp(gr / 20, 0, 1) * mw, 12); g.fillStyle = '#f4ecdc'; g.font = '600 11px Figtree, sans-serif'; g.fillText(`Redução: ${fmt(gr, 1)} dB`, mx + 4, 120); } });
  return wrap(stage(cv), toggle('Compressor ligado (desligue para comparar)', on, (v) => { on = v; upd(); }),
    slider('Limiar (threshold)', { min: -60, max: 0, value: P.th, unit: 'dB' }, (v) => { P.th = v; upd(); }), slider('Razão (ratio)', { min: 1, max: 20, step: 0.5, value: P.ratio, fmtv: (v) => `${fmt(v, 1)}:1` }, (v) => { P.ratio = v; upd(); }),
    slider('Ataque (attack)', { min: 0.001, max: 0.2, step: 0.001, value: P.att, fmtv: (v) => `${Math.round(v * 1000)} ms` }, (v) => { P.att = v; upd(); }), slider('Liberação (release)', { min: 0.03, max: 1, step: 0.01, value: P.rel, fmtv: (v) => `${Math.round(v * 1000)} ms` }, (v) => { P.rel = v; upd(); }),
    slider('Ganho de compensação (makeup)', { min: 0, max: 24, step: 0.5, value: 0, unit: 'dB' }, (v) => { P.makeup = v; upd(); }), hint('Acima do limiar, a cada “razão” dB que entram, só 1 dB sai. O medidor rosa mostra quanto o compressor está abaixando.'), r.row());
}

// ---------- jogo: quanta compressão? ----------
function jogoComp() {
  const OPT = [['Nenhuma', 1, 0, 0], ['Leve (2:1)', 2, -24, 3], ['Média (4:1)', 4, -30, 7], ['Pesada (10:1)', 10, -38, 13]];
  let target = null, score = 0, n = 0, locked = false; const N = {};
  const r = rig({ load: voiceBuffer, wire: (c, inp, out) => { N.c = c.createDynamicsCompressor(); N.c.knee.value = 4; N.c.attack.value = 0.004; N.c.release.value = 0.12; N.mk = c.createGain(); inp.connect(N.c); N.c.connect(N.mk); N.mk.connect(out); next(); } });
  const opts = h('div.quiz'), msg = h('p', { 'aria-live': 'polite', style: { minHeight: '2.6em' } }, 'Ouça a diferença entre as notas fortes e fracas. Quanto mais iguais, mais compressão.'), stat = h('span.pill', '0 de 0');
  function next() { locked = false; let t; do { t = Math.floor(Math.random() * OPT.length); } while (t === target); target = t; const [, ratio, th, mk] = OPT[t]; N.c.ratio.value = ratio; N.c.threshold.value = th; N.mk.gain.setTargetAtTime(db2g(mk), T(), 0.05); opts.replaceChildren(h('div.opts', OPT.map((o, i) => h('button.opt', { onclick: (e) => answer(i, e.currentTarget) }, o[0])))); }
  const answer = async (i, b) => { if (locked || target == null) return; locked = true; n++; const ok = i === target; if (ok) score++; b.classList.add(ok ? 'ok' : 'no'); msg.textContent = ok ? 'Certo!' : `Era “${OPT[target][0]}”. O volume foi compensado: preste atenção na dinâmica, não na altura do som.`; stat.textContent = `${score} de ${n}`; if (n % 8 === 0) await log('studio', { game: 'comp', ok: score, total: n }); setTimeout(() => { if (r.playing()) next(); else locked = false; }, ok ? 900 : 2600); };
  return wrap(h('div.row.between', h('span.pill', 'Jogo de ouvido'), stat), msg, opts, r.row());
}

// ---------- de-esser ----------
function deesser() {
  let th = -30, on = true, solo = false; const N = {};
  const r = rig({ load: voiceBuffer, wire: (c, inp, out) => { N.lo = c.createBiquadFilter(); N.lo.type = 'lowpass'; N.lo.frequency.value = 4500; N.lo2 = c.createBiquadFilter(); N.lo2.type = 'lowpass'; N.lo2.frequency.value = 4500; N.hi = c.createBiquadFilter(); N.hi.type = 'highpass'; N.hi.frequency.value = 4500; N.hi2 = c.createBiquadFilter(); N.hi2.type = 'highpass'; N.hi2.frequency.value = 4500;
    N.c = c.createDynamicsCompressor(); N.c.ratio.value = 12; N.c.attack.value = 0.001; N.c.release.value = 0.06; N.c.knee.value = 3; N.byp = c.createGain(); N.cmp = c.createGain(); N.loG = c.createGain(); N.an = analyser(c, 4096);
    inp.connect(N.lo); N.lo.connect(N.lo2); N.lo2.connect(N.loG); N.loG.connect(N.an); inp.connect(N.hi); N.hi.connect(N.hi2); N.hi2.connect(N.c); N.c.connect(N.cmp); N.cmp.connect(N.an); N.hi2.connect(N.byp); N.byp.connect(N.an); N.an.connect(out); upd(); } });
  const upd = () => { if (!N.c) return; N.c.threshold.value = th; N.cmp.gain.value = on ? 1 : 0; N.byp.gain.value = on ? 0 : 1; N.loG.gain.value = solo ? 0 : 1; };
  const cv = canvas(120); let gr = 0;
  loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); if (!N.an) return; drawSpectrum(g, N.an, 0, 0, w, hh - 26); g.fillStyle = 'rgba(240,106,152,.12)'; g.fillRect(fx(4500) * w, 0, w, hh - 26); gr += ((on ? -N.c.reduction : 0) - gr) * 0.3; g.fillStyle = '#0a1825'; g.fillRect(8, hh - 16, w - 16, 10); g.fillStyle = '#f06a98'; g.fillRect(8, hh - 16, clamp(gr / 18, 0, 1) * (w - 16), 10); g.fillStyle = '#f4ecdc'; g.font = '11px Figtree, sans-serif'; g.fillText(`redução nos “s”: ${fmt(gr, 1)} dB`, 10, hh - 20); });
  return wrap(stage(cv), toggle('De-esser ligado', on, (v) => { on = v; upd(); }), slider('Limiar (threshold)', { min: -60, max: 0, value: th, unit: 'dB' }, (v) => { th = v; upd(); }), toggle('Ouvir só a faixa dos “s” (acima de 4,5 kHz)', solo, (v) => { solo = v; upd(); }), hint('O de-esser é um compressor que só olha para a faixa da sibilância (área rosa). Ele abaixa os “s” e deixa o resto da voz em paz. Em excesso, a voz fica com língua presa.'), r.row());
}

// ---------- reverb e delay por envio ----------
function envio() {
  const P = { rev: -12, time: 1.6, pre: 0.02, dly: -60, dt: 0.33, fb: 0.3 }; const N = {}, IR = {};
  const r = rig({ load: voiceBuffer, wire: (c, inp, out) => { N.sR = c.createGain(); N.pd = c.createDelay(0.2); N.conv = c.createConvolver(); N.hp = c.createBiquadFilter(); N.hp.type = 'highpass'; N.hp.frequency.value = 250; N.sD = c.createGain(); N.d = c.createDelay(1.5); N.fb = c.createGain(); N.lp = c.createBiquadFilter(); N.lp.type = 'lowpass'; N.lp.frequency.value = 3500;
    inp.connect(out); inp.connect(N.sR); N.sR.connect(N.pd); N.pd.connect(N.conv); N.conv.connect(N.hp); N.hp.connect(out); inp.connect(N.sD); N.sD.connect(N.d); N.d.connect(N.lp); N.lp.connect(N.fb); N.fb.connect(N.d); N.lp.connect(out); upd(); } });
  const upd = () => { if (!N.sR) return; const c = getCtx(), k = P.time.toFixed(1); if (!IR[k]) IR[k] = makeImpulse(c, P.time, 2.4, 5); if (N.conv.buffer !== IR[k]) N.conv.buffer = IR[k]; N.sR.gain.setTargetAtTime(P.rev <= -60 ? 0 : db2g(P.rev), T(), 0.02); N.pd.delayTime.setTargetAtTime(P.pre, T(), 0.02); N.sD.gain.setTargetAtTime(P.dly <= -60 ? 0 : db2g(P.dly), T(), 0.02); N.d.delayTime.setTargetAtTime(P.dt, T(), 0.05); N.fb.gain.setTargetAtTime(P.fb, T(), 0.02); };
  return wrap(hint('A voz seca segue direto. Uma cópia vai por um envio (send) para o reverb, e a volta do efeito se soma à mixagem. Um só reverb serve a todas as vozes: elas parecem estar na mesma sala.'),
    h('div.eyebrow', 'Reverb'), slider('Envio para o reverb', { min: -60, max: 0, value: P.rev, unit: 'dB' }, (v) => { P.rev = v; upd(); }), slider('Tempo do reverb', { min: 0.4, max: 4, step: 0.2, value: P.time, unit: 's' }, (v) => { P.time = v; upd(); }), slider('Pré-atraso (pre-delay)', { min: 0, max: 0.12, step: 0.005, value: P.pre, fmtv: (v) => `${Math.round(v * 1000)} ms` }, (v) => { P.pre = v; upd(); }),
    h('div.eyebrow', 'Delay'), slider('Envio para o delay', { min: -60, max: 0, value: P.dly, unit: 'dB' }, (v) => { P.dly = v; upd(); }), slider('Tempo do delay', { min: 0.08, max: 0.8, step: 0.01, value: P.dt, fmtv: (v) => `${Math.round(v * 1000)} ms` }, (v) => { P.dt = v; upd(); }), slider('Repetições (feedback)', { min: 0, max: 0.75, step: 0.05, value: P.fb, fmtv: (v) => `${Math.round(v * 100)}%` }, (v) => { P.fb = v; upd(); }), r.row());
}

// ---------- automação de volume ----------
function automacao() {
  const PTS = 32, curve = new Float32Array(PTS).fill(0.7); const N = {}; let dur = 10, started = 0;
  const r = rig({ load: voiceBuffer, wire: (c, inp, out, bufs) => { N.g = c.createGain(); inp.connect(N.g); N.g.connect(out); dur = bufs[0].duration; } });
  const cv = canvas(160); cv.style.touchAction = 'none';
  const sched = () => { if (!N.g || !r.playing()) return; const c = getCtx(); N.g.gain.cancelScheduledValues(c.currentTime); started = c.currentTime + 0.03; for (let k = 0; k < 6; k++) for (let i = 0; i < PTS; i++) N.g.gain.linearRampToValueAtTime(curve[i] * 1.4, started + k * dur + ((i + 0.5) / PTS) * dur); };
  const pt = (e) => { const b = cv.getBoundingClientRect(); const i = clamp(Math.floor(((e.clientX - b.left) / b.width) * PTS), 0, PTS - 1); curve[i] = clamp(1 - (e.clientY - b.top) / b.height, 0, 1); if (i > 0 && e.movementX > 6) curve[i - 1] = (curve[i - 1] + curve[i]) / 2; };
  cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); pt(e); }); cv.addEventListener('pointermove', (e) => { if (e.buttons || e.pressure > 0) pt(e); }); cv.addEventListener('pointerup', sched);
  loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); const b = r.buffers(); if (b) { const x = b[0].getChannelData(0), st = Math.floor(x.length / w); g.fillStyle = 'rgba(92,200,232,.35)'; for (let px = 0; px < w; px++) { let m = 0; for (let k = 0; k < st; k += 16) { const v = Math.abs(x[px * st + k]); if (v > m) m = v; } const a = m * curve[Math.min(PTS - 1, Math.floor((px / w) * PTS))] * 1.4 * hh * 0.9; g.fillRect(px, hh / 2 - a / 2, 1, a); } }
    g.strokeStyle = '#ffd166'; g.lineWidth = 2.5; g.beginPath(); for (let i = 0; i < PTS; i++) { const x = ((i + 0.5) / PTS) * w, y = (1 - curve[i]) * hh; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    if (r.playing() && started) { const p = ((getCtx().currentTime - started) % dur) / dur; g.fillStyle = '#f4ecdc'; g.fillRect(p * w, 0, 2, hh); } });
  const start = r.btn.onclick; r.btn.onclick = async () => { const was = r.playing(); await start(); if (!was) sched(); };
  return wrap(hint('Desenhe com o dedo a linha amarela: é o fader se mexendo sozinho ao longo da música. Levante o volume nas notas fracas, abaixe nas fortes.'), h('div.stage', { role: 'img', 'aria-label': 'Curva de automação de volume: desenhe com o dedo' }, cv), h('div.row', r.btn, h('button.btn', { onclick: () => { curve.fill(0.7); sched(); } }, 'Zerar a curva'), r.status));
}

// ---------- A/B com volume igualado ----------
function ab() {
  let which = 'A', match = false, gB = 0; const N = {};
  const r = rig({ load: async () => { const b = await mixBuffer(); const ch = [b.getChannelData(0), b.getChannelData(1)]; const l0 = measureLoudness(ch, b.sampleRate).integrated; const lim = limit(ch, b.sampleRate, { gainDb: 7, ceilingDb: -1 }); const l1 = measureLoudness(lim.channels, b.sampleRate).integrated; gB = l0 - l1; N.info = { l0, l1 }; return [b, bufferFrom(lim.channels, b.sampleRate)]; }, wire: (c, inps, out) => { N.a = c.createGain(); N.b = c.createGain(); N.sm = c.createBiquadFilter(); N.sm.type = 'highshelf'; N.sm.frequency.value = 7000; N.sm.gain.value = 2.5; inps[0].connect(N.a); inps[1].connect(N.sm); N.sm.connect(N.b); N.a.connect(out); N.b.connect(out); upd(); } });
  const info = h('p.dim', 'A é a mixagem original. B passou por um limiter e ganhou um pouco de brilho, e ficou mais alta.');
  const upd = () => { if (!N.a) return; N.a.gain.setTargetAtTime(which === 'A' ? 1 : 0, T(), 0.01); N.b.gain.setTargetAtTime(which === 'B' ? db2g(match ? gB : 0) : 0, T(), 0.01); if (N.info) info.textContent = `A: ${fmt(N.info.l0, 1)} LUFS. B: ${fmt(N.info.l1, 1)} LUFS${match ? `, abaixada ${fmt(-gB, 1)} dB para empatar` : ''}. ${match ? 'Com o volume igualado, julgue de novo: B ainda é melhor, ou só era mais alta?' : 'Sem igualar, o ouvido quase sempre prefere a mais alta.'}`; };
  const start = r.btn.onclick; r.btn.onclick = async () => { await start(); upd(); };
  return wrap(seg([{ v: 'A', label: 'A · original' }, { v: 'B', label: 'B · processada' }], which, (v) => { which = v; upd(); }, { label: 'Versão' }), toggle('Igualar o volume (loudness match)', match, (v) => { match = v; upd(); }), info, hint('Vale para comparar a sua mixagem com uma faixa de referência: iguale o volume antes de comparar o timbre.'), r.row());
}

// ---------- vozes empilhadas ----------
function empilhadas() {
  let hp = false, bus = false, rev = false; const N = { hp: [] };
  const r = rig({ load: () => stems('mare'), wire: (c, inps, out) => { N.sum = c.createGain(); N.sum.gain.value = 0.5; N.comp = c.createDynamicsCompressor(); N.comp.threshold.value = -26; N.comp.ratio.value = 3; N.comp.attack.value = 0.02; N.comp.release.value = 0.25; N.cw = c.createGain(); N.cd = c.createGain(); N.conv = c.createConvolver(); N.conv.buffer = makeImpulse(c, 2.2, 2.4, 9); N.rs = c.createGain(); N.an = analyser(c, 4096);
    inps.forEach((inp, i) => { const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 20; const p = panner(c); if (p.pan) p.pan.value = i === 0 ? 0 : ((i % 2 ? -1 : 1) * Math.ceil(i / 2)) / 3 * 0.8; inp.connect(f); f.connect(p); p.connect(N.sum); N.hp.push(f); });
    N.sum.connect(N.comp); N.comp.connect(N.cw); N.sum.connect(N.cd); N.cw.connect(N.an); N.cd.connect(N.an); N.an.connect(out); N.an.connect(N.rs); N.rs.connect(N.conv); N.conv.connect(out); upd(); } });
  const upd = () => { if (!N.sum) return; N.hp.forEach((f, i) => f.frequency.setTargetAtTime(hp && i > 0 ? 140 + i * 25 : 20, T(), 0.03)); N.cw.gain.value = bus ? 1.5 : 0; N.cd.gain.value = bus ? 0 : 1; N.rs.gain.setTargetAtTime(rev ? 0.3 : 0, T(), 0.03); };
  const cv = canvas(120); loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); if (N.an) drawSpectrum(g, N.an, 0, 0, w, hh, '#b79cf0'); });
  return wrap(stage(cv), toggle('Corte de graves nas vozes de cima (o grave fica só com o baixo)', hp, (v) => { hp = v; upd(); }), toggle('Comprimir o grupo inteiro (bus compression)', bus, (v) => { bus = v; upd(); }), toggle('Um só reverb para todas as vozes', rev, (v) => { rev = v; upd(); }),
    hint('Seis vozes somadas acumulam graves e médio-graves: tudo embola perto de 200 a 300 Hz. Limpar cada voz, tratar o grupo como um instrumento e usar o mesmo ambiente é o que “cola” o empilhamento.'), r.row());
}

// ---------- saturação ----------
function saturacao() {
  let drive = 0, src = 'voz'; const N = {};
  const mk = (d) => { const n = 513, c = new Float32Array(n), k = 1 + d * 0.6; for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(x * k) / Math.tanh(k); } return c; };
  const r = rig({ load: voiceBuffer, wire: (c, inp, out) => { N.osc = c.createOscillator(); N.osc.frequency.value = 220; N.og = c.createGain(); N.og.gain.value = 0; N.osc.connect(N.og); N.osc.start(); N.vg = c.createGain(); N.pre = c.createGain(); N.ws = c.createWaveShaper(); N.ws.oversample = '4x'; N.post = c.createGain(); N.an = analyser(c, 8192); N.an.smoothingTimeConstant = 0.85;
    inp.connect(N.vg); N.vg.connect(N.pre); N.og.connect(N.pre); N.pre.connect(N.ws); N.ws.connect(N.post); N.post.connect(N.an); N.an.connect(out); upd(); } });
  const upd = () => { if (!N.ws) return; N.ws.curve = mk(drive); N.pre.gain.value = 1.4; N.post.gain.value = 0.6 / (1 + drive * 0.03); N.vg.gain.value = src === 'voz' ? 1 : 0; N.og.gain.setTargetAtTime(src === 'seno' && r.playing() ? 0.5 : 0, T(), 0.02); };
  const cv = canvas(150); loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); if (N.an) { drawSpectrum(g, N.an, 0, 0, w, hh, '#ff8f66'); if (N.og) N.og.gain.value = src === 'seno' && r.playing() ? 0.5 : 0; }
    g.strokeStyle = '#ffd166'; g.lineWidth = 2; g.beginPath(); const c = mk(drive), S = 54; for (let i = 0; i < 513; i += 8) { const x = w - S - 8 + (i / 512) * S, y = 8 + S - ((c[i] + 1) / 2) * S; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.strokeStyle = 'rgba(244,236,220,.3)'; g.strokeRect(w - S - 8, 8, S, S); });
  return wrap(stage(cv), seg([{ v: 'voz', label: 'Voz' }, { v: 'seno', label: 'Tom puro (220 Hz)' }], src, (v) => { src = v; upd(); }, { label: 'Fonte' }), slider('Saturação (drive)', { min: 0, max: 30, step: 0.5, value: 0 }, (v) => { drive = v; upd(); }), hint('Com o tom puro, veja os harmônicos nascendo no espectro: a saturação arredonda os picos e cria frequências novas. Pouco dá calor e densidade; muito vira distorção.'), r.row());
}

// ---------- imagem estéreo (mid/side) ----------
function estereo() {
  let width = 1; const N = {}; let corr = 1;
  const r = rig({ load: mixBuffer, wire: (c, inp, out) => { const sp = c.createChannelSplitter(2), mg = c.createChannelMerger(2); N.mid = c.createGain(); N.sL = c.createGain(); N.sR = c.createGain(); N.inv = c.createGain(); N.inv.gain.value = -1; N.aL = analyser(c, 1024); N.aR = analyser(c, 1024);
    inp.connect(sp); const L = c.createGain(), R = c.createGain(); sp.connect(L, 0); sp.connect(R, 1); L.connect(N.mid); R.connect(N.mid); N.mid.gain.value = 0.5; // M = (L+R)/2
    const side = c.createGain(); side.gain.value = 0.5; L.connect(side); R.connect(N.inv); N.inv.connect(side); // S = (L−R)/2
    side.connect(N.sL); side.connect(N.sR); N.mid.connect(mg, 0, 0); N.mid.connect(mg, 0, 1); N.sL.connect(mg, 0, 0); N.sR.connect(mg, 0, 1); mg.connect(out); const s2 = c.createChannelSplitter(2); mg.connect(s2); s2.connect(N.aL, 0); s2.connect(N.aR, 1); upd(); } });
  const upd = () => { if (!N.sL) return; N.sL.gain.setTargetAtTime(width, T(), 0.02); N.sR.gain.setTargetAtTime(-width, T(), 0.02); };
  const cv = canvas(170), a = new Float32Array(1024), b = new Float32Array(1024);
  loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.fillStyle = 'rgba(10,24,37,.35)'; g.fillRect(0, 0, w, hh); if (!N.aL) return; N.aL.getFloatTimeDomainData(a); N.aR.getFloatTimeDomainData(b); let sab = 0, sa = 0, sb = 0; g.fillStyle = '#5cc8e8';
    for (let i = 0; i < 1024; i += 2) { const m = (a[i] + b[i]) * 0.5, s = (b[i] - a[i]) * 0.5; g.fillRect(w / 2 + s * w * 0.9, (hh - 30) / 2 - m * hh * 0.8, 2, 2); sab += a[i] * b[i]; sa += a[i] * a[i]; sb += b[i] * b[i]; }
    corr += ((sab / (Math.sqrt(sa * sb) + 1e-9)) - corr) * 0.1; g.fillStyle = '#0e2030'; g.fillRect(0, hh - 28, w, 28); g.fillStyle = '#0a1825'; g.fillRect(8, hh - 16, w - 16, 10); g.fillStyle = corr < 0 ? '#f06a98' : '#58d6a0'; const cx = 8 + (w - 16) / 2; g.fillRect(Math.min(cx, cx + corr * (w - 16) / 2), hh - 16, Math.abs(corr) * (w - 16) / 2, 10); g.fillStyle = '#f4ecdc'; g.font = '11px Figtree, sans-serif'; g.fillText(`correlação: ${fmt(corr, 2)}  (−1 = cancela em mono · +1 = mono)`, 8, hh - 19); });
  return wrap(stage(cv), slider('Largura (width)', { min: 0, max: 2, step: 0.05, value: 1, fmtv: (v) => `${Math.round(v * 100)}%` }, (v) => { width = v; upd(); }), hint('O sinal é separado em meio (mid: o que é igual nos dois lados) e lados (side: o que é diferente). Aumentar os lados alarga a imagem. Se a correlação ficar negativa, o som enfraquece em mono.'), r.row());
}

// ---------- limiter com LUFS e true peak ----------
function limiter() {
  let gain = 0, ceil = -1, match = false, orig = null, res = null, timer = 0;
  const r = rig({ load: mixBuffer, wire: (c, inp, out) => { N.g = c.createGain(); inp.connect(N.g); N.g.connect(out); orig = r.buffers()[0]; } }); const N = {};
  const stats = h('div.stats'), note = h('p.small', { 'aria-live': 'polite' }), cv = canvas(120);
  const st = (v, l) => h('div.stat', h('b', v), h('span', l));
  const process = () => {
    if (!orig) return; const ch = [orig.getChannelData(0), orig.getChannelData(1)], fs = orig.sampleRate;
    const before = res && res.before ? res.before : { l: measureLoudness(ch, fs), tp: truePeak(ch) };
    const lim = limit(ch, fs, { gainDb: gain, ceilingDb: ceil }); const l = measureLoudness(lim.channels, fs), tp = truePeak(lim.channels), sp = samplePeak(lim.channels);
    res = { before, lim, l, tp, sp };
    stats.replaceChildren(st(`${fmt(l.integrated, 1)}`, 'LUFS integrado'), st(`${fmt(tp, 1)}`, 'dBTP (true peak)'), st(`${fmt(tp - l.integrated, 1)}`, 'pico − volume (PLR)'), st(`${fmt(l.shortMax, 1)}`, 'LUFS curto máx.'), st(`${fmt(lim.maxReduction, 1)} dB`, 'redução máxima'), st(`${fmt(before.l.integrated, 1)}`, 'LUFS antes'));
    note.textContent = lim.maxReduction < 0.1 ? 'O limiter ainda não está agindo: o pico não chegou ao teto.' : lim.maxReduction < 4 ? 'Limitação leve: mais volume, dinâmica quase intacta.' : lim.maxReduction < 9 ? 'Limitação forte: o volume sobe, mas os picos estão sendo achatados. Compare com o volume igualado.' : 'Esmagado: alto, sem dinâmica e com distorção. As plataformas vão abaixar o volume de qualquer jeito.';
    const outCh = match ? lim.channels.map((x) => applyGain(x, before.l.integrated - l.integrated)) : lim.channels; r.swap(bufferFrom(outCh, fs));
  };
  const later = () => { clearTimeout(timer); timer = setTimeout(process, 180); };
  loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); if (!orig) { g.fillStyle = 'rgba(244,236,220,.4)'; g.font = '12px Figtree, sans-serif'; g.fillText('Toque em “Tocar” para carregar a mixagem.', 10, hh / 2); return; }
    const draw = (x, col, k) => { const stp = Math.floor(x.length / w); g.fillStyle = col; for (let px = 0; px < w; px++) { let m = 0; for (let j = 0; j < stp; j += 24) { const v = Math.abs(x[px * stp + j]); if (v > m) m = v; } const a = Math.min(1, m * k) * hh; g.fillRect(px, hh / 2 - a / 2, 1, a); } };
    draw(orig.getChannelData(0), 'rgba(92,200,232,.35)', db2g(gain)); if (res) draw(res.lim.channels[0], '#ffd166', 1); const cy = (1 - db2g(ceil)) * hh / 2; g.fillStyle = '#f06a98'; g.fillRect(0, cy, w, 1); g.fillRect(0, hh - cy, w, 1); });
  const start = r.btn.onclick; r.btn.onclick = async () => { const was = r.playing(); await start(); if (!was) process(); };
  return wrap(stage(cv), h('div.legend', h('span', h('i', { css: { '--c': '#5cc8e8' } }), 'entrada com ganho'), h('span', h('i', { css: { '--c': '#ffd166' } }), 'saída do limiter'), h('span', h('i', { css: { '--c': '#f06a98' } }), 'teto')), stats, note,
    slider('Ganho de entrada', { min: 0, max: 20, step: 0.5, value: 0, unit: 'dB' }, (v) => { gain = v; later(); }), slider('Teto (ceiling)', { min: -3, max: 0, step: 0.1, value: ceil, unit: 'dBTP' }, (v) => { ceil = v; later(); }), toggle('Igualar o volume com o original', match, (v) => { match = v; later(); }),
    hint('Medição conforme ITU-R BS.1770, com true peak por superamostragem de 4×. O cálculo é feito sobre o áudio inteiro, por isso leva um instante depois de cada ajuste.'), r.row());
}

export const SIMS2 = { pan, eq, 'eq-mix': () => eq({ source: 'mix' }), 'jogo-eq': jogoEq, compressor, 'jogo-comp': jogoComp, deesser, envio, automacao, ab, empilhadas, saturacao, estereo, limiter };
