param(
  [int]$Port = 4173
)

$root = Resolve-Path (Join-Path $PSScriptRoot "..")

Write-Host "Serving AgendaAI brand guide at http://127.0.0.1:$Port"
Write-Host "Root: $root"

$appDir = Join-Path $root "apps/marketing-site"
& node (Join-Path $appDir "scripts/sync-brand-assets.mjs")
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

& pnpm --dir $appDir exec astro dev --host 127.0.0.1 --port $Port
exit $LASTEXITCODE
