# Builds build\ControleProjetor.apk with the Android SDK tools only (no Gradle).
# Does not bundle the receiver app (../receptor-projetor); build.sh does. Without it, the
# "Instalar o receptor" button fails, the rest works.
# -DebugBuild marks the APK debuggable (lets `adb shell run-as` reach the app's files for testing).
param([switch]$DebugBuild)
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$buildTools = "$sdk\build-tools\36.0.0"
$androidJar = "$sdk\platforms\android-37.0\android.jar"
$jbr = "C:\Program Files\Android\Android Studio\jbr"
$env:JAVA_HOME = $jbr
$env:PATH = "$jbr\bin;$env:PATH"

$versionCode = 6
$versionName = "5.0"
$out = if ($DebugBuild) { "$root\build-debug" } else { "$root\build" }
$debugFlag = @()
if ($DebugBuild) { $debugFlag = @("--debug-mode") }
$keystore = "$root\signing\controle-ir.jks"
# Personal sideload key; keep the same .jks so new versions install over old ones.
$keyPass = "controle-projetor"

function Check($what) { if ($LASTEXITCODE -ne 0) { throw "$what falhou (codigo $LASTEXITCODE)" } }

if (Test-Path $out) { Remove-Item -Recurse -Force $out }
New-Item -ItemType Directory -Force "$out\classes", "$out\dex", "$out\gen" | Out-Null

& "$buildTools\aapt2.exe" compile --dir "$root\res" -o "$out\res.zip"; Check "aapt2 compile"
& "$buildTools\aapt2.exe" link -o "$out\base.apk" -I $androidJar --manifest "$root\AndroidManifest.xml" `
    --custom-package dev.projetor.controle --min-sdk-version 26 --target-sdk-version 35 --version-code $versionCode --version-name $versionName `
    --java "$out\gen" @debugFlag "$out\res.zip"; Check "aapt2 link"

$sources = Get-ChildItem -Recurse "$root\src", "$out\gen" -Filter *.java | ForEach-Object { $_.FullName }
& "$jbr\bin\javac.exe" -source 8 -target 8 -bootclasspath "$androidJar;$buildTools\core-lambda-stubs.jar" `
    -encoding UTF-8 -nowarn -Xlint:-options `
    -d "$out\classes" $sources; Check "javac"

$classes = Get-ChildItem -Recurse "$out\classes" -Filter *.class | ForEach-Object { $_.FullName }
& "$buildTools\d8.bat" --release --min-api 26 --lib $androidJar --output "$out\dex" $classes; Check "d8"

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open("$out\base.apk", "Update")
[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, "$out\dex\classes.dex", "classes.dex") | Out-Null
$zip.Dispose()

& "$buildTools\zipalign.exe" -f -p 4 "$out\base.apk" "$out\aligned.apk"; Check "zipalign"

if (-not (Test-Path $keystore)) {
    New-Item -ItemType Directory -Force (Split-Path $keystore) | Out-Null
    & "$jbr\bin\keytool.exe" -genkeypair -keystore $keystore -alias controle -keyalg RSA -keysize 2048 `
        -validity 10000 -storepass $keyPass -keypass $keyPass -dname "CN=Controle Projetor"; Check "keytool"
}
& "$buildTools\apksigner.bat" sign --ks $keystore --ks-key-alias controle --ks-pass "pass:$keyPass" `
    --key-pass "pass:$keyPass" --out "$out\ControleProjetor.apk" "$out\aligned.apk"; Check "apksigner"

Write-Output "APK pronto: $out\ControleProjetor.apk"
