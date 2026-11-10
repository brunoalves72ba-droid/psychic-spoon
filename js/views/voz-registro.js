// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Medidor de registro vocal: extensão, tessitura, classificação, registro em tempo real, passagens, vibrato e fonação.
import { h, top, seg, canvas, loop, fmt, toast, wake } from '../core/ui.js';
import { kv, log, prefs, lastEvent } from '../core/store.js';
import { pitchToMidi } from '../core/widgets.js';
import { TASKS, taskUI } from '../core/voice-tasks.js';
import { micGate, onPitch } from '../audio/mic.js';
import { estimateRegister } from '../audio/voice-analysis.js';
import { noteName, VOICE_COLORS } from '../music/theory.js';

export const DISCLAIMER = 'Estimativa acústica feita pelo microfone do aparelho. Não é exame nem diagnóstico: quem avalia registro e saúde vocal é um profissional.';

export default async function registro(el, [tabArg]) {
  let tab = tabArg || 'extensao', current = null, offLive = null;
  const body = h('div.col');
  const voice = await kv.get('voice', null);
  const saveRange = async (r) => { await log('range', { lo: r.lo, hi: r.hi }); await log('tessitura', { lo: r.tess.lo, hi: r.tess.hi, center: Math.round(r.tess.center * 10) / 10, hist: r.hist }); await kv.set('voice', { lo: r.lo, hi: r.hi, tess: [r.tess.lo, r.tess.hi], types: r.types }); toast('Extensão e tessitura salvas na Evolução.'); };
  const TABS = {
    extensao: () => {
      const res = h('div.col');
      const t = taskUI(TASKS.extensao(), { onResult: (r) => { if (!r) return; res.replaceChildren(
        h('div.stats', h('div.stat', h('b', `${noteName(r.lo)}–${noteName(r.hi)}`), h('span', `extensão (${r.hi - r.lo} semitons)`)), h('div.stat', h('b', `${noteName(r.tess.lo)}–${noteName(r.tess.hi)}`), h('span', 'tessitura (faixa estável)')), h('div.stat', h('b', r.types[0] || '—'), h('span', r.types[1] ? `ou ${r.types[1].toLowerCase()}` : 'classificação aproximada'))),
        h('p.small.muted', 'A classificação é aproximada: ela considera só a extensão e a tessitura. O timbre e as notas de passagem também contam, e só um professor de canto fecha essa questão.'),
        h('button.btn.primary', { onclick: () => saveRange(r) }, 'Salvar esta medida')); } });
      return [t, h('div.col', t.el, res, h('div.legend', h('span', h('i', { css: { '--c': '#5cc8e8' } }), 'pouco tempo'), h('span', h('i', { css: { '--c': '#ff8c66' } }), 'muito tempo (voz estável)'), h('span', h('i', { css: { '--c': '#ffd166' } }), 'tessitura')))];
    },
    registro: () => {
      const cv = canvas(150), lab = h('div.big', '—'), conf = h('div.meter', h('i')), vals = h('p.small.muted', 'Ligue o microfone e cante.'), calInfo = h('p.small');
      let cal = null, pas = null, last = null, hist = [];
      const loadCal = async () => { cal = await kv.get('regcal', null); const p = await lastEvent('passaggio'); pas = p && p.data.points.length ? p.data.points[0].m : null; calInfo.textContent = cal && cal.chest && cal.head ? `Calibrado com as suas amostras (nota ${noteName(Math.round(cal.chest.m))}).${pas ? ` Passagem medida: ${noteName(pas)}.` : ''}` : 'Ainda sem calibração: usando valores genéricos, com confiança menor. Grave as duas amostras abaixo.'; };
      const NAMES = { peito: 'Peito', misto: 'Misto', 'cabeça': 'Cabeça / falsete' }, COL = { peito: VOICE_COLORS[4], misto: VOICE_COLORS[5], 'cabeça': VOICE_COLORS[1] };
      loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh);
        const zones = [['Peito', 0, 0.36, VOICE_COLORS[4]], ['Misto', 0.36, 0.64, VOICE_COLORS[5]], ['Cabeça', 0.64, 1, VOICE_COLORS[1]]];
        for (const [n, a, b, c] of zones) { g.fillStyle = c; g.globalAlpha = last && last.p >= a && last.p <= b ? 0.5 : 0.16; g.fillRect(a * w, 30, (b - a) * w - 2, hh - 60); g.globalAlpha = 1; g.fillStyle = '#f4ecdc'; g.font = '600 12px Figtree, sans-serif'; g.fillText(n, a * w + 8, 22); }
        hist.forEach((p, i) => { g.fillStyle = `rgba(244,236,220,${(i / hist.length) * 0.5})`; g.beginPath(); g.arc(p * w, hh / 2, 4, 0, 7); g.fill(); });
        if (last) { g.fillStyle = '#f4ecdc'; g.beginPath(); g.arc(last.p * w, hh / 2, 10, 0, 7); g.fill(); } });
      const gate = micGate(() => { wake.on(); offLive = onPitch((p) => {
        const m = pitchToMidi(p, prefs.get('a4') || 440, 0.85, 0.006);
        if (m == null) { last = null; lab.textContent = '—'; conf.firstChild.style.width = '0%'; return; }
        const r = estimateRegister({ m, h1h2: p.h1h2, tilt: p.tilt, hf: p.hf }, cal, pas); if (!r) return;
        last = last ? { ...r, p: last.p + (r.p - last.p) * 0.25 } : r; hist.push(last.p); if (hist.length > 40) hist.shift();
        lab.textContent = NAMES[r.reg]; lab.style.color = COL[r.reg]; conf.firstChild.style.width = Math.round(r.conf * 100) + '%';
        vals.textContent = `${noteName(Math.round(m))} · confiança ${Math.round(r.conf * 100)}% · H1−H2 ${fmt(p.h1h2, 1)} dB · inclinação ${fmt(p.tilt, 1)} dB/8ª · acima de 2 kHz ${fmt(p.hf, 1)} dB`;
      }, { spec: true }); });
      const note = voice ? Math.round(voice.lo + (voice.hi - voice.lo) * 0.62) : 62;
      const calBox = h('div.col');
      const mkCal = () => { const part = {}; const a = taskUI(TASKS.calibra('chest', note), { onResult: (r) => { if (r) { part.chest = r; save(); } } }), b = taskUI(TASKS.calibra('head', note), { onResult: (r) => { if (r) { part.head = r; save(); } } });
        const save = async () => { if (!part.chest || !part.head) return; await kv.set('regcal', part); await log('register', { chest: part.chest, head: part.head }); await loadCal(); toast('Calibração salva.'); };
        calBox.replaceChildren(a.el, b.el); return { cancel() { a.cancel(); b.cancel(); } }; };
      const c = mkCal(); loadCal();
      return [{ cancel() { c.cancel(); offLive && offLive(); wake.off(); } }, h('div.col', h('div.banner.warn', h('span', 'ⓘ'), h('span', DISCLAIMER)), h('div.row.between', lab, h('span.small.muted', 'registro agora')), h('div.stage', cv), h('label.field', 'Confiança da estimativa', conf), vals, gate, calInfo,
        h('h3', 'Calibrar com a sua voz'), h('p.small.dim', 'Cante a mesma nota de dois jeitos. O app aprende como é o seu peito e a sua cabeça nessa região e passa a comparar com isso.'), calBox,
        h('p.small.muted', 'Como funciona: a voz de peito tem harmônicos fortes (H1−H2 pequeno, mais energia acima de 2 kHz). A de cabeça concentra a energia no primeiro harmônico. A altura em relação à sua passagem entra como segundo indício.'))];
    },
    passagens: () => { const res = h('div');
      const t = taskUI(TASKS.sirene(), { onResult: (r) => { if (!r) return; res.replaceChildren(h('div.row.wrap', h('button.btn.primary', { onclick: async () => { await log('passaggio', { points: r.points, lo: r.lo, hi: r.hi }); toast('Passagens salvas.'); } }, 'Salvar esta medida')), h('p.small.muted', 'Faça a sirene duas ou três vezes: se a marca aparece sempre perto da mesma nota, é a sua passagem. ' + DISCLAIMER)); } });
      return [t, h('div.col', t.el, res)]; },
    vibrato: () => { const res = h('div');
      const note = voice ? Math.round((voice.lo + voice.hi) / 2) : null;
      const t = taskUI(TASKS.sustentada(note), { onResult: (r) => { if (!r) return; res.replaceChildren(h('div.stats', h('div.stat', h('b', r.hasVibrato ? `${fmt(r.rate, 1)} Hz` : '—'), h('span', 'taxa do vibrato')), h('div.stat', h('b', r.hasVibrato ? `±${fmt(r.extent)}` : '—'), h('span', 'extensão (cents)')), h('div.stat', h('b', fmt(r.stability, 1)), h('span', 'estabilidade (cents)'))), h('p.small.muted', 'Referência: vibrato natural costuma ficar entre 5 e 7 Hz. Em grupo vocal, nota reta ou vibrato pequeno funde melhor.'), h('button.btn.primary', { onclick: async () => { await log('vibrato', { rate: Math.round(r.rate * 10) / 10, extent: Math.round(r.extent), stability: Math.round(r.stability * 10) / 10, has: r.hasVibrato }); toast('Vibrato e estabilidade salvos.'); } }, 'Salvar esta medida')); } });
      return [t, h('div.col', t.el, res)]; },
    fonacao: () => { const t = taskUI(TASKS.fonacao(), { onResult: async (r) => { if (r) { await log('mpt', { seconds: r.seconds }); toast('Tempo de fonação salvo.'); } } });
      return [t, h('div.col', t.el, h('p.small.muted', 'Faça três tentativas com descanso entre elas e considere a melhor. Não force até ficar sem ar.'))]; },
  };
  const show = (k) => { if (current) current.cancel(); tab = k; const [task, node] = TABS[k](); current = task; body.replaceChildren(node); };
  show(tab);
  el.append(top('Medidor de registro', '#/voz'),
    seg([{ v: 'extensao', label: 'Extensão' }, { v: 'registro', label: 'Registro' }, { v: 'passagens', label: 'Passagens' }, { v: 'vibrato', label: 'Vibrato' }, { v: 'fonacao', label: 'Fonação' }], tab, show, { label: 'Medida' }),
    h('section.card', body), h('a.btn.block', { href: '#/voz/retrato' }, 'Fazer o Retrato vocal completo'));
  return () => { current && current.cancel(); offLive && offLive(); };
}
