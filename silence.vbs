Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell -ExecutionPolicy Bypass -File """ & WshShell.CurrentDirectory & "\lancer_urbex.ps1""", 0, False