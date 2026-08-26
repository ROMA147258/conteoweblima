@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title ConteoLima - Compartir en Linea (Cloudflare Tunnel)
color 0b
cd /d "%~dp0"
cls

echo ====================================================
echo        CONTEOLIMA - COMPARTIR PAGINA EN LINEA
echo ====================================================
echo.

:: Detectar Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
  if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
  if exist "%LOCALAPPDATA%\Programs\node\node.exe" set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%"
  if exist "%APPDATA%\nvm\node.exe" set "PATH=%APPDATA%\nvm;%PATH%"
)

echo [1/3] Verificando Backend API en puerto 5182...
netstat -aon 2>nul | findstr ":5182 " >nul
if %errorlevel% neq 0 (
    echo     Iniciando Backend en segundo plano...
    start "Voto Real - Backend API" /min cmd /c "cd /d "%~dp0backend" && npm start"
    timeout /t 2 /nobreak >nul
) else (
    echo     Backend activo en puerto 5182.
)

echo.
echo [2/3] Verificando Frontend Web en puerto 5174...
netstat -aon 2>nul | findstr ":5174 " >nul
if %errorlevel% neq 0 (
    echo     Iniciando Frontend en segundo plano...
    start "Voto Real - Frontend Web" /min cmd /c "cd /d "%~dp0frontend" && npm run dev"
    timeout /t 3 /nobreak >nul
) else (
    echo     Frontend activo en puerto 5174.
)

echo.
echo [3/3] Generando enlace publico con Cloudflare Tunnel...
echo.
echo ====================================================
echo INSTRUCCIONES:
echo.
echo 1. Copia el enlace HTTPS que aparece abajo.
echo    Formato: https://xxxx.trycloudflare.com
echo.
echo 2. Pasale ese enlace a cualquier persona.
echo    Podran abrir la plataforma en PC o Celular.
echo.
echo 3. El enlace se mantendra ACTIVO mientras esta
echo    ventana permanezca abierta.
echo ====================================================
echo.

if exist "%~dp0cloudflared.exe" (
    "%~dp0cloudflared.exe" tunnel --url http://localhost:5174
) else (
    where cloudflared >nul 2>nul
    if %errorlevel% equ 0 (
        cloudflared tunnel --url http://localhost:5174
    ) else (
        echo [ERROR] No se encontro cloudflared.exe en la carpeta del proyecto.
        echo Por favor asegurate de tener cloudflared.exe junto a este archivo.
    )
)

echo.
pause
