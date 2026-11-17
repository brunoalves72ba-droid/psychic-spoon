// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Ajustes: nome, celular e PC, áudio, meta de minutos, plano e dados. "Sobre o app" fica no menu lateral.
import { h, top, seg, toast, confirmSheet } from '../core/ui.js';
import { nomeUsuario, definirNome } from '../core/estado.js';
import { grifoLigado } from '../core/grifo.js';
import { baixados, baixarTodos } from '../core/audio.js';
import { S, salvar, apagarTudo } from '../core/estado.js';
import { PLANOS } from '../core/plano.js';
import { L } from '../core/estado.js';
import { plataforma, escolher } from '../core/plataforma.js';
import * as nuvem from '../core/nuvem.js';

export default async function (el) {
  const ns = nuvem.status();
  const qual = h('span.small.dim');
  const pintarQual = () => { qual.textContent = `Agora: ${plataforma() === 'pc' ? 'computador (menu lateral, duas colunas, atalhos de teclado)' : 'celular (abas embaixo, uma coluna, botões grandes)'}.`; };
  pintarQual();
  const campoNome = h('input', { type: 'text', id: 'ajuste-nome', value: nomeUsuario(), maxLength: 40, autocomplete: 'given-name', autocapitalize: 'words' });
  const erroNome = h('p.campo-erro', { 'aria-live': 'polite' });
  el.append(top('Ajustes'),
    h('section.card.flat.col', h('h3', 'Seu nome'),
      h('form.col', { novalidate: true, onsubmit: (e) => { e.preventDefault(); if (definirNome(campoNome.value)) { erroNome.textContent = ''; campoNome.value = nomeUsuario(); toast('Nome salvo.'); } else erroNome.textContent = 'Escreva um nome para salvar.'; } },
        h('label.field', { for: 'ajuste-nome' }, h('span', 'Como você quer ser chamado'), campoNome), erroNome,
        h('button.btn.block', { type: 'submit' }, 'Salvar nome'))),
    h('section.card.dest.col', h('h3', 'Celular e PC'),
      h('p.small.dim', ns.ligado ? `Sincronização ligada${ns.erro ? `, com problema: ${ns.erro}` : '.'}` : 'O progresso é salvo sozinho, mas só neste aparelho. Para continuar do mesmo ponto no outro, ligue a sincronização.'),
      h('a.btn.primary.block', { href: '#/mais/sync' }, ns.ligado ? 'Ver a sincronização' : 'Ligar a sincronização'),
      h('a.btn.block', { href: '#/mais/instalar' }, 'Instalar e salvar tudo no celular'),
      h('label.field', h('span', 'Este aparelho é'), seg([{ v: 'auto', label: 'Detectar sozinho' }, { v: 'pc', label: 'Computador' }, { v: 'celular', label: 'Celular' }], L.plataforma || 'auto', async (v) => { await escolher(v); pintarQual(); }, { wrap: true, label: 'Tipo de aparelho' })), qual),
    secaoVoz(),
    h('section.card.flat.col', h('h3', 'Sessão'),
      h('label.field', h('span', 'Meta de minutos por sessão (o relógio só avisa, nunca interrompe)'), seg([5, 10, 15, 25].map((v) => ({ v, label: `${v} min` })), S.perfil.alvo, (v) => { S.perfil.alvo = v; salvar('perfil'); }, { wrap: true, label: 'Minutos' })),
      h('div.row.between', h('span.small', S.perfil.plano ? `${PLANOS[S.perfil.plano].nome}: ${PLANOS[S.perfil.plano].ritmo}` : 'Nenhum plano escolhido'), h('a.btn.small', { href: '#/progresso/cronograma' }, 'Cronograma'))),
    h('section.card.flat.col', h('h3', 'Seus dados'),
      h('p.small.dim', 'O progresso é salvo sozinho, a cada passo, neste aparelho (IndexedDB). Sem servidor do app e sem analytics. Com a sincronização ligada, uma cópia cifrada vai para um Gist secreto seu no GitHub. Sem ela, só o backup traz tudo de volta se você trocar de aparelho ou limpar o navegador.'),
      h('a.btn.block', { href: '#/mais/backup' }, 'Backup: exportar e importar'),
      h('a.btn.block', { href: '#/mais/lembretes' }, 'Lembretes no calendário'),
      h('button.btn.danger.block', { type: 'button', onclick: async () => { if (await confirmSheet('Apagar todo o progresso, cartões, diário e prompts deste aparelho? Não dá para desfazer. Faça um backup antes.', 'Apagar tudo')) { await apagarTudo(); toast('Tudo apagado.'); location.hash = '#/hoje'; } } }, 'Apagar todos os dados')),
    h('a.btn.quiet.block', { href: '#/mais/sobre' }, 'Sobre o app e versão'));
}
/** Áudio das aulas (voz neural gerada uma vez): quantas têm áudio, quantas já estão no aparelho e baixar tudo. */
function secaoVoz() {
  const sec = h('section.card.flat.col', h('h3', 'Áudio das aulas'), h('p.small.dim', 'As aulas com áudio têm um player no topo, com voz neural natural. O áudio de cada aula é baixado na primeira vez que você toca e fica no aparelho.'),
    h('label.field', h('span', 'Texto grifado durante o áudio'), seg([{ v: true, label: 'Ligado' }, { v: false, label: 'Desligado' }], grifoLigado(), (v) => { S['v2.leitura.grifado'] = { ligado: v }; salvar('v2.leitura.grifado'); }, { label: 'Texto grifado durante o áudio' })),
    h('p.small.muted', 'Enquanto a voz lê, o parágrafo da vez fica em destaque e os outros em cinza. A tela não rola sozinha: se o trecho sair da tela, aparece o botão “Voltar ao trecho”.'));
  const info = h('p.small');
  const pintar = async () => {
    const b = await baixados();
    sec.querySelector('.baixar')?.remove();
    if (!b.total) { info.textContent = 'Ainda não há áudio gerado. Veja o passo a passo em formacao-ia/AUDIO.md.'; return; }
    info.textContent = `${b.total} aulas com áudio · ${b.baixados} já ${b.baixados === 1 ? 'está' : 'estão'} neste aparelho (cerca de ${b.mb.toFixed(0)} MB no total).`;
    if (b.baixados < b.total) sec.append(h('button.btn.block.baixar', { type: 'button', onclick: async (e) => {
      const bt = e.currentTarget; bt.disabled = true;
      const r = await baixarTodos((n, t) => { bt.textContent = `Baixando ${n} de ${t}…`; });
      toast(r.falhas ? `${r.falhas} não baixaram. Confira a internet e tente de novo.` : 'Todos os áudios estão no aparelho.');
      pintar();
    } }, 'Baixar todos os áudios (para ouvir sem internet)'));
  };
  sec.append(info); pintar();
  return sec;
}
