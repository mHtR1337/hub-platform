# Pushes non-empty env vars to Vercel (production + development).
# Reads .env.local, then .env.bulk. Never prints secret values.
$root = Split-Path -Parent $PSScriptRoot
$appUrl = "https://hub-platform-jade.vercel.app"
$envs = @("production", "development")

function Import-EnvFile([string]$path) {
  $vars = @{}
  if (-not (Test-Path $path)) { return $vars }
  Get-Content $path | ForEach-Object {
    $line = $_.Trim()
    if ($line -ne "" -and -not $line.StartsWith("#")) {
      $idx = $line.IndexOf("=")
      if ($idx -ge 1) {
        $name = $line.Substring(0, $idx).Trim()
        $value = $line.Substring($idx + 1).Trim()
        if ($value.StartsWith('"') -and $value.EndsWith('"')) {
          $value = $value.Substring(1, $value.Length - 2)
        }
        if ($value -ne "") {
          $vars[$name] = $value
        }
      }
    }
  }
  return $vars
}

$vars = Import-EnvFile (Join-Path $root ".env.local")
foreach ($entry in (Import-EnvFile (Join-Path $root ".env.bulk")).GetEnumerator()) {
  $vars[$entry.Key] = $entry.Value
}

$vars["NEXT_PUBLIC_APP_URL"] = $appUrl
$vars["NEXT_PUBLIC_APP_ENV"] = "test"
$vars["NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL"] = "/onboarding"

Write-Host "Pushing $($vars.Count) variables to Vercel..."
Push-Location $root
try {
  foreach ($name in @($vars.Keys)) {
    $value = $vars[$name]
    foreach ($env in $envs) {
      Write-Host "Adding $name ($env)..."
      & npx vercel env add $name $env --value $value -y --force --non-interactive 2>&1 | Write-Host
      if ($LASTEXITCODE -ne 0) {
        throw "Failed to add $name for $env (exit $LASTEXITCODE)"
      }
    }
  }
  Write-Host "`n--- Vercel env vars ---"
  & npx vercel env ls 2>&1 | Write-Host
}
finally {
  Pop-Location
}
