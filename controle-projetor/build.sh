#!/usr/bin/env bash
# Compila build/ControleIR.apk só com as ferramentas do Android SDK, sem Gradle.
#   ./build.sh        gera o APK assinado
#   ./build.sh test   confere os códigos infravermelho com os capturados do controle original
#
# No Ubuntu/Debian as ferramentas vêm destes pacotes:
#   sudo apt-get install aapt zipalign apksigner dalvik-exchange android-sdk-platform-23 openjdk-17-jdk-headless
# Variáveis opcionais: ANDROID_JAR, KEYSTORE, KEYSTORE_PASS.
set -euo pipefail
cd "$(dirname "$0")"

VERSION_CODE=3
VERSION_NAME=3.0
ANDROID_JAR=${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}
KEYSTORE=${KEYSTORE:-signing/controle-ir.jks}
KEYSTORE_PASS=${KEYSTORE_PASS:-controle-projetor}
OUT=build

[ -f "$ANDROID_JAR" ] || { echo "android.jar não encontrado em $ANDROID_JAR" >&2; exit 1; }

if [ "${1:-}" = "test" ]; then
    rm -rf "$OUT/test" && mkdir -p "$OUT/test"
    javac -source 8 -target 8 -nowarn -Xlint:-options -encoding UTF-8 -cp "$ANDROID_JAR" -d "$OUT/test" \
        src/dev/projetor/controle/ir/Nec.java src/dev/projetor/controle/ir/IrRemote.java \
        test/dev/projetor/controle/ir/NecTest.java
    java -Dstdout.encoding=UTF-8 -cp "$OUT/test" dev.projetor.controle.ir.NecTest
    exit 0
fi

rm -rf "$OUT" && mkdir -p "$OUT/gen" "$OUT/classes"

aapt package -f -m -J "$OUT/gen" -M AndroidManifest.xml -S res -I "$ANDROID_JAR" \
    --min-sdk-version 26 --target-sdk-version 35 \
    --version-code "$VERSION_CODE" --version-name "$VERSION_NAME" \
    -F "$OUT/base.apk"

# Sem lambdas no código: o dx (dalvik-exchange) não converte lambdas do Java 8.
javac -source 8 -target 8 -nowarn -Xlint:-options -encoding UTF-8 -bootclasspath "$ANDROID_JAR" \
    -d "$OUT/classes" $(find src "$OUT/gen" -name '*.java')

dalvik-exchange --dex --min-sdk-version=26 --output="$OUT/classes.dex" "$OUT/classes"
(cd "$OUT" && aapt add base.apk classes.dex >/dev/null)

zipalign -f -p 4 "$OUT/base.apk" "$OUT/aligned.apk"

if [ ! -f "$KEYSTORE" ]; then
    mkdir -p "$(dirname "$KEYSTORE")"
    keytool -genkeypair -keystore "$KEYSTORE" -alias controle -keyalg RSA -keysize 2048 -validity 10000 \
        -storepass "$KEYSTORE_PASS" -keypass "$KEYSTORE_PASS" -dname "CN=Controle IR" >/dev/null
fi
apksigner sign --ks "$KEYSTORE" --ks-key-alias controle --ks-pass "pass:$KEYSTORE_PASS" \
    --key-pass "pass:$KEYSTORE_PASS" --out "$OUT/ControleIR.apk" "$OUT/aligned.apk"

echo "APK pronto: $OUT/ControleIR.apk"
