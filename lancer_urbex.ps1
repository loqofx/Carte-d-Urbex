# Déterminer le dossier actuel
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# 1. Démarrer le Backend
$backendPath = Join-Path $scriptDir "backend"
$backend = Start-Process python -ArgumentList "-m uvicorn main:app --reload --port 8000" -WorkingDirectory $backendPath -WindowStyle Hidden -PassThru

# 2. Démarrer le Frontend
$frontendPath = Join-Path $scriptDir "frontend"
$frontend = Start-Process python -ArgumentList "-m http.server 5500" -WorkingDirectory $frontendPath -WindowStyle Hidden -PassThru

# 3. Laisser 2 secondes aux serveurs pour s'allumer
Start-Sleep -Seconds 2

# 4. Trouver le bon chemin de Chrome
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chromePath)) {
    $chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
}

# 5. Lancer l'app dans une NOUVELLE instance de Chrome dédiée
$app = Start-Process $chromePath -ArgumentList "--app=http://127.0.0.1:5500/", "--new-window" -PassThru

# 6. Attendre la fermeture exacte de CETTE fenêtre
$app.WaitForExit()

# 7. Extinction propre des serveurs dès que Chrome est fermé
Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue