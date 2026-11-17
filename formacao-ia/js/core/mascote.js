// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// A mascote: personagem original e simples (uma gotinha com antena de faísca), em SVG inline.
// Um acessório por aba (camadas que entram e saem por opacidade e transform), pisca a cada 6–10 s
// e coloca os óculos ao entrar numa lição. Decorativa: aria-hidden.
const NS = 'http://www.w3.org/2000/svg';
const IOS = 'cubic-bezier(.32,.72,0,1)';
const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Acessório de cada aba. "oculos-olhos" = óculos no rosto (dentro da lição); "oculos" = na testa. */
export const ACESSORIO = { hoje: 'cafe', trilha: 'oculos', revisar: 'cartao', projeto: 'chave', progresso: 'trofeu', licao: 'oculos-olhos' };

const ACC = {
  cafe: [['path', { d: 'M28.5 27h6.5v4.2a2.8 2.8 0 0 1-2.8 2.8h-.9a2.8 2.8 0 0 1-2.8-2.8z' }], ['path', { d: 'M35 28.4h.8a1.6 1.6 0 0 1 0 3.2H35' }], ['path', { d: 'M30.6 24.8q.9-1 0-2.1M33 24.8q.9-1 0-2.1', class: 'vapor' }]],
  oculos: [['circle', { cx: 15.5, cy: 18.6, r: 3.3 }], ['circle', { cx: 24.5, cy: 18.6, r: 3.3 }], ['path', { d: 'M18.8 18.4h2.4M12.2 18.2l-2.4-1M27.8 18.2l2.4-1' }]],
  cartao: [['rect', { x: 28.2, y: 22.5, width: 7.6, height: 10.4, rx: 1.3, transform: 'rotate(12 32 27.7)' }], ['path', { d: 'M30.4 26.2l3.6.8M30 28.6l3.2.7', transform: 'rotate(12 32 27.7)' }]],
  chave: [['rect', { x: 30, y: 27.2, width: 3.6, height: 6.4, rx: 1.4 }], ['path', { d: 'M31.8 27.2v-5.6M30.9 21.6h1.8' }]],
  trofeu: [['path', { d: 'M29 22.6h7v2.6a3.5 3.5 0 0 1-7 0z' }], ['path', { d: 'M29 23.4h-1.2a1.4 1.4 0 0 0 1.5 2.1M36 23.4h1.2a1.4 1.4 0 0 1-1.5 2.1M32.5 28.7v2.6M30.4 32.3h4.2' }]],
};

let ultimo = null; // acessório mostrado por último (para animar a troca na próxima tela)

function el(tag, at = {}) { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(at)) e.setAttribute(k, v); return e; }
const chaveGrupo = (a) => (a === 'oculos-olhos' ? 'oculos' : a);
const posOculos = (a) => (a === 'oculos-olhos' ? 'none' : 'translateY(-7px)');

/** Cria a mascote com o acessório `alvo`, animando a troca a partir do último acessório mostrado. */
export function mascote(alvo, tam = 36) {
  const svg = el('svg', { viewBox: '0 0 40 40', width: tam, height: tam, class: 'mascote', 'aria-hidden': 'true', focusable: 'false' });
  // corpo: gotinha arredondada; antena com uma faísca
  svg.append(
    el('path', { class: 'corpo', d: 'M20 7.2c7.6 0 12.6 5.6 12.6 13.2 0 7.5-5.4 12.6-12.6 12.6S7.4 27.9 7.4 20.4C7.4 12.8 12.4 7.2 20 7.2z' }),
    el('path', { class: 'antena', d: 'M20 7.2V4.4' }),
    el('path', { class: 'faisca', d: 'M20 1.4l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z' }));
  const olhos = el('g', { class: 'olhos' });
  olhos.append(el('ellipse', { cx: 15.6, cy: 18.6, rx: 1.35, ry: 1.9 }), el('ellipse', { cx: 24.4, cy: 18.6, rx: 1.35, ry: 1.9 }));
  svg.append(olhos, el('path', { class: 'boca', d: 'M17.2 24.4q2.8 2 5.6 0' }));
  const grupos = {};
  for (const [nome, partes] of Object.entries(ACC)) {
    const g = el('g', { class: 'acc acc-' + nome, 'data-acc': nome });
    for (const [tag, at] of partes) g.append(el(tag, at));
    grupos[nome] = g; svg.append(g);
  }
  const de = ultimo;
  const mostrar = (a, on) => { const g = grupos[chaveGrupo(a)]; if (!g) return; g.classList.toggle('on', on); if (chaveGrupo(a) === 'oculos') g.style.transform = posOculos(a); };
  ultimo = alvo;
  if (!de || de === alvo) { mostrar(alvo, true); return svg; }
  if (chaveGrupo(de) === 'oculos' && chaveGrupo(alvo) === 'oculos') {
    // óculos descem até os olhos (entrou na lição) ou sobem para a testa (saiu)
    mostrar(de, true);
    requestAnimationFrame(() => {
      const g = grupos.oculos;
      if (reduzido()) { g.style.transform = posOculos(alvo); return; }
      g.animate([{ transform: posOculos(de) }, { transform: posOculos(alvo) }], { duration: 300, easing: IOS, delay: 120 }).finished.then(() => { g.style.transform = posOculos(alvo); }, () => {});
    });
    return svg;
  }
  // troca de aba: o antigo sai (150 ms) e o novo entra (250 ms)
  mostrar(de, true);
  requestAnimationFrame(() => {
    const ga = grupos[chaveGrupo(de)], gn = grupos[chaveGrupo(alvo)];
    mostrar(alvo, true); mostrar(de, false); if (chaveGrupo(de) === 'oculos') ga.style.transform = '';
    if (!gn) return;
    if (chaveGrupo(alvo) === 'oculos') gn.style.transform = posOculos(alvo);
    if (reduzido()) { gn.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 }); return; }
    if (ga) ga.animate([{ opacity: 1, transform: ga.style.transform || 'none' }, { opacity: 0, transform: 'translateY(2px) scale(.9)' }], { duration: 150, easing: IOS });
    gn.animate([{ opacity: 0, transform: 'translateY(2px) scale(.8)' }, { opacity: 0, offset: 0.375 }, { opacity: 1, transform: gn.style.transform || 'none' }], { duration: 400, easing: IOS });
  });
  return svg;
}

/** Pulinho de 8 px (abertura). */
export function pular(svg) {
  if (!svg || reduzido()) return;
  svg.animate([{ transform: 'none' }, { transform: 'translateY(-8px)', offset: 0.45 }, { transform: 'none' }], { duration: 300, easing: IOS });
}

// ---- piscar: a cada 6–10 s, olhos fechados por 120 ms ----
let relogio = 0;
function agendar() {
  clearTimeout(relogio);
  relogio = setTimeout(() => {
    if (!document.hidden && !document.body.classList.contains('audio-tocando') && !reduzido()) {
      for (const o of document.querySelectorAll('svg.mascote .olhos')) o.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(.12)', offset: 0.4 }, { transform: 'scaleY(.12)', offset: 0.6 }, { transform: 'scaleY(1)' }], { duration: 120 });
    }
    agendar();
  }, 6000 + Math.random() * 4000);
}
if (typeof document !== 'undefined') {
  agendar();
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(relogio); else agendar(); });
}

/** Só para testes. */
export const _ultimoAcessorio = () => ultimo;
