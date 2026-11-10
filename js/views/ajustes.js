// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Ajustes: nomes das notas, afinação de referência, fones e informações do app.

import { h, top, toggle, slider, toast } from '../core/ui.js';
import { prefs } from '../core/store.js';
import { setSolfege, noteName } from '../music/theory.js';
import { setA4, pianoNote, now, unlock } from '../audio/engine.js';

export default async function ajustes(el) {
  const ex = h('span.val');
  const showEx = () => { ex.textContent = [60, 62, 64, 66].map(noteName).join(' · '); };
  showEx();
  const support = [
    ['AudioWorklet', typeof AudioWorkletNode !== 'undefined'],
    ['Microfone', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)],
    ['Funciona offline (Service Worker)', 'serviceWorker' in navigator],
    ['Tela sempre acesa (Wake Lock)', 'wakeLock' in navigator],
    ['Vibração', 'vibrate' in navigator],
    ['Teclado MIDI (Web MIDI)', 'requestMIDIAccess' in navigator],
    ['Compartilhar arquivos (Web Share)', 'share' in navigator],
    ['Tela cheia', !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)],
    ['Armazenamento persistente', !!(navigator.storage && navigator.storage.persist)],
  ];
  el.append(
    top('Ajustes', '#/inicio'),
    h('section.card.col',
      h('h3', 'Nomes das notas'),
      toggle('Usar Dó-Ré-Mi (desligado: C-D-E)', prefs.get('solfege'), async (v) => { await prefs.set('solfege', v); setSolfege(v); showEx(); }),
      h('p.small.muted', 'Exemplo: ', ex, '. As cifras dos acordes ficam sempre em letras (C, Dm7, G13).'),
    ),
    h('section.card.col',
      h('h3', 'Afinação de referência'),
      slider('Lá central (A4)', { min: 432, max: 446, step: 1, value: prefs.get('a4') || 440, unit: 'Hz' }, async (v) => { await prefs.set('a4', v); setA4(v); }),
      h('button.btn.small', { onclick: async () => { await unlock(); pianoNote(69, now(), 1.5); } }, 'Ouvir o Lá'),
    ),
    h('section.card.col',
      h('h3', 'Fones'),
      toggle('Já uso fones (não avisar de novo)', prefs.get('fones'), (v) => prefs.set('fones', v)),
      h('p.small.muted', 'Nas telas em que o app toca e escuta ao mesmo tempo, os fones evitam que o microfone capte o alto-falante.'),
    ),
    h('section.card.col',
      h('h3', 'Este aparelho'),
      h('ul.small', { style: { margin: 0, paddingLeft: '1.1em' } }, support.map(([n, ok]) => h('li', `${ok ? '✓' : '—'} ${n}${ok ? '' : ' (o app usa uma alternativa)'}`))),
      h('button.btn.small', { onclick: async () => {
        if (!('serviceWorker' in navigator)) return toast('Este navegador não tem service worker.');
        const reg = await navigator.serviceWorker.getRegistration(); if (reg) { await reg.update(); toast('Procurei por atualização.'); } else toast('O modo offline ainda não foi instalado.');
      } }, 'Procurar atualização'),
    ),
    h('section.card.col',
      h('h3', 'Sobre'),
      h('p', 'Sexteto: harmonia vocal, técnica vocal e produção musical.'),
      h('p.small', h('b', '© Bruno Moura. '), 'O único e exclusivo proprietário deste app é o usuário que o idealizou, Bruno Moura.'),
      h('p.small.muted', 'Seus dados e gravações ficam só neste aparelho. Sem login, sem analytics, sem requisições externas.'),
      h('div.row.wrap', h('a.btn.small', { href: '#/estudio/creditos' }, 'Créditos e licenças'), h('a.btn.small', { href: '#/evolucao/backup' }, 'Backup')),
    ),
  );
}
