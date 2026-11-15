// Limpa Fotos — © Bruno Moura, único e exclusivo proprietário.
// Tela: escolher fotos, triar arrastando (esquerda apaga, direita mantém), revisar e apagar de verdade.
import {
  ehImagem, criarFila, atual, proxima, terminou, decidir, desfazer, alternar, remover, resumo,
  formatarBytes, escolhaDoArraste,
} from './core/fila.js';

// Uma versão antiga do service worker do Sexteto (que fica na raiz do site) pode entregar a tela dele
// no lugar desta. Se acontecer, desliga aquele service worker e recarrega: o Sexteto o instala de novo,
// já atualizado, na próxima vez que for aberto.
if (!document.getElementById('inicio')) {
  const reg = await navigator.serviceWorker?.getRegistration();
  let tentou = false;
  try { tentou = sessionStorage.getItem('lf-conserto') === '1'; sessionStorage.setItem('lf-conserto', '1'); } catch {}
  if (reg && !tentou) { await reg.unregister(); location.reload(); }
  throw new Error('Limpa Fotos: página errada entregue pelo service worker do site.');
}
try { sessionStorage.removeItem('lf-conserto'); } catch {}

const $ = (s) => document.querySelector(s);
const telas = ['inicio', 'triagem', 'revisao'];
const mostrar = (id) => { for (const t of telas) $('#' + t).hidden = t !== id; };

let fila = null;
let podeApagar = false; // o navegador deixa apagar as fotos escolhidas?
const urls = new Map(); // id → object URL

// ---------- Início ----------
const temPasta = 'showDirectoryPicker' in window;
const temArquivos = 'showOpenFilePicker' in window && 'remove' in (window.FileSystemHandle?.prototype || {});
if (temPasta) $('#btn-pasta').hidden = false;
if (temArquivos) $('#btn-fotos').hidden = false;
if (!temPasta && !temArquivos) {
  $('#lbl-input').hidden = false;
  const av = $('#aviso-suporte');
  av.hidden = false;
  av.textContent = 'Neste navegador dá para escolher e triar as fotos, mas ele não deixa nenhum site apagar arquivos. '
    + 'No fim, o app gera a lista das fotos marcadas para você apagar na Galeria. '
    + 'Para apagar direto daqui, use o Chrome ou o Edge no computador.';
}

$('#btn-pasta').addEventListener('click', async () => {
  let dir;
  try { dir = await window.showDirectoryPicker({ id: 'limpa-fotos', mode: 'readwrite', startIn: 'pictures' }); }
  catch (e) { if (e.name !== 'AbortError') aviso('Não deu para abrir a pasta: ' + e.message); return; }
  aviso('Procurando fotos…', 60000);
  const fotos = [];
  await lerPasta(dir, '', fotos);
  podeApagar = true;
  comecar(fotos);
});

async function lerPasta(dir, prefixo, fotos) {
  for await (const [nome, h] of dir.entries()) {
    if (nome.startsWith('.')) continue;
    if (h.kind === 'directory') { await lerPasta(h, prefixo + nome + '/', fotos); continue; }
    if (!ehImagem(nome)) continue;
    const arquivo = await h.getFile();
    fotos.push({
      id: prefixo + nome, nome, caminho: prefixo + nome, tamanho: arquivo.size, data: arquivo.lastModified,
      arquivo, apagar: () => dir.removeEntry(nome),
    });
  }
}

$('#btn-fotos').addEventListener('click', async () => {
  let handles;
  try {
    handles = await window.showOpenFilePicker({
      id: 'limpa-fotos', multiple: true, startIn: 'pictures',
      types: [{ description: 'Fotos', accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif', '.avif'] } }],
    });
  } catch (e) { if (e.name !== 'AbortError') aviso('Não deu para abrir as fotos: ' + e.message); return; }
  const fotos = [];
  for (const [i, h] of handles.entries()) {
    const arquivo = await h.getFile();
    fotos.push({
      id: i + ':' + h.name, nome: h.name, caminho: h.name, tamanho: arquivo.size, data: arquivo.lastModified, arquivo,
      apagar: async () => {
        if ((await h.requestPermission?.({ mode: 'readwrite' })) === 'denied') throw new Error('permissão negada');
        await h.remove();
      },
    });
  }
  podeApagar = true;
  comecar(fotos);
});

$('#input-fotos').addEventListener('change', (e) => {
  const fotos = [...e.target.files].filter((a) => ehImagem(a.name, a.type)).map((a, i) => ({
    id: i + ':' + a.name, nome: a.name, caminho: a.webkitRelativePath || a.name, tamanho: a.size, data: a.lastModified, arquivo: a,
  }));
  e.target.value = '';
  podeApagar = false;
  comecar(fotos);
});

function comecar(fotos) {
  if (!fotos.length) { aviso('Nenhuma foto encontrada aí.'); return; }
  fotos.sort((a, b) => b.data - a.data); // mais novas primeiro, como na galeria
  liberarUrls();
  fila = criarFila(fotos);
  aviso(`${fotos.length} ${fotos.length === 1 ? 'foto' : 'fotos'}. Arraste para escolher.`);
  mostrar('triagem');
  desenhar();
}

// ---------- Imagens ----------
function url(foto) {
  if (!urls.has(foto.id)) urls.set(foto.id, URL.createObjectURL(foto.arquivo));
  return urls.get(foto.id);
}
function liberarUrls(manter = []) {
  const fica = new Set(manter.filter(Boolean).map((f) => f.id));
  for (const [id, u] of urls) if (!fica.has(id)) { URL.revokeObjectURL(u); urls.delete(id); }
}
function porImagem(img, foto) {
  img.alt = foto ? foto.nome : '';
  img.onerror = () => { img.removeAttribute('src'); img.alt = `Sem prévia neste navegador: ${foto.nome}`; };
  if (foto) img.src = url(foto); else img.removeAttribute('src');
}

// ---------- Triagem ----------
const carta = $('#carta');
const selos = { apagar: carta.querySelector('.selo-apagar'), manter: carta.querySelector('.selo-manter') };

function desenhar() {
  if (terminou(fila)) { abrirRevisao(); return; }
  const f = atual(fila), p = proxima(fila);
  liberarUrls([f, p]);
  carta.className = 'carta';
  carta.style.transform = '';
  carta.style.opacity = '';
  selos.apagar.style.opacity = selos.manter.style.opacity = 0;
  porImagem(carta.querySelector('img'), f);
  const baixo = $('#carta-baixo');
  baixo.hidden = !p;
  porImagem(baixo.querySelector('img'), p);
  const r = resumo(fila);
  $('#contador').textContent = `${r.vistas + 1} de ${r.total}`;
  $('#barra-progresso').style.width = (r.vistas / r.total * 100) + '%';
  $('#cont-apagar').textContent = r.apagar.length;
  $('#btn-desfazer').disabled = !fila.historico.length;
  const quando = new Date(f.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  $('#info-foto').textContent = `${f.caminho} · ${quando} · ${formatarBytes(f.tamanho)}`;
}

let animando = false;
function escolher(acao) {
  if (animando || !fila || terminou(fila)) return;
  animando = true;
  const w = carta.offsetWidth || 400;
  const lado = acao === 'apagar' ? -1 : 1;
  selos[acao].style.opacity = 1;
  carta.classList.remove('voltando');
  carta.classList.add('saindo');
  carta.style.transform = `translate(${lado * w * 1.4}px, 40px) rotate(${lado * 24}deg)`;
  carta.style.opacity = 0;
  const fim = () => { animando = false; decidir(fila, acao); desenhar(); };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) fim(); else setTimeout(fim, 260);
}

function voltarUma() {
  if (animando || !fila) return;
  const f = desfazer(fila);
  if (f) { mostrar('triagem'); desenhar(); aviso('Desfeito: ' + f.nome); }
}

$('#btn-apagar').addEventListener('click', () => escolher('apagar'));
$('#btn-manter').addEventListener('click', () => escolher('manter'));
$('#btn-desfazer').addEventListener('click', voltarUma);
$('#btn-revisar').addEventListener('click', abrirRevisao);
$('#btn-sair').addEventListener('click', async () => {
  if (resumo(fila).apagar.length && !(await confirmar('Sair sem apagar?', 'As fotos marcadas não serão apagadas e as escolhas se perdem.', 'Sair'))) return;
  sairParaInicio();
});

document.addEventListener('keydown', (e) => {
  if ($('#triagem').hidden || $('#dlg').open) return;
  if (e.key === 'ArrowLeft') { e.preventDefault(); escolher('apagar'); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); escolher('manter'); }
  else if (e.key === 'Backspace' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z')) { e.preventDefault(); voltarUma(); }
});

// Arraste com o dedo ou o mouse
let toque = null;
carta.addEventListener('pointerdown', (e) => {
  if (animando || (e.pointerType === 'mouse' && e.button !== 0)) return;
  carta.setPointerCapture(e.pointerId);
  carta.classList.remove('voltando');
  toque = { x: e.clientX, y: e.clientY, t: e.timeStamp, ux: e.clientX, ut: e.timeStamp, vel: 0 };
});
carta.addEventListener('pointermove', (e) => {
  if (!toque) return;
  const dx = e.clientX - toque.x, dy = e.clientY - toque.y;
  const dt = e.timeStamp - toque.ut;
  if (dt > 0) toque.vel = (e.clientX - toque.ux) / dt;
  toque.ux = e.clientX; toque.ut = e.timeStamp;
  carta.style.transform = `translate(${dx}px, ${dy * 0.25}px) rotate(${dx / 18}deg)`;
  const forca = Math.min(1, Math.abs(dx) / (carta.offsetWidth * 0.35));
  selos.apagar.style.opacity = dx < 0 ? forca : 0;
  selos.manter.style.opacity = dx > 0 ? forca : 0;
});
const soltar = (e) => {
  if (!toque) return;
  const dx = e.clientX - toque.x;
  const vel = e.timeStamp - toque.ut < 80 ? toque.vel : 0;
  toque = null;
  const acao = e.type === 'pointerup' ? escolhaDoArraste(dx, carta.offsetWidth, vel) : null;
  if (acao) { escolher(acao); return; }
  carta.classList.add('voltando');
  carta.style.transform = '';
  selos.apagar.style.opacity = selos.manter.style.opacity = 0;
};
carta.addEventListener('pointerup', soltar);
carta.addEventListener('pointercancel', soltar);

// ---------- Revisão ----------
let revisaveis = [];
function abrirRevisao() {
  revisaveis = resumo(fila).apagar;
  liberarUrls(revisaveis);
  const grade = $('#grade');
  grade.replaceChildren();
  if (!revisaveis.length) {
    const p = document.createElement('p');
    p.className = 'vazio';
    p.textContent = terminou(fila) ? 'Você manteve todas as fotos. Nada para apagar.' : 'Nenhuma foto marcada para apagar ainda.';
    grade.append(p);
  }
  for (const foto of revisaveis) {
    const b = document.createElement('button');
    b.className = 'miniatura';
    b.dataset.id = foto.id;
    const img = document.createElement('img');
    img.loading = 'lazy';
    porImagem(img, foto);
    b.append(img);
    b.addEventListener('click', () => {
      const nova = alternar(fila, foto.id);
      b.classList.toggle('mantida', nova === 'manter');
      atualizarRevisao();
    });
    grade.append(b);
  }
  $('#btn-continuar').textContent = terminou(fila) ? 'Recomeçar' : 'Continuar escolhendo';
  mostrar('revisao');
  atualizarRevisao();
}

function atualizarRevisao() {
  const r = resumo(fila);
  const n = r.apagar.length;
  $('#resumo').textContent = n
    ? `${n} ${n === 1 ? 'foto' : 'fotos'} para apagar · libera ${formatarBytes(r.bytes)}`
    : 'Nenhuma foto para apagar';
  for (const b of $('#grade').querySelectorAll('.miniatura')) {
    const nome = revisaveis.find((x) => x.id === b.dataset.id)?.nome;
    const vai = fila.decisoes.get(b.dataset.id) === 'apagar';
    b.setAttribute('aria-label', `${nome}: ${vai ? 'será apagada (toque para manter)' : 'mantida (toque para apagar)'}`);
  }
  const btn = $('#btn-confirmar');
  btn.disabled = !n;
  btn.textContent = podeApagar ? (n ? `Apagar ${n}` : 'Apagar') : 'Baixar lista';
}

$('#btn-voltar').addEventListener('click', () => { if (terminou(fila)) voltarUma(); else { mostrar('triagem'); desenhar(); } });
$('#btn-continuar').addEventListener('click', () => {
  if (!terminou(fila)) { mostrar('triagem'); desenhar(); return; }
  sairParaInicio();
});

$('#btn-confirmar').addEventListener('click', async () => {
  const r = resumo(fila);
  if (!r.apagar.length) return;
  if (!podeApagar) { baixarLista(r.apagar); return; }
  const n = r.apagar.length;
  const ok = await confirmar(
    `Apagar ${n} ${n === 1 ? 'foto' : 'fotos'}?`,
    `Libera ${formatarBytes(r.bytes)}. Os arquivos são apagados de vez (não vão para a lixeira) e isso não pode ser desfeito.`,
    `Apagar ${n}`,
  );
  if (!ok) return;
  const btn = $('#btn-confirmar');
  btn.disabled = true;
  const apagadas = [], falhas = [];
  for (const [i, foto] of r.apagar.entries()) {
    btn.textContent = `Apagando ${i + 1} de ${n}…`;
    try { await foto.apagar(); apagadas.push(foto); }
    catch (e) { falhas.push(foto); console.warn('não apagou', foto.caminho, e); }
  }
  const bytes = apagadas.reduce((s, x) => s + x.tamanho, 0);
  remover(fila, apagadas.map((x) => x.id));
  let msg = `${apagadas.length} ${apagadas.length === 1 ? 'foto apagada' : 'fotos apagadas'} · ${formatarBytes(bytes)} liberados`;
  if (falhas.length) msg += `. ${falhas.length} não deu para apagar.`;
  if (falhas.length) { abrirRevisao(); aviso(msg, 6000); return; }
  if (terminou(fila)) sairParaInicio(); else { mostrar('triagem'); desenhar(); }
  aviso(msg, 5000);
});

function baixarLista(fotos) {
  const texto = 'Fotos marcadas para apagar (Limpa Fotos)\n\n' + fotos.map((f) => f.caminho).join('\n') + '\n';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([texto], { type: 'text/plain;charset=utf-8' }));
  a.download = 'fotos-para-apagar.txt';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  aviso('Lista baixada. Apague essas fotos na Galeria do celular.', 5000);
}

function sairParaInicio() {
  liberarUrls();
  fila = null;
  mostrar('inicio');
}

// ---------- Utilidades ----------
function confirmar(titulo, texto, sim) {
  const d = $('#dlg');
  $('#dlg-titulo').textContent = titulo;
  $('#dlg-texto').textContent = texto;
  $('#dlg-sim').textContent = sim;
  d.returnValue = '';
  d.showModal();
  return new Promise((ok) => d.addEventListener('close', () => ok(d.returnValue === 'sim'), { once: true }));
}

let tempoAviso;
function aviso(texto, ms = 2500) {
  const t = $('#toast');
  t.textContent = texto;
  t.classList.add('visivel');
  clearTimeout(tempoAviso);
  tempoAviso = setTimeout(() => t.classList.remove('visivel'), ms);
}

// Modo offline
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
