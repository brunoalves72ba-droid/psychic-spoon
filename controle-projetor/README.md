# Controle Projetor: controle do projetor HY300 pelo celular

App Android que controla o projetor HY300 pelo Wi-Fi, usando a depuração por rede (ADB) do projetor ou o receptor, e que liga e desliga o projetor pelo infravermelho do celular.

A interface segue o estilo do iOS: título grande, pílulas de comando, barra de abas flutuante em cápsula, listas agrupadas como em Ajustes e a fonte Inter, parecida com a do iPhone. As animações usam molas e só mexem em posição, escala e transparência, que a GPU desenha sem refazer o layout.

**Fundo e cores:**
- O fundo é o papel de parede vinho com linhas rosé (`res/drawable-nodpi/fundo.jpg`). Ele fica parado atrás das páginas, como no iOS, com uma sombra vinho no alto e embaixo para o título e a barra de abas continuarem legíveis.
- A paleta vem da imagem: vinho escuro como base e o rosé das linhas como cor de destaque (aba selecionada, links, botões principais, interruptores). Os ícones de Ajustes usam a mesma família: rosé, ameixa, malva, cobre e dourado. Ligar e Desligar continuam verde e vermelho.
- Teclas, pílulas, cartões e listas são de **vidro**: brancos translúcidos, um pouco mais claros no alto e com uma borda fina, de modo que o papel de parede aparece por trás. As teclas ficam um tom acima dos cartões para se destacarem.

- **Topo:** status da conexão e as pílulas **Ligar** e **Desligar** (infravermelho) e **Buscar** (procura o projetor no Wi-Fi).
- **Controle:**
  - pílulas rápidas: Início, Voltar, Menu, Sem som e Apps;
  - controle redondo como o da Apple TV: toque nas bordas (segurar repete), deslize para navegar (cada passo do dedo é uma seta) ou toque no centro para OK;
  - botões Voltar, Início, Play/Pausa e Menu, e a tecla de volume em cápsula;
  - abaixo, o "Tocando agora" resumido e os atalhos de apps.
- **Mídia:**
  - "Tocando agora" com o app, o título e o canal ou artista, e se está tocando ou pausado (lido do projetor pela depuração);
  - botões anterior, voltar 10 s, play/pausa, avançar 10 s e próxima;
  - volume em cápsula no estilo da Central de Controle: arrastar muda o nível sem pular, com um toque leve a cada nível.
- **Touchpad:** move o cursor, clica e rola a tela do projetor.
- **Apps:** grade de ícones como a tela inicial do iPhone, com busca por nome.
- **Ajustes:** listas agrupadas com:
  - telas do projetor, Dormir, Acordar e Reiniciar;
  - digitar no projetor;
  - IP e busca no Wi-Fi;
  - receptor e pareamento;
  - interruptor "Setas e OK pelo infravermelho";
  - velocidade do cursor;
  - estado do infravermelho do celular.

**120 Hz:**
- Em celulares com tela de 120 Hz, o app pede ao Android o modo de 120 Hz na resolução atual. Se o celular também tiver 144 Hz, ele fica com 120; se não tiver 120, usa o modo mais rápido que houver.
- No Android 15 ou mais novo, as telas do app também pedem taxa alta enquanto se mexem. Isso importa nos celulares que baixam a taxa sozinhos para poupar bateria.
- Em **Ajustes → Tela** há o interruptor "Animações a 120 Hz" e a taxa da tela no momento. Alguns celulares só liberam 120 Hz com a taxa de atualização alta ligada nas configurações de tela do aparelho.

No celular, a barra de abas flutua embaixo e a tela fica em pé. No tablet, a barra fica no alto, centralizada, e a tela gira. Com 720 dp de largura ou mais, a aba Controle se divide em duas colunas: o controle à esquerda e mídia, volume e atalhos à direita.

## Sem a depuração: o receptor

Sem a depuração, o celular não consegue mandar comandos ao projetor pela rede. Para o app funcionar igual com ela desligada, existe o **Receptor do Controle** ([`../receptor-projetor`](../receptor-projetor)). É um app pequeno que fica no projetor, recebe os comandos pelo Wi-Fi (porta 7790) e os executa pela Acessibilidade do Android.

**Instalar (uma vez só):**
1. Com a depuração ainda ligada e o app conectado, toque em **Mais → Instalar o receptor no projetor**.
2. O app copia o receptor para o projetor, liga o receptor na Acessibilidade e faz o pareamento sozinho, lendo o código que o receptor gera.
3. Depois disso a depuração pode ser desligada.

Outra forma: instale o `ReceptorControle.apk` no projetor por um pen drive e ative **Receptor do Controle** em *Configurações → Acessibilidade*. Na primeira conexão, o projetor mostra um código de 4 números, e o app pede esse código.

**O que funciona pelo receptor:**
- setas, OK, Voltar e Início;
- play/pausa, voltar e avançar;
- volume (com a barra) e Sem som;
- lista de apps e abrir apps;
- digitar texto (agora com acentos);
- touchpad: o receptor desenha uma seta na tela e toca ou arrasta onde ela está;
- telas de ajustes e Dormir.

**O que vai pelo infravermelho:** Menu, Acordar, Ligar e Desligar, e Reiniciar (que abre o menu de energia do projetor).

No Android 11 do projetor, nenhum app consegue apertar teclas de seta. Por isso o receptor move a seleção entre os itens da tela, como o sistema faz com o controle, e o OK clica no item selecionado. Quando não há item selecionado (por exemplo, num vídeo em tela cheia), o celular manda a seta pelo infravermelho. Na aba Mais, a opção **Setas e OK pelo infravermelho** manda as setas sempre pelo infravermelho.

O receptor só aceita celulares pareados: cada um recebe uma chave guardada nos dois aparelhos.

Quando a depuração está ligada, o app usa o ADB, que imita as teclas com exatidão. Quando só o receptor responde, usa o receptor. O status mostra "· receptor" nesse caso.

## Como o app acha o projetor

O app não depende de IP fixo:

1. Ao abrir o app, ou quando o celular entra num Wi-Fi, ele tenta o último IP em que achou o projetor.
2. Se o projetor não responder nesse IP, o app procura na rede do celular. Ele testa os endereços da faixa (até 254) na porta 5555 (ADB) e na 7790 (receptor), e fica com o primeiro que responde. A busca leva cerca de 3 segundos e não abre pedido nenhum na tela do projetor.
3. Ele se conecta, guarda o novo IP e carrega o volume e a lista de apps.

O botão **Procurar o projetor no Wi-Fi**, na aba Mais, faz essa busca na hora. O campo de IP continua lá para digitar o endereço à mão.

Para funcionar, o projetor precisa estar com a **depuração por rede (ADB)** ligada e no mesmo Wi-Fi que o celular. Na primeira conexão, o projetor pergunta se permite a depuração. Marque "Sempre permitir" e confirme com o controle.

## Ligar e Desligar pelo infravermelho

Os dois botões enviam o botão de energia do controle original: protocolo NEC, portadora de 38 kHz, endereço `0x00`, comando `0x14`. O projetor lista esse código como o primeiro dos que o acordam (device tree, `cir_param`). Também tem a tabela `customer_ir_ff00.kl`, em que o código 20 (`0x14`) é POWER. A captura do controle está em [irplus-codes, issue 666](https://github.com/irplus-remote/irplus-codes.github.io/issues/666).

- **Ligar:** se o app já está conectado, avisa que o projetor está ligado. Se não, envia o sinal e espera o projetor voltar ao Wi-Fi para reconectar sozinho.
- **Desligar:** o projetor mostra o próprio menu de energia. Escolha a opção de desligar com as setas e OK; o app abre a aba Controle para isso. Se o app não estiver conectado, ele pergunta antes de enviar, porque o mesmo sinal ligaria um projetor desligado.

Aponte a ponta de cima do celular, onde fica o emissor, para a frente do projetor.

## Instalar

Abra `build/ControleProjetor.apk` no celular.

- Ele tem o mesmo pacote (`dev.projetor.controle.ir`) e a mesma assinatura da versão 3.0 ("Controle IR"), então instala por cima dela.
- A versão 2.0, feita no PC, tem outra assinatura. Desinstale-a para não ficar com dois "Controle Projetor".

## Compilar

- **Windows com Android Studio:** `build.ps1`, como na versão 2.0.
- **Linux sem o SDK do Google:** `./build.sh`. Os pacotes necessários estão listados no início do script. Na primeira vez, ele baixa do Maven Central o android.jar completo (Robolectric android-all) e o Retrolambda, que converte as lambdas para o `dalvik-exchange`.

`./build.sh test` testa:
- a leitura do "Tocando agora" (`dumpsys media_session`);
- a escolha do modo de tela de 120 Hz;
- o código infravermelho contra os 15 botões capturados do controle;
- a busca na rede com projetores falsos;
- o protocolo entre o celular e o receptor, com pareamento e cada comando.

O `build.sh` também compila o receptor e o põe dentro do APK do celular. O `build.ps1` não faz isso.

A fonte Inter (em `assets/fonts`, só com os caracteres latinos) é da SIL Open Font License; a licença está em `assets/fonts/OFL-Inter.txt`.

A chave de assinatura (`signing/controle-ir.jks`) não vai para o Git. Um APK assinado com outra chave não instala por cima. Nesse caso, desinstale a versão anterior antes.
