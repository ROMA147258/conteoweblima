@echo off
chcp 65001 >nul
title Voto Real Lima - Sistema Electoral (Clean Architecture)
color 0A
cls

cd /d "%~dp0"

echo.
echo  ======================================================
echo         VOTO REAL - SISTEMA ELECTORAL LIMA
echo         Arquitectura Frontend (React) + Backend (Node)
echo         SQL Server 2022 - Base de Datos: conteo
echo  ======================================================
echo.

:: Detectar Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
  if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
  if exist "%LOCALAPPDATA%\Programs\node\node.exe" set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%"
  if exist "%APPDATA%\nvm\node.exe" set "PATH=%APPDATA%\nvm;%PATH%"
)

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo  [ERROR] Node.js no esta instalado en este equipo.
  echo  Descargalo desde: https://nodejs.org
  echo.
  pause
  exit /b 1
)

:: Verificar dependencias backend
if not exist "backend\node_modules\" (
  echo  Instalando dependencias de Backend...
  cd backend
  call npm install
  cd ..
  echo.
)

:: Verificar dependencias frontend
if not exist "frontend\node_modules\" (
  echo  Instalando dependencias de Frontend...
  cd frontend
  call npm install
  cd ..
  echo.
)

:: Liberar puertos 5181 y 5174 si estaban ocupados
echo  Verificando puertos 5181 y 5174...
powershell -Command "Get-NetTCPConnection -LocalPort 5181,5174 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>nul

echo.
echo  ======================================================
echo   Iniciando Backend en:  http://localhost:5181
echo   Iniciando Frontend en: http://localhost:5174
echo.
echo   Usuario Admin: admin
echo   Contraseña:    admin2026
echo.
echo   Presiona Ctrl+C o cierra esta ventana para detener.
echo  ======================================================
echo.

:: Iniciar Backend en segundo plano
start "Voto Real - Backend API" /min cmd /c "cd /d "%~dp0backend" && node src/server.js"

:: Abrir navegador en el Frontend tras 2 segundos
start "" cmd /c "ping -n 3 127.0.0.1 >nul & start http://localhost:5174"

:: Iniciar Frontend en primer plano
cd frontend
call npm run dev

echo.
echo  [AVISO] El sistema se ha detenido.
echo.
pause
