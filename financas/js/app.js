// Finanças — © Bruno Moura, único e exclusivo proprietário.
// Roteador: #/secao?param=valor → js/views/secao.js (export render(main, params)).
import { carregar, atualizarRecorrentes } from './core/store.js';

const SECOES = ['resumo', 'extrato', 'lancar', 'orcamento', 'ajustes', 'importar'];
const main = document.getElementById('view');
let limpar = null;

async function rotear() {
  const [caminho, qs = ''] = (location.hash.replace(/^#\/?/, '') || 'resumo').split('?');
  const secao = SECOES.includes(caminho) ? caminho : 'resumo';
  const params = Object.fromEntries(new URLSearchParams(qs));
  document.querySelectorAll('.abas a').forEach((a) => {
    if (a.dataset.aba === secao) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
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

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
