@echo off
:: Ajoute l'agent dans le dossier Démarrage de Windows
:: (se lance automatiquement à chaque ouverture de session)

set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SCRIPT=%~dp0start.bat

echo Copie dans le dossier Demarrage Windows...
copy "%SCRIPT%" "%STARTUP%\agent-imprimante-pos.bat" >nul

if %errorlevel%==0 (
    echo.
    echo  OK - L'agent demarrera automatiquement au prochain login.
    echo  Fichier installe dans :
    echo  %STARTUP%\agent-imprimante-pos.bat
) else (
    echo.
    echo  ERREUR - Impossible de copier le fichier.
    echo  Copiez manuellement start.bat dans :
    echo  %STARTUP%
)
echo.
pause
