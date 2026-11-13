// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Biblioteca de prompts (entrega do Módulo 2): variáveis {assim}, versões, exemplo e rubrica de 4 pontos.
import { h, top, clear, put, toast, tick, textFile, confirmSheet, copyText, plural, fmtDia } from '../core/ui.js';
import { S } from '../core/estado.js';
import { RUBRICA, variaveis, nota, novoPrompt, atualizarPrompt, removerPrompt, exportarMarkdown } from '../core/biblioteca.js';
import { tokensAprox } from '../core/texto.js';
import { verificarConquistas } from '../core/conquistas.js';

export default async function (el, [id]) {
  if (id === 'novo') return editar(el, null);
  if (id) { const p = S.prompts.find((x) => String(x.id) === id); if (p) return editar(el, p); }
  const bons = S.prompts.filter((p) => nota(p) >= 3).length;
  el.append(top('Biblioteca de prompts', '#/projeto'),
    h('div.row.wrap', h('span.tag' + (S.prompts.length >= 10 ? '.ok' : ''), `${S.prompts.length} de 10 prompts`), h('span.tag' + (bons >= 10 ? '.ok' : ''), `${bons} com nota 3 ou 4`)),
    h('a.btn.primary.block', { href: '#/projeto/prompts/novo' }, 'Novo prompt'));
  if (!S.prompts.length) el.append(h('p.muted', 'Vazia por enquanto. Os exercícios do Módulo 2 já deixam você guardar os primeiros.'));
  el.append(h('div.list', S.prompts.map((p) => {
    const vs = variaveis(p.texto);
    return h('a.item' + (nota(p) >= 3 ? '.done' : ''), { href: `#/projeto/prompts/${p.id}` }, h('span.n', `${nota(p)}/4`),
      h('span.t', h('b', p.nome), h('span', `v${p.versao}${vs.length ? ' · ' + vs.map((v) => `{${v}}`).join(' ') : ' · sem variáveis'}`)), h('span.chev', '›'));
  })));
  if (S.prompts.length) el.append(h('div.row', h('button.btn.grow', { type: 'button', onclick: () => textFile(exportarMarkdown(), 'prompts.md', 'text/markdown') }, 'Exportar .md'),
    h('button.btn.grow', { type: 'button', onclick: () => textFile(JSON.stringify(S.prompts, null, 2), 'prompts.json', 'application/json') }, 'Exportar .json')));
}

function editar(el, p) {
  const novo = !p;
  const nome = h('input.inp', { type: 'text', value: p ? p.nome : '', placeholder: 'Ex.: Tutor Socrático', maxLength: 80, 'aria-label': 'Nome do prompt' });
  const texto = h('textarea.mono', { rows: 9, value: p ? p.texto : '', placeholder: 'Você é um tutor paciente…\nUse {tema} onde o assunto muda a cada uso.', 'aria-label': 'Texto do prompt', maxLength: 6000, spellcheck: false });
  const exemplo = h('textarea', { rows: 3, value: p ? p.exemplo : '', placeholder: 'Um exemplo de uso: valores das variáveis e um trecho da resposta que você recebeu.', maxLength: 2000 });
  const modelos = h('input.inp', { type: 'text', value: p ? p.modelos : '', placeholder: 'Ex.: dois modelos em que você testou', maxLength: 120 });
  const notas = h('textarea', { rows: 2, value: p ? p.notas : '', placeholder: 'O que mudou nesta versão e por quê.', maxLength: 600 });
  const info = h('div.small.muted');
  const rub = { ...(p ? p.rubrica : {}) };
  const pintarInfo = () => { const vs = variaveis(texto.value); put(clear(info), `Cerca de ${tokensAprox(texto.value).length} tokens. `, vs.length ? ['Variáveis: ', vs.map((v) => h('code', { style: { marginRight: '4px' } }, `{${v}}`))] : 'Sem variáveis: use {chaves} no que muda a cada uso.'); };
  texto.addEventListener('input', pintarInfo); pintarInfo();
  const salvar = () => {
    if (texto.value.trim().length < 20) { toast('Escreva o prompt antes de guardar (pelo menos uma frase).'); return; }
    if (novo) { const x = novoPrompt({ nome: nome.value || 'Prompt sem nome', texto: texto.value, exemplo: exemplo.value }); atualizarPrompt(x.id, { modelos: modelos.value, notas: notas.value, rubrica: rub }); }
    else { const antes = p.versao; atualizarPrompt(p.id, { nome: nome.value.trim() || p.nome, texto: texto.value, exemplo: exemplo.value, modelos: modelos.value, notas: notas.value }); atualizarPrompt(p.id, { rubrica: p.versao > antes ? {} : rub }); if (p.versao > antes) toast(`O texto mudou: agora é a versão ${p.versao}. Teste de novo e refaça a rubrica.`); }
    for (const c of verificarConquistas()) toast(`Conquista: ${c.t}`);
    location.hash = '#/projeto/prompts';
  };
  el.append(top(novo ? 'Novo prompt' : `${p.nome} · v${p.versao}`, '#/projeto/prompts'),
    h('label.field', h('span', 'Nome'), nome),
    h('label.field', h('span', 'Prompt'), texto), info,
    h('div.row', h('button.btn.small', { type: 'button', onclick: async () => { toast((await copyText(texto.value)) ? 'Prompt copiado.' : 'Selecione o texto e copie.'); } }, 'Copiar prompt')),
    h('label.field', h('span', 'Exemplo de uso'), exemplo),
    h('label.field', h('span', 'Testado em quais modelos?'), modelos),
    h('section.card.flat.col', h('h3', 'Rubrica'), h('p.small.muted', 'Rode o prompt num chat de verdade e marque o que a resposta cumpriu. A meta é 3 de 4 em dois modelos.'),
      RUBRICA.map((r) => tick(`**${r.t}.** ${r.d}`, !!rub[r.id], (on) => { rub[r.id] = on; }))),
    h('label.field', h('span', 'Notas desta versão'), notas),
    h('button.btn.primary.block', { type: 'button', onclick: salvar }, novo ? 'Guardar na biblioteca' : 'Guardar alterações'));
  if (!novo) {
    if (p.hist.length) el.append(h('details.card.flat', h('summary', { style: { fontWeight: '700', minHeight: '44px', display: 'flex', alignItems: 'center', cursor: 'pointer' } }, `Versões anteriores (${p.hist.length})`),
      p.hist.map((x) => h('div', { style: { marginTop: '10px' } }, h('div.small.muted', `v${x.v} · ${fmtDia(x.d)}`), h('pre', { style: { whiteSpace: 'pre-wrap', fontSize: '.86rem', margin: '4px 0 0' } }, x.texto)))));
    el.append(h('button.btn.danger.block', { type: 'button', onclick: async () => { if (await confirmSheet(`Apagar o prompt “${p.nome}” e todas as versões?`, 'Apagar')) { removerPrompt(p.id); location.hash = '#/projeto/prompts'; } } }, 'Apagar este prompt'));
  }
}
