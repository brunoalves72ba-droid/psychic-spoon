#!/usr/bin/env bash
# Compila build/ControleProjetor.apk em Linux, sem Gradle e sem o Android SDK do Google.
#   ./build.sh        gera o APK assinado
#   ./build.sh test   testa o código infravermelho e a busca do projetor na rede
#
# Pacotes (Ubuntu/Debian):
#   sudo apt-get install aapt zipalign apksigner dalvik-exchange android-sdk-platform-23 \
#       openjdk-17-jdk-headless openjdk-8-jdk-headless
# Na primeira vez, baixa do Maven Central para .ferramentas/ o android.jar completo (Robolectric
# android-all, ~140 MB) e o Retrolambda, que converte as lambdas para o dx.
# No Windows com o Android Studio, use build.ps1.
# Variáveis opcionais: MAVEN_REPO, JAVA8, ANDROID_JAR, KEYSTORE, KEYSTORE_PASS.
set -euo pipefail
cd "$(dirname "$0")"

VERSION_CODE=4
VERSION_NAME=4.0
MAVEN_REPO=${MAVEN_REPO:-https://repo1.maven.org/maven2}
JAVA8=${JAVA8:-/usr/lib/jvm/java-8-openjdk-amd64/bin/java}
ANDROID_JAR=${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}
KEYSTORE=${KEYSTORE:-signing/controle-ir.jks}
KEYSTORE_PASS=${KEYSTORE_PASS:-controle-projetor}
TOOLS=.ferramentas
OUT=build

fetch() {  # fetch <grupo/caminho> <arquivo>
    [ -f "$TOOLS/$2" ] && return
    mkdir -p "$TOOLS"
    echo "Baixando $2…"
    curl -fsSL -o "$TOOLS/$2.part" "$MAVEN_REPO/$1/$2" && mv "$TOOLS/$2.part" "$TOOLS/$2"
}

if [ "${1:-}" = "test" ]; then
    rm -rf "$OUT/test" && mkdir -p "$OUT/test"
    javac --release 11 -nowarn -encoding UTF-8 -d "$OUT/test" \
        src/dev/projetor/controle/IrCodes.java src/dev/projetor/controle/LanScanner.java \
        test/IrCodesTest.java test/LanScannerTest.java
    java -Dstdout.encoding=UTF-8 -cp "$OUT/test" IrCodesTest
    java -Dstdout.encoding=UTF-8 -cp "$OUT/test" LanScannerTest
    exit 0
fi

ALL=android-all-14-robolectric-10818077.jar
RETRO=retrolambda-2.5.7.jar
fetch org/robolectric/android-all/14-robolectric-10818077 "$ALL"
fetch net/orfjackal/retrolambda/retrolambda/2.5.7 "$RETRO"
[ -f "$ANDROID_JAR" ] || { echo "android.jar não encontrado em $ANDROID_JAR" >&2; exit 1; }

rm -rf "$OUT" && mkdir -p "$OUT/gen" "$OUT/classes" "$OUT/retro"

# Recursos: o android.jar 23 basta (ícones vetoriais sem atributos novos).
aapt package -f -m -J "$OUT/gen" -M AndroidManifest.xml -S res -I "$ANDROID_JAR" \
    --custom-package dev.projetor.controle \
    --min-sdk-version 26 --target-sdk-version 35 \
    --version-code "$VERSION_CODE" --version-name "$VERSION_NAME" \
    -F "$OUT/base.apk"

# Código: compila contra o Android 14 completo e converte as lambdas (o dx não as entende).
javac --release 8 -nowarn -encoding UTF-8 -cp "$TOOLS/$ALL" -d "$OUT/classes" \
    $(find src "$OUT/gen" -name '*.java')
"$JAVA8" -Dretrolambda.inputDir="$OUT/classes" -Dretrolambda.classpath="$OUT/classes:$ANDROID_JAR" \
    -Dretrolambda.outputDir="$OUT/retro" -jar "$TOOLS/$RETRO" >/dev/null

dalvik-exchange --dex --min-sdk-version=26 --output="$OUT/classes.dex" "$OUT/retro"
(cd "$OUT" && aapt add base.apk classes.dex >/dev/null)
zipalign -f -p 4 "$OUT/base.apk" "$OUT/aligned.apk"

if [ ! -f "$KEYSTORE" ]; then
    mkdir -p "$(dirname "$KEYSTORE")"
    keytool -genkeypair -keystore "$KEYSTORE" -alias controle -keyalg RSA -keysize 2048 -validity 10000 \
        -storepass "$KEYSTORE_PASS" -keypass "$KEYSTORE_PASS" -dname "CN=Controle IR" >/dev/null
fi
apksigner sign --ks "$KEYSTORE" --ks-key-alias controle --ks-pass "pass:$KEYSTORE_PASS" \
    --key-pass "pass:$KEYSTORE_PASS" --out "$OUT/ControleProjetor.apk" "$OUT/aligned.apk"

echo "APK pronto: $OUT/ControleProjetor.apk"
