@echo off
chcp 65001 >nul
setlocal
title ConteoLima - Compartir en Linea (Cloudflare Tunnel)
color 0b
cd /d "%~dp0"
cls

echo ====================================================
echo        CONTEOLIMA - COMPARTIR PAGINA EN LINEA
echo ====================================================
echo.
echo [1/2] Verificando servidor local en puerto 5181...

:: Verificar si el servidor ya esta corriendo, sino iniciarlo
netstat -aon 2>nul | findstr ":5181 " >nul
if %errorlevel% neq 0 (
    echo Iniciando servidor local en segundo plano...
    start "Servidor Local" /min cmd /c "cd /d "%~dp0backend" && node src/server.js"
    timeout /t 2 /nobreak >nul
) else (
    echo Servidor local ya se encuentra activo en puerto 5181.
)

echo.
echo [2/2] Generando enlace publico con Cloudflare Tunnel...
echo.
echo ====================================================
echo INSTRUCCIONES:
echo.
echo 1. Copia el enlace HTTPS que aparece abajo.
echo    Formato: https://xxxx.trycloudflare.com
echo.
echo 2. Pasale ese enlace a cualquier persona.
echo    Podran abrirlo en su PC o Celular (4G/5G/Wi-Fi).
echo.
echo 3. El enlace se mantendra ACTIVO hasta que cierres
echo    esta ventana o apagues tu equipo.
echo ====================================================
echo.

if exist "%~dp0cloudflared.exe" (
    "%~dp0cloudflared.exe" tunnel --url http://localhost:5181
) else (
    where cloudflared >nul 2>nul
    if %errorlevel% equ 0 (
        cloudflared tunnel --url http://localhost:5181
    ) else (
        echo [ERROR] No se encontro cloudflared.exe en la carpeta del proyecto.
        echo Por favor asegurate de tener cloudflared.exe junto a este archivo.
    )
)

echo.
pause
