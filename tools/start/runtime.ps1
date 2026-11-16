$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$script:stopRequested = $false
$script:ownedApps = @()
$script:activeCommandPid = 0
$script:logDirectory = Join-Path $env:LOCALAPPDATA 'ROLX-Store\logs'

function Write-Stage([int]$percent, [string]$message) {
  Write-Host ''
  Write-Host ('=' * 68) -ForegroundColor DarkGreen
  Write-Host ('{0}% — {1}' -f $percent, $message) -ForegroundColor Green
  Write-Host ('=' * 68) -ForegroundColor DarkGreen
}

function Stop-ProcessTree([int]$processId) {
  if ($processId -le 0) { return }
  try { & taskkill.exe /PID $processId /T /F *> $null } catch { }
}

function Stop-OwnedApps {
  foreach ($owned in $script:ownedApps) {
    try {
      if (-not $owned.Process.HasExited) {
        Write-Host ('Stopping {0} (PID {1})…' -f $owned.Name, $owned.Process.Id)
        Stop-ProcessTree $owned.Process.Id
      }
    } catch { }
  }
  $script:ownedApps = @()
}

function Get-LogPath([string]$name) {
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  return Join-Path $script:logDirectory ($stamp + '-' + ($name -replace '[^a-zA-Z0-9-]', '-') + '.log')
}

function Quote-ProcessArgument([string]$value) {
  return '"' + $value.Replace('"', '\"') + '"'
}

function Invoke-LoggedCommand {
  param(
    [string]$Name,
    [string]$FilePath,
    [string[]]$Arguments,
    [string]$WorkingDirectory,
    [int]$TimeoutSeconds = 3600,
    [switch]$Quiet
  )
  if ($script:stopRequested) { throw 'Startup stopped by user.' }
  $log = Get-LogPath $Name
  $errorLog = $log + '.err'
  $startInfo = New-Object Diagnostics.ProcessStartInfo
  $startInfo.WorkingDirectory = $WorkingDirectory
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  if ($FilePath -match '\.cmd$') {
    $startInfo.FileName = $env:ComSpec
    $startInfo.Arguments = '/d /s /c ""' + $FilePath + '" ' + ($Arguments -join ' ') + '"'
  } else {
    $startInfo.FileName = $FilePath
    $startInfo.Arguments = ($Arguments | ForEach-Object { Quote-ProcessArgument ([string]$_) }) -join ' '
  }
  $outputStream = $null
  $errorStream = $null
  $process = $null
  $timer = [Diagnostics.Stopwatch]::StartNew()
  $lastNotice = 0
  try {
    $outputStream = [IO.File]::Open($log, 'Create', 'Write', 'Read')
    $errorStream = [IO.File]::Open($errorLog, 'Create', 'Write', 'Read')
    $process = [Diagnostics.Process]::Start($startInfo)
    $script:activeCommandPid = $process.Id
    $streams = [Threading.Tasks.Task[]]@(
      $process.StandardOutput.BaseStream.CopyToAsync($outputStream),
      $process.StandardError.BaseStream.CopyToAsync($errorStream)
    )
    while (-not $process.WaitForExit(1000)) {
      if ($script:stopRequested) {
        Stop-ProcessTree $process.Id
        throw 'Startup stopped by user.'
      }
      if ($timer.Elapsed.TotalSeconds -gt $TimeoutSeconds) {
        Stop-ProcessTree $process.Id
        throw ('{0} exceeded its {1}-minute limit. See {2}' -f $Name, [math]::Ceiling($TimeoutSeconds / 60), $log)
      }
      $minute = [int][math]::Floor($timer.Elapsed.TotalSeconds / 60)
      if (-not $Quiet -and $timer.Elapsed.TotalSeconds -ge 20 -and $minute -gt $lastNotice) {
        $lastNotice = $minute
        Write-Host ('{0} is still running ({1} min). Detailed output: {2}' -f $Name, $minute, $log) -ForegroundColor DarkYellow
      }
    }
    if (-not [Threading.Tasks.Task]::WaitAll($streams, 10000)) {
      throw ('{0} exited before its logs closed. See {1}' -f $Name, $log)
    }
    if ($process.ExitCode -ne 0) {
      throw ('{0} failed (exit {1}). Logs: {2}' -f $Name, $process.ExitCode, $log)
    }
    return $log
  } finally {
    $script:activeCommandPid = 0
    if ($process) { $process.Dispose() }
    if ($outputStream) { $outputStream.Dispose() }
    if ($errorStream) { $errorStream.Dispose() }
  }
}

function Invoke-WithBackoff {
  param([string]$Name, [string]$FilePath, [string[]]$Arguments, [string]$Directory, [int]$Attempts, [int]$TimeoutSeconds)
  $delays = @(20, 45, 90, 180, 300, 300)
  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    try {
      Write-Host ('{0} (attempt {1} of {2})…' -f $Name, $attempt, $Attempts)
      Invoke-LoggedCommand -Name $Name -FilePath $FilePath -Arguments $Arguments -WorkingDirectory $Directory -TimeoutSeconds $TimeoutSeconds | Out-Null
      return
    } catch {
      if ($script:stopRequested) { throw }
      if ($attempt -ge $Attempts) { throw }
      $wait = $delays[[math]::Min($attempt - 1, $delays.Length - 1)]
      Write-Host ('{0} did not finish. Retrying in {1} seconds; logs are under {2}.' -f $Name, $wait, $script:logDirectory) -ForegroundColor DarkYellow
      Start-Sleep -Seconds $wait
    }
  }
}

function Import-ProjectEnvironment([string]$serverDirectory) {
  $dotenvPath = Join-Path $serverDirectory '.env'
  if (-not (Test-Path -LiteralPath $dotenvPath)) { $dotenvPath = Join-Path $serverDirectory '.env.example' }
  if (-not (Test-Path -LiteralPath $dotenvPath)) { throw 'server/.env.example is missing.' }
  foreach ($line in Get-Content -LiteralPath $dotenvPath) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') {
      $key = $Matches[1]
      $value = $Matches[2].Trim()
      if ($value.Length -ge 2 -and (($value[0] -eq '"' -and $value[$value.Length - 1] -eq '"') -or ($value[0] -eq "'" -and $value[$value.Length - 1] -eq "'"))) {
        $value = $value.Substring(1, $value.Length - 2)
      }
      if (-not [Environment]::GetEnvironmentVariable($key, 'Process')) { Set-Item -Path ('Env:' + $key) -Value $value }
    }
  }
}

function Get-Listener([int]$port) {
  try { return @(Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction Stop) }
  catch { return @() }
}

function Assert-NoPortConflict([int]$port, [string]$name, [switch]$allowMongoCompose) {
  $listeners = Get-Listener $port
  if (-not $listeners.Count) { return }
  if ($allowMongoCompose) { return }
  $owners = ($listeners | ForEach-Object { 'PID ' + $_.OwningProcess + ' on ' + $_.LocalAddress } | Select-Object -Unique) -join ', '
  throw ('Port {0} for {1} is already in use ({2}). Close that service before starting this project.' -f $port, $name, $owners)
}

function Wait-ForHttp([string]$url, [string]$label, [int]$timeoutSeconds) {
  $clock = [Diagnostics.Stopwatch]::StartNew()
  $lastNotice = 0
  while ($clock.Elapsed.TotalSeconds -lt $timeoutSeconds) {
    if ($script:stopRequested) { throw 'Startup stopped by user.' }
    foreach ($owned in $script:ownedApps) {
      $owned.Process.Refresh()
      if ($owned.Process.HasExited) { throw ('{0} stopped unexpectedly (exit {1}). Logs: {2}' -f $owned.Name, $owned.Process.ExitCode, $owned.Log) }
    }
    try {
      $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 4
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) { return }
    } catch { }
    Start-Sleep -Seconds 2
    if ([int]$clock.Elapsed.TotalSeconds -ge ($lastNotice + 30)) {
      $lastNotice = [int]$clock.Elapsed.TotalSeconds
      Write-Host ('Waiting for {0}… ({1}s)' -f $label, $lastNotice)
    }
  }
  throw ('Timed out waiting for {0} at {1}.' -f $label, $url)
}

function Start-OwnedNode([string]$name, [string]$scriptPath, [string]$directory, [string[]]$arguments) {
  $log = Get-LogPath $name
  $errorLog = $log + '.err'
  $node = (Get-Command node.exe -ErrorAction Stop).Source
  $allArguments = @($scriptPath) + $arguments
  $argumentText = ($allArguments | ForEach-Object { Quote-ProcessArgument ([string]$_) }) -join ' '
  $process = Start-Process -FilePath $node -ArgumentList $argumentText -WorkingDirectory $directory `
    -PassThru -WindowStyle Hidden -RedirectStandardOutput $log -RedirectStandardError $errorLog
  $script:ownedApps += [pscustomobject]@{ Name = $name; Process = $process; Log = $log }
  Write-Host ('Started {0} (PID {1}). Logs: {2}' -f $name, $process.Id, $log)
}

function Run-Startup {
  $root = $env:ROLX_PROJECT_ROOT
  $server = Join-Path $root 'server'
  $client = Join-Path $root 'client'
  $compose = Join-Path $server 'compose.yaml'
  if (-not (Test-Path -LiteralPath $compose)) { throw 'server/compose.yaml is missing.' }
  Import-ProjectEnvironment $server

  $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
  $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
  $dockerCommand = Get-Command docker.exe -ErrorAction SilentlyContinue
  $missingTools = @()
  if (-not $nodeCommand) { $missingTools += 'Node.js 24.14.1 or newer in the Node 24 line is missing. Install it from https://nodejs.org/en/download/.' }
  if (-not $npmCommand) { $missingTools += 'npm.cmd is missing. Reinstall Node.js 24 LTS with npm included from https://nodejs.org/en/download/.' }
  if (-not $dockerCommand) { $missingTools += 'Docker Desktop is missing. Install it from https://www.docker.com/products/docker-desktop/ and start it.' }
  if ($missingTools.Count) { throw ("Missing requirements:`n - " + ($missingTools -join "`n - ")) }

  $versionText = (& $nodeCommand.Source --version 2>$null | Select-Object -First 1).Trim()
  if ($versionText -notmatch '^v(\d+)\.(\d+)\.(\d+)') { throw 'Could not read the Node.js version. Install Node.js 24.14.1 or newer in the Node 24 line.' }
  $major = [int]$Matches[1]; $minor = [int]$Matches[2]; $patch = [int]$Matches[3]
  if ($major -ne 24 -or $minor -lt 14 -or ($minor -eq 14 -and $patch -lt 1)) {
    throw ('Node.js {0} is installed; this launcher requires Node.js 24.14.1 or newer within Node 24.' -f $versionText)
  }
  $npmVersion = (& $npmCommand.Source --version 2>$null | Select-Object -First 1).Trim()
  if (-not $npmVersion) { throw 'The npm bundled with Node.js could not be started. Repair the Node.js installation.' }

  $composeVersion = & $dockerCommand.Source compose version 2>$null
  if ($LASTEXITCODE -ne 0 -or -not $composeVersion) { throw 'Docker Compose v2 is missing. Update Docker Desktop and enable its Compose v2 plugin.' }

  $database = $env:MONGO_DATABASE
  $mongoUri = $env:MONGO_URI
  if ($mongoUri -notin @('mongodb://127.0.0.1:27017', 'mongodb://localhost:27017')) {
    throw 'MONGO_URI must be exactly mongodb://127.0.0.1:27017 or mongodb://localhost:27017. Remote, authenticated, and customized endpoints are blocked.'
  }
  $env:MONGO_URI = 'mongodb://127.0.0.1:27017/?directConnection=true'
  if ($database -notmatch '^[A-Za-z0-9_-]{1,64}$' -or $database -in @('admin', 'local', 'config')) {
    throw 'MONGO_DATABASE must be a non-system local database name using letters, numbers, underscore, or hyphen.'
  }
  if ($env:HOST -ne '127.0.0.1' -or $env:PORT -ne '5001' -or $env:CLIENT_ORIGIN -ne 'http://localhost:5173') {
    throw 'This launcher uses fixed local addresses: API 127.0.0.1:5001, frontend localhost:5173, and client origin http://localhost:5173. Restore these values in server/.env.'
  }
  foreach ($required in @((Join-Path $client 'package-lock.json'), (Join-Path $server 'package-lock.json'), (Join-Path $server 'seed\dials-rolex.json'))) {
    if (-not (Test-Path -LiteralPath $required)) { throw ('Required project file is missing: {0}. Extract the complete repository before starting.' -f $required) }
  }

  New-Item -ItemType Directory -Path $script:logDirectory -Force | Out-Null
  $dockerHost = $env:DOCKER_HOST
  if ($env:DOCKER_CONTEXT -or -not $dockerHost) {
    $contextLog = Invoke-LoggedCommand -Name 'docker context' -FilePath $dockerCommand.Source `
      -Arguments @('context', 'show') -WorkingDirectory $server -TimeoutSeconds 30 -Quiet
    $contextName = (Get-Content -LiteralPath $contextLog -Raw).Trim()
    $endpointLog = Invoke-LoggedCommand -Name 'docker endpoint' -FilePath $dockerCommand.Source `
      -Arguments @('context', 'inspect', '--format', '{{.Endpoints.docker.Host}}', $contextName) -WorkingDirectory $server -TimeoutSeconds 30 -Quiet
    $dockerHost = (Get-Content -LiteralPath $endpointLog -Raw).Trim()
  }
  if ($dockerHost -notmatch '^npipe:/+\./pipe/[^/]+$') {
    throw 'Select a local Windows Docker Desktop context before running START.exe.'
  }
  Remove-Item Env:DOCKER_CONTEXT,Env:DOCKER_HOST -ErrorAction SilentlyContinue
  $dockerTarget = @('--host', $dockerHost)
  $composeArguments = $dockerTarget + @('compose', '-f', 'compose.yaml', '--project-name', 'react-store')
  try {
    Invoke-LoggedCommand -Name 'docker engine check' -FilePath $dockerCommand.Source `
      -Arguments ($dockerTarget + @('info', '--format', '{{.ServerVersion}}')) -WorkingDirectory $server -TimeoutSeconds 60 -Quiet | Out-Null
  } catch {
    throw 'Docker Desktop is installed but its local engine is not responding. Start Docker Desktop and wait for the engine to be ready.'
  }

  $composeLog = Invoke-LoggedCommand -Name 'check Compose MongoDB' -FilePath $dockerCommand.Source `
    -Arguments ($composeArguments + @('ps', '--status', 'running', '-q', 'mongo')) -WorkingDirectory $server -TimeoutSeconds 60 -Quiet
  $mongoOwnedByCompose = -not [string]::IsNullOrWhiteSpace((Get-Content -LiteralPath $composeLog -Raw))
  Assert-NoPortConflict 5001 'API'
  Assert-NoPortConflict 5173 'frontend'
  Assert-NoPortConflict 27017 'MongoDB' -allowMongoCompose:$mongoOwnedByCompose

  $env:VITE_API_URL = 'http://localhost:5001'
  $env:npm_config_fetch_retries = '4'
  $env:npm_config_fetch_retry_mintimeout = '10000'
  $env:npm_config_fetch_retry_maxtimeout = '120000'
  $env:npm_config_fetch_timeout = '600000'
  Write-Host ('Using Node.js {0} and npm {1}.' -f $versionText, $npmVersion)
  Write-Host ('Catalog database: {0}. MongoDB URI is kept private.' -f $database)

  Write-Stage 5 'Installing server dependencies'
  Invoke-WithBackoff 'server npm ci' $npmCommand.Source @('ci', '--no-audit', '--no-fund') $server 3 5400
  Write-Stage 15 'Installing client dependencies'
  Invoke-WithBackoff 'client npm ci' $npmCommand.Source @('ci', '--no-audit', '--no-fund') $client 3 5400

  Write-Stage 25 'Starting local MongoDB with Docker Compose'
  Invoke-WithBackoff 'docker compose up' $dockerCommand.Source ($composeArguments + @('up', '-d', 'mongo')) $server 4 5400
  Write-Host 'Waiting for MongoDB to accept commands…'
  $mongoReady = $false
  $mongoClock = [Diagnostics.Stopwatch]::StartNew()
  $mongoNotice = 0
  while ($mongoClock.Elapsed.TotalSeconds -lt 600) {
    if ($script:stopRequested) { throw 'Startup stopped by user.' }
    try {
      Invoke-LoggedCommand -Name 'mongo ping' -FilePath $dockerCommand.Source `
        -Arguments ($composeArguments + @('exec', '-T', 'mongo', 'mongosh', '--quiet', '--eval', 'quit(db.runCommand({ping:1}).ok===1?0:1)')) `
        -WorkingDirectory $server -TimeoutSeconds 20 -Quiet | Out-Null
      $mongoReady = $true
      break
    } catch { Start-Sleep -Seconds 5 }
    if ($mongoClock.Elapsed.TotalSeconds -ge ($mongoNotice + 30)) {
      $mongoNotice = [int]$mongoClock.Elapsed.TotalSeconds
      Write-Host ('MongoDB is initializing ({0}s elapsed)…' -f $mongoNotice)
    }
  }
  if (-not $mongoReady) { throw 'MongoDB did not become ready within 10 minutes. Docker data was left untouched.' }

  Write-Stage 40 'Building API and storefront'
  Invoke-LoggedCommand 'client build' $npmCommand.Source @('run', 'build') $client 3600 | Out-Null

  Write-Stage 55 ('Building API and seeding catalog into local database "{0}"' -f $database)
  Invoke-LoggedCommand 'catalog seed' $npmCommand.Source @('run', 'seed:catalog') $server 3600 | Out-Null

  if ($env:ROLX_SKIP_PHOTOS -ne '1') {
    Write-Stage 65 'Downloading catalog photos (optional; this can take a while)'
    if (-not $env:PHOTO_REQUEST_TIMEOUT_MS) { $env:PHOTO_REQUEST_TIMEOUT_MS = '60000' }
    try {
      Invoke-LoggedCommand 'photo import' $nodeCommand.Source @('seed/import-photos.mjs') $server 14400 | Out-Null
      Write-Host 'Photo download pass completed.' -ForegroundColor Green
    } catch {
      Write-Host ('Photo download was incomplete; missing models will use placeholders. Details: {0}' -f $_.Exception.Message) -ForegroundColor DarkYellow
    }
  } else {
    Write-Host 'Photo download skipped (--skip-photos). Missing images use placeholders.'
  }

  Write-Stage 85 'Starting API and storefront'
  Start-OwnedNode 'API' 'dist/server.js' $server @()
  Wait-ForHttp 'http://127.0.0.1:5001/health' 'API health' 240
  Wait-ForHttp 'http://127.0.0.1:5001/ready' 'API Mongo readiness' 240
  $catalogReady = $false
  for ($try = 1; $try -le 30; $try++) {
    try {
      $catalog = Invoke-RestMethod -Uri 'http://127.0.0.1:5001/api/v1/models?page=1&pageSize=1' -TimeoutSec 5
      if ($catalog.total -gt 0 -and $catalog.data.Count -gt 0 -and $catalog.data[0].branchId -in @('damascus', 'latakia') -and $catalog.data[0].gender -in @('men', 'women', 'unisex')) {
        $catalogReady = $true
        break
      }
    } catch { }
    Start-Sleep -Seconds 2
  }
  if (-not $catalogReady) { throw 'The catalog API did not return seeded models with branch and gender membership. Check the catalog seed log.' }
  Write-Stage 92 ('Verified seeded catalog: {0} models.' -f $catalog.total)
  Start-OwnedNode 'Storefront' 'node_modules/vite/bin/vite.js' $client @('preview', '--host', '127.0.0.1', '--port', '5173', '--strictPort')
  Wait-ForHttp 'http://127.0.0.1:5173/' 'storefront' 180
  Write-Stage 100 'StoreProject is running'
  if ($env:ROLX_READY_SIGNAL) { [IO.File]::WriteAllText($env:ROLX_READY_SIGNAL, '') }
  Write-Host 'Storefront: http://localhost:5173'
  Write-Host 'API health:  http://127.0.0.1:5001/health'
  Write-Host 'MongoDB:     127.0.0.1:27017'
  Write-Host ('Logs:        {0}' -f $script:logDirectory)
  Write-Host 'Keep this window open. Press Ctrl+C here to stop only the API and storefront processes; Docker data is preserved.'
  while (-not $script:stopRequested) {
    foreach ($owned in $script:ownedApps) {
      $owned.Process.Refresh()
      if ($owned.Process.HasExited) {
        throw ('{0} stopped unexpectedly (exit {1}). Logs: {2}' -f $owned.Name, $owned.Process.ExitCode, $owned.Log)
      }
    }
    Start-Sleep -Seconds 2
  }
}

$cancelHandler = [ConsoleCancelEventHandler]{
  param($sender, $eventArgs)
  $eventArgs.Cancel = $true
  $script:stopRequested = $true
}
[Console]::add_CancelKeyPress($cancelHandler)
try {
  Run-Startup
} catch {
  if ($_.Exception.Message -ne 'Startup stopped by user.') {
    Write-Host ''
    Write-Host ('ERROR: ' + $_.Exception.Message) -ForegroundColor Red
    Write-Host 'Correct the issue above, then run START.exe again.' -ForegroundColor Yellow
    exit 1
  }
} finally {
  [Console]::remove_CancelKeyPress($cancelHandler)
  Stop-ProcessTree $script:activeCommandPid
  Stop-OwnedApps
  Write-Host 'Launcher stopped.'
}
