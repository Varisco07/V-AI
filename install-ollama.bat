@echo off
echo ========================================
echo    JARVIS AI - Installazione Ollama
echo ========================================
echo.

REM Check if Ollama is installed
where ollama >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Ollama e' gia' installato!
    echo.
    ollama --version
    echo.
    goto :download_model
) else (
    echo [!] Ollama non trovato.
    echo.
    echo Scarica Ollama da: https://ollama.ai/download/windows
    echo.
    echo Dopo l'installazione, riavvia questo script.
    echo.
    pause
    start https://ollama.ai/download/windows
    exit /b
)

:download_model
echo ========================================
echo    Download modello AI
echo ========================================
echo.
echo Scegli il modello da scaricare:
echo.
echo 1) llama3.2 (1B) - VELOCE (~2GB)        [Consigliato per PC normali]
echo 2) llama3.2 (3B) - BILANCIATO (~3GB)    [Migliore qualita']
echo 3) llama3.1 (8B) - POTENTE (~8GB)       [Serve GPU o PC potente]
echo 4) codellama - CODICE (~7GB)            [Specializzato per programmazione]
echo.

set /p choice="Scelta (1-4): "

if "%choice%"=="1" (
    set model=llama3.2
    set size=2GB
)
if "%choice%"=="2" (
    set model=llama3.2:3b
    set size=3GB
)
if "%choice%"=="3" (
    set model=llama3.1:8b
    set size=8GB
)
if "%choice%"=="4" (
    set model=codellama
    set size=7GB
)

echo.
echo Scaricando %model% (circa %size%)...
echo Questo potrebbe richiedere qualche minuto.
echo.

ollama pull %model%

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo    INSTALLAZIONE COMPLETATA!
    echo ========================================
    echo.
    echo Modello installato: %model%
    echo.
    echo Per avviare JARVIS:
    echo   npm run dev
    echo.
    echo Poi apri: http://localhost:3000
    echo.
    echo Il sistema e' pronto!
    echo ========================================
    echo.
) else (
    echo.
    echo [ERRORE] Installazione fallita.
    echo Verifica la connessione internet e riprova.
    echo.
)

pause
