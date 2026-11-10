// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Leitura e escrita de WAV (PCM 16 ou 24 bits), com dither TPDF opcional.

/** channels: [Float32Array, ...]. Retorna Blob audio/wav. */
export function encodeWav(channels, sampleRate, { bits = 16, dither = false } = {}) {
  const nCh = channels.length, n = channels[0].length, bps = bits / 8;
  const buf = new ArrayBuffer(44 + n * nCh * bps), v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n * nCh * bps, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, nCh, true); v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * nCh * bps, true); v.setUint16(32, nCh * bps, true); v.setUint16(34, bits, true);
  str(36, 'data'); v.setUint32(40, n * nCh * bps, true);
  const max = Math.pow(2, bits - 1) - 1;
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < nCh; c++) {
    let x = channels[c][i] * max;
    if (dither) x += Math.random() - Math.random(); // TPDF de ±1 LSB
    x = Math.max(-max - 1, Math.min(max, Math.round(x)));
    if (bits === 16) v.setInt16(o, x, true);
    else { v.setUint8(o, x & 255); v.setUint8(o + 1, (x >> 8) & 255); v.setUint8(o + 2, (x >> 16) & 255); }
    o += bps;
  }
  return new Blob([buf], { type: 'audio/wav' });
}

/** Lê um WAV PCM (8/16/24/32 bits inteiros ou 32 float). Retorna { sampleRate, channels }. */
export function decodeWav(arrayBuffer) {
  const v = new DataView(arrayBuffer);
  const tag = (o) => String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3));
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('Não é um arquivo WAV.');
  let o = 12, fmt = null, data = null;
  while (o + 8 <= v.byteLength) {
    const id = tag(o), size = v.getUint32(o + 4, true);
    if (id === 'fmt ') fmt = { format: v.getUint16(o + 8, true), nCh: v.getUint16(o + 10, true), sampleRate: v.getUint32(o + 12, true), bits: v.getUint16(o + 22, true) };
    else if (id === 'data') data = { off: o + 8, size: Math.min(size, v.byteLength - o - 8) };
    o += 8 + size + (size & 1);
  }
  if (!fmt || !data) throw new Error('WAV incompleto.');
  const bps = fmt.bits / 8, n = Math.floor(data.size / (bps * fmt.nCh));
  const channels = Array.from({ length: fmt.nCh }, () => new Float32Array(n));
  let p = data.off;
  for (let i = 0; i < n; i++) for (let c = 0; c < fmt.nCh; c++) {
    let x;
    if (fmt.format === 3) x = v.getFloat32(p, true);
    else if (fmt.bits === 16) x = v.getInt16(p, true) / 32768;
    else if (fmt.bits === 24) x = ((v.getUint8(p) | (v.getUint8(p + 1) << 8) | (v.getInt8(p + 2) << 16))) / 8388608;
    else if (fmt.bits === 32) x = v.getInt32(p, true) / 2147483648;
    else x = (v.getUint8(p) - 128) / 128;
    channels[c][i] = x; p += bps;
  }
  return { sampleRate: fmt.sampleRate, channels };
}
