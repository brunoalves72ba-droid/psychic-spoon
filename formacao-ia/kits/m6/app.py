"""
Interface do APE-IA v1.0 em Streamlit (lições 6.13 a 6.15).

No computador:  streamlit run app.py   (chave em .streamlit/secrets.toml, fora do Git)
Na nuvem:       Streamlit Community Cloud, com a chave colada em Settings › Secrets.
"""
import uuid

import streamlit as st

from agente import criar_agente, perguntar

st.set_page_config(page_title="APE-IA", page_icon="🤖")
st.title("APE-IA")
st.caption("Assistente de estudos que responde com base nas minhas anotações do curso e cita a fonte.")


@st.cache_resource
def agente_compartilhado():
    return criar_agente(api_key=st.secrets["GROQ_API_KEY"])


# o script roda de novo a cada interação: o que precisa durar mora no session_state
if "mensagens" not in st.session_state:
    st.session_state.mensagens = []
if "thread_id" not in st.session_state:
    st.session_state.thread_id = str(uuid.uuid4())  # uma conversa por visitante

for m in st.session_state.mensagens:
    with st.chat_message(m["role"]):
        st.markdown(m["content"])

pergunta = st.chat_input("Sua dúvida sobre o curso")
if pergunta:
    pergunta = pergunta[:1000]  # guardrail: entrada de tamanho limitado
    st.session_state.mensagens.append({"role": "user", "content": pergunta})
    with st.chat_message("user"):
        st.markdown(pergunta)
    with st.chat_message("assistant"):
        with st.spinner("Pensando…"):
            try:
                resposta = perguntar(agente_compartilhado(), pergunta, st.session_state.thread_id)
            except Exception as erro:
                resposta = f"Não consegui responder agora ({type(erro).__name__}). Tente de novo em instantes."
        st.markdown(resposta)
    st.session_state.mensagens.append({"role": "assistant", "content": resposta})

with st.sidebar:
    st.markdown("**Limitações:** responde só sobre as anotações indexadas; pode errar; confira o que importa.")
    st.markdown("**Privacidade (LGPD):** não digite dados pessoais. As perguntas são enviadas ao provedor do modelo para gerar a resposta e não são guardadas por este app.")
    if st.button("Nova conversa"):
        st.session_state.mensagens = []
        st.session_state.thread_id = str(uuid.uuid4())
        st.rerun()
