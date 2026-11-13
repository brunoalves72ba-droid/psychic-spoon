"""
Fábrica de flashcards do APE-IA (projeto do Módulo 5).

Lê um PDF (ou um CSV com uma coluna "texto"), pede ao LLM flashcards em JSON,
valida, tenta de novo quando vem inválido e salva flashcards.csv (frente;verso),
pronto para importar no app (Revisar › Importar cartões) ou no Anki.

Como usar:
    pip install -r requirements.txt
    python fabrica_flashcards.py apostila.pdf          # gera até 10 cartões
    python fabrica_flashcards.py apostila.pdf 20       # gera até 20

A chave fica no .env (GROQ_API_KEY=...). O .env está no .gitignore.
"""
import csv
import json
import os
import sys
import time

from dotenv import load_dotenv
from groq import Groq
from pypdf import PdfReader

load_dotenv()
MODELO = "openai/gpt-oss-120b"  # confira o nome na lista de modelos do console do Groq
PEDACO = 3500                   # caracteres por chamada (cabe com folga nos limites gratuitos)
PAUSA = 2                       # segundos entre chamadas (lição 3.6)
TENTATIVAS = 3

PROMPT = """Você cria flashcards de estudo em português do Brasil.
Com base SOMENTE no texto abaixo, crie {n} flashcards.
Cada flashcard tem "frente" (uma pergunta curta que se responde sem ver opções)
e "verso" (a resposta em até 2 frases).
Responda somente com JSON válido no formato:
{{"cartoes": [{{"frente": "...", "verso": "..."}}]}}

Texto:
{texto}"""


# 1. Ler
def ler_pdf(caminho):
    leitor = PdfReader(caminho)
    texto = "".join((p.extract_text() or "") + "\n" for p in leitor.pages)
    if not texto.strip():
        raise SystemExit("O PDF não tem texto (deve ser escaneado). Use um PDF com texto ou passe por OCR.")
    return texto


def ler_csv(caminho):
    with open(caminho, encoding="utf-8") as arquivo:
        return "\n".join(linha["texto"] for linha in csv.DictReader(arquivo) if linha.get("texto"))


# 2. Cortar
def cortar(texto, tamanho=PEDACO):
    texto = " ".join(texto.split())  # junta as quebras de linha do PDF
    return [texto[i:i + tamanho] for i in range(0, len(texto), tamanho)]


# 3 e 4. Gerar e conferir
def validar(conteudo):
    try:
        dados = json.loads(conteudo)
    except ValueError:
        return None
    cartoes = dados.get("cartoes") if isinstance(dados, dict) else dados
    if not isinstance(cartoes, list):
        return None
    bons = [c for c in cartoes if isinstance(c, dict) and str(c.get("frente", "")).strip() and str(c.get("verso", "")).strip()]
    return bons or None


def gerar_cartoes(cliente, pedaco, n=5):
    for tentativa in range(1, TENTATIVAS + 1):
        resposta = cliente.chat.completions.create(
            model=MODELO,
            messages=[{"role": "user", "content": PROMPT.format(n=n, texto=pedaco)}],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=1200,
        )
        cartoes = validar(resposta.choices[0].message.content)
        if cartoes:
            return cartoes
        print(f"  JSON inválido (tentativa {tentativa} de {TENTATIVAS}); tentando de novo…")
        time.sleep(PAUSA)
    return []


# 5. Embalar
def salvar_csv(cartoes, caminho="flashcards.csv"):
    with open(caminho, "w", encoding="utf-8", newline="") as arquivo:
        escritor = csv.writer(arquivo, delimiter=";")
        escritor.writerow(["frente", "verso"])
        for c in cartoes:
            escritor.writerow([c["frente"].strip(), c["verso"].strip()])
    print(f"Salvo: {caminho} ({len(cartoes)} cartões)")


def main():
    if len(sys.argv) < 2:
        raise SystemExit("Uso: python fabrica_flashcards.py arquivo.pdf [quantidade]")
    if not os.getenv("GROQ_API_KEY"):
        raise SystemExit("Faltou GROQ_API_KEY no arquivo .env")
    caminho, total = sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 10
    texto = ler_csv(caminho) if caminho.lower().endswith(".csv") else ler_pdf(caminho)
    pedacos = cortar(texto)
    print(f"{len(texto)} caracteres em {len(pedacos)} pedaços.")
    cliente = Groq(api_key=os.getenv("GROQ_API_KEY"))
    cartoes = []
    for i, pedaco in enumerate(pedacos, 1):
        if len(cartoes) >= total:
            break
        print(f"Pedaço {i}…")
        cartoes += gerar_cartoes(cliente, pedaco, n=min(5, total - len(cartoes)))
        time.sleep(PAUSA)
    salvar_csv(cartoes[:total])


if __name__ == "__main__":
    main()
