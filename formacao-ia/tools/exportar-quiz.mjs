// Gera QUIZ-PARA-REVISAR.md com todas as perguntas do quiz de cada aula (resposta certa, alternativas e explicação),
// para revisar fora do app. As perguntas ficam nos arquivos das aulas (js/data/m*.js): a PRIMEIRA opção é a certa
// (a tela embaralha). Uso: node tools/exportar-quiz.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const raiz = fileURLToPath(new URL('..', import.meta.url));
const { MODULOS, licao } = await import(new URL('../js/data/curso.js', import.meta.url).href);
const out = ['# Quiz das aulas — para revisar', '', 'Cada aula tem 3 perguntas de múltipla escolha, feitas a partir do texto da aula. ✔ marca a resposta certa. Para corrigir algo, edite a aula em `js/data/` (a primeira opção de cada pergunta é a certa) e rode `npm run precache`.', ''];
let n = 0;
for (const M of MODULOS) {
  out.push(`## Módulo ${M.n} — ${M.t}`, '');
  for (const A of M.aulas) for (const id of A.ids) {
    const L = licao(id);
    out.push(`### ${L.id} ${L.t}`, '');
    L.quiz.forEach((q, i) => { n++; out.push(`${i + 1}. ${q.q}`, `   - ✔ ${q.o[0]}`, ...q.o.slice(1).map((o) => `   - ${o}`), `   - _Explicação:_ ${q.w || '—'}`, ''); });
  }
}
writeFileSync(raiz + 'QUIZ-PARA-REVISAR.md', out.join('\n'));
console.log(`QUIZ-PARA-REVISAR.md: ${n} perguntas.`);
