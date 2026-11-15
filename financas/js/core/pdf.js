// Lê o texto de um PDF no próprio aparelho com o pdf.js (Mozilla, licença Apache 2.0). Nada é enviado.
// Devolve as linhas da página com a posição de cada pedaço de texto, para o leitor de extratos
// (lerPDF em importar.js) separar data, descrição e valor e reconhecer as colunas.
let lib = null;
async function carregar() {
  if (!lib) {
    lib = await import('../vendor/pdfjs/pdf.min.mjs');
    lib.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
  }
  return lib;
}

/** O PDF pede senha (`errada`: a senha informada não abriu). */
export class SenhaPDF extends Error {
  constructor(errada) { super(errada ? 'Senha incorreta. Confira e tente de novo.' : 'Este PDF é protegido por senha.'); this.name = 'SenhaPDF'; this.errada = errada; }
}

export function ehPDF(bytes, nome = '') {
  if (/\.pdf$/i.test(nome)) return true;
  const u = bytes instanceof Uint8Array ? bytes.subarray(0, 5) : new Uint8Array(bytes, 0, Math.min(5, bytes.byteLength));
  return String.fromCharCode(...u) === '%PDF-';
}

/** Linhas do PDF: [{ pagina, y, itens: [{ t, x, w, h }] }], de cima para baixo e da esquerda para a direita. */
export async function linhasDoPDF(bytes, senha) {
  const pdfjs = await carregar();
  let doc;
  try {
    doc = await pdfjs.getDocument({ data: new Uint8Array(bytes).slice(), password: senha || undefined, isEvalSupported: false, disableFontFace: true, useSystemFonts: false }).promise;
  } catch (e) {
    if (e && e.name === 'PasswordException') throw new SenhaPDF(e.code === pdfjs.PasswordResponses.INCORRECT_PASSWORD);
    throw new Error('Não consegui abrir esse PDF. Ele pode estar corrompido.');
  }
  const linhas = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const pg = await doc.getPage(n);
    const tc = await pg.getTextContent();
    const itens = tc.items.filter((i) => i.str && i.str.trim())
      .map((i) => ({ t: i.str, x: i.transform[4], y: i.transform[5], w: i.width, h: Math.abs(i.transform[3]) || Math.abs(i.height) || 8 }))
      .sort((a, b) => b.y - a.y || a.x - b.x);
    let atual = null;
    for (const it of itens) {
      if (atual && Math.abs(atual.y - it.y) <= Math.max(2, Math.min(atual.h, it.h) * 0.45)) atual.itens.push(it);
      else { atual = { pagina: n, y: it.y, h: it.h, itens: [it] }; linhas.push(atual); }
    }
    pg.cleanup();
  }
  await doc.destroy();
  for (const l of linhas) l.itens.sort((a, b) => a.x - b.x);
  return linhas;
}
