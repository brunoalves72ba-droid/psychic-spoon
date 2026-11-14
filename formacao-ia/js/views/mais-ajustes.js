// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Ajustes: tema, meta de minutos, plano, backup e a parte de privacidade.
import { h, top, seg, toast, confirmSheet } from '../core/ui.js';
import { S, salvar, apagarTudo } from '../core/estado.js';
import { aplicarTema } from '../app.js';
import { PLANOS } from '../core/plano.js';
import { L } from '../core/estado.js';
import { plataforma, escolher } from '../core/plataforma.js';
import * as nuvem from '../core/nuvem.js';

export default async function (el) {
  const ns = nuvem.status();
  const qual = h('span.small.dim');
  const pintarQual = () => { qual.textContent = `Agora: ${plataforma() === 'pc' ? 'computador (menu lateral, duas colunas, atalhos de teclado)' : 'celular (abas embaixo, uma coluna, botões grandes)'}.`; };
  pintarQual();
  el.append(top('Ajustes', '#/progresso'),
    h('section.card.dest.col', h('h3', 'Celular e PC'),
      h('p.small.dim', ns.ligado ? `Sincronização ligada${ns.erro ? `, com problema: ${ns.erro}` : '.'}` : 'O progresso é salvo sozinho, mas só neste aparelho. Para continuar do mesmo ponto no outro, ligue a sincronização.'),
      h('a.btn.primary.block', { href: '#/mais/sync' }, ns.ligado ? 'Ver a sincronização' : 'Ligar a sincronização'),
      h('label.field', h('span', 'Este aparelho é'), seg([{ v: 'auto', label: 'Detectar sozinho' }, { v: 'pc', label: 'Computador' }, { v: 'celular', label: 'Celular' }], L.plataforma || 'auto', async (v) => { await escolher(v); pintarQual(); }, { wrap: true, label: 'Tipo de aparelho' })), qual),
    h('section.card.flat.col', h('h3', 'Aparência'),
      h('label.field', h('span', 'Tema'), seg([{ v: 'auto', label: 'Automático' }, { v: 'claro', label: 'Claro' }, { v: 'escuro', label: 'Escuro' }], S.perfil.tema || 'auto', (v) => { S.perfil.tema = v; salvar('perfil'); aplicarTema(v); }, { label: 'Tema' }))),
    h('section.card.flat.col', h('h3', 'Sessão'),
      h('label.field', h('span', 'Meta de minutos por sessão (o relógio só avisa, nunca interrompe)'), seg([5, 10, 15, 25].map((v) => ({ v, label: `${v} min` })), S.perfil.alvo, (v) => { S.perfil.alvo = v; salvar('perfil'); }, { wrap: true, label: 'Minutos' })),
      h('div.row.between', h('span.small', S.perfil.plano ? `${PLANOS[S.perfil.plano].nome}: ${PLANOS[S.perfil.plano].ritmo}` : 'Nenhum plano escolhido'), h('a.btn.small', { href: '#/progresso/cronograma' }, 'Cronograma'))),
    h('section.card.flat.col', h('h3', 'Seus dados'),
      h('p.small.dim', 'O progresso é salvo sozinho, a cada passo, neste aparelho (IndexedDB). Sem servidor do app e sem analytics. Com a sincronização ligada, uma cópia cifrada vai para um Gist secreto seu no GitHub. Sem ela, só o backup traz tudo de volta se você trocar de aparelho ou limpar o navegador.'),
      h('a.btn.block', { href: '#/mais/backup' }, 'Backup: exportar e importar'),
      h('a.btn.block', { href: '#/mais/lembretes' }, 'Lembretes no calendário'),
      h('button.btn.danger.block', { type: 'button', onclick: async () => { if (await confirmSheet('Apagar todo o progresso, cartões, diário e prompts deste aparelho? Não dá para desfazer. Faça um backup antes.', 'Apagar tudo')) { await apagarTudo(); toast('Tudo apagado.'); location.hash = '#/hoje'; } } }, 'Apagar todos os dados')),
    h('section.card.flat.col', h('h3', 'Sobre'),
      h('p.small', 'Formação IA Generativa: app pessoal de estudo para a trilha de IA generativa, para quem começa do zero e para quem tem TDAH.'),
      h('p.small.dim', 'App pessoal e não oficial: não é afiliado à escola que oferece o curso nem às empresas citadas nas lições. O conteúdo é formação geral; não é parecer jurídico nem tratamento clínico.'),
      h('p.small.dim', '© Bruno Moura. Fontes Atkinson Hyperlegible e Bricolage Grotesque (SIL OFL 1.1). MicroPython (licença MIT).')));
}
