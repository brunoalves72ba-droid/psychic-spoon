// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Mesa virtual de seis canais e master, com as seis vozes de um arranjo do app ou as suas gravações.
import { h, top, toast } from '../core/ui.js';
import { kv, listProjects, saveProject } from '../core/store.js';
import { projectBuffers } from '../core/project.js';
import { mesaUI } from '../core/mesa-ui.js';
import { stems } from '../audio/sources.js';
import { defaultState } from '../audio/mixer.js';
import { ARRANGEMENTS } from '../music/arrangements.js';
import { VOICE_NAMES } from '../music/theory.js';

export default async function mesa(el, [srcArg, idArg]) {
  const projects = await listProjects(); let ui = null;
  const box = h('div.col', h('p.muted', 'Preparando as seis vozes…'));
  let src = srcArg === 'projeto' && idArg ? `p:${idArg}` : `a:${srcArg && ARRANGEMENTS.some((a) => a.id === srcArg) ? srcArg : await kv.get('mesa:src', 'aurora')}`;
  const load = async () => {
    if (ui) ui.stop(); box.replaceChildren(h('p.muted', 'Preparando o áudio…'));
    try {
      if (src.startsWith('a:')) { const id = src.slice(2); await kv.set('mesa:src', id); const bufs = await stems(id); const saved = await kv.get('mesa:state:' + id, null); ui = mesaUI({ buffers: bufs, names: VOICE_NAMES, state: saved || defaultState(6), onChange: debounce((s) => kv.set('mesa:state:' + id, s), 600) }); }
      else { const p = projects.find((x) => String(x.id) === src.slice(2)); const { buffers: bufs, names } = p ? await projectBuffers(p) : { buffers: [], names: [] };
        if (!bufs.length) { box.replaceChildren(h('p', 'Este projeto ainda não tem pistas gravadas.'), h('a.btn', { href: '#/estudio/gravador' }, 'Abrir o gravador')); return; }
        ui = mesaUI({ buffers: bufs, names, state: p.mix && p.mix.ch.length === bufs.length ? p.mix : defaultState(bufs.length), missions: false, onChange: debounce((s) => { p.mix = s; saveProject(p); }, 800) }); }
      box.replaceChildren(ui.el);
    } catch (e) { box.replaceChildren(h('p', 'Não consegui preparar o áudio: ' + (e.message || e))); }
  };
  await load();
  el.append(top('Mesa virtual', '#/estudio'),
    h('label.field', 'O que entra na mesa', h('select', { onchange: (e) => { src = e.target.value; load(); } }, h('optgroup', { label: 'Arranjos do app (vozes sintetizadas)' }, ARRANGEMENTS.map((a) => h('option', { value: 'a:' + a.id, selected: src === 'a:' + a.id }, a.title))), projects.length ? h('optgroup', { label: 'Minhas gravações' }, projects.map((p) => h('option', { value: 'p:' + p.id, selected: src === 'p:' + p.id }, p.name))) : null)),
    box, h('p.small.muted', 'Em pé, deslize para trocar de canal. Com o celular deitado, a mesa inteira aparece em cima.'));
  void toast;
  return () => ui && ui.stop();
}
function debounce(fn, ms) { let t = 0; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
