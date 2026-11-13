// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Kits de código do projeto: arquivos prontos para baixar e rodar no computador.
import { h, top, toast, download, rich } from '../core/ui.js';

const KITS = [
  { m: 3, t: 'Mini-RAG com fonte', d: 'Indexa a pasta anotacoes/ no ChromaDB e responde citando o arquivo de origem.', arqs: [['kits/m3/mini_rag.py', 'mini_rag.py'], ['kits/m3/requirements.txt', 'requirements.txt'], ['kits/env.example.txt', '.env.example'], ['kits/gitignore.txt', '.gitignore']],
    passos: ['Crie a pasta `ape-ia/rag` e salve os arquivos nela.', 'Crie a subpasta `anotacoes/` com as suas anotações (.md ou .txt).', 'Crie o `.env` a partir do `.env.example` e cole a sua chave do Groq.', 'Rode: `pip install -r requirements.txt`, depois `python mini_rag.py indexar` e `python mini_rag.py`.'] },
  { m: 5, t: 'Fábrica de flashcards', d: 'PDF → pedaços → LLM → JSON validado → flashcards.csv para importar aqui.', arqs: [['kits/m5/fabrica_flashcards.py', 'fabrica_flashcards.py'], ['kits/m5/requirements.txt', 'requirements.txt'], ['kits/env.example.txt', '.env.example'], ['kits/gitignore.txt', '.gitignore']],
    passos: ['Salve os arquivos em `ape-ia/fabrica`, com o `.venv` ativado.', 'Crie o `.env` com a sua chave.', '`pip install -r requirements.txt` e `python fabrica_flashcards.py apostila.pdf`.', 'Importe o `flashcards.csv` em Revisar › Importar cartões.'] },
  { m: 6, t: 'APE-IA v1.0 (agente + Streamlit)', d: 'Agente com RAG, quiz, memória e interface de chat, pronto para o Streamlit Community Cloud.', arqs: [['kits/m6/agente.py', 'agente.py'], ['kits/m6/app.py', 'app.py'], ['kits/m6/requirements.txt', 'requirements.txt'], ['kits/m3/mini_rag.py', 'mini_rag.py'], ['kits/m6/secrets.toml.txt', 'secrets.toml'], ['kits/gitignore.txt', '.gitignore']],
    passos: ['Na pasta do projeto, copie a pasta `anotacoes/` e rode `python mini_rag.py indexar` para criar o `banco/`.', 'Salve o `secrets.toml` em `.streamlit/secrets.toml` com a sua chave (ele está no `.gitignore`).', 'Teste: `streamlit run app.py`.', 'Suba para o GitHub (com o `banco/`, sem segredos) e publique em share.streamlit.io, colando a chave em Secrets.'] },
];

async function baixar(caminho, nome) {
  try { const r = await fetch(caminho); if (!r.ok) throw new Error(r.status); download(new Blob([await r.text()], { type: 'text/plain' }), nome); }
  catch { toast('Não deu para baixar agora. Confira a conexão e tente de novo.'); }
}

export default async function (el) {
  el.append(top('Kits de código', '#/projeto'), h('p.dim', 'Código pronto e comentado. A sua parte é entender cada etapa, ajustar o prompt e rodar no computador. Nenhum kit traz chave: ela fica no seu .env.'));
  for (const k of KITS) {
    el.append(h('section.card.flat.col', { css: { '--c': `var(--m${k.m})` }, style: { borderLeft: '4px solid var(--c)' } },
      h('div.eyebrow', `Módulo ${k.m}`), h('h3', k.t), h('p.small.dim', k.d),
      h('div.row.wrap', k.arqs.map(([c, n]) => h('button.btn.small', { type: 'button', onclick: () => baixar(c, n) }, `↓ ${n}`))),
      h('ol.steps', k.passos.map((p, i) => h('li', h('span', String(i + 1)), h('div', rich(p)))))));
  }
  el.append(h('div.callout.aviso', h('span.rot', 'Antes de publicar'), rich('Rode `git status` e confira que nem `.env` nem `secrets.toml` aparecem na lista. Chave que vai para o GitHub é chave vazada: revogue e gere outra.')));
}

