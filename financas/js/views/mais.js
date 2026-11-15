// Menu Mais: o que não cabe na barra de baixo.
import { eu, nomePessoa, pendentesAtivos } from '../core/store.js';
import { status } from '../core/nuvem.js';
import { esc } from '../core/ui.js';

export const titulo = 'Mais';

export function render(main) {
  const s = status();
  const n = pendentesAtivos().length;
  const itens = [
    ['#/orcamento', 'Metas', 'Minhas metas e metas do casal'],
    ['#/plano', 'Plano de contas', 'Grupos, contas, o que nasce compartilhado e sugestões'],
    ['#/caixa', 'A confirmar', n ? `${n} lançamento${n > 1 ? 's' : ''} lido${n > 1 ? 's' : ''} das notificações` : 'Gastos lidos das notificações do banco'],
    ['#/captura', 'Captura automática', 'MacroDroid, Compartilhar e apelidos dos cartões'],
    ['#/importar', 'Importar extrato', 'Arquivos OFX ou CSV do banco'],
    ['#/conectar', 'Conectar celulares', s.ligado ? (s.erro ? `Atenção: ${s.erro}` : 'Sincronização ligada') : 'Juntar a Conta Bruno e a Conta Rita'],
    ['#/ajustes', 'Ajustes', 'Tema, cópia de segurança, planilha e conta deste celular'],
  ];
  main.innerHTML = `<p class="conta-de">Conta ${esc(nomePessoa(eu()))}</p><h1>Mais</h1>
    <ul class="lista menu">${itens.map(([h, t, d]) => `<li><a class="item" href="${h}"><span class="txt"><span class="t1">${esc(t)}</span><span class="t2">${esc(d)}</span></span><span aria-hidden="true" class="seta">›</span></a></li>`).join('')}</ul>`;
}
