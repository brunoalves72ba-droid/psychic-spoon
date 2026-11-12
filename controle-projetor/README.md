# Controle IR: controle do projetor HY300 pelo infravermelho do celular

App Android que funciona como o controle remoto original do projetor HY300. Cada botão manda pelo emissor infravermelho do celular o mesmo sinal do controle de verdade. Não usa Wi-Fi nem a depuração USB/ADB do projetor.

A versão 2.0, que controlava o projetor pelo ADB via Wi-Fi, fica no histórico do Git (commit "Controle Projetor 2.0 (ADB)").

## Instalar

1. Copie `build/ControleIR.apk` para o celular e abra o arquivo. Se o Android pedir, permita instalar apps dessa origem.
2. O app aparece como **Controle IR**. Ele é um app separado do antigo "Controle Projetor", que pode ser desinstalado.
3. Aponte a ponta de cima do celular, onde fica o emissor, para a frente do projetor.

O celular precisa ter emissor infravermelho, como muitos Xiaomi, Redmi e Poco. Se não tiver, o app avisa.

## Botões

| Aba | Botões |
|---|---|
| Topo | Ligar / Desligar. Com o projetor ligado, ele abre o menu de desligar do próprio projetor. |
| Controle | Voltar, Início, Opções, direcional com OK (as setas repetem se você segurar), volume − e + (também repetem), Sem som |
| Mouse | Liga ou desliga a seta na tela do projetor. Com a seta ligada, o direcional a move e o botão do meio clica. |
| Mais | Espelhar (Android, Miracast) e AirPlay (iPhone) |

## Códigos

Protocolo NEC, portadora de 38 kHz, endereço `0x00`. Os códigos foram capturados do controle original do HY300 por outra pessoa e publicados em [irplus-codes, issue 666](https://github.com/irplus-remote/irplus-codes.github.io/issues/666). O próprio projetor lista o endereço `0x00` com o comando `0x14` como primeiro código de ligar (device tree, `cir_param`). Ele também tem a tabela `customer_ir_ff00.kl`, em que o código 20 (`0x14`) é POWER.

| Botão | Comando |
|---|---|
| Ligar/Desligar | `0x14` |
| Sem som | `0x01` |
| Mouse | `0x82` |
| Cima / Baixo / Esquerda / Direita | `0x03` / `0x02` / `0x0E` / `0x1A` |
| OK | `0x07` |
| Voltar | `0x5C` |
| Opções | `0x13` |
| Início | `0x48` |
| Volume − / + | `0x58` / `0x0B` |
| Espelhar / AirPlay | `0x98` / `0x93` |

Na captura, os códigos `0x98` e `0x93` vieram sem nome. Eles aparecem na mesma posição dos botões Miracast e AirPlay no arquivo do controle publicado junto, por isso recebem esses nomes aqui.

## Compilar

Não usa Gradle. No Ubuntu ou Debian:

```bash
sudo apt-get install aapt zipalign apksigner dalvik-exchange android-sdk-platform-23 openjdk-17-jdk-headless
./build.sh test   # confere os sinais gerados com os capturados do controle original
./build.sh        # gera build/ControleIR.apk
```

A chave de assinatura (`signing/controle-ir.jks`) é criada na primeira compilação e não vai para o Git. Um APK compilado em outro computador sai com outra chave. Nesse caso, desinstale o Controle IR antes de instalar a versão nova.

O código não usa lambdas, porque o `dalvik-exchange` (dx) não converte lambdas do Java 8.
