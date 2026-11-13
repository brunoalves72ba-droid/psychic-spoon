// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Peças comuns dos laboratórios: a caixa de missão e a árvore clicável de JSON.
import { h, clear, rich } from '../core/ui.js';

/**
 * Caixa de missão com uma lista de metas. metas: [{ t, ok:false }].
 * Devolve { el, marcar(i), completa } — chama feito() uma única vez quando todas as metas forem cumpridas.
 */
export function missao(metas, feito, titulo = 'Missão') {
  const estado = metas.map(() => false);
  const lista = h('ul.checks');
  const lis = metas.map((m) => h('li', rich(m)));
  lista.append(...lis);
  const el = h('div.banner.info', { style: { flexDirection: 'column', gap: '6px' } }, h('b', titulo), lista);
  let pronta = false;
  const api = {
    el,
    marcar(i) {
      if (!(i in estado) || estado[i]) return;
      estado[i] = true; lis[i].className = 'ok';
      if (estado.every(Boolean) && !pronta) { pronta = true; el.className = 'banner ok'; feito && feito(); }
    },
    get completa() { return pronta; },
  };
  return api;
}
/** Laboratório aberto fora de uma lição: sem missão. */
export const semMissao = () => ({ el: null, marcar() {}, completa: false });

/** Árvore de JSON com folhas clicáveis; onPick(caminho, valor). */
export function arvore(valor, onPick) {
  const box = h('div.jtree');
  const linha = (txt) => box.append(txt);
  const caminhoDe = (base, k) => (typeof k === 'number' ? `${base}[${k}]` : base ? `${base}.${k}` : k);
  const desenhar = (v, cam, ind, chave, ultimo) => {
    const pre = ' '.repeat(ind) + (chave != null ? `"${chave}": ` : '');
    const virg = ultimo ? '' : ',';
    if (Array.isArray(v) || (v && typeof v === 'object')) {
      const arr = Array.isArray(v);
      const ks = arr ? v.map((_, i) => i) : Object.keys(v);
      linha(pre + (arr ? '[' : '{') + (ks.length ? '\n' : ''));
      ks.forEach((k, i) => desenhar(v[k], caminhoDe(cam, k), ind + 2, arr ? null : k, i === ks.length - 1));
      linha((ks.length ? ' '.repeat(ind) : '') + (arr ? ']' : '}') + virg + '\n');
    } else {
      linha(pre);
      box.append(h('button', { type: 'button', title: cam, onclick: () => onPick && onPick(cam, v) }, JSON.stringify(v)));
      linha(virg + '\n');
    }
  };
  desenhar(valor, '', 0, null, true);
  return box;
}

export const limpar = clear;
