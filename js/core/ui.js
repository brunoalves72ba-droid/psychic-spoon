// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Utilitários de interface: criação de DOM, canvas, avisos, perguntas.

const SVGNS = 'http://www.w3.org/2000/svg';

function apply(el, props, kids) {
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.setAttribute('class', v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'css') for (const [p, val] of Object.entries(v)) el.style.setProperty(p, val);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'data') Object.assign(el.dataset, v);
    else if (k in el && !(el instanceof SVGElement) && k !== 'list' && k !== 'form') { try { el[k] = v; } catch { el.setAttribute(k, v); } }
    else el.setAttribute(k, v === true ? '' : v);
  }
  add(el, kids);
  return el;
}
function add(el, kids) {
  for (const k of kids) {
    if (k == null || k === false) continue;
    if (Array.isArray(k)) add(el, k);
    else el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}
function make(spec, ns) {
  const m = spec.match(/^([a-z0-9]+)?(#[\w-]+)?((?:\.[\w-]+)*)$/i);
  const tag = (m && m[1]) || 'div';
  const el = ns ? document.createElementNS(ns, tag) : document.createElement(tag);
  if (m && m[2]) el.id = m[2].slice(1);
  if (m && m[3]) el.setAttribute('class', m[3].slice(1).replace(/\./g, ' '));
  return el;
}
/** h('div.card', {onclick}, filhos...) */
export function h(spec, props, ...kids) {
  if (props instanceof Node || typeof props === 'string' || typeof props === 'number' || Array.isArray(props)) { kids.unshift(props); props = null; }
  return apply(make(spec), props, kids);
}
export function s(spec, props, ...kids) {
  if (props instanceof Node || typeof props === 'string' || Array.isArray(props)) { kids.unshift(props); props = null; }
  return apply(make(spec, SVGNS), props, kids);
}
export const clear = (el) => { while (el.firstChild) el.firstChild.remove(); return el; };

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const fmt = (x, d = 0) => Number(x).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
export const dayKey = (d = new Date()) => { const t = new Date(d); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
export const fmtDate = (ts) => new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
export const fmtDur = (sec) => { sec = Math.max(0, Math.round(sec)); const m = Math.floor(sec / 60), s2 = sec % 60; return `${m}:${String(s2).padStart(2, '0')}`; };

/** Cabeçalho de página com botão de voltar. */
export function top(title, back, extra) {
  return h('header.top',
    back ? h('a.back', { href: back, 'aria-label': 'Voltar' }, s('svg', { viewBox: '0 0 24 24' }, s('path', { d: 'M15 5l-7 7 7 7' }))) : null,
    h('h1', title), extra || null);
}

export function toast(msg, action) {
  const box = document.getElementById('toasts');
  if (!box) return;
  const t = h('div.toast', msg);
  if (action) t.append(h('button', { onclick: () => { action.fn(); t.remove(); } }, action.label));
  box.append(t);
  setTimeout(() => t.remove(), action ? 9000 : 3200);
}

/** Folha modal simples. Retorna função para fechar. */
export function sheet(content, { onClose } = {}) {
  const bg = h('div.sheet-bg', { role: 'dialog', 'aria-modal': 'true' });
  const box = h('div.sheet', content);
  bg.append(box);
  const close = () => { bg.remove(); document.removeEventListener('keydown', esc); onClose && onClose(); };
  const esc = (e) => { if (e.key === 'Escape') close(); };
  bg.addEventListener('click', (e) => { if (e.target === bg) close(); });
  document.addEventListener('keydown', esc);
  document.body.append(bg);
  const f = box.querySelector('button, a, input, select'); f && f.focus();
  return close;
}
export function confirmSheet(text, yes = 'Confirmar') {
  return new Promise((res) => {
    let done = false;
    const close = sheet([
      h('p', text),
      h('div.row', h('button.btn.grow', { onclick: () => { done = true; close(); res(false); } }, 'Cancelar'),
        h('button.btn.primary.grow', { onclick: () => { done = true; close(); res(true); } }, yes)),
    ], { onClose: () => { if (!done) res(false); } });
  });
}

/** Canvas que acompanha o tamanho CSS e o devicePixelRatio. */
export function canvas(height, cls) {
  const c = h('canvas', { class: cls || '', style: { height: height + 'px', width: '100%' } });
  c._fit = () => {
    const r = c.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width * dpr)), hh = Math.max(1, Math.round(r.height * dpr));
    if (c.width !== w || c.height !== hh) { c.width = w; c.height = hh; }
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { g, w: r.width, h: r.height, dpr };
  };
  return c;
}

/** Laço de animação que para sozinho quando o elemento sai da tela. */
export function loop(el, fn) {
  let raf = 0, alive = true, seen = false, t0 = performance.now();
  const tick = (t) => {
    if (!alive) return;
    if (!el.isConnected) { if (seen) { alive = false; return; } raf = requestAnimationFrame(tick); return; }
    seen = true;
    fn((t - t0) / 1000, t);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => { alive = false; cancelAnimationFrame(raf); };
}

/** Controle segmentado. opts: [{v,label}] ou strings. */
export function seg(opts, value, onChange, { wrap = false, label } = {}) {
  const box = h('div.seg' + (wrap ? '.wrap' : ''), { role: 'group', 'aria-label': label || 'Opções' });
  const items = opts.map((o) => (typeof o === 'object' ? o : { v: o, label: String(o) }));
  const set = (v, fire) => {
    value = v;
    [...box.children].forEach((b, i) => b.setAttribute('aria-pressed', String(items[i].v === v)));
    if (fire) onChange(v);
  };
  for (const it of items) box.append(h('button.chip', { type: 'button', onclick: () => set(it.v, true) }, it.label));
  set(value, false);
  box.set = (v) => set(v, false);
  box.get = () => value;
  return box;
}

export function slider(label, { min, max, step = 1, value, unit = '', fmtv }, onInput) {
  const out = h('span.val');
  const show = (v) => { out.textContent = (fmtv ? fmtv(v) : fmt(v, step < 1 ? (step < 0.1 ? 2 : 1) : 0)) + (unit ? ' ' + unit : ''); };
  const inp = h('input', { type: 'range', min, max, step, value, 'aria-label': label, oninput: () => { show(+inp.value); onInput(+inp.value); } });
  show(value);
  const el = h('label.field', h('span.row.between', h('span', label), out), inp);
  el.set = (v) => { inp.value = v; show(+v); };
  el.input = inp;
  return el;
}

export function toggle(label, value, onChange) {
  const inp = h('input', { type: 'checkbox', checked: !!value, role: 'switch', onchange: () => onChange(inp.checked) });
  const el = h('label.switch', h('span', label), inp);
  el.input = inp;
  return el;
}

/** Bloco de perguntas. qs: [{q, o:[...], a:índice, w:'explicação'}]. onDone(acertos,total) */
export function quiz(qs, onDone) {
  const box = h('div.quiz');
  let answered = 0, right = 0;
  qs.forEach((q, qi) => {
    const why = h('div.why');
    const opts = h('div.opts');
    let locked = false;
    q.o.forEach((o, oi) => {
      const b = h('button.opt', { type: 'button', onclick: () => {
        if (locked) return; locked = true; answered++;
        const ok = oi === q.a;
        if (ok) right++;
        b.classList.add(ok ? 'ok' : 'no');
        opts.children[q.a].classList.add('ok');
        why.textContent = (ok ? 'Isso! ' : 'Quase. ') + (q.w || '');
        if (answered === qs.length) onDone && onDone(right, qs.length);
      } }, o);
      opts.append(b);
    });
    box.append(h('div.q', h('b', `${qi + 1}. ${q.q}`), opts, why));
  });
  return box;
}

export const vib = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

/** Mantém a tela acesa durante exercícios (Wake Lock, com detecção de suporte). */
let wl = null, wlWanted = false;
export const wake = {
  async on() { wlWanted = true; try { if ('wakeLock' in navigator && !wl) { wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => { wl = null; }); } } catch {} },
  off() { wlWanted = false; try { wl && wl.release(); } catch {} wl = null; },
};
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (wlWanted && document.visibilityState === 'visible') wake.on(); });

export async function fullscreen(el, on) {
  try {
    if (on) { const f = el.requestFullscreen || el.webkitRequestFullscreen; if (f) await f.call(el, { navigationUI: 'hide' }); }
    else if (document.fullscreenElement || document.webkitFullscreenElement) { const f = document.exitFullscreen || document.webkitExitFullscreen; f && await f.call(document); }
  } catch {}
}

/** Baixa ou compartilha um arquivo (Web Share quando existir). */
export async function shareOrDownload(blob, name, title) {
  try {
    const file = new File([blob], name, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: title || name }); return 'share'; }
  } catch (e) { if (e && e.name === 'AbortError') return 'cancel'; }
  download(blob, name);
  return 'download';
}
export function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
