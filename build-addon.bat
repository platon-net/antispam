@echo off
rem cd .\src

for /f "delims=" %%a in ('findstr "\"version\"" manifest.json') do @set versionrow=%%a
set version=%versionrow:~13,3%
tar -a -c -f build\thunderbird\Antispam.%version%.xpi --exclude "*.bat" --exclude "*.psd" --exclude "*.eps"  --exclude ".git" --exclude "build" --exclude "test" *

rem cd ..
pause
