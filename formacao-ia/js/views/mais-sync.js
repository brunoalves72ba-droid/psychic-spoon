// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Sincronização entre celular e PC: configuração passo a passo e situação atual.
import { h, top, clear, toast, confirmSheet, rich } from '../core/ui.js';
import * as nuvem from '../core/nuvem.js';
import { plataforma } from '../core/plataforma.js';

const quando = (iso) => { if (!iso) return 'nunca'; const s = (Date.now() - new Date(iso)) / 1000; return s < 60 ? 'agora há pouco' : s < 3600 ? `há ${Math.round(s / 60)} min` : new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); };

export default async function (el) {
  const corpo = h('div.col.gap-l');
  el.append(top('Sincronizar celular e PC', '#/mais/ajustes'), corpo);
  const pintar = () => {
    const st = nuvem.status();
    clear(corpo);
    if (st.ligado) {
      corpo.append(h('section.card.dest.col',
        h('div.eyebrow', 'Sincronização ligada'),
        h('h2', st.rodando ? 'Sincronizando…' : st.erro ? 'Não deu para sincronizar' : `Sincronizado ${quando(st.ult)}`),
        st.erro ? h('div.banner.quase', st.erro) : h('p.small.dim', 'Cada lição, cartão, missão e anotação vai sozinho para o outro aparelho: ao abrir o app, alguns segundos depois de cada mudança e ao sair.'),
        st.outroToken ? h('div.col', h('p.small', 'Os dados na nuvem foram gravados com outro token. Se você trocou de token, recomece a nuvem a partir deste aparelho: o progresso daqui é enviado, e o outro aparelho precisa usar este token novo.'),
          h('button.btn.block', { type: 'button', onclick: async () => { if (await confirmSheet('Recomeçar a nuvem com os dados deste aparelho?', 'Recomeçar')) { await nuvem.recomecarNuvem(); pintar(); } } }, 'Recomeçar a nuvem daqui')) : null,
        h('button.btn.primary.block', { type: 'button', disabled: st.rodando, onclick: async () => { await nuvem.sincronizar(); pintar(); toast(nuvem.status().erro ? 'Não deu: veja a mensagem.' : 'Sincronizado.'); } }, 'Sincronizar agora')),
        h('section.card.flat.col', h('h3', 'No outro aparelho'), h('p.small', rich('Abra o app no outro aparelho, vá em **Progresso › Ajustes › Sincronizar** e cole **o mesmo token**. O app acha os seus dados sozinho e junta os dois lados, sem perder nada.'))),
        h('button.btn.danger.block', { type: 'button', onclick: async () => { if (await confirmSheet('Desligar a sincronização neste aparelho? Os dados daqui continuam aqui.', 'Desligar')) { await nuvem.desconectar(); pintar(); } } }, 'Desligar neste aparelho'));
      return;
    }
    const inp = h('input.inp.mono', { type: 'password', placeholder: 'ghp_… ou github_pat_…', autocomplete: 'off', spellcheck: false, 'aria-label': 'Token do GitHub' });
    corpo.append(
      h('p.dim', `Hoje o progresso fica só ${plataforma() === 'pc' ? 'neste computador' : 'neste celular'}. Para estudar nos dois e continuar de onde parou, ligue a sincronização uma vez em cada aparelho. Leva 2 minutos.`),
      h('section.card.flat.col', h('h3', 'Passo 1: crie um token no GitHub'),
        h('p.small', rich('Você já tem conta no GitHub. O token é uma senha só para este app, com uma única permissão: **gist** (guardar arquivos). Ele não acessa os seus repositórios.')),
        h('a.btn.block', { href: nuvem.LINK_TOKEN, target: '_blank', rel: 'noopener noreferrer' }, 'Abrir o GitHub para criar o token ↗'),
        h('p.small.muted', rich('Na página que abrir: a caixa **gist** já vem marcada. Em **Expiration**, escolha **No expiration** (ou uma data longa), role até o fim e toque em **Generate token**. Copie o código que aparece: ele só é mostrado uma vez. Guarde também num gerenciador de senhas, para colar no outro aparelho.'))),
      h('section.card.flat.col', h('h3', 'Passo 2: cole aqui'), inp,
        h('button.btn.primary.block', { type: 'button', onclick: async (e) => {
          const t = inp.value.trim();
          if (!/^(ghp_|github_pat_|gho_)\w{20,}/.test(t)) { toast('Isso não parece um token do GitHub. Ele começa com ghp_ ou github_pat_.'); return; }
          e.currentTarget.disabled = true; e.currentTarget.textContent = 'Conectando…';
          await nuvem.conectar(t);
          const st = nuvem.status();
          if (st.erro) { toast(st.erro); await nuvem.desconectar(); }
          else toast('Sincronização ligada.');
          pintar();
        } }, 'Ligar a sincronização')),
      h('div.callout.dica', h('span.rot', 'Privacidade'), rich('Os dados vão para um **Gist secreto** da sua conta, **cifrados** com uma chave derivada do token: mesmo quem tiver o link do Gist não consegue ler. O token fica só neste aparelho e nunca entra no backup.')));
  };
  const off = nuvem.aoMudar(pintar);
  pintar();
  return off;
}
