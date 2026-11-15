// Porta de entrada das notificações: #/receber?app=...&titulo=...&texto=...
// O MacroDroid abre este endereço com o texto da notificação; "texto" vem por último e
// é lido até o fim, então "&", "#" ou "%" dentro da notificação não quebram nada.
import { receberNotificacao } from '../core/store.js';
import { reais } from '../core/dinheiro.js';
import { navegar } from '../core/ui.js';

export const titulo = 'Recebendo';

export function decodificar(s) {
  const t = String(s || '');
  try { return decodeURIComponent(t); }
  catch { return t.replace(/(%[0-9A-Fa-f]{2})+/g, (m) => { try { return decodeURIComponent(m); } catch { return m; } }); }
}

/** Separa os parâmetros do endereço sem estragar o texto livre da notificação. */
export function lerParametros(qs) {
  const out = {};
  let resto = String(qs || '').replace(/^[?#]/, '');
  const i = resto.search(/(^|&)texto=/);
  if (i >= 0) {
    const ini = resto.indexOf('texto=', i) + 'texto='.length;
    out.texto = decodificar(resto.slice(ini));
    resto = resto.slice(0, i);
  }
  for (const par of resto.split('&')) {
    if (!par) continue;
    const [k, ...v] = par.split('=');
    out[decodificar(k)] = decodificar(v.join('='));
  }
  return out;
}

// texto que o MacroDroid manda quando o campo não existe ("[not_title]" literal) não conta
const vazio = (s) => !s || /^\[[a-z_]+\]$/i.test(s.trim());

export function render(main) {
  const qs = location.hash.split('?').slice(1).join('?');
  const p = lerParametros(qs);
  const texto = vazio(p.texto) ? '' : p.texto;
  const r = texto ? receberNotificacao(texto, { app: vazio(p.app) ? '' : p.app, titulo: vazio(p.titulo) ? '' : p.titulo }) : { status: 'vazio' };
  const msg = r.status === 'novo'
    ? (r.pendente.lido.ignorar ? `Notificação ignorada: ${r.pendente.lido.ignorar}.` : `Nova notificação: ${r.pendente.lido.tipo === 'receita' ? 'entrada' : 'gasto'} de ${reais(r.pendente.lido.valor)} em ${r.pendente.lido.descricao}.`)
    : r.status === 'repetido' ? 'Essa notificação já tinha chegado.'
    : r.status === 'sem-valor' ? 'A notificação não tinha valor em reais; nada foi lançado.'
    : 'Nenhum texto recebido.';
  // troca o endereço para a caixa, sem deixar o /receber no histórico (voltar não relança)
  try { sessionStorage.setItem('fin-msg-caixa', msg); } catch {}
  history.replaceState(null, '', '#/caixa');
  main.innerHTML = '';
  navegar('#/caixa');
}
