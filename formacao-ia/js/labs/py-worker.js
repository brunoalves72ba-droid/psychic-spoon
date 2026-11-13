// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Python de bolso: MicroPython (WebAssembly) rodando num Web Worker, para um laço infinito não travar a tela.
import { loadMicroPython } from '../../assets/micropython/micropython.mjs';
import { HARNESS } from './py-harness.js';

const saida = [];
const pronto = loadMicroPython({ stdout: (l) => saida.push(l), stderr: (l) => saida.push(l), linebuffer: true });

self.onmessage = async (e) => {
  const { id, codigo, entradas, depois, eco } = e.data;
  let mp;
  try { mp = await pronto; } catch (err) { self.postMessage({ id, texto: 'Não deu para iniciar o Python: ' + err.message, erro: true }); return; }
  saida.length = 0;
  mp.globals.set('_src', String(codigo));
  mp.globals.set('_ent', JSON.stringify((entradas || []).map(String)));
  mp.globals.set('_dep', depois || '');
  mp.globals.set('_eco', !!eco);
  let erro = false, dep = '';
  try { mp.runPython(HARNESS); erro = mp.globals.get('_res') === 'erro'; dep = mp.globals.get('_depr'); }
  catch (err) { saida.push(String(err && err.message || err)); erro = true; }
  self.postMessage({ id, texto: saida.join('\n'), erro, dep });
};
