// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Utilitários de interface: criação de DOM, texto rico das lições, avisos, folhas e controles.

const SVGNS = 'http://www.w3.org/2000/svg';

function apply(el, props, kids) {
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.setAttribute('class', v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'css') for (const [p, val] of Object.entries(v)) el.style.setProperty(p, val);
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
/** append que ignora null/false e aceita listas (o append nativo escreveria "null"). */
export const put = (el, ...kids) => { add(el, kids); return el; };

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const fmt = (x, d = 0) => Number(x).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtDur = (sec) => { sec = Math.max(0, Math.round(sec)); const m = Math.floor(sec / 60), s2 = sec % 60; return `${m}:${String(s2).padStart(2, '0')}`; };
export const fmtDia = (day, opts = { day: '2-digit', month: 'short' }) => { const [y, m, d] = day.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('pt-BR', opts); };
export const plural = (n, um, varios) => `${fmt(n)} ${n === 1 ? um : varios}`;

// ---------- ícones ----------
const ICONS = {
  volta: 'M15 5l-7 7 7 7',
  fecha: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  seta: 'M5 12h14M13 6l6 6-6 6',
  nota: 'M5 4h10l4 4v12H5zM9 12h6M9 16h4',
  raio: 'M13 3L5 13.5h6L10 21l8-10.5h-6z',
  relogio: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  copia: 'M9 9h10v11H9zM5 15V4h10',
  play: 'M8 5.5v13l10.5-6.5z',
  lampada: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  pc: 'M4 5h16v11H4zM9 20h6M12 16v4',
  mais: 'M12 5v14M5 12h14',
  lixo: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  baixa: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  estrela: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z',
  gelo: 'M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5',
};
export function icon(name, cls) {
  return s('svg', { viewBox: '0 0 24 24', class: 'ic' + (cls ? ' ' + cls : ''), 'aria-hidden': 'true' }, s('path', { d: ICONS[name] || '' }));
}

/** Cabeçalho de página com botão de voltar. */
export function top(title, back, extra) {
  return h('header.top',
    back ? h('a.back', { href: back, 'aria-label': 'Voltar' }, icon('volta')) : null,
    h('h1', title), extra || null);
}

// ---------- texto rico das lições ----------
// Em linha: **negrito**, *itálico*, `código`, [texto](https://link). Nada de innerHTML.
const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\)|\*[^*\s][^*]*\*)/g;
export function rich(str) {
  const frag = document.createDocumentFragment();
  if (str == null) return frag;
  for (const part of String(str).split(INLINE)) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) frag.append(h('b', rich(part.slice(2, -2))));
    else if (part.startsWith('`') && part.endsWith('`') && part.length > 2) frag.append(h('code', part.slice(1, -1)));
    else if (part.startsWith('[') && part.endsWith(')')) {
      const m = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      if (m && /^(https?:\/\/|#\/)/.test(m[2])) frag.append(m[2].startsWith('#') ? h('a', { href: m[2] }, m[1]) : h('a', { href: m[2], target: '_blank', rel: 'noopener noreferrer' }, m[1]));
      else frag.append(part);
    } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) frag.append(h('em', part.slice(1, -1)));
    else frag.append(part);
  }
  return frag;
}

const ROTULOS = { dica: 'Dica', aviso: 'Atenção', analogia: 'Analogia', erro: 'Erro comum' };
/** Blocos: string = parágrafo; {c,l} código; {ul}/{ol} listas; {nota,tipo}; {tab:{h,r}}; {h} subtítulo. */
export function blocks(arr, opts = {}) {
  const box = h('div.prose');
  for (const b of [].concat(arr || [])) {
    if (b == null || b === false) continue;
    if (typeof b === 'string') box.append(h('p', rich(b)));
    else if (b.c != null) box.append(codeBlock(b.c, b.l, { run: b.run && opts.run, wrap: b.wrap, titulo: b.t }));
    else if (b.ul) box.append(h('ul', b.ul.map((x) => h('li', rich(x)))));
    else if (b.ol) box.append(h('ol', b.ol.map((x) => h('li', rich(x)))));
    else if (b.passos) box.append(h('ol.steps', b.passos.map((x, i) => h('li', h('span', String(i + 1)), h('div', rich(x))))));
    else if (b.nota) box.append(h('div.callout.' + (b.tipo || 'dica'), h('span.rot', b.rot || ROTULOS[b.tipo || 'dica']), rich(b.nota)));
    else if (b.h) box.append(h('h3', b.h));
    else if (b.tab) box.append(h('div.tblwrap', h('table.tbl', h('thead', h('tr', b.tab.h.map((x) => h('th', x)))), h('tbody', b.tab.r.map((r) => h('tr', r.map((x) => h('td', rich(x)))))))));
  }
  return box;
}

const LANG = { python: 'Python', json: 'JSON', prompt: 'Prompt', bash: 'Terminal', http: 'HTTP', n8n: 'n8n', texto: 'Texto', saida: 'Saída', toml: 'TOML', md: 'Markdown' };
/** Bloco de código com botão de copiar e, se pedido, de rodar (opts.run recebe o código e devolve a saída). */
export function codeBlock(code, lang, opts = {}) {
  const pre = h('pre', code);
  const box = h('div.code' + (opts.wrap || lang === 'prompt' || lang === 'texto' || lang === 'saida' ? '.wrap' : ''));
  const bar = h('div.bar', h('span', opts.titulo || LANG[lang] || 'Código'));
  const btns = h('span.row', { style: { gap: '0' } });
  if (opts.run) {
    const out = h('div.out.hide');
    const b = h('button', { type: 'button', onclick: async () => {
      b.disabled = true; out.classList.remove('hide', 'err'); out.textContent = 'Rodando…';
      try { const r = await opts.run(code); out.textContent = r.texto || '(sem saída)'; out.classList.toggle('err', !!r.erro); }
      catch (e) { out.textContent = String(e && e.message || e); out.classList.add('err'); }
      b.disabled = false;
    } }, '▶ Rodar');
    btns.append(b);
    box._out = out;
  }
  btns.append(h('button', { type: 'button', 'aria-label': 'Copiar código', onclick: async (e) => {
    const ok = await copyText(code);
    const bt = e.currentTarget; bt.textContent = ok ? 'Copiado' : 'Selecione e copie'; setTimeout(() => { bt.textContent = 'Copiar'; }, 1600);
  } }, 'Copiar'));
  bar.append(btns);
  box.append(bar, pre);
  if (box._out) box.append(box._out);
  return box;
}
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    try { const ta = h('textarea', { value: text, style: { position: 'fixed', opacity: '0' } }); document.body.append(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; }
    catch { return false; }
  }
}

// ---------- avisos e folhas ----------
export function toast(msg, action) {
  const box = document.getElementById('toasts');
  if (!box) return;
  const t = h('div.toast', msg);
  if (action) t.append(h('button', { onclick: () => { action.fn(); t.remove(); } }, action.label));
  box.append(t);
  setTimeout(() => t.remove(), action ? 9000 : 3000);
}

/** Folha modal simples. Retorna função para fechar. */
export function sheet(content, { onClose } = {}) {
  const bg = h('div.sheet-bg', { role: 'dialog', 'aria-modal': 'true' });
  const box = h('div.sheet', content);
  bg.append(box);
  let closed = false;
  const close = () => { if (closed) return; closed = true; bg.remove(); document.removeEventListener('keydown', esc); onClose && onClose(); };
  const esc = (e) => { if (e.key === 'Escape') close(); };
  bg.addEventListener('click', (e) => { if (e.target === bg) close(); });
  document.addEventListener('keydown', esc);
  document.body.append(bg);
  const f = box.querySelector('textarea, input, button, a, select'); f && f.focus();
  return close;
}
export function confirmSheet(text, yes = 'Confirmar', no = 'Cancelar') {
  return new Promise((res) => {
    let done = false;
    const close = sheet([
      h('p', text),
      h('div.row', h('button.btn.grow', { onclick: () => { done = true; close(); res(false); } }, no),
        h('button.btn.primary.grow', { onclick: () => { done = true; close(); res(true); } }, yes)),
    ], { onClose: () => { if (!done) res(false); } });
  });
}

// ---------- controles ----------
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

/** Item de lista marcável (caixa de seleção grande). */
export function tick(label, on, onChange) {
  const b = h('button.tick', { type: 'button', 'aria-pressed': String(!!on), onclick: () => { const v = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(v)); onChange && onChange(v); } },
    h('span.box', '✓'), h('span.grow', typeof label === 'string' ? rich(label) : label));
  return b;
}

export function progressBar(frac, color) {
  return h('div.bar', color ? { css: { '--c': color } } : null, h('i', { style: { width: Math.round(clamp(frac, 0, 1) * 100) + '%' } }));
}

export const vib = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

/** Mantém a tela acesa (Wake Lock, com detecção de suporte). */
let wl = null, wlWanted = false;
export const wake = {
  async on() { wlWanted = true; try { if ('wakeLock' in navigator && !wl) { wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => { wl = null; }); } } catch {} },
  off() { wlWanted = false; try { wl && wl.release(); } catch {} wl = null; },
};
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (wlWanted && document.visibilityState === 'visible') wake.on(); });

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
export const textFile = (text, name, type = 'text/plain') => download(new Blob([text], { type: type + ';charset=utf-8' }), name);
