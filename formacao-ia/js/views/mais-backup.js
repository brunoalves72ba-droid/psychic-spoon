// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Backup: exportar tudo num arquivo JSON e restaurar em outro aparelho.
import { h, top, toast, shareOrDownload, confirmSheet } from '../core/ui.js';
import { exportar, importar } from '../core/estado.js';
import { hoje } from '../core/dia.js';
import { redesenhar } from '../app.js';

export default async function (el) {
  const arq = h('input.inp', { type: 'file', accept: '.json,application/json', 'aria-label': 'Arquivo de backup' });
  el.append(top('Backup', '#/mais/ajustes'),
    h('p.dim', 'O arquivo leva tudo: progresso, cartões, histórico de revisões, diário, ficha técnica, prompts e ajustes.'),
    h('button.btn.primary.block', { type: 'button', onclick: async () => {
      const dados = await exportar();
      const r = await shareOrDownload(new Blob([JSON.stringify(dados)], { type: 'application/json' }), `formacao-ia-backup-${hoje()}.json`, 'Backup do Formação IA');
      if (r !== 'cancel') toast('Backup pronto. Guarde num lugar seguro (Drive, e-mail para você mesmo).');
    } }, 'Exportar backup'),
    h('section.card.flat.col', h('h3', 'Restaurar'), h('p.small.dim', 'Substitui tudo o que está neste aparelho pelo conteúdo do arquivo.'), arq,
      h('button.btn.block', { type: 'button', onclick: async () => {
        const f = arq.files[0]; if (!f) { toast('Escolha o arquivo primeiro.'); return; }
        let obj; try { obj = JSON.parse(await f.text()); } catch { toast('Este arquivo não é um JSON válido.'); return; }
        if (!(await confirmSheet('Substituir todos os dados deste aparelho pelos do backup?', 'Restaurar'))) return;
        try { await importar(obj); toast('Backup restaurado.'); location.hash = '#/hoje'; redesenhar(); } catch (e) { toast(e.message); }
      } }, 'Restaurar este arquivo')));
}
