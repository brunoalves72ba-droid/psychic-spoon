// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Laboratório de JSON: validador com erros em português e árvore clicável que mostra o caminho de cada campo.
import { h, clear, put } from '../core/ui.js';
import { analisar } from '../core/json-pt.js';
import { marco } from '../core/estado.js';
import { missao, semMissao, arvore } from './comum.js';

const INICIAL = '[\n  { "titulo": "Dom Casmurro", "autor": "Machado de Assis", "ano": 1899 },\n  { "titulo": "Vidas Secas", "autor": "Graciliano Ramos", "ano": 1938 }\n]';

export default function ({ missao: m, feito }) {
  const mi = m ? missao(['Cole um JSON (pode ser a resposta de um chat) e faça passar.', 'Toque num valor da árvore para ver o caminho dele.'], feito) : semMissao();
  const ta = h('textarea.mono', { rows: 8, value: INICIAL, spellcheck: false, 'aria-label': 'JSON para validar' });
  const msg = h('div.why', { role: 'status' });
  const arv = h('div');
  const cam = h('div.small');
  const validar = () => {
    const r = analisar(ta.value);
    clear(arv); clear(cam);
    if (!r.ok) { msg.className = 'why no'; put(clear(msg), h('b', `Linha ${r.linha}, coluna ${r.col}: `), r.msg + ' ', r.dica); return; }
    msg.className = 'why ok'; clear(msg).append(h('b', 'JSON válido. '), 'Toque num valor para ver o caminho até ele.');
    marco('json'); mi.marcar(0);
    arv.append(arvore(r.valor, (c, v) => { clear(cam).append('Caminho: ', h('code', c || '(raiz)'), ' → ', h('code', JSON.stringify(v))); mi.marcar(1); }));
  };
  return h('div.lab', mi.el, ta, h('button.btn.primary.block', { type: 'button', onclick: validar }, 'Validar'), msg, arv, cam);
}
