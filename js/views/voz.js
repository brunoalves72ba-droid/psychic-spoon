// Sexteto — © Bruno Moura, único e exclusivo proprietário.
import { h, fmtDate } from '../core/ui.js';
import { lastEvent, kv } from '../core/store.js';
import { noteName } from '../music/theory.js';

export default async function voz(el) {
  const [voice, portrait] = await Promise.all([kv.get('voice', null), lastEvent('portrait')]);
  const days = portrait ? Math.floor((Date.now() - portrait.ts) / 86400000) : null;
  const tool = (href, c, t, d) => h('a.tool', { href, css: { '--c': c } }, h('b', t), h('span', d));
  el.append(
    h('header', h('div.eyebrow', 'Voz'), h('h1', 'Seu instrumento')),
    h('a.card.col', { href: '#/voz/retrato', style: { textDecoration: 'none', color: 'inherit', borderColor: days == null || days >= 30 ? 'var(--v5)' : 'var(--line)' } },
      h('div.row.between', h('h3', 'Retrato vocal'), h('span.chev', '›')),
      h('p.small.dim', portrait ? `Último: ${fmtDate(portrait.ts)} (há ${days} ${days === 1 ? 'dia' : 'dias'}). ${days >= 30 ? 'Já dá para repetir e comparar.' : 'Repita a cada 30 dias para ver a evolução.'}` : 'Teste guiado de uns três minutos: extensão, tessitura, passagens, vibrato, fôlego e uma escala gravada.'),
      voice ? h('p.small', `Sua extensão medida: ${noteName(voice.lo)} a ${noteName(voice.hi)}.`) : null),
    h('section.tools',
      tool('#/voz/respiracao', 'var(--v0)', 'Respiração', '4-4-8, fôlego longo, quadrada, apoio'),
      tool('#/voz/aquecimento', 'var(--v4)', 'Aquecimento', 'Sete exercícios na sua extensão'),
      tool('#/voz/afinacao', 'var(--v1)', 'Afinação', 'Afinador, nota e harmonia'),
      tool('#/voz/registro', 'var(--v3)', 'Medidor de registro', 'Extensão, registro, passagens, vibrato'),
      tool('#/voz/dicas', 'var(--v2)', 'Dicas', 'Postura, apoio, ressonância, saúde'),
      tool('#/evolucao', 'var(--v5)', 'Evolução', 'Seu histórico e gráficos'),
    ),
    h('div.banner', h('span', '♥'), h('span', h('b', 'Cuide da voz. '), 'Dor é sinal de parada. Rouquidão por mais de duas semanas pede otorrinolaringologista ou fonoaudiólogo.')),
  );
}
