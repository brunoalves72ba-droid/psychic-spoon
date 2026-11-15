// Finanças — © Bruno Moura, único e exclusivo proprietário.
// Roteador: #/secao?param=valor → js/views/secao.js (export render(main, params)).
import { carregar, atualizarRecorrentes, pendentesAtivos, aoMudar, eu } from './core/store.js';
import { iniciar as iniciarNuvem, quandoReceber } from './core/nuvem.js';
import { aviso } from './core/ui.js';

const SECOES = ['resumo', 'casal', 'extrato', 'lancar', 'mais', 'orcamento', 'recorrentes', 'ajustes', 'importar', 'plano', 'caixa', 'receber', 'captura', 'conectar', 'quem'];
// telas sem aba própria acendem a aba de onde vieram
const ABA_DE = { importar: 'mais', plano: 'mais', orcamento: 'mais', recorrentes: 'mais', ajustes: 'mais', captura: 'mais', conectar: 'mais', caixa: 'lancar', receber: 'lancar', quem: 'resumo' };
// telas que funcionam antes de escolher "Conta Bruno / Conta Rita"
const SEM_CONTA = ['quem', 'conectar', 'receber'];
const main = document.getElementById('view');
let limpar = null;

async function rotear() {
  const [caminho, qs = ''] = (location.hash.replace(/^#\/?/, '') || 'resumo').split('?');
  const secao = SECOES.includes(caminho) ? caminho : 'resumo';
  // primeiro uso depois da atualização: escolher de quem é este celular
  if (!eu() && !SEM_CONTA.includes(secao)) { location.replace(`#/quem?depois=${encodeURIComponent(location.hash || '#/resumo')}`); return; }
  const params = Object.fromEntries(new URLSearchParams(qs));
  document.querySelectorAll('.abas a').forEach((a) => {
    if (a.dataset.aba === (ABA_DE[secao] || secao)) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  if (typeof limpar === 'function') limpar();
  const view = await import(`./views/${secao}.js`);
  main.innerHTML = '';
  limpar = view.render(main, params);
  document.title = `${view.titulo || 'Finanças'} · Finanças`;
  window.scrollTo(0, 0);
  if (rotear.jaFoi) main.focus({ preventScroll: true });
  rotear.jaFoi = true;
}

/** Número de itens na caixa "A confirmar", no ícone da aba Lançar. */
function pintarContador() {
  const n = pendentesAtivos().length;
  const aba = document.querySelector('.abas a[data-aba=lancar]');
  let b = aba.querySelector('.contador');
  if (!n) { b?.remove(); aba.setAttribute('aria-label', 'Lançar'); return; }
  if (!b) { b = document.createElement('span'); b.className = 'contador'; b.setAttribute('aria-hidden', 'true'); aba.append(b); }
  b.textContent = n > 99 ? '99+' : n;
  aba.setAttribute('aria-label', `Lançar, ${n} a confirmar`);
}

// "Compartilhar com o Finanças" (Android) chega como ?titulo=...&texto=... no endereço:
// vira a mesma entrada que o MacroDroid usa.
if (/[?&](texto|titulo)=/.test(location.search)) {
  const q = location.search.slice(1);
  history.replaceState(null, '', location.pathname + '#/receber?' + q.replace(/(^|&)(link=[^&]*)/, ''));
}

carregar();
pintarContador();
iniciarNuvem();
// chegou algo do outro celular: redesenha (menos no meio de um lançamento ou da caixa)
quandoReceber(() => { if (!/^#\/(lancar|caixa|conectar)/.test(location.hash)) rotear(); pintarContador(); });
aoMudar(pintarContador);
addEventListener('hashchange', rotear);
// ao voltar para o app num dia novo, contas fixas que venceram entram sozinhas
document.addEventListener('visibilitychange', () => { if (!document.hidden && atualizarRecorrentes() && !location.hash.startsWith('#/lancar')) rotear(); });
rotear();

// Atualização do app instalado: procura versão nova ao abrir e ao voltar para o app;
// quando ela termina de baixar, oferece "Atualizar" (os dados ficam no aparelho e não mudam).
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  let recarregando = false;
  const jaInstalado = !!navigator.serviceWorker.controller; // na primeira visita não há o que recarregar
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recarregando || !jaInstalado) return;
    recarregando = true;
    location.reload();
  });
  const oferecer = (sw) => {
    if (!sw || !navigator.serviceWorker.controller) return; // primeira instalação: nada a atualizar
    aviso('Nova versão do app disponível.', { rotulo: 'Atualizar', fazer: () => sw.postMessage('skipWaiting') }, 60000);
  };
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
    if (reg.waiting) oferecer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const novo = reg.installing;
      novo?.addEventListener('statechange', () => { if (novo.state === 'installed') oferecer(novo); });
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => {});
}
