// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Ficha técnica do APE-IA (entrega do Módulo 1): objetivo, 2 modelos, 5 regras e um teste de alucinação.
import { h, top, textFile, toast } from '../core/ui.js';
import { S, salvar } from '../core/estado.js';
import { hoje } from '../core/dia.js';

const CAMPOS = [
  { sec: 'Objetivo' },
  { id: 'objetivo', rot: 'O que o APE-IA faz, em uma frase', ph: 'Ex.: responde dúvidas sobre as minhas anotações do curso e sempre mostra de onde tirou a resposta.', linhas: 2 },
  { sec: 'Modelos escolhidos' },
  { id: 'modelo1', rot: 'Modelo 1', ph: 'Nome do modelo', linhas: 1 }, { id: 'porque1', rot: 'Por que este?', ph: 'Custo, velocidade, qualidade em português, janela de contexto…', linhas: 2 },
  { id: 'modelo2', rot: 'Modelo 2', ph: 'Nome do modelo', linhas: 1 }, { id: 'porque2', rot: 'Por que este?', ph: 'Em que ele é melhor que o primeiro?', linhas: 2 },
  { sec: 'Regras de uso responsável' },
  ...[1, 2, 3, 4, 5].map((i) => ({ id: 'regra' + i, rot: `Regra ${i}`, ph: ['Nunca recebe dados pessoais de terceiros.', 'Sempre mostra a fonte da resposta.', 'Diz “não sei” quando a resposta não está no material.', 'Toda informação importante é conferida por mim.', 'Não decide nada sozinho sobre pessoas.'][i - 1], linhas: 1 })),
  { id: 'nunca', rot: 'O que nunca entra no prompt?', ph: 'CPF, senhas, dados de saúde, planilhas de clientes…', linhas: 2 },
  { sec: 'Teste de alucinação' },
  { id: 'testeP', rot: 'O que você pediu', ph: 'Ex.: 3 artigos com DOI sobre repetição espaçada.', linhas: 2 },
  { id: 'testeR', rot: 'O que aconteceu ao conferir', ph: 'Ex.: 1 DOI existia, 2 eram inventados.', linhas: 2 },
  { id: 'testeL', rot: 'O que você aprendeu', ph: 'Ex.: citação de IA só vale depois de conferida na fonte.', linhas: 2 },
];
const IDS = CAMPOS.filter((c) => c.id).map((c) => c.id);

export function fichaMarkdown() {
  const f = S.ficha; const v = (k) => (f[k] || '').trim() || '(a preencher)';
  return ['# Ficha técnica — APE-IA', '', `Atualizada em ${hoje()}.`, '', '## Objetivo', '', v('objetivo'), '', '## Modelos escolhidos', '', `1. **${v('modelo1')}** — ${v('porque1')}`, `2. **${v('modelo2')}** — ${v('porque2')}`, '',
    '## Regras de uso responsável', '', ...[1, 2, 3, 4, 5].map((i) => `${i}. ${v('regra' + i)}`), '', `**O que nunca entra no prompt:** ${v('nunca')}`, '',
    '## Teste de alucinação', '', `- Pedido: ${v('testeP')}`, `- Conferência: ${v('testeR')}`, `- Aprendizado: ${v('testeL')}`, ''].join('\n');
}

export default async function (el) {
  const status = h('span.tag');
  const palavras = h('span.small.muted');
  const pintar = () => {
    const n = IDS.filter((k) => (S.ficha[k] || '').trim()).length;
    status.className = 'tag' + (n === IDS.length ? ' ok' : ''); status.textContent = `${n} de ${IDS.length} campos`;
    const w = IDS.reduce((a, k) => a + ((S.ficha[k] || '').trim().split(/\s+/).filter(Boolean).length), 0);
    palavras.textContent = `${w} palavras. ${w <= 350 ? 'Cabe em 1 página.' : 'Passou de 1 página: corte até cerca de 350 palavras.'}`;
  };
  let t = 0;
  const campo = (c) => {
    const ta = h('textarea', { rows: c.linhas, placeholder: c.ph, value: S.ficha[c.id] || '', maxLength: 600, oninput: () => { S.ficha[c.id] = ta.value; clearTimeout(t); t = setTimeout(() => salvar('ficha'), 400); pintar(); } });
    return h('label.field', h('span', c.rot), ta);
  };
  el.append(top('Ficha técnica', '#/projeto'), h('div.row.wrap', status, palavras),
    h('p.small.dim', 'Preencha aos poucos, conforme as missões do Módulo 1. Tudo é salvo sozinho, só neste aparelho.'));
  let sec = null;
  for (const c of CAMPOS) {
    if (c.sec) { sec = h('section.card.flat.col', h('h3', c.sec)); el.append(sec); continue; }
    sec.append(campo(c));
  }
  el.append(h('button.btn.primary.block', { type: 'button', onclick: () => { salvar('ficha'); textFile(fichaMarkdown(), 'ficha-tecnica.md', 'text/markdown'); toast('Ficha exportada. Salve na pasta ape-ia.'); } }, 'Exportar ficha-tecnica.md'));
  pintar();
  return () => { clearTimeout(t); salvar('ficha'); };
}
