@echo off

rem change encoding to UTF-8
chcp 65001 >nul

rem cd .\src

if "%1"=="" goto build
if /i "%1"=="build" goto build
if /i "%1"=="basic" goto basic
if /i "%1"=="plus" goto plus
if /i "%1"=="help" goto usage
goto usage

:build
echo 🚀 Building of Antispam

echo ➡️ Build of BASIC version
copy manifest-basic.json manifest.json

for /f "delims=" %%a in ('findstr "\"version\"" manifest.json') do @set versionrow=%%a
set version=%versionrow:~13,4%
tar -a -c -f build\thunderbird\Antispam.%version%.zip ^
	--exclude "*.bat" --exclude "*.psd" --exclude "*.eps" ^
	--exclude ".git" --exclude "build" --exclude "test" ^
	--exclude "manifest-basic.json" --exclude "manifest-plus.json" ^
	--exclude "experiment.js" --exclude "css/experiment.css" --exclude "schema.json" ^
	*
move build\thunderbird\Antispam.%version%.zip build\thunderbird\Antispam.%version%.xpi

echo ➡️ Build of PLUS version
copy manifest-plus.json manifest.json

for /f "delims=" %%a in ('findstr "\"version\"" manifest.json') do @set versionrow=%%a
set version=%versionrow:~13,4%
tar -a -c -f build\thunderbird\AntispamPlus.%version%.zip ^
	--exclude "*.bat" --exclude "*.psd" --exclude "*.eps" ^
	--exclude ".git" --exclude "build" --exclude "test" ^
	--exclude "manifest-basic.json" --exclude "manifest-plus.json" ^
	*
move build\thunderbird\AntispamPlus.%version%.zip build\thunderbird\AntispamPlus.%version%.xpi

echo ✅ Done.
goto end

:basic
echo ➡️ Copy manifest of BASIC version
copy manifest-basic.json manifest.json
echo ✅ Done.
goto end

:plus
echo ➡️ Copy manifest of PLUS version
copy manifest-plus.json manifest.json
echo ✅ Done.
goto end

:usage
echo ℹ️ Usage:      run.bat build^|basic^|plus
echo.
echo 👉 build:      Build addon for BASIC and PLUS version
echo 👉 basic:      Copy manifest of BASIC to main manifest file
echo 👉 plus:       Copy manifest of PLUS to main manifest file

:end
rem cd ..
rem pause
