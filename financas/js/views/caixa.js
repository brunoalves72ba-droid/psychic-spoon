// Caixa "A confirmar": gastos e entradas lidos das notificações, esperando um ✔.
import { outra, compartilhaPorPadrao, rateioPadrao, dados, pendentesAtivos, confirmarPendente, descartarPendente, reconsiderarPendente, receberNotificacao, nomeCategoria, nomeCartao, apagarLancamento } from '../core/store.js';
import { PAGAMENTOS } from '../core/calc.js';
import { reconhecer } from '../core/plano.js';
import { dividirParcelas } from '../core/notificacoes.js';
import { reais, digitosParaCentavos } from '../core/dinheiro.js';
import { nomeDia, nomeMesCurto } from '../core/datas.js';
import { esc, aviso, icone } from '../core/ui.js';
import { opcoesAgrupadas } from './plano.js';

export const titulo = 'A confirmar';

const hora = (iso) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
/** "Nubank •1234", "Itaú do Bruno" ou só o banco, sem repetir o nome. */
const origem = (p) => {
  const banco = p.lido.banco || p.app || 'Notificação';
  if (!p.lido.cartao) return banco;
  const c = nomeCartao(p.lido.cartao);
  return c.startsWith(banco) ? c : `${banco} · ${c}`;
};
const br = (d) => d.split('-').reverse().join('/');

export function render(main, params = {}) {
  const e = dados();
  if (!params.msg) try { params = { ...params, msg: sessionStorage.getItem('fin-msg-caixa') || '' }; sessionStorage.removeItem('fin-msg-caixa'); } catch {}
  const ativos = pendentesAtivos().sort((a, b) => b.recebidoEm.localeCompare(a.recebidoEm));
  const ignorados = e.pendentes.filter((p) => p.lido.ignorar).sort((a, b) => b.recebidoEm.localeCompare(a.recebidoEm));
  const porque = (p) => ({ regra: 'você ensinou', historico: 'como da última vez', nome: 'pelo nome da conta', palavra: `por “${p.reconhecido?.palavra}”`, padrao: 'a classificar: escolha a conta' }[p.reconhecido?.fonte] || '');

  const cartao = (p) => {
    const l = p.lido;
    const partes = l.parcelas > 1 ? dividirParcelas(l) : null;
    return `<li class="pend${p.reconhecido?.fonte === 'padrao' ? ' a-classificar' : ''}" data-id="${esc(p.id)}">
      <div class="pend-cab"><span>${esc(origem(p))}</span><span>${esc(nomeDia(p.recebidoEm.slice(0, 10)))} ${hora(p.recebidoEm)}</span></div>
      <p class="pend-texto">${esc(p.texto)}</p>
      <div class="alternar mini" role="group" aria-label="Tipo">
        <button type="button" data-tipo="despesa" aria-pressed="${l.tipo === 'despesa'}">Gasto</button>
        <button type="button" data-tipo="receita" aria-pressed="${l.tipo === 'receita'}">Entrada</button>
      </div>
      <div class="pend-campos">
        <label class="campo"><span>Valor${partes ? ' total' : ''}</span><input type="text" inputmode="numeric" data-campo="valor" value="${reais(l.valor)}"></label>
        <label class="campo"><span>Data</span><input type="date" data-campo="data" value="${esc(l.data)}"></label>
      </div>
      <label class="campo"><span>Descrição</span><input type="text" data-campo="descricao" maxlength="120" value="${esc(l.descricao)}"></label>
      <label class="campo"><span>Conta <small class="muted">${esc(porque(p))}</small></span><select data-campo="categoria">${opcoesAgrupadas(e, l.tipo, p.categoria)}</select></label>
      ${l.tipo === 'despesa' ? `<label class="campo"><span>Como pagou</span><select data-campo="pagamento">${PAGAMENTOS.map((x) => `<option${x === l.pagamento ? ' selected' : ''}>${x}</option>`).join('')}</select></label>` : ''}
      <label class="marcar compartilhar"><input type="checkbox" data-campo="compartilhado" ${compartilhaPorPadrao(p.categoria) ? 'checked' : ''}><span><b>Compartilhar com ${esc(outra()?.nome || 'o casal')}</b></span></label>
      ${l.tipo === 'despesa' ? (() => { const r = rateioPadrao(l.descricao).rateio; return `<label class="campo rateio-caixa"><span>De quem é</span><select data-campo="rateio">
        <option value="dividir"${r === 'dividir' ? ' selected' : ''}>Dos dois (dividir no acerto)</option>
        <option value="meu"${r === 'meu' ? ' selected' : ''}>Só meu (fora do acerto)</option>
        <option value="outro"${r === 'outro' ? ' selected' : ''}>Só de ${esc(outra()?.nome || 'quem divide comigo')} (volta para mim)</option></select></label>`; })() : ''}
      ${partes ? `<p class="parcelas">${icone('calendario')}<span>Parcelado em <b>${l.parcelas}x de ${reais(partes[1].valor)}</b>: entra uma parcela por mês, de ${nomeMesCurto(partes[0].data.slice(0, 7))}/${partes[0].data.slice(2, 4)} a ${nomeMesCurto(partes[partes.length - 1].data.slice(0, 7))}/${partes[partes.length - 1].data.slice(2, 4)}.</span></p>` : ''}
      <div class="btn-linha"><button class="btn" type="button" data-descartar>Descartar</button><button class="btn primario" type="button" data-confirmar>✔ Confirmar</button></div>
    </li>`;
  };

  main.innerHTML = `<h1>A confirmar</h1>
    ${params.msg ? `<p class="cartao recebido">${esc(params.msg)}</p>` : ''}
    ${ativos.length ? `
      <div class="caixa-topo"><p class="sub">${ativos.length} lançamento${ativos.length > 1 ? 's' : ''} lido${ativos.length > 1 ? 's' : ''} das notificações. Confira e confirme.</p>
        ${ativos.length > 1 ? `<button class="btn primario" type="button" id="todos">✔ Confirmar todos (${ativos.length})</button>` : ''}</div>
      <ul class="pends">${ativos.map(cartao).join('')}</ul>`
    : `<div class="cartao vazio">${icone('ok')}<h2>Nada para confirmar</h2>
        <p class="sub">Quando chegar a notificação de uma compra, ela aparece aqui pronta para você confirmar.</p>
        <a class="btn" href="#/captura">Configurar a captura automática</a></div>`}

    <details class="cartao colar">
      <summary>Colar o texto de uma notificação</summary>
      <p class="sub" style="margin-top:8px">Copie o texto de uma notificação ou SMS do banco e cole aqui. Também serve para testar a leitura.</p>
      <textarea id="colado" rows="3" placeholder="Ex.: Compra aprovada no cartão final 1234 de R$ 89,90 em DROGASIL"></textarea>
      <button class="btn cheio" type="button" id="ler" style="margin-top:8px">Ler e pôr na caixa</button>
    </details>

    ${ignorados.length ? `<details class="cartao">
      <summary>Ignoradas (${ignorados.length}) <span class="muted">— recusadas, estornos, faturas…</span></summary>
      <ul class="pends ign">${ignorados.map((p) => `<li data-id="${esc(p.id)}">
        <p class="pend-texto">${esc(p.texto)}</p>
        <p class="sub"><span class="etq">${esc(p.lido.ignorar)}</span> · ${esc(nomeDia(p.recebidoEm.slice(0, 10)))} ${hora(p.recebidoEm)}</p>
        <div class="btn-linha"><button class="btn mini" type="button" data-descartar>Apagar</button><button class="btn mini" type="button" data-reconsiderar>Lançar mesmo assim</button></div>
      </li>`).join('')}</ul>
    </details>` : ''}`;

  const recarregar = (msg) => render((main.innerHTML = '', main), msg ? { msg } : {});
  const item = (el) => el.closest('[data-id]');
  const pend = (id) => dados().pendentes.find((p) => p.id === id);

  /** Lê os campos do cartão (o que a pessoa ajustou). */
  const ajustes = (li) => {
    const p = pend(li.dataset.id);
    const a = { tipo: p.lido.tipo };
    const tipoSel = li.querySelector('[data-tipo][aria-pressed=true]');
    if (tipoSel) a.tipo = tipoSel.dataset.tipo;
    li.querySelectorAll('[data-campo]').forEach((c) => {
      const k = c.dataset.campo;
      if (k === 'valor') a.valor = digitosParaCentavos(c.value) || p.lido.valor;
      else if (k === 'compartilhado') a.compartilhado = c.checked;
      else a[k] = c.value.trim();
    });
    if (a.tipo === 'receita') a.pagamento = '';
    return a;
  };

  main.querySelectorAll('.pend').forEach((li) => {
    const p = pend(li.dataset.id);
    // valor com máscara de caixa eletrônico
    const v = li.querySelector('[data-campo=valor]');
    v.addEventListener('input', () => { const c = digitosParaCentavos(v.value); v.value = c ? reais(c) : ''; });
    // trocar o tipo refaz a lista de contas
    li.querySelectorAll('[data-tipo]').forEach((b) => (b.onclick = () => {
      li.querySelectorAll('[data-tipo]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const tipo = b.dataset.tipo;
      const r = reconhecer(li.querySelector('[data-campo=descricao]').value, tipo, dados());
      li.querySelector('[data-campo=categoria]').innerHTML = opcoesAgrupadas(dados(), tipo, r.categoria);
      const pag = li.querySelector('[data-campo=pagamento]');
      if (pag) pag.closest('label').hidden = tipo === 'receita';
    }));
    // descrição nova → reconhece a conta de novo (se a pessoa ainda não escolheu outra)
    let contaMexida = false;
    li.querySelector('[data-campo=categoria]').addEventListener('change', () => { contaMexida = true; });
    li.querySelector('[data-campo=descricao]').addEventListener('change', (ev) => {
      if (contaMexida) return;
      const tipo = li.querySelector('[data-tipo][aria-pressed=true]')?.dataset.tipo || p.lido.tipo;
      li.querySelector('[data-campo=categoria]').value = reconhecer(ev.target.value, tipo, dados()).categoria;
    });
  });

  main.querySelectorAll('[data-confirmar]').forEach((b) => (b.onclick = () => {
    const li = item(b);
    const a = ajustes(li);
    const ids = confirmarPendente(li.dataset.id, a);
    aviso(`${ids.length > 1 ? `${ids.length} parcelas lançadas` : 'Lançado'} em ${nomeCategoria(a.categoria)}.`, { rotulo: 'Desfazer', fazer: () => { ids.forEach(apagarLancamento); aviso('Desfeito. O lançamento saiu do extrato.'); } });
    recarregar();
  }));
  main.querySelectorAll('[data-descartar]').forEach((b) => (b.onclick = () => { descartarPendente(item(b).dataset.id); recarregar(); }));
  main.querySelectorAll('[data-reconsiderar]').forEach((b) => (b.onclick = () => { reconsiderarPendente(item(b).dataset.id); recarregar('Voltou para a caixa como lançamento.'); }));
  main.querySelector('#todos')?.addEventListener('click', () => {
    let n = 0;
    main.querySelectorAll('.pend').forEach((li) => { n += confirmarPendente(li.dataset.id, ajustes(li)).length ? 1 : 0; });
    aviso(`${n} lançamento${n > 1 ? 's' : ''} confirmado${n > 1 ? 's' : ''}.`);
    recarregar();
  });
  main.querySelector('#ler').addEventListener('click', () => {
    const t = main.querySelector('#colado').value.trim();
    if (!t) return;
    const r = receberNotificacao(t, { app: '' });
    recarregar(r.status === 'novo' ? (r.pendente.lido.ignorar ? `Lido, mas ignorado: ${r.pendente.lido.ignorar}.` : `Lido: ${reais(r.pendente.lido.valor)} em ${r.pendente.lido.descricao}.`)
      : r.status === 'repetido' ? 'Esse texto já tinha chegado há pouco.' : 'Não encontrei um valor em reais nesse texto.');
  });
}
