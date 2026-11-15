// Limpa Fotos — © Bruno Moura, único e exclusivo proprietário.
// Fila de triagem: uma foto por vez, cada uma marcada para apagar (esquerda) ou manter (direita).
// Só lógica, sem tela: dá para testar no Node.

export const EXTENSOES = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'avif', 'bmp'];

export function ehImagem(nome = '', tipo = '') {
  if (tipo.startsWith('image/')) return true;
  const ext = nome.split('.').pop().toLowerCase();
  return nome.includes('.') && EXTENSOES.includes(ext);
}

/** fotos: [{ id, nome, tamanho, data, ... }] — a ordem é a de exibição. */
export function criarFila(fotos) {
  return { fotos, pos: 0, decisoes: new Map(), historico: [] };
}

export const atual = (f) => f.fotos[f.pos] || null;
export const proxima = (f) => f.fotos[f.pos + 1] || null;
export const terminou = (f) => f.pos >= f.fotos.length;

/** acao: 'apagar' | 'manter'. Avança para a próxima foto. */
export function decidir(f, acao) {
  const foto = atual(f);
  if (!foto) return null;
  if (acao !== 'apagar' && acao !== 'manter') throw new Error('ação inválida: ' + acao);
  f.decisoes.set(foto.id, acao);
  f.historico.push(foto.id);
  f.pos++;
  return foto;
}

/** Volta uma foto e esquece a decisão dela. */
export function desfazer(f) {
  if (!f.historico.length) return null;
  const id = f.historico.pop();
  f.decisoes.delete(id);
  f.pos = f.fotos.findIndex((x) => x.id === id);
  return f.fotos[f.pos];
}

/** Na revisão: troca apagar ↔ manter de uma foto já decidida. */
export function alternar(f, id) {
  const d = f.decisoes.get(id);
  if (!d) return null;
  const nova = d === 'apagar' ? 'manter' : 'apagar';
  f.decisoes.set(id, nova);
  return nova;
}

/** Tira da fila as fotos já apagadas do aparelho. */
export function remover(f, ids) {
  const fora = new Set(ids);
  const antes = f.fotos.slice(0, f.pos).filter((x) => fora.has(x.id)).length;
  f.fotos = f.fotos.filter((x) => !fora.has(x.id));
  f.pos = Math.max(0, f.pos - antes);
  f.historico = f.historico.filter((id) => !fora.has(id));
  for (const id of fora) f.decisoes.delete(id);
}

export function resumo(f) {
  const apagar = f.fotos.filter((x) => f.decisoes.get(x.id) === 'apagar');
  const manter = f.fotos.filter((x) => f.decisoes.get(x.id) === 'manter').length;
  return {
    total: f.fotos.length,
    vistas: f.pos,
    faltam: f.fotos.length - f.pos,
    apagar,
    manter,
    bytes: apagar.reduce((s, x) => s + (x.tamanho || 0), 0),
  };
}

export function formatarBytes(b) {
  if (b < 1024) return `${b} B`;
  const un = ['KB', 'MB', 'GB', 'TB'];
  let v = b / 1024, i = 0;
  while (v >= 1024 && i < un.length - 1) { v /= 1024; i++; }
  return `${v.toLocaleString('pt-BR', { maximumFractionDigits: v < 10 ? 1 : 0 })} ${un[i]}`;
}

/** Decide se o arraste virou escolha: passou de 35% da largura ou foi um gesto rápido. */
export function escolhaDoArraste(dx, largura, velocidade = 0) {
  const limite = largura * 0.35;
  if (dx <= -limite || (dx < -40 && velocidade < -0.6)) return 'apagar';
  if (dx >= limite || (dx > 40 && velocidade > 0.6)) return 'manter';
  return null;
}
