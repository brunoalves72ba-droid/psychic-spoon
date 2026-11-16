#!/usr/bin/env node
// Formação IA — gera o áudio de cada aula com voz neural (rode no SEU computador, nunca no app).
//
//   node tools/audio/gerar-audio.mjs --simular        mostra quantos caracteres vai gastar (não chama a API)
//   node tools/audio/gerar-audio.mjs                  gera o que falta (pula aulas que já têm áudio)
//   node tools/audio/gerar-audio.mjs --aula 0.1,0.2   só estas aulas
//   node tools/audio/gerar-audio.mjs --refazer        gera de novo mesmo se já existir
//   --limite 10   no máximo 10 aulas nesta rodada     --saida pasta   onde salvar (padrão: audio/)
//
// A chave fica em tools/audio/.env (copie de .env.exemplo). O .env está no .gitignore.
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { pecasDaAula, dividir, textoPuro, CAPITULOS } from './ssml.mjs';
import { semId3, duracaoMp3 } from './mp3.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');

// ---------- configuração ----------
function lerEnv(arq) {
  const out = {};
  if (!existsSync(arq)) return out;
  for (const linha of readFileSync(arq, 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !linha.trim().startsWith('#')) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}
const ENV = { ...lerEnv(join(AQUI, '.env')), ...process.env };
const arg = (nome) => { const i = process.argv.indexOf('--' + nome); return i < 0 ? null : (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true); };
const SIMULAR = !!arg('simular'), REFAZER = !!arg('refazer');
const SO = arg('aula') && arg('aula') !== true ? String(arg('aula')).split(',').map((s) => s.trim()) : null;
const LIMITE = arg('limite') ? +arg('limite') : Infinity;
const SAIDA = arg('saida') && arg('saida') !== true ? String(arg('saida')) : join(RAIZ, 'audio');
const PROVEDOR = (ENV.PROVEDOR || 'google').toLowerCase();

// ---------- provedores (para trocar de serviço, basta outro objeto com o mesmo formato) ----------
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
async function pedir(url, opcoes, tentativas = 4) {
  for (let t = 1; ; t++) {
    const r = await fetch(url, opcoes);
    if (r.ok) return r;
    const corpo = await r.text().catch(() => '');
    if ((r.status === 429 || r.status >= 500) && t < tentativas) { await esperar(1500 * 2 ** t); continue; }
    throw new Error(`A API respondeu ${r.status}: ${corpo.slice(0, 400)}`);
  }
}

const PROVEDORES = {
  google: () => {
    const chave = ENV.GOOGLE_TTS_API_KEY;
    const voz = ENV.GOOGLE_VOZ || 'pt-BR-Neural2-A';
    const chirp = /chirp/i.test(voz);
    return {
      nome: `Google Cloud (${voz})`, voz, chave,
      modo: chirp ? 'chirp' : 'ssml', limite: 4800, marcas: !chirp,
      async falar(entrada) {
        const r = await pedir((ENV.TTS_GOOGLE_URL || 'https://texttospeech.googleapis.com') + '/v1beta1/text:synthesize', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': chave },
          body: JSON.stringify({
            input: { ssml: entrada }, voice: { languageCode: 'pt-BR', name: voz },
            audioConfig: { audioEncoding: 'MP3', speakingRate: +(ENV.VELOCIDADE || 1), sampleRateHertz: 24000 },
            ...(chirp ? {} : { enableTimePointing: ['SSML_MARK'] }),
          }),
        });
        const j = await r.json();
        return { audio: Buffer.from(j.audioContent, 'base64'), marcas: (j.timepoints || []).map((x) => ({ nome: x.markName, t: x.timeSeconds })) };
      },
    };
  },
  elevenlabs: () => {
    const chave = ENV.ELEVENLABS_API_KEY, voz = ENV.ELEVENLABS_VOZ_ID, modelo = ENV.ELEVENLABS_MODELO || 'eleven_multilingual_v2';
    return {
      nome: `ElevenLabs (${modelo}, voz ${voz})`, voz: `elevenlabs:${voz}`, chave, modo: 'texto', limite: 2500, marcas: false,
      async falar(entrada) {
        const r = await pedir(`${ENV.TTS_ELEVENLABS_URL || 'https://api.elevenlabs.io'}/v1/text-to-speech/${encodeURIComponent(voz)}?output_format=mp3_44100_64`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'xi-api-key': chave, Accept: 'audio/mpeg' },
          body: JSON.stringify({ text: entrada, model_id: modelo, language_code: 'pt' }),
        });
        return { audio: Buffer.from(await r.arrayBuffer()), marcas: [] };
      },
    };
  },
};

// ---------- principal ----------
const P = (PROVEDORES[PROVEDOR] || (() => { throw new Error(`PROVEDOR desconhecido: ${PROVEDOR} (use google ou elevenlabs)`); }))();
if (!SIMULAR && !P.chave) {
  console.error(`\nFalta a chave da API. Copie tools/audio/.env.exemplo para tools/audio/.env e preencha ${PROVEDOR === 'google' ? 'GOOGLE_TTS_API_KEY' : 'ELEVENLABS_API_KEY'}.\n`);
  process.exit(1);
}
const { TODAS } = await import(pathToFileURL(join(RAIZ, 'js', 'data', 'curso.js')).href);
mkdirSync(SAIDA, { recursive: true });
const arqIndice = join(SAIDA, 'indice.json');
const indice = existsSync(arqIndice) ? JSON.parse(readFileSync(arqIndice, 'utf8')) : {};
for (const id of Object.keys(indice)) if (!existsSync(join(SAIDA, indice[id].arquivo))) delete indice[id];

const aulas = TODAS.filter((L) => !SO || SO.includes(L.id));
let feitas = 0, puladas = 0, enviados = 0, falados = 0, pedidos = 0;
if (SIMULAR) mkdirSync(join(SAIDA, 'ssml'), { recursive: true });
console.log(`${SIMULAR ? 'SIMULAÇÃO (nada é enviado)' : 'Gerando'} com ${P.nome} · ${aulas.length} aulas · saída: ${SAIDA}\n`);

for (const L of aulas) {
  const arquivo = `aula-${L.id}.mp3`, destino = join(SAIDA, arquivo);
  if (!REFAZER && existsSync(destino) && statSync(destino).size > 1000) { puladas++; continue; }
  if (feitas >= LIMITE) break;
  const pecas = pecasDaAula(L);
  // vozes sem marcas de tempo (Chirp 3 HD, ElevenLabs): cada parte vai em pedidos separados, e o começo
  // de cada parte é medido no próprio áudio. Assim o app corta exatamente entre Começo, Ideia, Exemplo e Erro comum.
  const grupos = [];
  for (const p of pecas) { const m = p.match(/<mark name="([^"]+)"\/>/); if (!grupos.length || (m && !P.marcas)) grupos.push({ marca: m ? m[1] : null, pecas: [] }); grupos[grupos.length - 1].pecas.push(p); }
  const lotesPorGrupo = grupos.map((g) => dividir(g.pecas, { modo: P.modo, limite: P.limite }));
  const lotes = lotesPorGrupo.flat();
  const caracteres = lotes.reduce((a, s) => a + s.length, 0), fala = textoPuro(pecas.join(''));
  enviados += caracteres; falados += fala.length; pedidos += lotes.length;
  if (SIMULAR) {
    writeFileSync(join(SAIDA, 'ssml', `aula-${L.id}.${P.modo === 'texto' ? 'txt' : 'xml'}`), lotes.join('\n\n<!-- ===== próximo pedido ===== -->\n\n'));
    feitas++; continue;
  }
  process.stdout.write(`aula ${L.id.padEnd(5)} ${String(lotes.length).padStart(2)} pedido(s) · ${caracteres} caracteres… `);
  const partes = [], marcas = [];
  let desloc = 0;
  for (const [gi, lotesG] of lotesPorGrupo.entries()) {
    if (!P.marcas && grupos[gi].marca) marcas.push({ nome: grupos[gi].marca, t: Math.round(desloc * 100) / 100 });
    for (const lote of lotesG) {
      const { audio, marcas: mk } = await P.falar(lote);
      const limpo = semId3(audio);
      for (const m of mk) marcas.push({ nome: m.nome, t: Math.round((desloc + m.t) * 100) / 100 });
      desloc += duracaoMp3(limpo);
      partes.push(limpo);
    }
  }
  const mp3 = Buffer.concat(partes);
  writeFileSync(destino, mp3);
  const duracao = duracaoMp3(mp3);
  // capítulos: pelas marcas da API; sem marcas (Chirp, ElevenLabs), pela posição no texto
  let capitulos = marcas.filter((m) => CAPITULOS[m.nome]).map((m) => ({ id: m.nome, nome: CAPITULOS[m.nome], t: m.t }));
  if (!capitulos.length) {
    const total = fala.length || 1;
    let antes = 0;
    for (const p of pecas) { const m = p.match(/<mark name="([^"]+)"\/>/); if (m && CAPITULOS[m[1]]) capitulos.push({ id: m[1], nome: CAPITULOS[m[1]], t: Math.round((duracao * antes) / total * 100) / 100 }); antes += textoPuro(p).length + 1; }
  }
  indice[L.id] = { arquivo, duracao, bytes: mp3.length, capitulos, cortes: marcas.length ? 'exatos' : 'estimados', voz: P.voz, gerado: new Date().toISOString().slice(0, 10) };
  writeFileSync(arqIndice, JSON.stringify(indice, null, 1) + '\n');
  feitas++;
  console.log(`ok (${Math.round(duracao)} s, ${(mp3.length / 1024).toFixed(0)} KB)`);
}

const fmt = (n) => n.toLocaleString('pt-BR');
console.log(`\n${SIMULAR ? 'Seriam geradas' : 'Geradas'}: ${feitas} · já tinham áudio (puladas): ${puladas} · pedidos à API: ${pedidos}`);
console.log(`Caracteres ${SIMULAR ? 'que seriam enviados' : 'enviados'} (é o que a API conta, com as marcações SSML): ${fmt(enviados)}`);
console.log(`Caracteres de fala (só o texto lido): ${fmt(falados)}`);
if (SIMULAR) console.log(`\nPara conferir como cada aula vai soar, abra ${join(SAIDA, 'ssml')}`);
else if (feitas && !arg('sem-precache')) {
  // o app só vê os áudios novos depois de regenerar a lista de arquivos do service worker
  execFileSync(process.execPath, [join(RAIZ, 'tools', 'gen-precache.mjs')], { stdio: 'inherit' });
  console.log('\nPronto. Agora publique: git add audio && git commit -m "Áudio das aulas" && git push');
}
