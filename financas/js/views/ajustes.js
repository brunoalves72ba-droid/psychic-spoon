// Ajustes: categorias, cópia de segurança, planilha, tema e apagar tudo.
import { dados, nomeCategoria, salvarCategoria, apagarCategoria, exportar, importar, apagarTudo } from '../core/store.js';
import { csv, doMes } from '../core/calc.js';
import { mesAtual, hoje } from '../core/datas.js';
import { esc, aviso, confirmar, baixar, navegar } from '../core/ui.js';

export const titulo = 'Ajustes';

export function render(main) {
  const e = dados();
  let tema = 'auto';
  try { tema = localStorage.getItem('fin-tema') || 'auto'; } catch {}
  const usos = (id) => e.lancamentos.filter((l) => l.categoria === id).length;
  const listaCats = (tipo) => e.categorias.filter((c) => c.tipo === tipo).map((c) => `
    <li class="orc-editar" style="grid-template-columns:1fr auto auto"><span>${esc(c.nome)} <span class="muted">· ${usos(c.id)}</span></span>
      <button class="btn" type="button" data-renomear="${esc(c.id)}" style="min-height:40px;padding:6px 12px">Renomear</button>
      <button class="btn perigo" type="button" data-apagar="${esc(c.id)}" style="min-height:40px;padding:6px 12px" aria-label="Apagar ${esc(c.nome)}">Apagar</button></li>`).join('');

  main.innerHTML = `<h1>Ajustes</h1>
    <section class="cartao">
      <h2>Aparência</h2>
      <div class="chips" role="group" aria-label="Tema">
        ${[['auto', 'Automático'], ['claro', 'Claro'], ['escuro', 'Escuro']].map(([v, r]) => `<button type="button" class="chip" data-tema="${v}" aria-pressed="${tema === v}">${r}</button>`).join('')}
      </div>
    </section>

    <section class="cartao">
      <h2>Categorias de gasto</h2>
      <ul style="list-style:none;margin:0;padding:0">${listaCats('despesa')}</ul>
      <h2 style="margin-top:18px">Categorias de entrada</h2>
      <ul style="list-style:none;margin:0;padding:0">${listaCats('receita')}</ul>
      <form id="nova" style="display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:14px">
        <input type="text" name="nome" maxlength="40" placeholder="Nova categoria" aria-label="Nome da nova categoria" required>
        <select name="tipo" aria-label="Tipo da nova categoria"><option value="despesa">Gasto</option><option value="receita">Entrada</option></select>
        <button class="btn primario" type="submit" style="grid-column:1/-1">Adicionar categoria</button>
      </form>
    </section>

    <section class="cartao">
      <h2>Seus dados</h2>
      <p class="sub">Tudo fica guardado só neste aparelho, sem conta e sem internet. Faça uma cópia de vez em quando: se limpar os dados do navegador ou trocar de celular, é ela que traz tudo de volta.</p>
      <div class="btn-linha">
        <button class="btn" type="button" id="exportar">Salvar cópia</button>
        <button class="btn" type="button" id="importar">Restaurar cópia</button>
      </div>
      <input type="file" id="arquivo" accept="application/json,.json" hidden>
      <a class="btn cheio" href="#/importar" style="margin-top:10px">Importar extrato do banco (OFX/CSV)</a>
      <div class="btn-linha" style="margin-top:10px">
        <button class="btn" type="button" id="csv-mes">Planilha do mês</button>
        <button class="btn" type="button" id="csv-tudo">Planilha completa</button>
      </div>
      <p class="sub" style="margin-top:10px">${e.lancamentos.length} lançamento${e.lancamentos.length === 1 ? '' : 's'} guardado${e.lancamentos.length === 1 ? '' : 's'}. A planilha abre no Excel ou no Google Planilhas.</p>
    </section>

    <section class="cartao">
      <h2>Começar do zero</h2>
      <button class="btn perigo cheio" type="button" id="zerar">Apagar todos os dados</button>
    </section>
    <p class="sub" style="text-align:center">Finanças · © Bruno Moura. Todos os direitos reservados.</p>`;

  const $ = (s) => main.querySelector(s);
  const recarregar = () => render((main.innerHTML = '', main));

  main.querySelectorAll('[data-tema]').forEach((b) => (b.onclick = () => {
    const v = b.dataset.tema;
    try { v === 'auto' ? localStorage.removeItem('fin-tema') : localStorage.setItem('fin-tema', v); } catch {}
    if (v === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = v;
    main.querySelectorAll('[data-tema]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));

  main.querySelectorAll('[data-renomear]').forEach((b) => (b.onclick = () => {
    const c = e.categorias.find((x) => x.id === b.dataset.renomear);
    const nome = prompt('Novo nome da categoria:', c.nome);
    if (nome && nome.trim()) { salvarCategoria({ ...c, nome: nome.trim().slice(0, 40) }); recarregar(); }
  }));

  main.querySelectorAll('[data-apagar]').forEach((b) => (b.onclick = async () => {
    const id = b.dataset.apagar;
    const c = e.categorias.find((x) => x.id === id);
    const n = usos(id) + e.recorrentes.filter((r) => r.categoria === id).length;
    if (!n) {
      if (await confirmar('Apagar categoria?', `“${c.nome}” não tem lançamentos.`, { sim: 'Apagar', perigo: true })) { apagarCategoria(id); recarregar(); }
      return;
    }
    const outras = e.categorias.filter((x) => x.tipo === c.tipo && x.id !== id);
    if (!outras.length) { aviso('Crie outra categoria antes de apagar esta.'); return; }
    const d = document.createElement('dialog');
    d.innerHTML = `<h2>Apagar “${esc(c.nome)}”?</h2><p class="sub">Ela tem ${n} lançamento${n > 1 ? 's' : ''}. Para onde eles vão?</p>
      <select aria-label="Mover lançamentos para">${outras.map((o) => `<option value="${esc(o.id)}">${esc(o.nome)}</option>`).join('')}</select>
      <div class="btn-linha" style="margin-top:14px"><button class="btn" value="nao">Cancelar</button><button class="btn perigo" value="sim">Mover e apagar</button></div>`;
    d.querySelectorAll('button').forEach((x) => (x.onclick = () => d.close(x.value)));
    d.addEventListener('close', () => {
      if (d.returnValue === 'sim') { const destino = d.querySelector('select').value; apagarCategoria(id, destino); aviso(`Lançamentos movidos para ${nomeCategoria(destino)}.`); recarregar(); }
      d.remove();
    });
    document.body.append(d); d.showModal();
  }));

  $('#nova').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const nome = ev.target.nome.value.trim();
    if (!nome) return;
    if (e.categorias.some((c) => c.nome.toLowerCase() === nome.toLowerCase() && c.tipo === ev.target.tipo.value)) { aviso('Essa categoria já existe.'); return; }
    salvarCategoria({ nome: nome.slice(0, 40), tipo: ev.target.tipo.value });
    aviso(`Categoria “${nome}” criada.`);
    recarregar();
  });

  $('#exportar').onclick = () => { baixar(`financas-copia-${hoje()}.json`, exportar(), 'application/json'); aviso('Cópia salva na pasta de downloads.'); };
  $('#importar').onclick = () => $('#arquivo').click();
  $('#arquivo').onchange = async (ev) => {
    const arq = ev.target.files[0]; if (!arq) return;
    if (!(await confirmar('Restaurar cópia?', 'Os dados atuais deste aparelho serão substituídos pelos da cópia.', { sim: 'Restaurar' }))) return;
    try { const n = importar(await arq.text()).lancamentos.length; aviso(`Cópia restaurada: ${n} lançamentos.`); recarregar(); }
    catch (err) { aviso(err.message.includes('Finanças') ? err.message : 'Não consegui ler esse arquivo.'); }
  };
  $('#csv-mes').onclick = () => baixar(`financas-${mesAtual()}.csv`, csv(doMes(e, mesAtual()), nomeCategoria), 'text/csv');
  $('#csv-tudo').onclick = () => baixar(`financas-completo-${hoje()}.csv`, csv(e.lancamentos, nomeCategoria), 'text/csv');

  $('#zerar').onclick = async () => {
    if (!(await confirmar('Apagar tudo?', 'Todos os lançamentos, metas e categorias deste aparelho serão apagados. Isso não tem volta — salve uma cópia antes se quiser.', { sim: 'Apagar tudo', perigo: true }))) return;
    apagarTudo(); aviso('Tudo apagado.'); navegar('#/resumo');
  };
}
