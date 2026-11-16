// Gerador de áudio (tools/audio): forma falada, SSML, divisão no limite da API, MP3 e o gerador inteiro
// contra uma API do Google de mentira (nenhuma chave real, nenhum caractere gasto).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { falado, codigoFalado } from '../tools/audio/falado.mjs';
import { pecasDaAula, dividir, converter, textoPuro } from '../tools/audio/ssml.mjs';
import { duracaoMp3, semId3 } from '../tools/audio/mp3.mjs';
import { TODAS, licao } from '../js/data/curso.js';
import { diasSeguidos, diasEstudados } from '../js/core/sequencia.js';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const temFfmpeg = (() => { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } })();
const mp3De = (seg, dir) => { const f = join(dir, `t${seg}.mp3`); execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', `sine=frequency=440:duration=${seg}`, '-ac', '1', '-ar', '24000', '-b:a', '32k', f]); return readFileSync(f); };

test('forma falada: moeda, porcentagem, datas, horas, abreviações, símbolos e código em linha', () => {
  assert.equal(falado('Custa R$ 1.234,50 ou R$ 1.', 'texto'), 'Custa 1.234 reais e 50 centavos ou 1 real.');
  assert.equal(falado('15% em 05/11/2026 às 14h30', 'texto'), '15 por cento em 5 de novembro de 2026 às 14 horas e 30');
  assert.equal(falado('Ex.: 3x de 2 GB → ok; etc.', 'texto'), 'por exemplo 3 vezes de 2 gigabytes, depois, ok; etcétera');
  assert.equal(falado('o 1º e a 2ª; nº 5; 10 min', 'texto'), 'o primeiro e a segunda; número 5; 10 minutos');
  assert.equal(codigoFalado('choices[0].message.content'), 'choices item 0 ponto message ponto content');
  assert.equal(falado('Use **IF/Switch** e veja [a ficha](#/mais/ficha).', 'texto'), 'Use íf ou suítch e veja a ficha.');
  assert.match(falado('A API em JSON & <b>', 'ssml'), /^A <sub alias="a pê í">API<\/sub> em <sub alias="djêison">JSON<\/sub> e &lt;b&gt;$/);
  assert.equal(falado('parcela 3/6 em 2026', 'texto'), 'parcela 3 ou 6 em 2026'.replace(' ou ', '/'));   // fração não vira data
});

test('SSML de todas as aulas: bem formado, com pausas, títulos mais lentos, marcas e dentro do limite da API', () => {
  for (const L of TODAS) {
    const pecas = pecasDaAula(L);
    const pedidos = dividir(pecas, { modo: 'ssml', limite: 4800 });
    for (const s of pedidos) {
      assert.ok(Buffer.byteLength(s) <= 4800, `${L.id}: pedido com ${Buffer.byteLength(s)} bytes`);
      assert.ok(s.startsWith('<speak>') && s.endsWith('</speak>'));
      assert.ok(!/&(?!amp;|lt;|gt;|quot;)/.test(s), `${L.id}: & sem escape`);
      for (const tag of ['p', 's', 'prosody', 'sub']) assert.equal((s.match(new RegExp(`<${tag}[ >]`, 'g')) || []).length, (s.match(new RegExp(`</${tag}>`, 'g')) || []).length, `${L.id}: <${tag}> desbalanceado`);
    }
    const tudo = pedidos.join('');
    for (const m of ['passo-0', 'passo-1', 'passo-2', 'passo-5']) assert.ok(tudo.includes(`<mark name="${m}"/>`), `${L.id}: falta ${m}`);
    assert.ok(tudo.includes('<break time="600ms"/>') && tudo.includes('<break time="1s"/>') && tudo.includes('<prosody rate="88%">'));
    assert.ok(!/[`*]/.test(textoPuro(tudo)), `${L.id}: sobrou marcação de markdown`);
  }
  const s = pecasDaAula(licao('3.5')).join('');
  assert.ok(s.includes('O código está na tela.'), 'bloco de código não é lido');
  assert.ok(/<s>Primeiro: /.test(s), 'lista numerada lida item por item');
});

test('Chirp 3 HD e ElevenLabs: sem as marcações que eles não aceitam; divisão respeita o limite', () => {
  const pecas = pecasDaAula(licao('1.1'));
  const chirp = dividir(pecas, { modo: 'chirp' }).join('');
  assert.ok(!/<break|<prosody|<mark/.test(chirp) && /<sub alias=/.test(chirp));
  const txt = dividir(pecas, { modo: 'texto', limite: 600 });
  assert.ok(txt.length > 1 && txt.every((t) => t.length <= 600 && !/<(p|s|sub|mark)\b/.test(t)), JSON.stringify(txt.map((t) => t.length)));
  assert.match(txt.join(' '), /<break time="1\.0s" \/>/);
  assert.equal(converter('<p>a &amp; b</p>', 'texto'), 'a & b');
});

test('MP3: duração pelos quadros e junção sem etiqueta ID3', { skip: !temFfmpeg && 'sem ffmpeg' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'mp3-'));
  const a = mp3De(2, dir), b = mp3De(3, dir);
  assert.ok(Math.abs(duracaoMp3(a) - 2) < 0.15, String(duracaoMp3(a)));
  assert.ok(Math.abs(duracaoMp3(Buffer.concat([semId3(a), semId3(b)])) - 5) < 0.25);
  assert.equal(semId3(Buffer.concat([Buffer.from('ID3\x04\x00\x00\x00\x00\x00\x02xx', 'latin1'), Buffer.from([0xff, 0xfb])])).length, 2);
});

test('gerador inteiro contra uma API de mentira: junta pedidos, capítulos, índice, pula o que existe e conta caracteres', { skip: !temFfmpeg && 'sem ffmpeg' }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'aud-'));
  const pedaco = mp3De(1, dir).toString('base64');
  const recebidos = [];
  const srv = createServer((req, res) => {
    let corpo = '';
    req.on('data', (c) => (corpo += c));
    req.on('end', () => {
      const j = JSON.parse(corpo);
      recebidos.push({ chave: req.headers['x-goog-api-key'], voz: j.voice.name, ssml: j.input.ssml, marcas: j.enableTimePointing });
      const marcas = [...j.input.ssml.matchAll(/<mark name="([^"]+)"\/>/g)].map((m, i) => ({ markName: m[1], timeSeconds: i * 0.2 }));
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ audioContent: pedaco, timepoints: marcas }));
    });
  });
  await new Promise((r) => srv.listen(0, r));
  const env = { ...process.env, GOOGLE_TTS_API_KEY: 'chave-de-teste', GOOGLE_VOZ: 'pt-BR-Neural2-A', TTS_GOOGLE_URL: `http://127.0.0.1:${srv.address().port}` };
  const rodar = (...args) => new Promise((ok, erro) => {
    const p = spawn(process.execPath, [join(raiz, 'tools/audio/gerar-audio.mjs'), '--saida', dir, '--sem-precache', ...args], { env });
    let out = ''; p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (out += d));
    p.on('close', (c) => (c ? erro(new Error(out)) : ok(out)));
  });
  const saida1 = await rodar('--aula', '0.1,3.5');
  assert.match(saida1, /Geradas: 2/);
  assert.match(saida1, /Caracteres enviados.*: [\d.]+/);
  assert.equal(recebidos.length, 2);
  assert.ok(recebidos.every((r) => r.chave === 'chave-de-teste' && r.voz === 'pt-BR-Neural2-A' && r.marcas[0] === 'SSML_MARK'));
  const ind = JSON.parse(readFileSync(join(dir, 'indice.json'), 'utf8'));
  assert.deepEqual(Object.keys(ind).sort(), ['0.1', '3.5']);
  assert.ok(existsSync(join(dir, 'aula-3.5.mp3')));
  assert.deepEqual(ind['3.5'].capitulos.map((c) => c.nome), ['Começo', 'Ideia', 'Exemplo', 'Erro comum']);
  assert.ok(ind['3.5'].duracao > 0.8 && ind['3.5'].bytes > 1000);
  // segunda rodada: nada é enviado de novo
  const saida2 = await rodar('--aula', '0.1,3.5');
  assert.match(saida2, /Geradas: 0 · já tinham áudio \(puladas\): 2/);
  assert.match(saida2, /Caracteres enviados.*: 0/);
  assert.equal(recebidos.length, 2);
  // pedido grande é dividido: com limite pequeno a aula vira vários pedidos e um único MP3
  writeFileSync(join(dir, 'x'), '');
  srv.close();
});

test('sem chave: o gerador para com uma mensagem clara (e a simulação funciona sem chave)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aud-'));
  const env = { ...process.env, GOOGLE_TTS_API_KEY: '' };
  assert.throws(() => execFileSync(process.execPath, [join(raiz, 'tools/audio/gerar-audio.mjs'), '--saida', dir], { env, stdio: 'pipe' }), (e) => /Falta a chave da API/.test(String(e.stderr)));
  const out = execFileSync(process.execPath, [join(raiz, 'tools/audio/gerar-audio.mjs'), '--simular', '--aula', '1.1', '--saida', dir], { env }).toString();
  assert.match(out, /Seriam geradas: 1/);
  assert.ok(existsSync(join(dir, 'ssml', 'aula-1.1.xml')));
});

test('dias seguidos e dias estudados', () => {
  const d = { '2026-11-14': { l: 1 }, '2026-11-15': { c: 2 }, '2026-11-12': { p: 1 } };
  assert.equal(diasSeguidos(d, '2026-11-16'), 2);   // hoje ainda não estudou: conta até ontem
  assert.equal(diasSeguidos({ ...d, '2026-11-16': { l: 1 } }, '2026-11-16'), 3);
  assert.equal(diasSeguidos(d, '2026-11-18'), 0);
  assert.equal(diasEstudados(d), 3);
});
