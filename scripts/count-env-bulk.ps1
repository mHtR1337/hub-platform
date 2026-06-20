$bulkPath = Join-Path (Split-Path -Parent $PSScriptRoot) ".env.bulk"
$vars = @{}
Get-Content $bulkPath | ForEach-Object {
  $line = $_.Trim()
  if ($line -ne "" -and -not $line.StartsWith("#")) {
    $idx = $line.IndexOf("=")
    if ($idx -ge 1) {
      $name = $line.Substring(0, $idx).Trim()
      $value = $line.Substring($idx + 1).Trim()
      if ($value -ne "") { $vars[$name] = $value }
    }
  }
}
Write-Host "file: $bulkPath"
Write-Host "lines: $((Get-Content $bulkPath).Count)"
Write-Host "vars: $($vars.Count)"
$vars.Keys | Sort-Object | ForEach-Object { Write-Host "  $_" }
