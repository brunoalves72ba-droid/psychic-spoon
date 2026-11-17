// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Card do check-in na tela Hoje: círculo que pisca, três carinhas, o check desenhado (leve, como o de
// carteira digital), a carinha indo para o canto ao lado da saudação, as pílulas de tempo, as sugestões
// e a curiosidade do dia. Sem pop-up, sem som.
import { h, icon, seg, clear } from './ui.js';
import { HUMORES, ENERGIA, ROTULO, TEMPOS, checkinHoje, registrarCheckin, mudarTempo, rosto, curiosidadeDoDia, curiosidadeDispensada, dispensarCuriosidade } from './checkin.js';

const IOS = 'cubic-bezier(.32,.72,0,1)';
const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS = 'http://www.w3.org/2000/svg';

function circuloComCheck() {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 56 56'); svg.setAttribute('width', 56); svg.setAttribute('height', 56); svg.setAttribute('aria-hidden', 'true');
  const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', 28); c.setAttribute('cy', 28); c.setAttribute('r', 26); c.setAttribute('class', 'aro');
  const p = document.createElementNS(NS, 'path'); p.setAttribute('d', 'M18.5 28.5l6.5 6.5 12.5-13'); p.setAttribute('class', 'traco');
  svg.append(c, p);
  return h('div.ck-circulo' + (reduzido() ? '' : '.pulsa'), svg);
}

/** Coloca (ou troca) a carinha pequena no canto, ao lado da saudação. Devolve o elemento. */
export function rostoNoCanto(humor) {
  const slot = document.querySelector('.topo-rosto');
  if (!slot) return null;
  slot.replaceChildren(rosto(humor, 20));
  slot.setAttribute('title', `Check-in de hoje: ${ROTULO[humor].toLowerCase()}`);
  slot.setAttribute('aria-label', `Check-in de hoje: ${ROTULO[humor].toLowerCase()}`);
  slot.setAttribute('role', 'img');
  return slot;
}

/**
 * @param {(energia:'baixa'|'media'|'alta', tempo:number) => {t,sub,href}[]} sugestoes  lógica atual de sugestão
 */
export function cartaoCheckin(sugestoes) {
  let c = checkinHoje();
  const card = h('section.card.checkin', { 'aria-labelledby': 'ck-tit' });
  const tit = h('h2.ck-tit', { id: 'ck-tit' }, c ? 'Seu check-in de hoje' : 'Como você está agora?');
  const vivo = h('p.sr', { 'aria-live': 'polite' });
  const circulo = c ? null : circuloComCheck();
  const botoes = HUMORES.map((hm) => h('button.ck-rosto', { type: 'button', 'aria-pressed': String(c ? c.humor === hm : false), 'aria-label': ROTULO[hm], 'data-humor': hm, disabled: c ? true : null }, rosto(hm, 32)));
  if (c) botoes.forEach((b) => { if (b.dataset.humor !== c.humor) b.classList.add('apagado'); });
  const rostos = h('div.ck-rostos', { role: 'group', 'aria-label': 'Como você está' }, botoes);
  const resto = h('div.ck-resto.col');
  card.append(tit, h('div.ck-centro', circulo, rostos), resto, vivo);

  // ---- depois do check: tempo, sugestões e curiosidade ----
  const lista = h('div.col.ck-sug', { 'aria-live': 'polite' });
  const pintarSug = (animar) => {
    const fazer = () => {
      clear(lista);
      const en = ENERGIA[c.humor];
      const itens = sugestoes(en, c.tempo);
      if (!itens.length) { lista.append(h('p.small.muted', 'Nada pendente agora. Aproveite o descanso.')); return; }
      lista.append(h('div.small.muted', en === 'baixa' ? 'Dia mais pesado pede tarefa leve:' : en === 'media' ? 'Dia normal combina com uma lição:' : 'Energia alta é hora de construir:'));
      itens.forEach((it, i) => lista.append(h('a.item' + (i === 0 ? '.now' : ''), { href: it.href }, h('span.n', String(i + 1)), h('span.t', h('b', it.t), h('span', it.sub)), h('span.chev', '›'))));
    };
    if (!animar || reduzido()) { fazer(); return; }
    lista.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 75, easing: 'linear' }).finished.then(() => { fazer(); lista.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 75, easing: 'linear' }); }, fazer);
  };
  const montarResto = (animar) => {
    const pilulas = seg(TEMPOS.map((v) => ({ v, label: `${v} min` })), c.tempo, (v) => { mudarTempo(v); c = checkinHoje(); pintarSug(true); }, { label: 'Quanto tempo você tem' });
    pilulas.classList.add('ck-pilulas');
    const blocoTempo = h('div.col.ck-tempo', h('span.small.dim', 'Quanto tempo você tem?'), pilulas);
    resto.append(blocoTempo, lista);
    pintarSug(false);
    const frase = curiosidadeDoDia();
    if (frase && !curiosidadeDispensada()) {
      const cur = h('aside.ck-curiosidade', { 'aria-label': 'Curiosidade do dia' },
        h('p.small', frase),
        h('button.ck-dispensar', { type: 'button', 'aria-label': 'Dispensar', onclick: () => { dispensarCuriosidade(); cur.remove(); } }, icon('fecha')));
      resto.append(cur);
    }
    if (animar && !reduzido()) resto.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 250, easing: IOS });
  };
  if (c) { montarResto(false); return card; }

  // ---- a escolha ----
  for (const b of botoes) b.addEventListener('click', () => {
    if (c) return;
    const hm = b.dataset.humor;
    c = registrarCheckin(hm, 15);
    b.setAttribute('aria-pressed', 'true');
    botoes.forEach((x) => { x.disabled = true; if (x !== b) x.classList.add('apagado'); });
    tit.textContent = 'Seu check-in de hoje';
    vivo.textContent = 'Check-in registrado';
    try { if (navigator.vibrate) navigator.vibrate(10); } catch {}
    if (reduzido()) { circulo.classList.add('feito'); rostoNoCanto(hm); circulo.remove(); montarResto(false); return; }
    // o círculo para de piscar, cresce uma vez e o check é desenhado
    circulo.classList.remove('pulsa');
    circulo.classList.add('feito');
    circulo.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.14)' }, { transform: 'scale(1)' }], { duration: 350, easing: 'cubic-bezier(.2,.8,.2,1)' });
    circulo.querySelector('.traco').animate([{ strokeDashoffset: 30 }, { strokeDashoffset: 0 }], { duration: 350, delay: 100, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
    // aos ~600 ms: o círculo some e a carinha escolhida vai para o canto, ao lado da saudação
    setTimeout(() => {
      const de = b.getBoundingClientRect();
      const canto = rostoNoCanto(hm);
      if (canto) {
        const para = canto.getBoundingClientRect();
        const dx = de.left + de.width / 2 - (para.left + para.width / 2), dy = de.top + de.height / 2 - (para.top + para.height / 2);
        canto.animate([{ transform: `translate(${dx}px,${dy}px) scale(${de.width / para.width})`, opacity: 0.6 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: IOS });
      }
      circulo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'linear' }).finished.then(() => { circulo.remove(); montarResto(true); }, () => { circulo.remove(); montarResto(false); });
    }, 600);
  });
  return card;
}
