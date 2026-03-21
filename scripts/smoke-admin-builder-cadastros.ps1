param(
  [string]$BaseUrl = "http://127.0.0.1:3333",
  [string]$StartDate = (Get-Date -Format "yyyy-MM-dd"),
  [int]$LookaheadDays = 21
)

$ErrorActionPreference = "Stop"
$script:StartDateValue = [DateTime]::ParseExact(
  $StartDate,
  "yyyy-MM-dd",
  [System.Globalization.CultureInfo]::InvariantCulture
)

function Invoke-AgendaJson {
  param(
    [string]$Method,
    [string]$Path,
    $Body,
    [string]$Token,
    [int[]]$AcceptStatus = @(200, 201, 204)
  )

  $headers = @{}
  if ($Token) {
    $headers["Authorization"] = "Bearer $Token"
  }

  $params = @{
    Method = $Method
    Uri = "$BaseUrl$Path"
    Headers = $headers
    TimeoutSec = 120
  }

  if ($null -ne $Body) {
    $params["ContentType"] = "application/json"
    $params["Body"] = ($Body | ConvertTo-Json -Depth 20 -Compress)
  }

  try {
    $response = Invoke-WebRequest @params
  } catch {
    $httpResponse = $_.Exception.Response
    if (-not $httpResponse) {
      throw
    }

    $reader = New-Object System.IO.StreamReader($httpResponse.GetResponseStream())
    $content = $reader.ReadToEnd()
    $response = [PSCustomObject]@{
      StatusCode = [int]$httpResponse.StatusCode
      Content = $content
    }
  }
  if ($AcceptStatus -notcontains [int]$response.StatusCode) {
    throw "Unexpected status $($response.StatusCode) for $Method $Path. Body: $($response.Content)"
  }

  if ([string]::IsNullOrWhiteSpace($response.Content)) {
    return $null
  }

  return $response.Content | ConvertFrom-Json
}

function New-UniquePhone {
  param([int64]$Seed)

  $suffix = [string]($Seed % 1000000000)
  return "11" + $suffix.PadLeft(9, "0")
}

function Find-FirstSlot {
  param(
    [string]$Slug,
    $Service,
    $Professional
  )

  for ($offset = 0; $offset -lt $LookaheadDays; $offset++) {
    $date = $script:StartDateValue.AddDays($offset).ToString(
      "yyyy-MM-dd",
      [System.Globalization.CultureInfo]::InvariantCulture
    )
    $availability = Invoke-AgendaJson -Method "GET" -Path (
      "/v1/public/tenants/$Slug/availability" +
      "?serviceId=$($Service.id)" +
      "&professionalId=$($Professional.id)" +
      "&date=$date"
    )

    if ($availability.items -and $availability.items.Count -gt 0) {
      return [PSCustomObject]@{
        date = $date
        slot = $availability.items[0]
      }
    }
  }

  throw "Nenhum slot encontrado para o servico $($Service.id) com o profissional $($Professional.id)."
}

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$slug = "smoke-builder-$stamp"
$email = "owner.builder.$stamp@agendaai.test"
$password = "agendaai-demo"
$phone = New-UniquePhone -Seed $stamp
$bookingPhone = New-UniquePhone -Seed ($stamp + 1)

$onboarding = Invoke-AgendaJson -Method "POST" -Path "/v1/onboarding/tenants" -Body @{
  nome = "Smoke Builder $stamp"
  slug = $slug
  timezone = "America/Sao_Paulo"
  admin = @{
    nome = "Owner Builder QA"
    email = $email
    telefone = $phone
    senha = $password
    aceitarTermos = $true
  }
}

$token = $onboarding.session.token

$serviceA = Invoke-AgendaJson -Method "POST" -Path "/v1/admin/services" -Token $token -Body @{
  nome = "Corte Smoke $stamp"
  duracaoMin = 30
  precoBase = 65
  exigeSinal = $false
}

$serviceB = Invoke-AgendaJson -Method "POST" -Path "/v1/admin/services" -Token $token -Body @{
  nome = "Escova Smoke $stamp"
  duracaoMin = 45
  precoBase = 90
  exigeSinal = $true
}

$professional = Invoke-AgendaJson -Method "POST" -Path "/v1/admin/professionals" -Token $token -Body @{
  nome = "Ana Smoke $stamp"
  especialidades = @($serviceA.id, $serviceB.id)
}

$availability = Invoke-AgendaJson -Method "PUT" -Path "/v1/admin/professionals/$($professional.id)/availability" -Token $token -Body @{
  rules = @(
    @{ weekday = 1; faixa = @{ startTime = "09:00"; endTime = "18:00" } },
    @{ weekday = 2; faixa = @{ startTime = "09:00"; endTime = "18:00" } },
    @{ weekday = 3; faixa = @{ startTime = "09:00"; endTime = "18:00" } },
    @{ weekday = 4; faixa = @{ startTime = "09:00"; endTime = "18:00" } },
    @{ weekday = 5; faixa = @{ startTime = "09:00"; endTime = "18:00" } }
  )
}

$slot = Find-FirstSlot -Slug $slug -Service $serviceA -Professional $professional
$booking = Invoke-AgendaJson -Method "POST" -Path "/v1/public/tenants/$slug/bookings" -Body @{
  serviceId = $serviceA.id
  professionalId = $professional.id
  startAt = $slot.slot.startAt
  endAt = $slot.slot.endAt
  client = @{
    nome = "Cliente Builder $stamp"
    telefone = $bookingPhone
    email = "cliente.builder.$stamp@agendaai.test"
    origem = "google"
  }
}

$services = Invoke-AgendaJson -Method "GET" -Path "/v1/admin/services" -Token $token
$professionals = Invoke-AgendaJson -Method "GET" -Path "/v1/admin/professionals" -Token $token
$clients = Invoke-AgendaJson -Method "GET" -Path "/v1/admin/clients" -Token $token
$catalog = Invoke-AgendaJson -Method "GET" -Path "/v1/admin/reporting/catalog" -Token $token

$codesToExecute = @(
  "RPT-EXECUTIVE",
  "RPT-REVENUE",
  "RPT-TEAM",
  "RPT-OPERATIONS",
  "RPT-RETENTION",
  "RPT-WEEK",
  "RPT-MONTH",
  "RPT-SERVICE-CATALOG",
  "RPT-PROFESSIONAL-REGISTRY",
  "RPT-PAYMENTS"
)

$executions = @()
foreach ($code in $codesToExecute) {
  $definition = $catalog.systemDefinitions | Where-Object { $_.code -eq $code } | Select-Object -First 1
  if (-not $definition) {
    throw "System definition $code nao encontrada no catalogo."
  }

  $execution = Invoke-AgendaJson -Method "POST" -Path "/v1/admin/report-definitions/$($definition.id)/execute" -Token $token -Body $null
  $executions += [PSCustomObject]@{
    code = $code
    base = $definition.base
    preview = $execution.previewExpression
    kpis = @($execution.kpis).Count
    rows = if ($execution.table) { @($execution.table.rows).Count } else { 0 }
    appliedFilters = @($execution.appliedFilters).Count
  }
}

$savedFromSystem = Invoke-AgendaJson -Method "POST" -Path "/v1/admin/report-definitions" -Token $token -Body (
  ($catalog.systemDefinitions | Where-Object { $_.code -eq "RPT-EXECUTIVE" } | Select-Object -First 1) |
    ConvertTo-Json -Depth 20 |
    ConvertFrom-Json
)

$savedClone = Invoke-AgendaJson -Method "POST" -Path "/v1/admin/report-definitions" -Token $token -Body @{
  id = $savedFromSystem.id
  source = $savedFromSystem.source
  code = $savedFromSystem.code
  name = "$($savedFromSystem.name) Clone"
  description = "Clone funcional do modelo salvo"
  base = $savedFromSystem.base
  visualization = $savedFromSystem.visualization
  metric = $savedFromSystem.metric
  relation = $savedFromSystem.relation
  filters = $savedFromSystem.filters
  groupBy = $savedFromSystem.groupBy
  orderBy = $savedFromSystem.orderBy
  authorName = "Smoke QA"
  createdAt = $savedFromSystem.createdAt
  updatedAt = $savedFromSystem.updatedAt
  locked = $false
}

$savedDefinitions = Invoke-AgendaJson -Method "GET" -Path "/v1/admin/report-definitions" -Token $token

$invalidServicePatch = Invoke-AgendaJson -Method "PATCH" -Path "/v1/admin/services/$($serviceA.id)" -Token $token -Body @{
  status = "invalid"
} -AcceptStatus @(400)

$invalidProfessionalPatch = Invoke-AgendaJson -Method "PATCH" -Path "/v1/admin/professionals/$($professional.id)" -Token $token -Body @{
  status = "invalid"
} -AcceptStatus @(400)

[PSCustomObject]@{
  base = $BaseUrl
  tenant = [PSCustomObject]@{
    slug = $slug
    adminEmail = $email
    tokenReceived = [bool]$token
  }
  cadastros = [PSCustomObject]@{
    services = @($services.items).Count
    professionals = @($professionals.items).Count
    clients = @($clients.items).Count
    serviceCodes = @($services.items | ForEach-Object { $_.codigo })
    professionalCodes = @($professionals.items | ForEach-Object { $_.codigo })
    clientCodes = @($clients.items | ForEach-Object { $_.codigo })
  }
  bookingSmoke = [PSCustomObject]@{
    bookingId = $booking.booking.id
    clientId = $booking.client.id
    serviceId = $booking.service.id
    professionalId = $booking.professional.id
    startAt = $booking.booking.startAt
  }
  reports = [PSCustomObject]@{
    bases = @($catalog.baseOptions | ForEach-Object { $_.id })
    systemDefinitions = @($catalog.systemDefinitions | ForEach-Object { $_.code })
    executions = $executions
    savedCount = @($savedDefinitions.items).Count
    savedCodes = @($savedDefinitions.items | ForEach-Object { $_.code })
  }
  enumValidation = [PSCustomObject]@{
    servicePatchStatus = $invalidServicePatch.error
    professionalPatchStatus = $invalidProfessionalPatch.error
  }
} | ConvertTo-Json -Depth 20
