// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Dados e backup: exportar e importar tudo, espaço usado e gravações.
import { h, top, fmt, fmtDate, fmtDur, toast, confirmSheet, shareOrDownload } from '../core/ui.js';
import { exportAll, importAll, usage, listRecordings, getRecordingPcm, deleteRecording, wipeAll, SCHEMA, askPersist } from '../core/store.js';
import { playPcm, unlock, stopAll } from '../audio/engine.js';
import { encodeWav } from '../audio/wav.js';

const mb = (b) => (b == null ? '—' : b < 1048576 ? `${fmt(b / 1024)} kB` : `${fmt(b / 1048576, 1)} MB`);
export default async function backup(el) {
  const useEl = h('div.col'), recEl = h('div.list');
  const paint = async () => {
    const u = await usage(), recs = await listRecordings();
    useEl.replaceChildren(h('div.stats', h('div.stat', h('b', mb(u.used)), h('span', 'usados pelo app')), h('div.stat', h('b', mb(u.recBytes)), h('span', `${u.recCount} ${u.recCount === 1 ? 'gravação' : 'gravações'}`)), h('div.stat', h('b', u.quota ? mb(u.quota) : '—'), h('span', 'disponível'))),
      h('p.small.muted', u.persisted === true ? 'Armazenamento persistente: o navegador não apaga seus dados para liberar espaço.' : u.persisted === false ? 'O navegador ainda pode apagar os dados se faltar espaço. Instalar o app na tela inicial e fazer backup reduz esse risco.' : 'Este navegador não informa se o armazenamento é persistente.'),
      u.persisted === false ? h('button.btn.small', { onclick: async () => { await askPersist(); let ok = false; try { ok = await navigator.storage.persist(); } catch {} toast(ok ? 'Armazenamento persistente ativado.' : 'O navegador não concedeu agora. Instale o app e tente de novo.'); paint(); } }, 'Pedir armazenamento persistente') : null);
    recEl.replaceChildren(...(recs.length ? recs.map((r) => h('div.card.tight.col', h('div.row.between', h('b', r.name), h('span.small.muted', `${fmtDur(r.length / r.sampleRate)} · ${mb(r.bytes)}`)), h('span.small.muted', `${fmtDate(r.ts)} · ${r.kind}`),
      h('div.row.wrap', h('button.btn.small', { onclick: async () => { await unlock(); stopAll(); playPcm(await getRecordingPcm(r.id), r.sampleRate); } }, '▶ Ouvir'), h('button.btn.small', { onclick: async () => { const pcm = await getRecordingPcm(r.id); await shareOrDownload(encodeWav([pcm], r.sampleRate), `${r.name.replace(/[^\w\-À-ú ]+/g, '').trim() || 'gravacao'}.wav`, r.name); } }, 'WAV'), h('button.btn.small.danger', { onclick: async () => { if (await confirmSheet(`Apagar a gravação “${r.name}”? Isso não pode ser desfeito.`, 'Apagar')) { await deleteRecording(r.id); toast('Gravação apagada.'); paint(); } } }, 'Apagar')))) : [h('p.muted', 'Nenhuma gravação ainda.')]));
  };
  await paint();
  const file = h('input', { type: 'file', accept: '.json,application/json', class: 'sr', onchange: async () => {
    const f = file.files[0]; if (!f) return;
    try { const data = JSON.parse(await f.text()); if (!(await confirmSheet(`Importar o backup de ${data.exportedAt ? new Date(data.exportedAt).toLocaleDateString('pt-BR') : 'data desconhecida'}? Tudo o que está neste aparelho será substituído.`, 'Importar'))) return; const r = await importAll(data); toast(`Importado: ${r.events} registros e ${r.recordings} gravações.`); paint(); }
    catch (e) { toast(e.message || 'Arquivo inválido.'); }
    file.value = '';
  } });
  el.append(top('Dados e backup', '#/evolucao'),
    h('section.card.col', h('h3', 'Espaço'), useEl),
    h('section.card.col', h('h3', 'Backup'), h('p.small.dim', `Um arquivo com tudo: histórico, preferências, projetos e gravações. Esquema versão ${SCHEMA}; backups antigos são convertidos ao importar.`),
      h('button.btn.primary', { onclick: async () => { const data = await exportAll(); const blob = new Blob([JSON.stringify(data)], { type: 'application/json' }); const how = await shareOrDownload(blob, `sexteto-backup-${new Date().toISOString().slice(0, 10)}.json`, 'Backup do Sexteto'); if (how !== 'cancel') toast('Backup gerado.'); } }, 'Exportar tudo'),
      h('button.btn', { onclick: () => file.click() }, 'Importar de um arquivo'), file),
    h('h2', 'Gravações'), recEl,
    h('section.card.col', h('h3', 'Apagar tudo'), h('p.small.dim', 'Remove histórico, preferências e gravações deste aparelho.'), h('button.btn.danger', { onclick: async () => { if (await confirmSheet('Apagar todos os dados do Sexteto neste aparelho? Faça um backup antes: isso não pode ser desfeito.', 'Apagar tudo')) { await wipeAll(); toast('Dados apagados.'); paint(); } } }, 'Apagar todos os dados')),
    h('p.small.muted', 'Seus dados e gravações ficam só neste aparelho.'));
  return () => stopAll();
}
