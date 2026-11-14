// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Biblioteca de prompts do APE-IA (projeto do Módulo 2): prompts com variáveis, versão, exemplo e rubrica.
import { h, toast } from './ui.js';
import { S, salvar, apagar } from './estado.js';
import { hoje } from './dia.js';

export const RUBRICA = [
  { id: 'correcao', t: 'Correção', d: 'O que ele diz está certo? Você conferiu?' },
  { id: 'completude', t: 'Completude', d: 'Respondeu tudo o que foi pedido?' },
  { id: 'formato', t: 'Formato', d: 'Veio no formato pedido, sem sobras?' },
  { id: 'tom', t: 'Tom', d: 'A linguagem serve para quem vai ler?' },
];

/** Variáveis {assim} usadas no texto, sem repetição. */
export const variaveis = (texto) => [...new Set((String(texto).match(/\{([a-zA-Z_][\w]*)\}/g) || []).map((x) => x.slice(1, -1)))];
export const nota = (p) => RUBRICA.reduce((n, r) => n + (p.rubrica && p.rubrica[r.id] ? 1 : 0), 0);

export function novoPrompt({ nome, texto, exemplo = '' }) {
  const p = { id: Date.now() + Math.floor(Math.random() * 1000), nome: String(nome || 'Prompt sem nome').trim().slice(0, 80), texto: String(texto || '').trim(), versao: 1, exemplo, modelos: '', rubrica: {}, notas: '', criado: hoje(), atualizado: hoje(), hist: [], _t: Date.now() };
  S.prompts.unshift(p);
  salvar('prompts');
  return p;
}
/** Atualiza o prompt. Se o texto mudou, guarda a versão anterior e sobe o número da versão. */
export function atualizarPrompt(id, campos) {
  const p = S.prompts.find((x) => x.id === id);
  if (!p) return null;
  if (campos.texto != null && campos.texto.trim() !== p.texto) {
    p.hist.unshift({ v: p.versao, texto: p.texto, d: p.atualizado });
    p.hist = p.hist.slice(0, 20);
    p.versao += 1; p.rubrica = {};
    p.texto = campos.texto.trim();
  }
  for (const k of ['nome', 'exemplo', 'modelos', 'notas', 'rubrica']) if (campos[k] != null) p[k] = campos[k];
  p.atualizado = hoje(); p._t = Date.now();
  salvar('prompts');
  return p;
}
export function removerPrompt(id) { S.prompts = S.prompts.filter((x) => x.id !== id); apagar('prompts', id); salvar('prompts'); }

export function exportarMarkdown() {
  const linhas = ['# Biblioteca de prompts do APE-IA', ''];
  for (const p of [...S.prompts].reverse()) {
    linhas.push(`## ${p.nome} (v${p.versao})`, '', '```', p.texto, '```', '');
    const vs = variaveis(p.texto);
    if (vs.length) linhas.push(`Variáveis: ${vs.map((v) => '`{' + v + '}`').join(', ')}`, '');
    if (p.exemplo) linhas.push('Exemplo de uso:', '', p.exemplo, '');
    if (p.modelos) linhas.push(`Testado em: ${p.modelos}`, '');
    linhas.push(`Rubrica: ${nota(p)}/4 (${RUBRICA.map((r) => `${r.t} ${p.rubrica && p.rubrica[r.id] ? '✓' : '–'}`).join(', ')})`, '');
    if (p.notas) linhas.push(`Notas: ${p.notas}`, '');
  }
  return linhas.join('\n');
}

/** Botão “Guardar na biblioteca” usado ao fim de exercícios de escrita de prompt. */
export function botaoSalvar(texto, nome) {
  const b = h('button.btn.block', { type: 'button', onclick: () => { novoPrompt({ nome: typeof nome === 'string' ? nome : 'Prompt da lição', texto }); b.disabled = true; b.textContent = 'Guardado na biblioteca'; toast('Prompt guardado em Projeto › Biblioteca de prompts.'); } }, 'Guardar na biblioteca de prompts');
  return b;
}
