// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Modo foco: tela limpa, relógio visível de 10, 15 ou 25 min e a opção de continuar no fluxo.
// O relógio avisa, mas nunca interrompe: quem está em hiperfoco decide se segue.
import { h, clear, seg, icon, fmtDur, wake, toast, vib, rich } from '../core/ui.js';
import { S, tocarDia, salvar } from '../core/estado.js';
import { missao } from '../data/projeto.js';
import { capturar } from '../core/pensamento.js';

export default async function (el, [mid]) {
  const ms = mid ? missao(mid) : null;
  let alvo = [10, 15, 25].includes(S.perfil.foco) ? S.perfil.foco : 15;
  let ini = 0, pausado = 0, acum = 0, timer = 0, avisou = false, rodando = false;
  const tempo = h('div.tempo', { role: 'timer', 'aria-live': 'off' }, fmtDur(alvo * 60));
  const estado = h('p.dim');
  const botoes = h('div.row.wrap', { style: { justifyContent: 'center' } });
  const passado = () => acum + (rodando ? (Date.now() - ini) / 1000 : 0);
  const tick = () => {
    const s = passado(); const resta = alvo * 60 - s;
    tempo.textContent = resta >= 0 ? fmtDur(resta) : `+${fmtDur(-resta)}`;
    if (resta < 0 && !avisou) {
      avisou = true; vib([200, 100, 200]);
      estado.textContent = 'Tempo cumprido. Pode parar aqui, ou seguir no fluxo: o relógio continua contando.';
      toast(`${alvo} min de foco feitos.`);
    }
  };
  const pintar = () => {
    clear(botoes);
    if (!rodando && acum === 0) botoes.append(h('button.btn.primary.big', { type: 'button', onclick: comecar }, icon('play'), 'Começar'));
    else if (rodando) botoes.append(h('button.btn', { type: 'button', onclick: pausar }, 'Pausar'), h('button.btn.primary', { type: 'button', onclick: terminar }, 'Terminei'));
    else botoes.append(h('button.btn.primary', { type: 'button', onclick: comecar }, 'Continuar'), h('button.btn', { type: 'button', onclick: terminar }, 'Terminei'));
  };
  function comecar() { rodando = true; ini = Date.now(); clearInterval(timer); timer = setInterval(tick, 500); wake.on(); estado.textContent = ms ? `Missão: ${ms.t}` : 'Uma coisa só. O resto espera.'; pintar(); }
  function pausar() { acum = passado(); rodando = false; clearInterval(timer); wake.off(); estado.textContent = 'Em pausa.'; pintar(); }
  function terminar() {
    const min = Math.round(passado() / 60);
    clearInterval(timer); rodando = false; wake.off();
    if (passado() >= 60) { tocarDia('p'); const d = S.dias[Object.keys(S.dias).sort().pop()]; if (d) { d.s = (d.s || 0) + Math.round(passado()); salvar('dias'); } }
    clear(el).append(h('div.foco', h('div.festa', h('div.selo', icon('check')), h('h1', min >= 1 ? `${min} min de foco` : 'Sessão encerrada'),
      h('p.dim', min >= alvo ? 'Bom trabalho. Se der, anote uma frase no diário.' : 'Qualquer minuto conta. Sem culpa.')),
      ms ? h('a.btn.primary.block', { href: `#/projeto/m/${ms.m}` }, 'Marcar o que foi feito na missão') : null,
      h('a.btn.block', { href: '#/projeto/diario' }, 'Escrever no diário'), h('a.btn.quiet.block', { href: '#/hoje' }, 'Voltar para Hoje')));
  }
  el.append(h('div.ptop', h('a.x', { href: ms ? `#/projeto/m/${ms.m}` : '#/hoje', 'aria-label': 'Sair do modo foco' }, icon('fecha')), h('span.grow'),
    h('button.btn.small', { type: 'button', onclick: capturar, 'aria-label': 'Anotar um pensamento' }, icon('nota'), 'Anotar')),
  h('div.foco',
    h('h1', ms ? ms.t : 'Modo foco'),
    seg([10, 15, 25].map((v) => ({ v, label: `${v} min` })), alvo, (v) => { alvo = v; S.perfil.foco = v; salvar('perfil'); avisou = false; tick(); }, { label: 'Duração' }),
    tempo, estado, botoes,
    ms ? h('ul.checks', { style: { textAlign: 'left' } }, ms.itens.map((x) => h('li', rich(x)))) : null,
    h('details', { style: { maxWidth: '420px' } }, h('summary', { style: { minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: '650' } }, 'Estudar junto (opcional)'),
      h('p.small.dim', 'Algumas pessoas rendem mais com alguém “estudando junto”, mesmo em vídeo. A evidência é fraca, mas o custo é baixo: experimente e veja se funciona para você.'),
      h('a.btn.small', { href: 'https://www.youtube.com/results?search_query=study+with+me+pomodoro', target: '_blank', rel: 'noopener noreferrer' }, 'Vídeos “study with me” ↗'))));
  pintar();
  return () => { clearInterval(timer); wake.off(); };
}
