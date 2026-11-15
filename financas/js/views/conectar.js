// Conectar os celulares do casal: chave do GitHub no primeiro, convite (QR ou link) no segundo.
import { dados, eu, nomePessoa, outra, aparelho, definirPessoa } from '../core/store.js';
import { status, conectar, desconectar, sincronizar, linkConvite, lerConvite, LINK_TOKEN, aoMudar } from '../core/nuvem.js';
import qrcode from '../vendor/qrcode.js';
import { esc, aviso, confirmar, navegar } from '../core/ui.js';

export const titulo = 'Conectar celulares';

const quando = (iso) => {
  if (!iso) return 'nunca';
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  if (min < 1440) return `há ${Math.round(min / 60)} h`;
  return new Date(iso).toLocaleDateString('pt-BR');
};

function svgQR(texto) {
  const q = qrcode(0, 'M'); q.addData(texto); q.make();
  const n = q.getModuleCount(), m = 4;
  let d = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x + m},${y + m}h1v1h-1z`;
  return `<svg viewBox="0 0 ${n + 2 * m} ${n + 2 * m}" role="img" aria-label="QR code do convite" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

export function render(main, params = {}) {
  // convite aberto no outro celular (#/conectar?c=...)
  if (params.c) return renderConvite(main, params.c);
  pintar(main);
  // redesenha quando a sincronização muda de estado (um ouvinte só; o roteador o desliga ao sair da tela)
  let agendado = false;
  return aoMudar(() => {
    if (agendado || !location.hash.startsWith('#/conectar')) return;
    agendado = true;
    setTimeout(() => { agendado = false; if (location.hash.startsWith('#/conectar')) pintar((main.innerHTML = '', main)); }, 0);
  });
}

function pintar(main) {
  const s = status();
  const e = dados();
  const aparelhos = Object.entries(e.aparelhos || {}).sort((a, b) => (b[1].ult || '').localeCompare(a[1].ult || ''));

  if (!s.ligado) {
    main.innerHTML = `<h1>Conectar celulares</h1>
      <p class="sub">Juntando a <b>Conta Bruno</b> e a <b>Conta Rita</b>, a aba <b>Casal</b> fica igual nos dois celulares: o que um compartilha aparece para o outro em segundos. Os dados vão <b>cifrados</b> para um arquivo secreto (Gist) numa conta do GitHub de vocês; nem o GitHub consegue ler.</p>
      <section class="cartao">
        <h2><span>1. No primeiro celular (uma vez só)</span></h2>
        <ol class="passos">
          <li><span class="num">1</span><div><b>Crie uma conta no GitHub</b><p class="sub">Grátis, em github.com. Recomendamos uma conta só para as finanças da família.</p></div></li>
          <li><span class="num">2</span><div><b>Gere a chave de acesso</b><p class="sub">Toque no botão abaixo (já entra logado no GitHub), escolha a validade <b>“No expiration”</b> (sem vencimento) e toque em <b>Generate token</b>. A permissão “gist” já vem marcada.</p>
            <a class="btn" href="${LINK_TOKEN}" target="_blank" rel="noopener">Abrir a página da chave no GitHub</a></div></li>
          <li><span class="num">3</span><div><b>Cole a chave aqui</b><p class="sub">Ela começa com <code>ghp_</code>. Fica guardada só neste celular.</p></div></li>
        </ol>
        <form id="form-token" class="linha-form"><input type="password" name="token" autocomplete="off" placeholder="ghp_…" aria-label="Chave de acesso do GitHub" required><button class="btn primario" type="submit">Conectar</button></form>
      </section>
      <section class="cartao"><h2><span>2. No outro celular</span></h2><p class="sub">Depois de conectar este, aparece aqui um <b>QR code</b>. No outro celular, é só apontar a câmera para ele.</p></section>`;
    main.querySelector('#form-token').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const t = ev.target.token.value.trim();
      if (!/^(ghp_|github_pat_|gho_)/.test(t)) { aviso('Essa não parece uma chave do GitHub (começa com ghp_).'); return; }
      aviso('Conectando…');
      await conectar(t);
      const st = status();
      if (st.erro) aviso(st.erro, null, 8000); else aviso('Conectado! Agora convide o outro celular.');
      pintar((main.innerHTML = '', main));
    });
    return;
  }

  const link = linkConvite();
  main.innerHTML = `<h1>Conectar celulares</h1>
    <section class="cartao">
      <h2><span>Sincronização</span><span class="sub">${s.rodando ? 'sincronizando…' : quando(s.ult)}</span></h2>
      ${s.erro ? `<p class="erro">${esc(s.erro)}</p>` : '<p class="sub">Ligada. Sincroniza ao abrir o app, a cada mudança e a cada 5 minutos.</p>'}
      <button class="btn cheio" type="button" id="agora">Sincronizar agora</button>
    </section>

    <section class="cartao">
      <h2><span>Convidar o celular de ${esc(outra()?.nome || 'outra pessoa')}</span></h2>
      <p class="sub">No celular de ${esc(outra()?.nome || 'outra pessoa')}, abra a <b>câmera</b> e aponte para o QR code. O Finanças abre e pergunta de quem é o celular.</p>
      <div class="qr">${svgQR(link)}</div>
      <details class="tabela"><summary>Sem câmera? Enviar o link</summary>
        <p class="sub">O link leva a chave de acesso. Mande só para ${esc(outra()?.nome || 'a outra pessoa')} e apague a mensagem depois.</p>
        <button class="btn cheio" type="button" id="enviar">Enviar link do convite</button>
      </details>
    </section>

    <section class="cartao">
      <h2><span>Aparelhos conectados</span><span class="sub">${aparelhos.length}</span></h2>
      <ul class="contas">${aparelhos.map(([id, a]) => `<li><span class="conta-nome">Conta ${esc(nomePessoa(a.pessoa))}${id === aparelho().id ? ' <span class="etq">este celular</span>' : ''}<small>${esc(a.modelo || 'Android')} · sincronizou ${esc(quando(a.ult))}</small></span></li>`).join('')}</ul>
      <p class="sub">Perdeu ou trocou um celular? Apague a chave no GitHub (Settings › Developer settings › Personal access tokens), gere outra e conecte de novo os celulares que ficaram.</p>
    </section>

    <button class="btn perigo cheio" type="button" id="desligar">Desconectar este celular</button>`;

  main.querySelector('#agora').onclick = async () => { await sincronizar(); const st = status(); aviso(st.erro || 'Sincronizado.'); pintar((main.innerHTML = '', main)); };
  main.querySelector('#enviar').onclick = async () => {
    try { await navigator.share({ title: 'Convite — Finanças do casal', text: 'Abra no seu celular para conectar o Finanças:', url: link }); }
    catch { try { await navigator.clipboard.writeText(link); aviso('Link copiado.'); } catch { aviso('Não consegui compartilhar o link.'); } }
  };
  main.querySelector('#desligar').onclick = async () => {
    if (!(await confirmar('Desconectar este celular?', 'Os dados continuam neste celular, mas param de sincronizar com o outro.', { sim: 'Desconectar', perigo: true }))) return;
    desconectar(); aviso('Desconectado.'); pintar((main.innerHTML = '', main));
  };
}

function renderConvite(main, c) {
  const conv = lerConvite(c);
  if (!conv) { main.innerHTML = '<h1>Convite inválido</h1><p class="sub">O link ou QR code está incompleto. Gere outro no primeiro celular.</p>'; return; }
  const e = dados();
  main.innerHTML = `<h1>Conectar este celular</h1>
    <p class="sub">Este celular vai juntar as contas com o outro. O que já estiver lançado aqui continua aqui e passa a sincronizar.</p>
    <p class="sub"><b>De quem é este celular?</b></p>
    <div class="quem">${e.pessoas.map((p) => `<button type="button" class="btn quem-btn" data-p="${esc(p.id)}"><span class="avatar" aria-hidden="true">${esc(p.nome.slice(0, 1))}</span><span><b>Conta ${esc(p.nome)}</b></span></button>`).join('')}</div>`;
  main.querySelectorAll('[data-p]').forEach((b) => (b.onclick = async () => {
    definirPessoa(b.dataset.p);
    history.replaceState(null, '', '#/conectar'); // tira a chave do endereço
    aviso('Conectando…');
    await conectar(conv.token, conv.gist);
    const st = status();
    aviso(st.erro || `Pronto! Conta ${nomePessoa(eu())} conectada.`, null, 6000);
    navegar(st.erro ? '#/conectar' : '#/casal');
  }));
}
