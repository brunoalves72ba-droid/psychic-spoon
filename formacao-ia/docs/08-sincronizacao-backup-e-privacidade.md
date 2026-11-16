# 08 · Sincronização, backup e privacidade

## O que fica onde

| Dado | Onde fica | Sai do aparelho? |
|---|---|---|
| Progresso, cartões, diário, prompts, ficha… (`S`) | IndexedDB `formacao-ia` | só com sincronização (cifrado) ou backup em arquivo |
| Identificador do aparelho, token do GitHub, plataforma (`L`, chave `local`) | IndexedDB | **nunca** (fora do backup e da nuvem) |
| Tema, velocidade do áudio, “tocar ao abrir”, cortes calculados | `localStorage` | nunca |
| Arquivos do app e áudios baixados | Cache do service worker | — |

Sem servidor do app, sem conta, sem analytics, sem chave de IA no navegador.

## Sincronização celular ↔ PC (opcional) — `js/core/nuvem.js`, tela `#/mais/sync`

1. A pessoa cria no GitHub um token **clássico com permissão só de “gist”** (o app abre o link
   `github.com/settings/tokens/new?scopes=gist&description=Formação IA (sincronização)`) e cola o **mesmo token** nos
   dois aparelhos. O token fica só em `L.nuvem.token`.
2. O app procura entre os Gists da pessoa um que tenha o arquivo **`formacao-ia-sync.json`**; se não houver, cria um
   Gist **secreto** com a descrição “Formação IA: sincronização entre aparelhos (conteúdo cifrado)”.
3. **Cifra:** chave AES-GCM de 256 bits derivada do token com PBKDF2 (SHA-256, **150.000 iterações**, sal aleatório de
   16 bytes); IV aleatório de 12 bytes a cada gravação. O arquivo guarda
   `{ "app": "formacao-ia", "v": 1, "sal": base64, "iv": base64, "dados": base64 }`. Quem só tiver o link do Gist não lê nada.
4. **Ciclo:** ler o Gist → decifrar → **mesclar** com o que está no aparelho (regras no capítulo 04) → aplicar se chegou
   algo novo → cifrar → gravar. A comparação usa JSON com chaves ordenadas e sem a sequência semanal (derivada), para não
   acusar mudança falsa.
5. **Quando roda:** 6 s depois de cada gravação; ao abrir (0,3 s); ao voltar para a tela (0,5 s); ao sair da tela
   (imediato); ao voltar a internet; e a cada 5 minutos com a tela visível.
6. Token de outra conta ou trocado: “Os dados da nuvem foram gravados com outro token.” Há como “recomeçar a nuvem”.
   Desconectar apaga só o token deste aparelho.

## Backup em arquivo — tela `#/mais/backup`

- **Exportar:** baixa um `.json` `{ app: 'formacao-ia', esquema: 1, quando, kv, log }` — todas as chaves do estado e o
  histórico, **sem** a chave `local` (sem token). Pelo compartilhamento do celular quando disponível.
- **Importar:** recusa arquivo que não seja deste app (“Este arquivo não é um backup do Formação IA.”) ou de esquema mais
  novo, e substitui os dados (menos os deste aparelho).
- **Apagar todos os dados** (Ajustes): limpa estado e histórico, mantendo só o identificador do aparelho.

## Kits do projeto e chaves

Os kits Python (`kits/`) usam a chave do **Groq** num `.env` do computador da pessoa; o app nunca vê essa chave.
O gerador de áudio usa a chave do Google em `tools/audio/.env` (no `.gitignore`), também só no computador.
