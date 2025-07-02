@echo off
curl -s -X POST https://syndesis-engine.onrender.com/process ^
-H "Content-Type: application/json" ^
-d "{\"message\":\"Test SYNDESIS\"}" | powershell -Command "$input | ConvertFrom-Json | Select-Object -ExpandProperty reply"
pause
