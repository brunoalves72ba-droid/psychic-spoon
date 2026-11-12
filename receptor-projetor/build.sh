#!/usr/bin/env bash
# Compila build/ReceptorControle.apk, o app que fica no projetor e deixa o Controle Projetor funcionar
# sem a depuração. Usa as mesmas ferramentas do ../controle-projetor/build.sh (veja lá os pacotes).
# O código do receptor não usa lambdas, então vai direto do javac para o dx.
# Variáveis opcionais: MAVEN_REPO, KEYSTORE, KEYSTORE_PASS.
set -euo pipefail
cd "$(dirname "$0")"

VERSION_CODE=1
VERSION_NAME=1.0
MAVEN_REPO=${MAVEN_REPO:-https://repo1.maven.org/maven2}
KEYSTORE=${KEYSTORE:-../controle-projetor/signing/controle-ir.jks}
KEYSTORE_PASS=${KEYSTORE_PASS:-controle-projetor}
TOOLS=../controle-projetor/.ferramentas
ALL=android-all-14-robolectric-10818077.jar
OUT=build

if [ ! -f "$TOOLS/$ALL" ]; then
    mkdir -p "$TOOLS"
    echo "Baixando $ALL…"
    curl -fsSL -o "$TOOLS/$ALL.part" "$MAVEN_REPO/org/robolectric/android-all/14-robolectric-10818077/$ALL"
    mv "$TOOLS/$ALL.part" "$TOOLS/$ALL"
fi

rm -rf "$OUT" && mkdir -p "$OUT/gen" "$OUT/classes"

# Os recursos usam atributos do Android 7+ (canPerformGestures), então o link usa o Android 14 completo.
aapt package -f -m -J "$OUT/gen" -M AndroidManifest.xml -S res -I "$TOOLS/$ALL" \
    --min-sdk-version 26 --target-sdk-version 30 \
    --version-code "$VERSION_CODE" --version-name "$VERSION_NAME" \
    -F "$OUT/base.apk"

javac --release 8 -nowarn -encoding UTF-8 -cp "$TOOLS/$ALL" -d "$OUT/classes" $(find src "$OUT/gen" -name '*.java')
dalvik-exchange --dex --min-sdk-version=26 --output="$OUT/classes.dex" "$OUT/classes"
(cd "$OUT" && aapt add base.apk classes.dex >/dev/null)
zipalign -f -p 4 "$OUT/base.apk" "$OUT/aligned.apk"

if [ ! -f "$KEYSTORE" ]; then
    mkdir -p "$(dirname "$KEYSTORE")"
    keytool -genkeypair -keystore "$KEYSTORE" -alias controle -keyalg RSA -keysize 2048 -validity 10000 \
        -storepass "$KEYSTORE_PASS" -keypass "$KEYSTORE_PASS" -dname "CN=Controle IR" >/dev/null
fi
apksigner sign --ks "$KEYSTORE" --ks-key-alias controle --ks-pass "pass:$KEYSTORE_PASS" \
    --key-pass "pass:$KEYSTORE_PASS" --out "$OUT/ReceptorControle.apk" "$OUT/aligned.apk"

echo "APK pronto: $OUT/ReceptorControle.apk"
