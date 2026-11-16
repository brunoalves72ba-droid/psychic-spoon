// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Sobre o app: o que é, de quem é, versão e a busca de atualização.
import { h, top, toast } from '../core/ui.js';
import { procurarAtualizacao, versaoAtual } from '../app.js';

export default async function (el) {
  const versao = h('p.small.muted');
  el.append(top('Sobre o app'),
    h('section.card.col',
      h('p', 'Formação IA Generativa: app pessoal de estudo para a trilha de IA generativa, para quem começa do zero e para quem tem TDAH.'),
      h('p.small.dim', 'App pessoal e não oficial: não é afiliado à escola que oferece o curso nem às empresas citadas nas lições. O conteúdo é formação geral; não é parecer jurídico nem tratamento clínico.'),
      h('p.small.dim', '© Bruno Moura. Fontes Manrope, Inter e Atkinson Hyperlegible Mono (SIL OFL 1.1). MicroPython (licença MIT).'),
      versao,
      h('button.btn.block', { type: 'button', onclick: async (e) => {
        const b = e.currentTarget; b.disabled = true; b.textContent = 'Procurando…';
        const r = await procurarAtualizacao();
        toast(r === 'nova' ? 'Versão nova encontrada. Ela baixa em alguns segundos e aparece o botão Atualizar.' : r === 'atual' ? 'Você já está na versão mais nova.' : 'Sem internet agora. Tente de novo depois.');
        b.disabled = false; b.textContent = 'Procurar atualização';
      } }, 'Procurar atualização')),
    h('section.card.flat.col', h('h3', 'Por dentro'),
      h('a.btn.block', { href: '#/mais/porque' }, 'Por que o app é assim')));
  versaoAtual().then((v) => { versao.textContent = v ? `Versão ${v}` : ''; });
}
