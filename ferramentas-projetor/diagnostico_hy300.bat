@echo off
rem Diagnostico e backup SOMENTE LEITURA da imagem do projetor HY300 (Allwinner H713).
rem Nao altera nada. Gera backup_hy300_display.txt nesta pasta.
rem Uso: diagnostico_hy300.bat 192.168.0.5
setlocal
set IP=%1
if "%IP%"=="" set /p IP=IP do projetor (ex.: 192.168.0.5): 
set ADB=adb
where adb >nul 2>nul || set ADB="%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
set OUT=backup_hy300_display.txt

%ADB% connect %IP%:5555
%ADB% -s %IP%:5555 get-state >nul 2>nul || (echo Nao conectou em %IP%:5555. Depuracao por rede ligada? & exit /b 1)
set A=%ADB% -s %IP%:5555 shell

echo ==== HY300 backup %DATE% %TIME% ==== > %OUT%
echo. >> %OUT% & echo ==== adb devices ==== >> %OUT% & %ADB% devices >> %OUT%
echo. >> %OUT% & echo ==== getprop ==== >> %OUT% & %A% getprop >> %OUT%
echo. >> %OUT% & echo ==== service list ==== >> %OUT% & %A% service list >> %OUT%
echo. >> %OUT% & echo ==== dumpsys display ==== >> %OUT% & %A% dumpsys display >> %OUT%
echo. >> %OUT% & echo ==== settings system ==== >> %OUT% & %A% settings list system >> %OUT%
echo. >> %OUT% & echo ==== settings secure ==== >> %OUT% & %A% settings list secure >> %OUT%
echo. >> %OUT% & echo ==== settings global ==== >> %OUT% & %A% settings list global >> %OUT%
echo. >> %OUT% & echo ==== sysfs disp (Allwinner display engine) ==== >> %OUT%
%A% "for f in /sys/class/disp/disp/attr/* /sys/class/disp/disp/*; do [ -f $f ] && echo $f=$(cat $f 2>/dev/null | head -c 300); done" >> %OUT%
echo. >> %OUT% & echo ==== servicos de imagem (pq/tv/disp/color) ==== >> %OUT%
%A% "service list | grep -i -E 'pq|tv|disp|color|picture|aw'" >> %OUT%
%A% "for s in $(service list | grep -i -E 'pq|tvserver|picture' | sed 's/^[0-9]*[[:space:]]*//;s/:.*//'); do echo --- dumpsys $s; dumpsys $s 2>&1 | head -200; done" >> %OUT%
echo. >> %OUT% & echo ==== arquivos de configuracao de imagem ==== >> %OUT%
%A% "ls -la /vendor/etc /system/etc /vendor/etc/pq* /vendor/etc/tv* /vendor/etc/*disp* 2>/dev/null" >> %OUT%
%A% "for f in $(find /vendor/etc /system/etc /odm/etc -maxdepth 2 -type f 2>/dev/null | grep -i -E 'pq|picture|gamma|color|disp|panel|tv'); do echo --- $f; head -c 4000 $f; echo; done" >> %OUT%
echo. >> %OUT% & echo ==== app de ajustes do projetor ==== >> %OUT%
%A% "dumpsys package com.htc.htcsettings | grep -E 'versionName|Activity|Provider' | head -40" >> %OUT%
%A% "content query --uri content://settings/system 2>/dev/null | grep -i -E 'bright|contrast|gamma|satur|sharp|temp|hue|picture|pq'" >> %OUT%

echo.
echo Pronto: %OUT% gravado. Nada foi alterado no projetor.
endlocal
