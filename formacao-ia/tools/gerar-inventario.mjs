// Gera docs/INVENTARIO.md a partir do código: arquivos (com propósito e funções exportadas), rotas, módulos,
// lições, exercícios, laboratórios, projeto, fotos, áudios, cores e scripts. Rode depois de qualquer mudança:
//   node tools/gerar-inventario.mjs        (ou: npm run docs)
// `--check` falha se o inventário estiver desatualizado (o npm test usa).
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const ler = (f) => readFileSync(join(raiz, f), 'utf8');
const imp = (f) => import(pathToFileURL(join(raiz, f)).href);
const out = [];
const p = (...l) => out.push(...l);
const kb = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const linhas = (f) => ler(f).split('\n').length;
const listar = (dir, filtro = () => true) => {
  const fs = [];
  const andar = (d) => { for (const n of readdirSync(join(raiz, d)).sort()) { const r = d ? `${d}/${n}` : n; const st = statSync(join(raiz, r)); if (st.isDirectory()) andar(r); else if (filtro(r)) fs.push(r); } };
  andar(dir); return fs;
};
/** Primeiro bloco de comentário do arquivo (sem a linha de direitos autorais). */
const proposito = (f) => {
  const ls = ler(f).split('\n'); const t = [];
  for (const l of ls) { const m = l.match(/^\s*(?:\/\/|#|\/\*+|\*)\s?(.*?)\s*(?:\*\/)?$/); if (!m) break; if (/©|^Formação IA Generativa —$/.test(m[1]) || !m[1]) continue; t.push(m[1]); if (t.join(' ').length > 260) break; }
  return t.join(' ').replace(/\s+/g, ' ').trim();
};
const exportsDe = (f) => [...(/^export default/m.test(ler(f)) ? ['default'] : []), ...[...ler(f).matchAll(/^export\s+(?:async\s+)?(?:function\*?|const|let|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1])];
const tabelaArquivos = (fs) => { p('| Arquivo | Linhas | O que é | Exporta |', '|---|---:|---|---|'); for (const f of fs) p(`| \`${f}\` | ${linhas(f)} | ${proposito(f).replace(/\|/g, '\\|') || '—'} | ${exportsDe(f).map((x) => `\`${x}\``).join(', ') || '—'} |`); p(''); };

p('# Inventário do app Formação IA (gerado do código)', '',
  '> Gerado por `tools/gerar-inventario.mjs`. **Não edite à mão**: mude o código e rode `npm run docs`. O `npm test` avisa se este arquivo ficar desatualizado.', '');

// ---------- números gerais ----------
const curso = await imp('js/data/curso.js');
const { PROJETO } = await imp('js/data/projeto.js');
const { LABS } = await imp('js/data/labs.js');
const { FOTOS, POR_LICAO, POR_MODULO } = await imp('js/data/fotos.js');
const { FICHA, VERIFICADO } = await imp('js/data/ficha.js');
const { RECURSOS } = await imp('js/data/recursos.js');
const { DESAFIOS } = await imp('js/data/desafios.js');
const { VIDEOS } = await imp('js/data/videos.js');
const indice = existsSync(join(raiz, 'audio/indice.json')) ? JSON.parse(ler('audio/indice.json')) : {};
const pkg = JSON.parse(ler('package.json'));
const swa = ler('sw-assets.js');
const precache = JSON.parse(swa.match(/FIA_ASSETS = (\[.*\])/)[1]);
const T = curso.TODAS;
const cartoes = T.reduce((a, L) => a + L.quiz.length, 0);
const porTipo = {}; for (const L of T) porTipo[L.ex.tipo] = (porTipo[L.ex.tipo] || 0) + 1;
const maos = T.filter((L) => L.mao); const maoPC = maos.filter((L) => L.mao.onde === 'pc').length;
const durTotal = Object.values(indice).reduce((a, x) => a + (x.duracao || 0), 0);
const bytesAudio = Object.values(indice).reduce((a, x) => a + (x.bytes || 0), 0);
p('## Números', '',
  '| Item | Quantidade |', '|---|---:|',
  `| Módulos | ${curso.MODULOS.length} |`, `| Aulas (agrupamentos) | ${curso.MODULOS.reduce((a, m) => a + m.aulas.length, 0)} |`,
  `| Micro-lições | ${T.length} |`, `| Perguntas de quiz (= cartões de revisão) | ${cartoes} |`,
  `| Práticas “mão na massa” | ${maos.length} (${maoPC} no computador) |`, `| Missões do projeto APE-IA | ${PROJETO.reduce((a, x) => a + x.missoes.length, 0)} em ${PROJETO.length} etapas |`,
  `| Laboratórios | ${LABS.length} |`, `| Desafios surpresa | ${DESAFIOS.length} |`, `| Itens da Ficha viva | ${FICHA.length} (verificada em ${VERIFICADO}) |`,
  `| Recursos externos | ${Object.values(RECURSOS).flat().length} |`, `| Fotos | ${Object.keys(FOTOS).length} (em ${Object.keys(POR_LICAO).length} lições e ${Object.keys(POR_MODULO).length} módulos) |`,
  `| Vídeos configurados | ${Object.keys(VIDEOS).length} |`,
  `| Áudios das aulas | ${Object.keys(indice).length} (${Math.round(durTotal / 60)} min, ${kb(bytesAudio)}) |`,
  `| Arquivos no pré-cache do app | ${precache.length} (versão ${swa.match(/FIA_VERSION = '([^']+)'/)[1]}) |`, '');

// ---------- telas e rotas ----------
const app = ler('js/app.js');
const views = [...app.match(/const VIEWS = new Set\(\[([\s\S]*?)\]\)/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
const imersivo = [...app.match(/const IMERSIVO = new Set\(\[([^\]]*)\]\)/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
const rota = (v) => { const [a, ...b] = v.split('-'); return '#/' + [a, ...b].join('/'); };
p('## Telas (rotas)', '', 'Rota `#/secao/pagina/arg` → arquivo `js/views/secao-pagina.js` (ou `secao.js`, recebendo `[pagina, arg]`). Telas imersivas escondem as abas.', '',
  '| Rota | Arquivo | Imersiva | O que é |', '|---|---|---|---|');
for (const v of views) p(`| \`${rota(v)}\` | \`js/views/${v}.js\` | ${imersivo.includes(v) ? 'sim' : ''} | ${proposito(`js/views/${v}.js`).replace(/\|/g, '\\|')} |`);
p('', `Abas: ${[...ler('index.html').matchAll(/data-tab="([^"]+)"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/g)].map((m) => `**${m[2]}** (\`${m[1]}\`)`).join(' · ')}.`, '');

// ---------- arquivos ----------
p('## Arquivos do app', '');
for (const [tit, dir] of [['Núcleo (`js/core`)', 'js/core'], ['Telas (`js/views`)', 'js/views'], ['Laboratórios (`js/labs`)', 'js/labs'], ['Dados (`js/data`)', 'js/data']]) {
  p(`### ${tit}`, ''); tabelaArquivos(listar(dir, (f) => f.endsWith('.js')));
}
p('### Raiz, ferramentas e testes', ''); tabelaArquivos(['index.html', 'sw.js', 'js/app.js', ...listar('tools', (f) => /\.(mjs|js)$/.test(f)), ...listar('tests', (f) => /\.mjs$/.test(f))]);
p('### Recursos estáticos', '', '| Pasta | Arquivos | Tamanho |', '|---|---|---:|');
for (const d of ['assets/fonts', 'assets/icons', 'assets/fotos', 'assets/micropython', 'kits', 'audio']) {
  if (!existsSync(join(raiz, d))) continue;
  const fs = listar(d); const tam = fs.reduce((a, f) => a + statSync(join(raiz, f)).size, 0);
  p(`| \`${d}\` | ${fs.length <= 12 ? fs.map((f) => `\`${relative(d, f)}\``).join(', ') : `${fs.length} arquivos`} | ${kb(tam)} |`);
}
p('');

// ---------- trilha ----------
p('## Trilha: módulos, aulas e lições', '');
for (const M of curso.MODULOS) {
  p(`### M${M.n} · ${M.t}`, '', `${M.sub}. ${M.horas} h · ${M.ementa} · Marco: ${M.marco} · O projeto ganha: ${M.ganha}. Cor: \`${M.cor}\`. Foto do módulo: \`${POR_MODULO[M.n] || '—'}\`.`, '',
    '| Lição | Título | Min | Exercício | Quiz | Mão na massa | Foto | Áudio |', '|---|---|---:|---|---:|---|---|---|');
  for (const A of M.aulas) {
    p(`| | **${A.t}** | | | | | | |`);
    for (const id of A.ids) {
      const L = curso.licao(id), a = indice[id];
      p(`| ${id} | ${L.t.replace(/\|/g, '\\|')} | ${L.min} | ${L.ex.tipo}${L.ex.lab ? ` (${L.ex.lab})` : ''} | ${L.quiz.length} | ${L.mao ? `${L.mao.onde === 'pc' ? 'PC' : 'fora'}: ${L.mao.t.replace(/\|/g, '\\|')}` : '—'} | ${POR_LICAO[id] || '—'} | ${a ? `${Math.round(a.duracao)} s` : '—'} |`);
    }
  }
  p('');
}
p('### Exercícios por tipo', '', Object.entries(porTipo).sort((a, b) => b[1] - a[1]).map(([t, n]) => `\`${t}\`: ${n}`).join(' · '), '');

// ---------- constantes das regras ----------
const srs = await imp('js/core/srs.js'), seq = await imp('js/core/sequencia.js'), est = await imp('js/core/estado.js'), plano = await imp('js/core/plano.js');
const { CONQUISTAS } = await imp('js/core/conquistas.js');
p('## Constantes das regras', '',
  `- Revisão espaçada: escada \`${JSON.stringify(srs.ESCADA)}\` dias, teto de **${srs.TETO}** cartões por dia, notas \`${srs.NOTAS.join(', ')}\`.`,
  `- Semana: meta de **${seq.META}** dias em 7, até **${seq.GELOS_MAX}** congelamentos.`,
  `- XP por ação: ${Object.entries(est.XP).map(([k, v]) => `\`${k}\` ${v}`).join(' · ')}. Nível = 1 + ⌊XP / ${est.XP_NIVEL}⌋.`, '',
  '| Plano | Ritmo | Semanas | Semanas de cada módulo (M0…M6) |', '|---|---|---:|---|',
  ...Object.entries(plano.PLANOS).map(([k, v]) => `| ${v.nome} | ${v.ritmo} | ${v.total} | ${v.sem.map(([a, b], i) => `M${i}: ${a}–${b}`).join(' · ')} |`), '',
  '### Conquistas', '', '| id | Nome | Como ganha |', '|---|---|---|', ...CONQUISTAS.map((c) => `| \`${c.id}\` | ${c.t} | ${c.d.replace(/\|/g, '\\|')} |`), '');

// ---------- projeto, labs, fotos, ficha, desafios ----------
p('## Projeto APE-IA', '', '| Etapa | Entrega | Missões (id · minutos) |', '|---|---|---|');
for (const E of PROJETO) p(`| M${E.m} · ${E.t} | ${E.entrega.replace(/\|/g, '\\|')} | ${E.missoes.map((m) => `\`${m.id}\` ${m.t} (${m.min} min, ${m.itens.length} itens)`).join('<br>')} |`);
p('', '## Laboratórios', '', '| id | Nome | Módulo | Lição | Descrição |', '|---|---|---|---|---|');
for (const x of LABS) p(`| \`${x.id}\` | ${x.t} | M${x.m} | ${x.licao} | ${x.d.replace(/\|/g, '\\|')} |`);
p('', '## Fotos', '', '| id | Arquivo | Autor | Licença | Lições |', '|---|---|---|---|---|');
for (const [id, f] of Object.entries(FOTOS)) p(`| \`${id}\` | \`${f.arq}\` (${f.w}×${f.h}) | ${f.autor} | ${f.licenca} | ${Object.keys(POR_LICAO).filter((l) => POR_LICAO[l] === id).join(', ') || '—'} |`);
p('', '## Ficha viva', '', FICHA.map((x) => `- **${x.t}** (${x.g})`).join('\n'), '', '## Desafios surpresa', '', DESAFIOS.map((x) => `- \`${x.id}\` (a partir do M${x.m})`).join('\n'), '');

// ---------- áudio ----------
p('## Áudios das aulas (`audio/indice.json`)', '');
if (!Object.keys(indice).length) p('Nenhum áudio gerado.', '');
else {
  const vozes = {}; for (const x of Object.values(indice)) vozes[x.voz] = (vozes[x.voz] || 0) + 1;
  const cortes = {}; for (const x of Object.values(indice)) cortes[x.cortes || 'estimados'] = (cortes[x.cortes || 'estimados'] || 0) + 1;
  p(`Vozes: ${Object.entries(vozes).map(([v, n]) => `\`${v}\` (${n})`).join(', ')}. Cortes entre partes: ${Object.entries(cortes).map(([v, n]) => `${v} (${n})`).join(', ')}. Gerados em: ${[...new Set(Object.values(indice).map((x) => x.gerado))].join(', ')}.`, '',
    'Formato de cada entrada: `{ arquivo, duracao (s), bytes, capitulos: [{ id: "passo-0|1|2|5", nome, t (s) }], cortes?: "exatos"|"estimados", voz, gerado }`.', '');
}

// ---------- design ----------
const css = ler('css/app.css');
const bloco = (re) => (css.match(re) || [, ''])[1];
const tokens = (txt) => [...txt.matchAll(/(--[\w-]+):([^;]+);/g)].map((m) => [m[1], m[2].trim()]);
const vars = tokens(bloco(/:root\{([\s\S]*?)\n\}/));
p('## Design: variáveis de CSS (`css/app.css`)', '', 'Um tema só (escuro). Os nomes antigos (`--bg`, `--ink`, `--acao`…) apontam para a paleta nova.', '', '| Variável | Valor |', '|---|---|');
for (const [k, v] of vars) p(`| \`${k}\` | \`${v.replace(/\|/g, '\\|')}\` |`);
p('', `Fontes: ${[...css.matchAll(/font-family:"([^"]+)";src:url\("([^"]+)"\)/g)].map((m) => `**${m[1]}** (\`${m[2].replace('../', '')}\`)`).join(', ')}.`, '');

// ---------- manifesto e scripts ----------
const man = JSON.parse(ler('manifest.webmanifest'));
p('## Manifesto (PWA)', '', '```json', JSON.stringify(man, null, 2), '```', '', '## Scripts (`package.json`)', '', '| Comando | Faz |', '|---|---|');
for (const [k, v] of Object.entries(pkg.scripts)) p(`| \`npm run ${k}\` | \`${v}\` |`);
p('');

const texto = out.join('\n');
const destino = join(raiz, 'docs/INVENTARIO.md');
if (process.argv.includes('--check')) {
  const atual = existsSync(destino) ? readFileSync(destino, 'utf8') : '';
  if (atual !== texto) { console.error('docs/INVENTARIO.md está desatualizado. Rode: npm run docs'); process.exit(1); }
  console.log('docs/INVENTARIO.md em dia.');
} else { writeFileSync(destino, texto); console.log(`docs/INVENTARIO.md: ${out.length} linhas.`); }
