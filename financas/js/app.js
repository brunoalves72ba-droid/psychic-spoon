// Finanças — © Bruno Moura, único e exclusivo proprietário.
// Roteador: #/secao?param=valor → js/views/secao.js (export render(main, params)).
import { carregar, atualizarRecorrentes } from './core/store.js';
import { aviso } from './core/ui.js';

const SECOES = ['resumo', 'extrato', 'lancar', 'orcamento', 'ajustes', 'importar', 'plano'];
const ABA_DE = { importar: 'extrato', plano: 'ajustes' }; // telas sem aba própria acendem a aba de onde vieram
const main = document.getElementById('view');
let limpar = null;

async function rotear() {
  const [caminho, qs = ''] = (location.hash.replace(/^#\/?/, '') || 'resumo').split('?');
  const secao = SECOES.includes(caminho) ? caminho : 'resumo';
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

carregar();
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
