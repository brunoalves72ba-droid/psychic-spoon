// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Ajustes: tema, meta de minutos, plano, backup e a parte de privacidade.
import { h, top, seg, toast, confirmSheet, toggle } from '../core/ui.js';
import * as voz from '../core/voz.js';
import { S, salvar, apagarTudo } from '../core/estado.js';
import { aplicarTema, procurarAtualizacao, versaoAtual } from '../app.js';
import { PLANOS } from '../core/plano.js';
import { L } from '../core/estado.js';
import { plataforma, escolher } from '../core/plataforma.js';
import * as nuvem from '../core/nuvem.js';

export default async function (el) {
  const ns = nuvem.status();
  const versao = h('p.small.muted');
  const qual = h('span.small.dim');
  const pintarQual = () => { qual.textContent = `Agora: ${plataforma() === 'pc' ? 'computador (menu lateral, duas colunas, atalhos de teclado)' : 'celular (abas embaixo, uma coluna, botões grandes)'}.`; };
  pintarQual();
  el.append(top('Ajustes'),
    h('section.card.dest.col', h('h3', 'Celular e PC'),
      h('p.small.dim', ns.ligado ? `Sincronização ligada${ns.erro ? `, com problema: ${ns.erro}` : '.'}` : 'O progresso é salvo sozinho, mas só neste aparelho. Para continuar do mesmo ponto no outro, ligue a sincronização.'),
      h('a.btn.primary.block', { href: '#/mais/sync' }, ns.ligado ? 'Ver a sincronização' : 'Ligar a sincronização'),
      h('a.btn.block', { href: '#/mais/instalar' }, 'Instalar e salvar tudo no celular'),
      h('label.field', h('span', 'Este aparelho é'), seg([{ v: 'auto', label: 'Detectar sozinho' }, { v: 'pc', label: 'Computador' }, { v: 'celular', label: 'Celular' }], L.plataforma || 'auto', async (v) => { await escolher(v); pintarQual(); }, { wrap: true, label: 'Tipo de aparelho' })), qual),
    secaoVoz(),
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
      h('p.small.dim', '© Bruno Moura. Fontes Atkinson Hyperlegible e Bricolage Grotesque (SIL OFL 1.1). MicroPython (licença MIT).'),
      versao,
      h('button.btn.block', { type: 'button', onclick: async (e) => {
        const b = e.currentTarget; b.disabled = true; b.textContent = 'Procurando…';
        const r = await procurarAtualizacao();
        toast(r === 'nova' ? 'Versão nova encontrada. Ela baixa em alguns segundos e aparece o botão Atualizar.' : r === 'atual' ? 'Você já está na versão mais nova.' : 'Sem internet agora. Tente de novo depois.');
        b.disabled = false; b.textContent = 'Procurar atualização';
      } }, 'Procurar atualização')));
  versaoAtual().then((v) => { versao.textContent = v ? `Versão ${v}` : ''; });
}

/** Leitura em voz alta: liga e desliga, leitura automática, voz do aparelho e velocidade. */
function secaoVoz() {
  const sec = h('section.card.flat.col', h('h3', 'Leitura em voz alta'));
  if (!voz.suportado()) { sec.append(h('p.small.dim', 'Este navegador não tem leitura em voz alta. No celular, use o Chrome; no PC, o Chrome ou o Edge.')); return sec; }
  const c = voz.cfg();
  const extras = h('div.col');
  const pintarExtras = () => { extras.classList.toggle('hide', !voz.cfg().ligada); };
  const escolha = h('div.col');
  sec.append(
    h('p.small.dim', 'Lê as lições, os exemplos, as perguntas do quiz e os cartões com a voz do próprio aparelho. Grátis e sem cadastro.'),
    toggle('Ler em voz alta', c.ligada, async (v) => { await voz.ajustar({ ligada: v }); pintarExtras(); }),
    extras);
  extras.append(
    toggle('Ler sozinho ao mudar de passo ou de cartão', c.auto, (v) => voz.ajustar({ auto: v })),
    escolha,
    h('label.field', h('span', 'Velocidade'), seg([{ v: 0.8, label: 'Devagar' }, { v: 0.9, label: '0,9×' }, { v: 1, label: 'Normal' }, { v: 1.15, label: '1,15×' }, { v: 1.3, label: 'Rápida' }], c.vel, (v) => voz.ajustar({ vel: v }), { wrap: true, label: 'Velocidade da voz' })),
    h('button.btn.block', { type: 'button', onclick: () => voz.falar('Oi! Eu leio as lições, os exemplos e as perguntas do quiz. Prompt, token, API e embeddings soam assim.', { id: 'teste' }) }, 'Testar a voz'),
    h('p.small.muted', 'Voz robótica ou sem português? Nas configurações do celular, procure “texto para fala” (ou “conversão de texto em voz”), escolha o mecanismo do Google e instale os dados de voz de Português (Brasil). As vozes marcadas “sem internet” funcionam offline. No PC, o Edge tem vozes “Natural” bem humanas.'));
  voz.esperarVozes().then((vs) => {
    escolha.textContent = '';
    if (!vs.length) { escolha.append(h('div.callout.aviso', h('span.rot', 'Nenhuma voz em português'), h('span', 'O aparelho não ofereceu voz em português. Instale uma (veja a dica abaixo) e reabra o app.'))); return; }
    const atual = voz.cfg().nome;
    const sel = h('select', { 'aria-label': 'Voz', onchange: () => { voz.ajustar({ nome: sel.value }); voz.falar('Esta é a voz escolhida.', { id: 'teste' }); } },
      h('option', { value: '' }, 'Automática (a melhor disponível)'),
      vs.map((v) => h('option', { value: v.name, selected: v.name === atual }, `${v.name}${v.localService ? ' · sem internet' : ' · precisa de internet'}`)));
    escolha.append(h('label.field', h('span', 'Voz'), sel));
  });
  pintarExtras();
  return sec;
}
