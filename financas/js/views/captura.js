// Guia da captura automática: MacroDroid lê a notificação do banco e manda para o Finanças.
import { dados, apelidarCartao, nomeCartao } from '../core/store.js';
import { esc, aviso } from '../core/ui.js';

export const titulo = 'Captura automática';

/** Endereço que o MacroDroid abre (o texto da notificação precisa ser o último parâmetro). */
export const enderecoCaptura = (base = location.origin + location.pathname) =>
  `${base}#/receber?app=[not_app_name]&titulo=[not_title]&texto=[notification]`;

const PASSOS = [
  ['Instale o MacroDroid', 'Na Play Store, procure <b>MacroDroid</b> e instale. A versão gratuita basta: só vamos usar 1 macro.'],
  ['Crie a macro', 'Abra o MacroDroid e toque em <b>Adicionar macro</b>. Dê o nome <b>Finanças</b>.'],
  ['Gatilho: notificação do banco', 'Em <b>Gatilhos</b>, toque em <b>+</b> › <b>Notificação</b> › <b>Notificação recebida</b>. Escolha <b>Selecionar aplicativos</b> e marque os apps dos seus bancos e cartões. Em texto, escolha <b>Contém</b> e escreva <b>R$</b>. Na primeira vez, o celular pede para liberar o <b>Acesso a notificações</b> do MacroDroid: libere.'],
  ['Ação: abrir o Finanças', 'Em <b>Ações</b>, toque em <b>+</b> › <b>Aplicativos</b> › <b>Abrir site / página da web</b> e cole o endereço abaixo. Se o MacroDroid oferecer <b>codificar o texto (URL encode)</b>, deixe ligado.'],
  ['Salve e teste', 'Salve a macro. Para testar sem gastar, use o botão <b>Testar ação</b> do MacroDroid, ou faça uma compra pequena. O Finanças abre na caixa <b>A confirmar</b> com o gasto lido.'],
];

export function render(main) {
  const url = enderecoCaptura();
  const cartoes = Object.entries(dados().cartoes || {});

  main.innerHTML = `<h1>Captura automática</h1>
    <p class="sub">Cada compra, Pix ou boleto pago que gerar notificação do banco cai na caixa <b>A confirmar</b>. Você só confere e toca em ✔. O texto da notificação não sai do celular: o MacroDroid e o Finanças trabalham aqui mesmo.</p>

    <section class="cartao">
      <h2><span>Endereço para o MacroDroid</span></h2>
      <p class="sub">Copie e cole na ação “Abrir site”. Os campos entre colchetes são preenchidos pelo MacroDroid com o texto da notificação.</p>
      <code class="endereco" id="url">${esc(url)}</code>
      <button class="btn primario cheio" type="button" id="copiar" style="margin-top:10px">Copiar endereço</button>
    </section>

    <section class="cartao">
      <h2><span>Passo a passo</span></h2>
      <ol class="passos">${PASSOS.map(([t, d], i) => `<li><span class="num" aria-hidden="true">${i + 1}</span><div><b>${t}</b><p class="sub">${d}</p></div></li>`).join('')}</ol>
      <p class="sub">Se o texto entre colchetes não for substituído, toque no botão <b>…</b> (texto mágico) ao lado do campo do endereço e escolha <b>Texto da notificação</b>, <b>Título da notificação</b> e <b>Nome do aplicativo</b> nos lugares certos.</p>
    </section>

    <section class="cartao">
      <h2><span>Sem MacroDroid: Compartilhar</span></h2>
      <p class="sub">Com o Finanças instalado na tela inicial, ele aparece na lista do botão <b>Compartilhar</b> do Android. Em um SMS do banco ou no texto de um e-mail, selecione o texto e toque em Compartilhar › <b>Finanças</b>. O texto também cai na caixa A confirmar.</p>
      <a class="btn cheio" href="#/caixa">Abrir a caixa A confirmar</a>
    </section>

    <section class="cartao">
      <h2><span>Seus cartões</span></h2>
      ${cartoes.length ? `<p class="sub">Dê um apelido para reconhecer cada cartão no extrato (ex.: “Nubank do Bruno”, “Itaú da Rita”).</p>
        <ul class="contas">${cartoes.map(([final, c]) => `<li><span class="conta-nome">${esc(nomeCartao(final))}<small>${esc(c.banco || 'Banco não identificado')} · final ${esc(final)}</small></span>
          <span class="conta-acoes"><button class="btn mini" type="button" data-apelido="${esc(final)}">Dar apelido</button></span></li>`).join('')}</ul>`
      : '<p class="sub">Os cartões aparecem aqui quando chegar a primeira notificação com o final do cartão.</p>'}
    </section>`;

  main.querySelector('#copiar').onclick = async () => {
    try { await navigator.clipboard.writeText(url); aviso('Endereço copiado. Cole no MacroDroid.'); }
    catch {
      const r = document.createRange(); r.selectNodeContents(main.querySelector('#url'));
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      aviso('Selecionei o endereço: toque em Copiar.');
    }
  };
  main.querySelectorAll('[data-apelido]').forEach((b) => (b.onclick = () => {
    const final = b.dataset.apelido;
    const nome = prompt(`Apelido do cartão final ${final}:`, dados().cartoes[final]?.apelido || '');
    if (nome !== null) { apelidarCartao(final, nome); render((main.innerHTML = '', main)); }
  }));
}
