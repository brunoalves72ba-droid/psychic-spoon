// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Treino de ouvido: tipos de exercício, dificuldade adaptativa e repetição do que foi errado.
// Lógica pura (sem áudio nem DOM), testada em tests/ear.test.mjs.

const IV = { '2ª menor': 1, '2ª maior': 2, '3ª menor': 3, '3ª maior': 4, '4ª justa': 5, 'Trítono': 6, '5ª justa': 7, '6ª menor': 8, '6ª maior': 9, '7ª menor': 10, '7ª maior': 11, '8ª': 12 };
const TRI = { Maior: [0, 4, 7], Menor: [0, 3, 7], Diminuta: [0, 3, 6], Aumentada: [0, 4, 8] };
const TET = { maj7: [0, 4, 7, 11], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], 'm7(♭5)': [0, 3, 6, 10], dim7: [0, 3, 6, 9], 'm(maj7)': [0, 3, 7, 11], '6': [0, 4, 7, 9] };
const TEN = { 'Sem tensão': null, '9': 14, '♭9': 13, '♯9': 15, '13': 21, '♯11': 18, '♭13': 20 };
// graus do campo maior a partir da tônica (semitons, tipo)
const DEG = { I: [0, 'M'], ii: [2, 'm'], iii: [4, 'm'], IV: [5, 'M'], V: [7, '7'], vi: [9, 'm'], 'vii°': [11, 'd'] };
const FN = { I: 'Tônica', iii: 'Tônica', vi: 'Tônica', ii: 'Subdominante', IV: 'Subdominante', V: 'Dominante', 'vii°': 'Dominante' };
const CAD = { 'Perfeita (V–I)': ['V', 'I'], 'Plagal (IV–I)': ['IV', 'I'], 'Meia cadência (termina no V)': ['ii', 'V'], 'De engano (V–vi)': ['V', 'vi'] };
const tri = (root, q) => (q === 'M' ? [0, 4, 7] : q === 'm' ? [0, 3, 7] : q === 'd' ? [0, 3, 6] : [0, 4, 7, 10]).map((x) => root + x);

export const KINDS = [
  { id: 'intervalos', name: 'Intervalos', ask: 'Que intervalo é este?', levels: [['3ª maior', '5ª justa', '8ª', '2ª maior'], ['3ª menor', '4ª justa', '6ª maior', '7ª menor'], ['2ª menor', 'Trítono', '6ª menor', '7ª maior']] },
  { id: 'triades', name: 'Tríades', ask: 'Que tríade é esta?', levels: [['Maior', 'Menor'], ['Diminuta', 'Aumentada'], []] },
  { id: 'tetrades', name: 'Tétrades', ask: 'Que acorde é este?', levels: [['maj7', '7', 'm7'], ['m7(♭5)', 'dim7'], ['m(maj7)', '6']] },
  { id: 'tensoes', name: 'Tensões', ask: 'Que tensão foi somada ao C7?', levels: [['Sem tensão', '9', '♭9'], ['♯9', '13'], ['♯11', '♭13']] },
  { id: 'funcoes', name: 'Funções', ask: 'Depois da cadência, que função tem o último acorde?', levels: [['I', 'IV', 'V'], ['ii', 'vi'], ['iii', 'vii°']] },
  { id: 'cadencias', name: 'Cadências', ask: 'Que cadência é esta?', levels: [['Perfeita (V–I)', 'Plagal (IV–I)'], ['Meia cadência (termina no V)'], ['De engano (V–vi)']] },
  { id: 'voz', name: 'Qual voz mexeu?', ask: 'O acorde tocou duas vezes. Qual voz mudou de nota?', levels: [['Soprano', 'Baixo'], ['Contralto', 'Tenor'], []] },
];
export const kindById = (id) => KINDS.find((k) => k.id === id) || KINDS[0];

/** Itens disponíveis no nível (1..3): acumula os níveis anteriores. */
export const pool = (kind, level) => kind.levels.slice(0, level).flat();
/** Opções de resposta mostradas. Em "funções" a resposta é a função, não o grau. */
export function answers(kind, level) { return kind.id === 'funcoes' ? ['Tônica', 'Subdominante', 'Dominante'] : pool(kind, level); }
export const answerOf = (kind, item) => (kind.id === 'funcoes' ? FN[item] : item);

export const newState = () => ({ level: 1, streak: 0, misses: 0, queue: [], asked: 0, last: null });

/**
 * Escolhe o próximo item. Itens errados voltam à fila e reaparecem depois de 2 perguntas.
 * rnd: função aleatória [0,1).
 */
export function nextItem(kind, st, rnd = Math.random) {
  st.asked++;
  const due = st.queue.findIndex((q) => q.at <= st.asked);
  if (due >= 0) { const [q] = st.queue.splice(due, 1); st.last = q.item; return { item: q.item, review: true }; }
  const p = pool(kind, st.level);
  let item = p[Math.floor(rnd() * p.length)];
  if (p.length > 1 && item === st.last) item = p[(p.indexOf(item) + 1) % p.length];
  st.last = item;
  return { item, review: false };
}

/** Atualiza o estado depois da resposta. Sobe de nível com 5 acertos seguidos; desce com 3 erros em sequência curta. */
export function grade(kind, st, item, ok) {
  let change = 0;
  if (ok) { st.streak++; st.misses = Math.max(0, st.misses - 1); if (st.streak >= 5 && st.level < 3 && kind.levels[st.level].length) { st.level++; st.streak = 0; change = 1; } }
  else { st.streak = 0; st.misses++; st.queue.push({ item, at: st.asked + 3 }); if (st.misses >= 3 && st.level > 1) { st.level--; st.misses = 0; change = -1; } }
  return change;
}

/**
 * Monta o som da pergunta: lista de eventos { notes:[midi], at: segundos, dur, kind:'piano'|'coro' }.
 * rnd controla a transposição.
 */
export function buildSound(kind, item, level, rnd = Math.random) {
  const r = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  if (kind.id === 'intervalos') { const root = r(55, 66), top = root + IV[item]; return [{ notes: [root], at: 0, dur: 0.7 }, { notes: [top], at: 0.7, dur: 0.7 }, { notes: [root, top], at: 1.5, dur: 1.4 }]; }
  if (kind.id === 'triades') { const root = r(55, 64); let n = TRI[item].map((x) => root + x); if (level >= 3) { const inv = r(0, 2); for (let k = 0; k < inv; k++) n.push(n.shift() + 12); } return [{ notes: n, at: 0, dur: 1.6 }, ...n.map((m, i) => ({ notes: [m], at: 1.7 + i * 0.35, dur: 0.5 }))]; }
  if (kind.id === 'tetrades') { const root = r(53, 60), n = TET[item].map((x) => root + x); return [{ notes: n, at: 0, dur: 1.8 }, ...n.map((m, i) => ({ notes: [m], at: 1.9 + i * 0.32, dur: 0.45 }))]; }
  if (kind.id === 'tensoes') { const root = r(46, 50), shell = [root, root + 10, root + 16]; const t = TEN[item]; return [{ notes: shell, at: 0, dur: 1.2 }, { notes: t == null ? shell : [...shell, root + 12 + t], at: 1.4, dur: 2 }]; }
  if (kind.id === 'funcoes' || kind.id === 'cadencias') {
    const key = r(48, 55); const ch = (d) => { const [st, q] = DEG[d]; const c = tri(key + st, q); return [c[0] - 12, ...c]; };
    const intro = ['I', 'IV', 'V', 'I'].map((d, i) => ({ notes: ch(d), at: i * 0.7, dur: 0.65 }));
    if (kind.id === 'funcoes') return [...intro, { notes: ch(item), at: 3.4, dur: 2 }];
    const [a, b] = CAD[item]; return [...intro, { notes: ch(a), at: 3.4, dur: 1.1 }, { notes: ch(b), at: 4.6, dur: 2 }];
  }
  // qual voz mexeu: acorde a quatro vozes; na segunda vez, uma voz anda (um tom nos níveis 1–2, um semitom no 3)
  const key = r(-2, 3); const base = [48, 55, 64, 71].map((x) => x + key); // baixo, tenor, contralto, soprano (Cmaj7 aberto)
  const idx = ['Baixo', 'Tenor', 'Contralto', 'Soprano'].indexOf(item); const moved = [...base];
  const step = level >= 3 ? 1 : 2; moved[idx] += (idx === 3 || idx === 1 ? -1 : 1) * step;
  return [{ notes: base, at: 0, dur: 1.5, coro: true }, { notes: moved, at: 1.9, dur: 1.8, coro: true }];
}
