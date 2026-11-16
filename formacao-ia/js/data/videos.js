// Formação IA Generativa — vídeos opcionais das aulas (YouTube; pode ser "não listado").
// Para pôr um vídeo numa aula, acrescente uma linha: 'ID da aula': 'link do YouTube'.
// Aceita youtu.be/…, youtube.com/watch?v=…, /shorts/…, /embed/… ou só o código de 11 letras.
// Sem vídeo, a aula aparece normal. (As aulas em si ficam em m0.js … m6c.js e não mudam.)
export const VIDEOS = {
  // '0.1': 'https://youtu.be/XXXXXXXXXXX',
};

export function idYoutube(link) {
  const s = String(link || '').trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/);
  return m ? m[1] : null;
}
export const videoDaAula = (id) => idYoutube(VIDEOS[id]);
