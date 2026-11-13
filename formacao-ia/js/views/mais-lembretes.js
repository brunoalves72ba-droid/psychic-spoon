// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Lembretes: eventos semanais no calendário do celular (.ics), com a próxima ação concreta escrita no aviso.
// Um app web não consegue avisar de forma confiável com o navegador fechado; o calendário consegue.
import { h, top, seg, toast, textFile } from '../core/ui.js';
import { S, salvar } from '../core/estado.js';
import { hoje, addDays, dow } from '../core/dia.js';

const SIGLA = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
const NOMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/** Gera o arquivo .ics: um evento semanal recorrente por horário, com alarme na hora. */
export function gerarIcs({ dias, hora, minutos, url, inicio }) {
  const [hh, mm] = hora.split(':').map(Number);
  const d0 = addDays(inicio, (dias.map((x) => (x - dow(inicio) + 7) % 7).sort((a, b) => a - b)[0]) || 0);
  const pad = (n) => String(n).padStart(2, '0');
  const ini = `${d0.replace(/-/g, '')}T${pad(hh)}${pad(mm)}00`;
  const fimMin = hh * 60 + mm + minutos;
  const fim = `${d0.replace(/-/g, '')}T${pad(Math.floor(fimMin / 60) % 24)}${pad(fimMin % 60)}00`;
  const desc = `Abra o app e toque em Começar: a próxima lição já está carregada. Dia ruim? Um cartão já conta.\\n${url}`;
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Formacao IA//Lembretes//PT', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:formacao-ia-${ini}@local`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`, `DTSTART:${ini}`, `DTEND:${fim}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${dias.map((x) => SIGLA[x]).join(',')}`,
    `SUMMARY:Estudar IA: ${minutos} min`, `DESCRIPTION:${desc}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Hora de estudar: só tocar em Começar.', 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
}

export default async function (el) {
  const cfg = S.perfil.lembrete || { dias: [0, 2, 4, 6], hora: '20:00', minutos: S.perfil.alvo || 15 };
  const diasBox = h('div.seg.wrap', { role: 'group', 'aria-label': 'Dias da semana' }, NOMES.map((n, i) => h('button.chip', { type: 'button', 'aria-pressed': String(cfg.dias.includes(i)), onclick: (e) => {
    cfg.dias = cfg.dias.includes(i) ? cfg.dias.filter((x) => x !== i) : [...cfg.dias, i].sort(); e.currentTarget.setAttribute('aria-pressed', String(cfg.dias.includes(i)));
  } }, n)));
  const hora = h('input.inp', { type: 'time', value: cfg.hora, 'aria-label': 'Horário', style: { maxWidth: '160px' } });
  el.append(top('Lembretes', '#/progresso'),
    h('p.dim', 'Um ou dois lembretes por dia, no máximo, sempre com a próxima ação concreta. Eles vão para o calendário do seu celular, que avisa mesmo com o app fechado.'),
    h('label.field', h('span', 'Dias'), diasBox),
    h('label.field', h('span', 'Horário'), hora),
    h('label.field', h('span', 'Duração no calendário'), seg([5, 15, 30].map((v) => ({ v, label: `${v} min` })), cfg.minutos, (v) => { cfg.minutos = v; }, { label: 'Duração' })),
    h('button.btn.primary.block', { type: 'button', onclick: () => {
      if (!cfg.dias.length) { toast('Escolha pelo menos um dia.'); return; }
      cfg.hora = hora.value || '20:00';
      S.perfil.lembrete = cfg; salvar('perfil');
      textFile(gerarIcs({ ...cfg, url: location.href.split('#')[0] + '#/hoje/comecar', inicio: hoje() }), 'lembretes-formacao-ia.ics', 'text/calendar');
      toast('Abra o arquivo baixado para adicionar ao calendário.');
    } }, 'Baixar para o calendário (.ics)'),
    h('div.callout.dica', h('span.rot', 'Se os lembretes virarem ruído'), 'Ignorou o aviso três vezes seguidas? É sinal de horário ruim, não de falta de força de vontade. Apague o evento no calendário e gere outro, em outro horário. Menos lembretes, melhores.'),
    h('p.small.muted', 'No iPhone, abra o arquivo pelo Safari ou pelo app Arquivos e toque em “Adicionar todos”. No Android, abra com o Google Agenda.'));
}
