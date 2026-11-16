// Utilidades de MP3 sem dependências: tirar etiquetas ID3 (para juntar pedaços) e medir a duração pelos quadros.
export function semId3(buf) {
  let ini = 0, fim = buf.length;
  if (buf.length > 10 && buf.toString('latin1', 0, 3) === 'ID3') ini = 10 + (((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f));
  if (fim - ini > 128 && buf.toString('latin1', fim - 128, fim - 125) === 'TAG') fim -= 128;
  return buf.subarray(ini, fim);
}
const BR = { 1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320], 2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160] };
const SR = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };
/** Duração em segundos (MPEG camada III, taxa fixa ou variável). */
export function duracaoMp3(buf) {
  const b = semId3(buf);
  let i = 0, seg = 0;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff || (b[i + 1] & 0xe0) !== 0xe0) { i++; continue; }
    const ver = (b[i + 1] >> 3) & 3, camada = (b[i + 1] >> 1) & 3, bri = b[i + 2] >> 4, sri = (b[i + 2] >> 2) & 3, pad = (b[i + 2] >> 1) & 1;
    if (ver === 1 || camada !== 1 || bri === 0 || bri === 15 || sri === 3) { i++; continue; }
    const br = BR[ver === 3 ? 1 : 2][bri] * 1000, sr = SR[ver][sri];
    const tam = Math.floor(((ver === 3 ? 144 : 72) * br) / sr) + pad;
    if (tam < 5) { i++; continue; }
    seg += (ver === 3 ? 1152 : 576) / sr;
    i += tam;
  }
  return Math.round(seg * 100) / 100;
}
