// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Ajustes: tema, meta de minutos, plano, backup e a parte de privacidade.
import { h, top, seg, toast, confirmSheet } from '../core/ui.js';
import { S, salvar, apagarTudo } from '../core/estado.js';
import { aplicarTema } from '../app.js';
import { PLANOS } from '../core/plano.js';

export default async function (el) {
  el.append(top('Ajustes', '#/progresso'),
    h('section.card.flat.col', h('h3', 'Aparência'),
      h('label.field', h('span', 'Tema'), seg([{ v: 'auto', label: 'Automático' }, { v: 'claro', label: 'Claro' }, { v: 'escuro', label: 'Escuro' }], S.perfil.tema || 'auto', (v) => { S.perfil.tema = v; salvar('perfil'); aplicarTema(v); }, { label: 'Tema' }))),
    h('section.card.flat.col', h('h3', 'Sessão'),
      h('label.field', h('span', 'Meta de minutos por sessão (o relógio só avisa, nunca interrompe)'), seg([5, 10, 15, 25].map((v) => ({ v, label: `${v} min` })), S.perfil.alvo, (v) => { S.perfil.alvo = v; salvar('perfil'); }, { wrap: true, label: 'Minutos' })),
      h('div.row.between', h('span.small', S.perfil.plano ? `${PLANOS[S.perfil.plano].nome}: ${PLANOS[S.perfil.plano].ritmo}` : 'Nenhum plano escolhido'), h('a.btn.small', { href: '#/progresso/cronograma' }, 'Cronograma'))),
    h('section.card.flat.col', h('h3', 'Seus dados'),
      h('p.small.dim', 'Tudo fica só neste aparelho (IndexedDB). Sem conta, sem servidor, sem analytics. Se trocar de celular ou limpar o navegador, só o backup traz tudo de volta.'),
      h('a.btn.block', { href: '#/mais/backup' }, 'Backup: exportar e importar'),
      h('a.btn.block', { href: '#/mais/lembretes' }, 'Lembretes no calendário'),
      h('button.btn.danger.block', { type: 'button', onclick: async () => { if (await confirmSheet('Apagar todo o progresso, cartões, diário e prompts deste aparelho? Não dá para desfazer. Faça um backup antes.', 'Apagar tudo')) { await apagarTudo(); toast('Tudo apagado.'); location.hash = '#/hoje'; } } }, 'Apagar todos os dados')),
    h('section.card.flat.col', h('h3', 'Sobre'),
      h('p.small', 'Formação IA Generativa: app pessoal de estudo para a trilha de IA generativa, para quem começa do zero e para quem tem TDAH.'),
      h('p.small.dim', 'App pessoal e não oficial: não é afiliado à escola que oferece o curso nem às empresas citadas nas lições. O conteúdo é formação geral; não é parecer jurídico nem tratamento clínico.'),
      h('p.small.dim', '© Bruno Moura. Fontes Atkinson Hyperlegible e Bricolage Grotesque (SIL OFL 1.1). MicroPython (licença MIT).')));
}
