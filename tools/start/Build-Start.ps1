param(
  [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
$sourceDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$repositoryRoot = (Resolve-Path (Join-Path $sourceDirectory '..\..')).Path
if (-not $OutputPath) { $OutputPath = Join-Path $repositoryRoot 'START.exe' }
$OutputPath = [IO.Path]::GetFullPath($OutputPath)
$compilerCandidates = @(
  (Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'),
  (Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe')
)
$compiler = $compilerCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $compiler) {
  throw 'The .NET Framework C# compiler was not found. Install the Windows .NET Framework 4.x developer tools, then rerun this build script.'
}

$runtimeScript = Join-Path $sourceDirectory 'runtime.ps1'
$launcherSource = Join-Path $sourceDirectory 'Launcher.cs'
foreach ($required in @($runtimeScript, $launcherSource)) {
  if (-not (Test-Path -LiteralPath $required)) { throw "Missing launcher source: $required" }
}
$outputDirectory = Split-Path -Parent $OutputPath
if (-not (Test-Path -LiteralPath $outputDirectory)) { New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null }

$compilerArguments = @(
  '/nologo',
  '/target:exe',
  '/optimize+',
  ('/out:' + $OutputPath),
  ('/resource:' + $runtimeScript + ',ROLX.Runtime.ps1'),
  $launcherSource
)
& $compiler $compilerArguments
if ($LASTEXITCODE -ne 0) { throw "C# launcher compilation failed with exit code $LASTEXITCODE." }
Write-Host "Built $OutputPath" -ForegroundColor Green
