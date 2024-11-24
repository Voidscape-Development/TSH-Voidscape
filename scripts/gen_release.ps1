Push-Location ..
New-Item -Path "TournamentStreamHelper" -ItemType Directory

Copy-Item -Recurse -Force "assets" "TournamentStreamHelper\assets"

# Already embedded inside release exe
Remove-Item -Path "TournamentStreamHelper\assets\versions.json" -Force
Remove-Item -Path "TournamentStreamHelper\assets\contributors.txt" -Force

Copy-Item -Recurse -Force "layout" "TournamentStreamHelper\layout"
Copy-Item -Recurse -Force "user_data" "TournamentStreamHelper\user_data"
Copy-Item -Force "LICENSE" "TournamentStreamHelper\LICENSE"
Copy-Item -Force "TSH.exe" "TournamentStreamHelper\TSH.exe"

Compress-Archive -Path "TournamentStreamHelper" -DestinationPath "release.zip" -Update

Remove-Item -Recurse -Force "TournamentStreamHelper"

Pop-Location
