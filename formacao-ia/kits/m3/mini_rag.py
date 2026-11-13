"""
Mini-RAG do APE-IA (projeto do Módulo 3).

Responde perguntas sobre as suas anotações e cita o arquivo de origem.
Se a resposta não estiver no material, diz "Não encontrei isso no material."

Como usar (no computador, com o ambiente virtual ativado):
    pip install -r requirements.txt
    python mini_rag.py indexar          # lê a pasta anotacoes/ e monta o banco
    python mini_rag.py                  # modo conversa: digite perguntas, "sair" para terminar
    python mini_rag.py teste perguntas.txt   # roda o simulado (uma pergunta por linha)

No Google Colab: envie este arquivo e a pasta anotacoes/, rode
    !pip install -r requirements.txt
e use os mesmos comandos com ! na frente. A chave pode ir numa célula:
    import os; os.environ["GROQ_API_KEY"] = "..."   (nunca salve o notebook com a chave)

A chave fica no arquivo .env (GROQ_API_KEY=...), que NUNCA vai para o GitHub.
"""
import os
import sys
from pathlib import Path

import chromadb
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

PASTA = Path("anotacoes")      # seus arquivos .md e .txt
BANCO = "./banco"              # onde o ChromaDB guarda os vetores
COLECAO = "anotacoes"
MODELO = "openai/gpt-oss-120b" # confira o nome na lista de modelos do console do Groq
TAMANHO = 500                  # caracteres por pedaço (lição 3.11)
SOBRE = 80                     # sobreposição entre pedaços
TOP_K = 3                      # trechos por pergunta (lição 3.13)

# O modelo de embedding padrão do Chroma é pequeno e treinado sobretudo em inglês.
# Para buscar melhor em português, instale sentence-transformers e troque por:
#   from chromadb.utils import embedding_functions
#   EMB = embedding_functions.SentenceTransformerEmbeddingFunction("paraphrase-multilingual-MiniLM-L12-v2")
# e passe embedding_function=EMB em get_or_create_collection (indexe de novo depois de trocar).
EMB = None


def colecao():
    cliente = chromadb.PersistentClient(path=BANCO)
    if EMB:
        return cliente.get_or_create_collection(COLECAO, embedding_function=EMB)
    return cliente.get_or_create_collection(COLECAO)


def cortar(texto, tamanho=TAMANHO, sobre=SOBRE):
    """Divide em pedaços, preferindo cortar em fim de frase."""
    pedacos, ini = [], 0
    while ini < len(texto):
        fim = min(len(texto), ini + tamanho)
        if fim < len(texto):
            ponto = max(texto.rfind(". ", ini, fim), texto.rfind("\n", ini, fim))
            if ponto > ini + tamanho // 2:
                fim = ponto + 1
        pedaco = texto[ini:fim].strip()
        if pedaco:
            pedacos.append(pedaco)
        if fim >= len(texto):
            break
        ini = max(fim - sobre, ini + 1)
    return pedacos


def indexar():
    arquivos = sorted(list(PASTA.glob("*.md")) + list(PASTA.glob("*.txt")))
    if not arquivos:
        print(f"Nenhum .md ou .txt em {PASTA}/. Crie a pasta e coloque as suas anotações nela.")
        return
    cliente = chromadb.PersistentClient(path=BANCO)
    try:
        cliente.delete_collection(COLECAO)  # recomeça do zero a cada indexação
    except Exception:
        pass
    col = colecao()
    total = 0
    for arq in arquivos:
        texto = arq.read_text(encoding="utf-8")
        pedacos = cortar(texto)
        if not pedacos:
            continue
        col.add(
            ids=[f"{arq.name}-{i}" for i in range(len(pedacos))],
            documents=pedacos,
            metadatas=[{"fonte": arq.name} for _ in pedacos],
        )
        total += len(pedacos)
        print(f"{arq.name}: {len(pedacos)} pedaços")
    print(f"Pronto: {total} pedaços indexados.")


def buscar(pergunta, k=TOP_K):
    r = colecao().query(query_texts=[pergunta], n_results=k)
    return list(zip(r["documents"][0], [m["fonte"] for m in r["metadatas"][0]]))


def responder(pergunta):
    trechos = buscar(pergunta)
    contexto = "\n".join(f"[{fonte}] {texto}" for texto, fonte in trechos)
    prompt = (
        "Responda usando SOMENTE o contexto abaixo.\n"
        'Se a resposta não estiver no contexto, diga exatamente: "Não encontrei isso no material."\n'
        "Cite a fonte entre colchetes, como [arquivo.md].\n\n"
        f"Contexto:\n{contexto}\n\nPergunta: {pergunta}"
    )
    cliente = Groq(api_key=os.getenv("GROQ_API_KEY"))
    resposta = cliente.chat.completions.create(
        model=MODELO,
        messages=[
            {"role": "system", "content": "Você é o APE-IA, assistente de estudos. Seja breve e fiel ao contexto."},
            {"role": "user", "content": prompt},
        ],
        temperature=0,
        max_tokens=400,
    )
    return resposta.choices[0].message.content, trechos


def conversar():
    if not os.getenv("GROQ_API_KEY"):
        print("Faltou GROQ_API_KEY no arquivo .env.")
        return
    print('Pergunte sobre as suas anotações. Digite "sair" para terminar.')
    while True:
        pergunta = input("\nVocê: ").strip()
        if pergunta.lower() in ("sair", "exit", ""):
            break
        texto, trechos = responder(pergunta)
        print(f"\nAPE-IA: {texto}")
        print("Trechos usados:", ", ".join(sorted({f for _, f in trechos})))


def teste(arquivo):
    """Simulado da lição 3.14: uma pergunta por linha. Anote à mão se cada resposta está certa."""
    perguntas = [l.strip() for l in Path(arquivo).read_text(encoding="utf-8").splitlines() if l.strip()]
    for i, p in enumerate(perguntas, 1):
        texto, trechos = responder(p)
        print(f"\n{i}. {p}\n   → {texto}\n   fontes: {', '.join(sorted({f for _, f in trechos}))}")


if __name__ == "__main__":
    comando = sys.argv[1] if len(sys.argv) > 1 else "conversar"
    if comando == "indexar":
        indexar()
    elif comando == "teste" and len(sys.argv) > 2:
        teste(sys.argv[2])
    else:
        conversar()
