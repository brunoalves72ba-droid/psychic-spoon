# Receptor do Controle: app do projetor HY300

Fica instalado no projetor e deixa o app **Controle Projetor** do celular funcionar com a depuração USB/ADB desligada. Os detalhes de uso estão no [README do Controle Projetor](../controle-projetor/README.md#sem-a-depuração-o-receptor).

- **Acessibilidade:** roda como serviço de acessibilidade ("Receptor do Controle"). Com ele ativo, volta sozinho depois de reiniciar o projetor.
- **Rede:** escuta na porta 7790 do Wi-Fi. É um protocolo de texto, um comando por linha (veja `ReceiverServer.java`).
- **Pareamento:** só atende celulares pareados. O primeiro pareamento mostra um código de 4 números na tela, válido por 2 minutos e com até 5 tentativas.
- **Teclas e toques:** as setas movem a seleção entre os itens (`focusSearch`), porque o Android 11 não deixa um app apertar teclas. O OK clica no item selecionado, e Voltar e Início usam as ações globais. O touchpad desenha uma seta na tela e faz toques e arrastos nela.
- **Mídia, volume e apps:** as teclas de mídia vão para o player ativo, e o volume usa o `AudioManager`. A lista de apps sai do `PackageManager`.
- **Tela no projetor:** a tela do app mostra se o receptor está ligado e abre a Acessibilidade.

## Compilar

`./build.sh`, com as ferramentas descritas em `../controle-projetor/build.sh`. O APK sai em `build/ReceptorControle.apk`. O `../controle-projetor/build.sh` chama este script e põe o receptor dentro do app do celular.
