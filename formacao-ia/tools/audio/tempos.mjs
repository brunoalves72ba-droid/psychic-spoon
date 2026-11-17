// Tempos de cada parágrafo do áudio das aulas (para grifar o texto enquanto a voz lê).
// Roda uma vez no computador, sobre os MP3 que já existem: não gera áudio nem gasta créditos.
// 1. acha o começo de cada parte (as mesmas regras do app: a pausa mais longa perto da estimativa);
// 2. dentro de cada parte, divide o tempo pelos caracteres falados de cada parágrafo;
// 3. puxa o começo de cada parágrafo para a pausa de silêncio mais próxima (até 1,5 s);
// 4. aplica por cima os ajustes manuais de audio/tempos-ajustes.json (preservados a cada rodada).
// Saída: audio/tempos.json  { "1.1": { "passo-0": [["tit", 0], ["gancho", 3.4]], ... } }
// Uso: node tools/audio/tempos.mjs --modulo 1   |   --aula 1.3   |   (sem nada: todas as aulas com áudio)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ORDEM, licao, moduloDe } from '../../js/data/curso.js';
import { energia, silencios, ajustarCortes } from '../../js/core/cortes.js';
import { unidadesDaAula, textoPuro } from './ssml.mjs';

const raiz = fileURLToPath(new URL('../../', import.meta.url));
const TAXA = 16000, PASSO = 0.02, JANELA = 1.5;
const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : null; };

/** Começo de cada parágrafo dentro de uma parte: proporcional aos caracteres e puxado para o silêncio mais próximo. */
export function temposDaParte(unidades, ini, fim, sil) {
  const pesos = unidades.map((u) => Math.max(1, textoPuro(u.ssml).length));
  const total = pesos.reduce((a, b) => a + b, 0);
  const out = []; let acum = 0;
  unidades.forEach((u, i) => {
    let t = ini + ((fim - ini) * acum) / total;
    if (i > 0) {
      // o parágrafo começa quando a voz volta depois de uma pausa. Entre parágrafos a pausa é mais longa
      // que entre frases: perto da estimativa (até 1,5 s), vale a pausa mais longa, descontada a distância
      // o parágrafo anterior precisa de pelo menos 60% do tempo que os caracteres dele pedem
      const minimo = out[i - 1][1] + 0.6 * ((fim - ini) * pesos[i - 1]) / total;
      let melhor = null, nota = -Infinity;
      for (const s of sil) {
        const d = Math.abs(s.fim - t);
        if (d > JANELA || s.fim <= minimo || s.fim >= fim) continue;
        const n = s.dur - 0.25 * d;
        if (n > nota) { nota = n; melhor = s; }
      }
      if (melhor) t = Math.max(melhor.ini, melhor.fim - 0.12);
      if (t <= out[i - 1][1] + 0.3) t = out[i - 1][1] + 0.3;
    }
    out.push([u.chave, Math.round(t * 100) / 100]);
    acum += pesos[i];
  });
  return out;
}

function pcm(arquivo) {
  const buf = execFileSync('ffmpeg', ['-v', 'error', '-i', arquivo, '-ac', '1', '-ar', String(TAXA), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

export function temposDaAula(L, info, amostras) {
  const rms = energia(amostras, TAXA, PASSO);
  const sil = silencios(rms, PASSO, 0.12); // pausas curtas também (entre parágrafos)
  const silPartes = silencios(rms, PASSO);
  const dur = amostras.length / TAXA;
  const caps = info.capitulos;
  const inicios = info.cortes ? caps.map((c) => c.t) : ajustarCortes(caps.map((c) => c.t), silPartes);
  const uni = unidadesDaAula(L);
  const out = {};
  caps.forEach((c, i) => {
    const ini = inicios[i], fim = i + 1 < caps.length ? inicios[i + 1] : dur;
    const us = uni.filter((u) => u.parte === c.id);
    if (us.length) out[c.id] = temposDaParte(us, ini, fim, sil);
  });
  return out;
}

function aplicarAjustes(tempos, ajustes) {
  for (const [id, mudancas] of Object.entries(ajustes)) {
    if (!tempos[id] || id.startsWith('_')) continue;
    for (const [chaveCompleta, t] of Object.entries(mudancas)) {
      const [parte, chave] = chaveCompleta.split(':');
      const linha = (tempos[id][parte] || []).find((x) => x[0] === chave);
      if (linha && typeof t === 'number') linha[1] = t;
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const indice = JSON.parse(readFileSync(raiz + 'audio/indice.json', 'utf8'));
  const caminho = raiz + 'audio/tempos.json', caminhoAj = raiz + 'audio/tempos-ajustes.json';
  const tempos = existsSync(caminho) ? JSON.parse(readFileSync(caminho, 'utf8')) : {};
  const ajustes = existsSync(caminhoAj) ? JSON.parse(readFileSync(caminhoAj, 'utf8')) : {};
  const mod = arg('modulo'), so = arg('aula');
  const ids = ORDEM.filter((id) => indice[id] && (so ? id === so : mod != null ? String(moduloDe(id)) === mod : true));
  for (const id of ids) {
    const L = licao(id), info = indice[id];
    tempos[id] = temposDaAula(L, info, pcm(raiz + 'audio/' + info.arquivo));
    const n = Object.values(tempos[id]).reduce((a, x) => a + x.length, 0);
    console.log(`${id}: ${n} parágrafos`);
  }
  aplicarAjustes(tempos, ajustes);
  const ord = Object.fromEntries(ORDEM.filter((id) => tempos[id]).map((id) => [id, tempos[id]]));
  writeFileSync(caminho, JSON.stringify(ord) + '\n');
  if (!existsSync(caminhoAj)) writeFileSync(caminhoAj, JSON.stringify({ _como: 'Ajustes manuais: { "1.3": { "passo-1:b2": 45.1 } } (segundos desde o começo do MP3). Valem por cima do cálculo e ficam a cada nova rodada.' }, null, 1) + '\n');
  console.log(`\n${ids.length} aulas → audio/tempos.json`);
}
