// Plano de contas: contas agrupadas, sugestões de preenchimento e gestão das contas.
import { compartilharSempre, compartilhaPorPadrao, outra, dados, nomeCategoria, salvarCategoria, apagarCategoria, criarContaDoPlano, ensinar, virarContaFixa, dispensarSugestao } from '../core/store.js';
import { GRUPOS, CONTAS, nomeGrupo, grupoDaCategoria, sugestoesPlano } from '../core/plano.js';
import { doMes } from '../core/calc.js';
import { reais } from '../core/dinheiro.js';
import { mesAtual } from '../core/datas.js';
import { esc, aviso, confirmar } from '../core/ui.js';

export const titulo = 'Plano de contas';

/** <select> com as contas agrupadas (optgroup por grupo). */
export function opcoesAgrupadas(estado, tipo, selecionada = '') {
  return GRUPOS.filter((g) => g.tipo === tipo).map((g) => {
    const cats = estado.categorias.filter((c) => c.tipo === tipo && grupoDaCategoria(c) === g.id);
    return cats.length ? `<optgroup label="${esc(g.nome)}">${cats.map((c) => `<option value="${esc(c.id)}"${c.id === selecionada ? ' selected' : ''}>${esc(c.nome)}</option>`).join('')}</optgroup>` : '';
  }).join('');
}

export function render(main) {
  const e = dados();
  const sug = sugestoesPlano(e);
  const mes = mesAtual();
  const gastoMes = {};
  for (const l of doMes(e, mes)) gastoMes[l.categoria] = (gastoMes[l.categoria] || 0) + l.valor;
  const usos = {};
  for (const l of e.lancamentos) usos[l.categoria] = (usos[l.categoria] || 0) + 1;

  const cartaoSug = [];
  for (const s of sug.criar) {
    cartaoSug.push(`<li class="sug" data-chave="criar:${esc(s.conta.id)}">
      <p class="sug-tit">Criar a conta <b>${esc(s.conta.nome)}</b> <span class="muted">em ${esc(nomeGrupo(s.conta.grupo))}</span></p>
      <p class="sub">${s.lancamentos.length} lançamentos somando ${reais(s.total)} estão hoje em “${esc(nomeCategoria(e.lancamentos.find((l) => l.id === s.lancamentos[0])?.categoria))}”. Ex.: ${s.exemplos.map((x) => `“${esc(x)}”`).join(', ')}.</p>
      <div class="btn-linha"><button class="btn" type="button" data-dispensar>Agora não</button><button class="btn primario" type="button" data-criar="${esc(s.conta.id)}">Criar e mover</button></div>
    </li>`);
  }
  for (const s of sug.classificar) {
    cartaoSug.push(`<li class="sug" data-chave="classificar:${esc(s.chave)}">
      <p class="sug-tit"><b>“${esc(s.descricao)}”</b> aparece ${s.lancamentos.length} vezes sem conta definida</p>
      <p class="sub">Somam ${reais(s.total)}. Escolha a conta e o app passa a reconhecer sozinho nas próximas vezes.</p>
      <select data-classificar-sel aria-label="Conta para ${esc(s.descricao)}">${opcoesAgrupadas(e, s.tipo, s.tipo === 'despesa' ? 'outros' : 'outras-receitas')}</select>
      <div class="btn-linha" style="margin-top:8px"><button class="btn" type="button" data-dispensar>Agora não</button><button class="btn primario" type="button" data-classificar="${esc(s.chave)}">Classificar</button></div>
    </li>`);
  }
  for (const f of sug.fixas) {
    cartaoSug.push(`<li class="sug" data-chave="fixa:${esc(f.chave)}">
      <p class="sug-tit"><b>${esc(f.descricao)}</b> parece uma conta fixa</p>
      <p class="sub">${reais(f.valor)} todo mês há ${f.meses} meses, por volta do dia ${f.dia}. Como conta fixa, ela entra sozinha e aparece na previsão do mês.</p>
      <div class="btn-linha"><button class="btn" type="button" data-dispensar>Agora não</button><button class="btn primario" type="button" data-fixa="${esc(f.chave)}">Virar conta fixa</button></div>
    </li>`);
  }

  const grupos = GRUPOS.map((g) => {
    const cats = e.categorias.filter((c) => grupoDaCategoria(c) === g.id);
    const total = cats.reduce((s, c) => s + (gastoMes[c.id] || 0), 0);
    const modelos = CONTAS.filter((c) => c.grupo === g.id && !e.categorias.some((x) => x.id === c.id));
    return `<section class="cartao grupo" data-grupo="${g.id}">
      <h2><span>${esc(g.nome)}</span><span class="sub">${total ? `${reais(total)} no mês` : ''}</span></h2>
      ${cats.length ? `<ul class="contas">${cats.map((c) => `<li>
        <span class="conta-nome">${esc(c.nome)}<small>${usos[c.id] ? `${usos[c.id]} lançamento${usos[c.id] > 1 ? 's' : ''}` : 'sem lançamentos'}${gastoMes[c.id] ? ` · ${reais(gastoMes[c.id])} no mês` : ''}</small></span>
        <span class="conta-acoes">${c.tipo === 'despesa' && g.id !== 'transferencias' ? `<button class="btn mini sempre" type="button" data-sempre="${esc(c.id)}" aria-pressed="${compartilhaPorPadrao(c.id)}" title="Lançamentos desta conta já nascem compartilhados com ${esc(outra()?.nome || 'o casal')}">${compartilhaPorPadrao(c.id) ? '👥 Sempre compartilhar' : 'Compartilhar sempre?'}</button>` : ''}<button class="btn mini" type="button" data-renomear="${esc(c.id)}">Renomear</button><button class="btn mini perigo" type="button" data-apagar="${esc(c.id)}" aria-label="Apagar ${esc(c.nome)}">Apagar</button></span>
      </li>`).join('')}</ul>` : '<p class="sub">Nenhuma conta neste grupo.</p>'}
      <details class="add-conta"><summary>Adicionar conta em ${esc(g.nome)}</summary>
        <div class="chips" style="margin:10px 0">${modelos.map((m) => `<button type="button" class="chip" data-modelo="${esc(m.id)}">+ ${esc(m.nome)}</button>`).join('')}</div>
        <form data-nova="${g.id}" class="linha-form"><input type="text" name="nome" maxlength="40" placeholder="Outra conta (digite o nome)" aria-label="Nome da nova conta em ${esc(g.nome)}"><button class="btn" type="submit">Criar</button></form>
      </details>
    </section>`;
  }).join('');

  main.innerHTML = `<h1>Plano de contas</h1>
    <p class="sub">Plano de contas pessoal, organizado por grupo. Em cada conta de gasto você escolhe se os lançamentos dela já nascem <b>compartilhados</b> com ${esc(outra()?.nome || 'o casal')} (ex.: Aluguel, Mercado, Energia). O app reconhece os lançamentos pela descrição e sugere como completar o plano a partir do que você gasta.</p>
    <section class="cartao destaque">
      <h2><span>Sugestões para o seu plano</span><span class="sub">${sug.total || ''}</span></h2>
      ${cartaoSug.length ? `<ul class="sugs">${cartaoSug.join('')}</ul>` : `<p class="sub">Nenhuma sugestão agora. Elas aparecem quando o app encontra gastos repetidos que caberiam numa conta própria, descrições que ele ainda não sabe classificar ou gastos que se repetem todo mês.</p>`}
    </section>
    ${grupos}`;

  const recarregar = () => render((main.innerHTML = '', main));
  const cartao = (b) => b.closest('.sug');

  main.querySelectorAll('[data-dispensar]').forEach((b) => (b.onclick = () => { dispensarSugestao(cartao(b).dataset.chave); recarregar(); }));
  main.querySelectorAll('[data-criar]').forEach((b) => (b.onclick = () => {
    const s = sug.criar.find((x) => x.conta.id === b.dataset.criar);
    criarContaDoPlano(s.conta.id, s.lancamentos);
    aviso(`Conta “${s.conta.nome}” criada com ${s.lancamentos.length} lançamentos.`);
    recarregar();
  }));
  main.querySelectorAll('[data-classificar]').forEach((b) => (b.onclick = () => {
    const s = sug.classificar.find((x) => x.chave === b.dataset.classificar);
    const cat = cartao(b).querySelector('select').value;
    ensinar(s.tipo, s.descricao, cat, s.lancamentos);
    aviso(`“${s.descricao}” agora vai para ${nomeCategoria(cat)}.`);
    recarregar();
  }));
  main.querySelectorAll('[data-fixa]').forEach((b) => (b.onclick = () => {
    const f = sug.fixas.find((x) => x.chave === b.dataset.fixa);
    virarContaFixa(f);
    aviso(`${f.descricao} virou conta fixa.`);
    recarregar();
  }));

  main.querySelectorAll('[data-modelo]').forEach((b) => (b.onclick = () => {
    const m = CONTAS.find((c) => c.id === b.dataset.modelo);
    criarContaDoPlano(m.id);
    aviso(`Conta “${m.nome}” criada. Lançamentos novos com ${m.kw ? 'as palavras dela' : 'esse nome'} entram nela sozinhos.`);
    recarregar();
  }));
  main.querySelectorAll('form[data-nova]').forEach((f) => f.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const nome = f.nome.value.trim();
    if (!nome) return;
    const grupo = f.dataset.nova;
    const tipo = GRUPOS.find((g) => g.id === grupo).tipo;
    if (e.categorias.some((c) => c.tipo === tipo && c.nome.toLowerCase() === nome.toLowerCase())) { aviso('Essa conta já existe.'); return; }
    salvarCategoria({ nome: nome.slice(0, 40), tipo, grupo });
    aviso(`Conta “${nome}” criada.`);
    recarregar();
  }));

  main.querySelectorAll('[data-sempre]').forEach((b) => (b.onclick = () => {
    const sim = b.getAttribute('aria-pressed') !== 'true';
    compartilharSempre(b.dataset.sempre, sim);
    aviso(sim ? `Novos lançamentos de “${nomeCategoria(b.dataset.sempre)}” já nascem compartilhados.` : `“${nomeCategoria(b.dataset.sempre)}” volta a nascer privado.`);
    recarregar();
  }));
  main.querySelectorAll('[data-renomear]').forEach((b) => (b.onclick = () => {
    const c = e.categorias.find((x) => x.id === b.dataset.renomear);
    const nome = prompt('Novo nome da conta:', c.nome);
    if (nome && nome.trim()) { salvarCategoria({ ...c, nome: nome.trim().slice(0, 40) }); recarregar(); }
  }));
  main.querySelectorAll('[data-apagar]').forEach((b) => (b.onclick = async () => {
    const id = b.dataset.apagar;
    const c = e.categorias.find((x) => x.id === id);
    const n = (usos[id] || 0) + e.recorrentes.filter((r) => r.categoria === id).length;
    if (!n) {
      if (await confirmar('Apagar conta?', `“${c.nome}” não tem lançamentos.`, { sim: 'Apagar', perigo: true })) { apagarCategoria(id); recarregar(); }
      return;
    }
    const outras = e.categorias.filter((x) => x.tipo === c.tipo && x.id !== id);
    if (!outras.length) { aviso('Crie outra conta antes de apagar esta.'); return; }
    const d = document.createElement('dialog');
    d.innerHTML = `<h2>Apagar “${esc(c.nome)}”?</h2><p class="sub">Ela tem ${n} lançamento${n > 1 ? 's' : ''}. Para qual conta eles vão?</p>
      <select aria-label="Mover lançamentos para">${opcoesAgrupadas({ categorias: outras }, c.tipo)}</select>
      <div class="btn-linha" style="margin-top:14px"><button class="btn" value="nao">Cancelar</button><button class="btn perigo" value="sim">Mover e apagar</button></div>`;
    d.querySelectorAll('button').forEach((x) => (x.onclick = () => d.close(x.value)));
    d.addEventListener('close', () => {
      if (d.returnValue === 'sim') { const destino = d.querySelector('select').value; apagarCategoria(id, destino); aviso(`Lançamentos movidos para ${nomeCategoria(destino)}.`); recarregar(); }
      d.remove();
    });
    document.body.append(d); d.showModal();
  }));
}
