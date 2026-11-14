// Pequenos utilitários de interface.
import { mesAtual, somarMeses, nomeMes } from './datas.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const ICONES = {
  voltar: '<path d="M15 5l-7 7 7 7"/>',
  avancar: '<path d="M9 5l7 7-7 7"/>',
  ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  alerta: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  x: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
  ritmo: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
  calendario: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  repetir: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  carteira: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2"/>',
  subiu: '<path d="M4 17l6-6 4 4 6-7"/><path d="M15 8h5v5"/>',
  desceu: '<path d="M4 7l6 6 4-4 6 7"/><path d="M15 16h5v-5"/>',
};
export const icone = (nome, cls = '') => `<svg viewBox="0 0 24 24" aria-hidden="true" class="${cls}">${ICONES[nome]}</svg>`;

/** Cabeçalho com setas para trocar de mês. `rota` é a base (ex.: "#/resumo"). */
export function navMes(rota, mes) {
  const atual = mesAtual();
  return `<div class="mes-nav">
    <a class="btn-icone" href="${rota}?m=${somarMeses(mes, -1)}" aria-label="Mês anterior">${icone('voltar')}</a>
    <h1>${esc(nomeMes(mes, mes.slice(0, 4) !== atual.slice(0, 4)))}</h1>
    ${mes >= atual ? `<button class="btn-icone" disabled aria-label="Próximo mês">${icone('avancar')}</button>`
      : `<a class="btn-icone" href="${rota}?m=${somarMeses(mes, 1)}" aria-label="Próximo mês">${icone('avancar')}</a>`}
  </div>`;
}

/** Aviso rápido no rodapé, com ação opcional (ex.: "Desfazer"). */
export function aviso(texto, acao = null, ms = 5000) {
  const box = document.getElementById('avisos');
  box.replaceChildren(); // só o aviso mais recente fica na tela
  const el = document.createElement('div');
  el.className = 'aviso';
  el.innerHTML = `<span>${esc(texto)}</span>${acao ? `<button type="button">${esc(acao.rotulo)}</button>` : ''}`;
  const fechar = () => el.remove();
  if (acao) el.querySelector('button').onclick = () => { acao.fazer(); fechar(); };
  box.append(el);
  setTimeout(fechar, ms);
}

/** Pergunta sim/não num <dialog>. Devolve uma Promise<boolean>. */
export function confirmar(titulo, texto, { sim = 'Confirmar', nao = 'Cancelar', perigo = false } = {}) {
  return new Promise((ok) => {
    const d = document.createElement('dialog');
    d.innerHTML = `<h2>${esc(titulo)}</h2><p class="sub">${esc(texto)}</p>
      <div class="btn-linha"><button class="btn" value="nao">${esc(nao)}</button><button class="btn ${perigo ? 'perigo' : 'primario'}" value="sim">${esc(sim)}</button></div>`;
    d.querySelectorAll('button').forEach((b) => (b.onclick = () => { d.close(b.value); }));
    d.addEventListener('close', () => { ok(d.returnValue === 'sim'); d.remove(); });
    document.body.append(d);
    d.showModal();
  });
}

/** Baixa um arquivo gerado no aparelho. */
export function baixar(nome, conteudo, tipo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nome });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Vai para uma rota; se já estiver nela, redesenha a tela. */
export function navegar(hash) {
  if (location.hash === hash) dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
}
