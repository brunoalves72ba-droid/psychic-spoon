// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Sorteio das frases de boas-vindas (puro, testável).

/** Sorteia uma frase que não esteja entre as últimas 10 mostradas. Devolve [índice, nova lista]. */
export function sortear(total, ultimas = [], rnd = Math.random) {
  const evitar = new Set(ultimas.slice(-10));
  const livres = [];
  for (let i = 0; i < total; i++) if (!evitar.has(i)) livres.push(i);
  const i = livres.length ? livres[Math.floor(rnd() * livres.length)] : Math.floor(rnd() * total);
  return [i, [...ultimas, i].slice(-10)];
}

