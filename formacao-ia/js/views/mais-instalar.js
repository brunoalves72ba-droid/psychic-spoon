// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Instalar como app próprio e guardar tudo no aparelho: lições, fotos, laboratórios, Python e kits.
import { h, top, clear, rich, toast, progressBar } from '../core/ui.js';
import * as inst from '../core/instalar.js';
import * as nuvem from '../core/nuvem.js';

export default async function (el) {
  const corpo = h('div.col.gap-l');
  el.append(top('Instalar e salvar no celular', '#/mais/ajustes'), corpo);
  const pintar = async () => {
    const st = await inst.situacaoOffline();
    const ns = nuvem.status();
    clear(corpo);
    // 1. instalação
    const card = h('section.card.dest.col', h('div.row', h('img', { src: 'assets/icons/icon-192.png', alt: '', width: 56, height: 56, style: { borderRadius: '14px' } }),
      h('div', h('h3', 'Formação IA como app próprio'), h('p.small.dim', 'Com ícone próprio na tela inicial, separado do Sexteto.'))));
    if (inst.instalado()) card.append(h('div.banner.ok', 'Você está usando o app instalado.'));
    else if (inst.podeInstalar()) card.append(h('button.btn.primary.big.block', { type: 'button', onclick: async () => { if (await inst.instalar()) toast('Instalado. Procure o ícone “Formação IA” na tela inicial.'); pintar(); } }, 'Instalar o app'));
    else if (inst.ehIOS()) card.append(h('ol.steps', ['Abra este endereço no **Safari** (não dentro de outro app).', 'Toque em **Compartilhar** (o quadrado com a seta para cima).', 'Toque em **Adicionar à Tela de Início** e depois em **Adicionar**.'].map((t, i) => h('li', h('span', String(i + 1)), h('div', rich(t))))));
    else card.append(h('ol.steps', ['Abra este endereço no **Chrome**, digitando ou colando na barra de endereço (não toque no link dentro de outro app).', 'Toque no menu **⋮** no canto de cima.', 'Toque em **Instalar app** (ou **Adicionar à tela inicial** › **Instalar**).'].map((t, i) => h('li', h('span', String(i + 1)), h('div', rich(t))))),
      h('div.callout.aviso', h('span.rot', 'Abriu dentro do Sexteto?'), rich('Se você instalou o Sexteto antes desta atualização, o celular pode continuar abrindo este endereço dentro dele por um ou dois dias, até o Sexteto receber a atualização sozinho. Para instalar agora: abra o **Chrome**, cole o endereço na barra e use **⋮ › Instalar app**.')));
    corpo.append(card);
    // 2. tudo guardado para usar sem internet
    if (st.suportado && st.total) {
      const completo = st.guardados === st.total;
      const barra = h('div', progressBar(st.guardados / st.total, completo ? 'var(--ok)' : 'var(--acao)'));
      const msg = h('p.small.dim', completo ? `Tudo guardado neste aparelho: ${st.total} arquivos (lições, fotos, laboratórios, Python e kits${st.usoMB ? `, cerca de ${st.usoMB.toFixed(0)} MB` : ''}). Funciona sem internet.` : `${st.guardados} de ${st.total} arquivos guardados.`);
      const sec = h('section.card.flat.col', h('h3', 'Funciona sem internet'), barra, msg,
        h('div.row.wrap', h('span.tag' + (st.persistente ? '.ok' : ''), st.persistente ? 'Armazenamento permanente: sim' : 'Armazenamento permanente: ainda não')),
        h('p.small.muted', 'Armazenamento permanente: o celular não apaga os dados do app quando falta espaço. Instalar o app costuma liberar isso.'));
      if (!completo || !st.persistente) sec.append(h('button.btn.primary.block', { type: 'button', onclick: async (e) => {
        const b = e.currentTarget; b.disabled = true;
        const r = await inst.guardarTudo((n, t) => { b.textContent = `Guardando ${n} de ${t}…`; });
        toast(r.falhas ? `${r.falhas} arquivos não baixaram. Confira a internet e tente de novo.` : r.persistente ? 'Tudo guardado, de forma permanente.' : 'Tudo guardado. O navegador ainda não liberou o armazenamento permanente: instale o app.');
        pintar();
      } }, completo ? 'Pedir armazenamento permanente' : 'Guardar tudo agora'));
      corpo.append(sec);
    } else if (st.erro) corpo.append(h('div.banner.quase', `Não deu para conferir os arquivos guardados: ${st.erro}`));
    // 3. o que fica salvo
    corpo.append(h('section.card.flat.col', h('h3', 'O que fica salvo no aparelho'),
      h('ul', { style: { margin: 0, paddingLeft: '1.2em' } },
        h('li', 'Todo o progresso, salvo sozinho a cada passo: lições, cartões, missões, diário, ficha técnica, prompts e ajustes.'),
        h('li', 'O app inteiro: as 98 lições, as fotos, os 14 laboratórios, o Python embutido e os kits de código.'),
        h('li', ns.ligado ? 'A sincronização com o PC, já ligada neste aparelho.' : 'A sincronização com o PC, quando você ligar (o token fica só neste aparelho).')),
      ns.ligado ? null : h('a.btn.block', { href: '#/mais/sync' }, 'Ligar a sincronização com o PC'),
      h('a.btn.quiet.block', { href: '#/mais/backup' }, 'Fazer um backup em arquivo')));
  };
  const off = inst.aoMudar(pintar);
  await pintar();
  return off;
}
