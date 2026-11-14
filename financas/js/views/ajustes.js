// Ajustes: categorias, cópia de segurança, planilha, tema e apagar tudo.
import { dados, nomeCategoria, exportar, importar, apagarTudo } from '../core/store.js';
import { csv, doMes } from '../core/calc.js';
import { mesAtual, hoje } from '../core/datas.js';
import { esc, aviso, confirmar, baixar, navegar } from '../core/ui.js';

export const titulo = 'Ajustes';

export function render(main) {
  const e = dados();
  let tema = 'auto';
  try { tema = localStorage.getItem('fin-tema') || 'auto'; } catch {}

  main.innerHTML = `<h1>Ajustes</h1>
    <section class="cartao">
      <h2>Aparência</h2>
      <div class="chips" role="group" aria-label="Tema">
        ${[['auto', 'Automático'], ['claro', 'Claro'], ['escuro', 'Escuro']].map(([v, r]) => `<button type="button" class="chip" data-tema="${v}" aria-pressed="${tema === v}">${r}</button>`).join('')}
      </div>
    </section>

    <section class="cartao">
      <h2>Plano de contas</h2>
      <p class="sub">Contas organizadas em grupos (Moradia, Alimentação, Transporte…), sugestões de contas novas a partir dos seus gastos e o que o app já aprendeu a reconhecer.</p>
      <a class="btn cheio" href="#/plano">Abrir plano de contas</a>
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
