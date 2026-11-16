// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Pontos de corte entre as partes do áudio de uma aula (Começo, Ideia, Exemplo, Erro comum).
// Com vozes que não devolvem o tempo exato de cada parte (Chirp 3 HD, ElevenLabs), o gerador só estima
// onde cada parte começa. Aqui o app procura, perto de cada estimativa, a pausa de silêncio mais longa:
// é onde a voz termina um assunto e começa o título do próximo. Funções puras (testáveis no Node).

/** Energia (RMS) do som em janelas de `passo` segundos. */
export function energia(amostras, taxa, passo = 0.02) {
  const n = Math.max(1, Math.round(taxa * passo)), tot = Math.floor(amostras.length / n);
  const out = new Float32Array(tot);
  for (let j = 0; j < tot; j++) { let s = 0; for (let k = j * n; k < (j + 1) * n; k++) s += amostras[k] * amostras[k]; out[j] = Math.sqrt(s / n); }
  return out;
}

/** Trechos de silêncio com pelo menos `minimo` segundos: [{ ini, fim, dur }] em segundos. */
export function silencios(rms, passo = 0.02, minimo = 0.25) {
  if (!rms.length) return [];
  const ord = Float32Array.from(rms).sort();
  const piso = ord[Math.floor(ord.length * 0.1)], fala = ord[Math.floor(ord.length * 0.7)];
  const limiar = piso + (fala - piso) * 0.12;
  const out = [];
  let ini = -1;
  for (let j = 0; j <= rms.length; j++) {
    const quieto = j < rms.length && rms[j] <= limiar;
    if (quieto && ini < 0) ini = j;
    else if (!quieto && ini >= 0) { const dur = (j - ini) * passo; if (dur >= minimo) out.push({ ini: ini * passo, fim: j * passo, dur }); ini = -1; }
  }
  return out;
}

/**
 * Ajusta cada estimativa de início de parte para o fim da pausa mais longa por perto (até `janela` s),
 * começando um instante antes de a voz voltar. A primeira parte começa em 0. Mantém a ordem crescente.
 */
export function ajustarCortes(estimativas, sil, janela = 8) {
  const out = [];
  estimativas.forEach((t, i) => {
    if (i === 0) { out.push(0); return; }
    let melhor = null, nota = -Infinity;
    sil.forEach((s, k) => {
      const meio = (s.ini + s.fim) / 2;
      if (Math.abs(meio - t) > janela) return;
      // assinatura de título: depois da pausa vem uma fala curta (o nome da parte) e outra pausa
      const prox = sil[k + 1], fala = prox ? prox.ini - s.fim : Infinity;
      const titulo = fala >= 0.3 && fala <= 2.2 && prox.dur >= 0.3 ? 0.8 : 0;
      const n = s.dur + titulo - 0.04 * Math.abs(meio - t);
      if (n > nota) { nota = n; melhor = s; }
    });
    let c = melhor ? Math.max(melhor.ini, melhor.fim - 0.12) : t;
    if (c <= out[i - 1] + 1) c = t;          // nunca volta para antes da parte anterior
    out.push(Math.round(c * 100) / 100);
  });
  return out;
}
