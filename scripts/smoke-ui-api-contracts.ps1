param(
  [string]$BaseUrl = "https://api.agendaai.com",
  [string]$Slug = "demo-studio-20260317",
  [string]$Email = "owner@agendaai.demo",
  [string]$Password = "agendaai-demo",
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
    [string]$Token
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
    $params["Body"] = ($Body | ConvertTo-Json -Depth 12 -Compress)
  }

  return Invoke-RestMethod @params
}

function New-UniquePhone {
  param([int64]$Seed)

  $suffix = [string]($Seed % 1000000000)
  return "11" + $suffix.PadLeft(9, "0")
}

function Find-FirstSlot {
  param(
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
        total = $availability.items.Count
      }
    }
  }

  throw "Nenhum slot encontrado para o servico $($Service.id) com o profissional $($Professional.id)."
}

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$bookingPhone = New-UniquePhone -Seed $stamp
$paymentPhone = New-UniquePhone -Seed ($stamp + 1)

$login = Invoke-AgendaJson -Method "POST" -Path "/v1/admin/auth/sessions" -Body @{
  email = $Email
  password = $Password
}
$token = $login.token

$adminSession = Invoke-AgendaJson -Method "GET" -Path "/v1/admin/auth/session" -Token $token
$paymentSettings = Invoke-AgendaJson -Method "GET" -Path "/v1/admin/payment-settings" -Token $token
$paymentIntentsBefore = Invoke-AgendaJson -Method "GET" -Path "/v1/admin/payment-intents" -Token $token
$cashEntries = Invoke-AgendaJson -Method "GET" -Path "/v1/admin/cash-entries" -Token $token
$servicesResponse = Invoke-AgendaJson -Method "GET" -Path "/v1/admin/services" -Token $token
$professionalsResponse = Invoke-AgendaJson -Method "GET" -Path "/v1/admin/professionals" -Token $token
$clientsBefore = Invoke-AgendaJson -Method "GET" -Path "/v1/admin/clients" -Token $token
$bookingsBefore = Invoke-AgendaJson -Method "GET" -Path "/v1/admin/bookings" -Token $token
$reports = Invoke-AgendaJson -Method "GET" -Path "/v1/admin/read-models/reports?range=30d&returnWindow=30d" -Token $token
$catalog = Invoke-AgendaJson -Method "GET" -Path "/v1/public/tenants/$Slug/catalog"

$activeServices = @($servicesResponse.items | Where-Object { $_.status -eq "active" })
$activeProfessionals = @($professionalsResponse.items | Where-Object { $_.status -eq "active" })

$noSignalService = $activeServices | Where-Object { -not $_.exigeSinal } | Select-Object -First 1
if (-not $noSignalService) {
  throw "Nenhum servico ativo sem sinal encontrado."
}

$noSignalProfessional = $activeProfessionals | Where-Object {
  $_.especialidades -contains $noSignalService.id
} | Select-Object -First 1
if (-not $noSignalProfessional) {
  throw "Nenhum profissional ativo atende ao servico sem sinal."
}

$noSignalSlot = Find-FirstSlot -Service $noSignalService -Professional $noSignalProfessional
$bookingCreate = Invoke-AgendaJson -Method "POST" -Path "/v1/public/tenants/$Slug/bookings" -Body @{
  serviceId = $noSignalService.id
  professionalId = $noSignalProfessional.id
  startAt = $noSignalSlot.slot.startAt
  endAt = $noSignalSlot.slot.endAt
  client = @{
    nome = "Smoke Booking $stamp"
    telefone = $bookingPhone
    email = "smoke.booking.$stamp@agendaai.test"
    origem = "instagram"
  }
}

$clientsAfterBooking = Invoke-AgendaJson -Method "GET" -Path "/v1/admin/clients" -Token $token
$bookingsAfterBooking = Invoke-AgendaJson -Method "GET" -Path "/v1/admin/bookings" -Token $token

$upfrontService = $activeServices | Where-Object {
  $_.exigeSinal -or $_.paymentPolicy.collectionMode -eq "deposit" -or $_.paymentPolicy.collectionMode -eq "full"
} | Select-Object -First 1
if (-not $upfrontService) {
  throw "Nenhum servico ativo com cobranca antecipada encontrado."
}

$upfrontProfessional = $activeProfessionals | Where-Object {
  $_.especialidades -contains $upfrontService.id
} | Select-Object -First 1
if (-not $upfrontProfessional) {
  throw "Nenhum profissional ativo atende ao servico com cobranca."
}

$upfrontSlot = Find-FirstSlot -Service $upfrontService -Professional $upfrontProfessional
$paymentIntentCreate = Invoke-AgendaJson -Method "POST" -Path "/v1/public/tenants/$Slug/payment-intents" -Body @{
  serviceId = $upfrontService.id
  professionalId = $upfrontProfessional.id
  startAt = $upfrontSlot.slot.startAt
  endAt = $upfrontSlot.slot.endAt
  client = @{
    nome = "Smoke Payment $stamp"
    telefone = $paymentPhone
    email = "smoke.payment.$stamp@agendaai.test"
    origem = "google"
  }
}

$paymentIntentsAfter = Invoke-AgendaJson -Method "GET" -Path "/v1/admin/payment-intents" -Token $token

[PSCustomObject]@{
  base = $BaseUrl
  slug = $Slug
  admin = [PSCustomObject]@{
    tenantId = $adminSession.tenant.id
    tenantSlug = $adminSession.tenant.slug
    sessionRole = $adminSession.claims.role
    paymentSettingsStatus = $paymentSettings.item.status
    countsBefore = [PSCustomObject]@{
      services = @($servicesResponse.items).Count
      professionals = @($professionalsResponse.items).Count
      clients = @($clientsBefore.items).Count
      bookings = @($bookingsBefore.items).Count
      paymentIntents = @($paymentIntentsBefore.items).Count
      cashEntries = @($cashEntries.items).Count
    }
    reportsCurrent = [PSCustomObject]@{
      bookingsCount = $reports.current.bookingsCount
      completedCount = $reports.current.completedCount
      grossRevenue = $reports.current.grossRevenue
      noShowCount = $reports.current.noShowCount
    }
  }
  publicCatalog = [PSCustomObject]@{
    tenantName = $catalog.tenant.nome
    services = @($catalog.services).Count
    professionals = @($catalog.professionals).Count
  }
  bookingSmoke = [PSCustomObject]@{
    serviceId = $noSignalService.id
    professionalId = $noSignalProfessional.id
    date = $noSignalSlot.date
    startAt = $noSignalSlot.slot.startAt
    bookingId = $bookingCreate.booking.id
    bookingStatus = $bookingCreate.booking.status
    visibleInAdmin = [bool]($bookingsAfterBooking.items | Where-Object { $_.id -eq $bookingCreate.booking.id })
    clientVisibleInAdmin = [bool]($clientsAfterBooking.items | Where-Object { $_.id -eq $bookingCreate.client.id })
    responseOrigem = $bookingCreate.client.origem
  }
  paymentIntentSmoke = [PSCustomObject]@{
    serviceId = $paymentIntentCreate.service.id
    professionalId = $paymentIntentCreate.professional.id
    date = $upfrontSlot.date
    startAt = $upfrontSlot.slot.startAt
    bookingId = $paymentIntentCreate.booking.id
    bookingStatus = $paymentIntentCreate.booking.status
    paymentIntentId = $paymentIntentCreate.paymentIntent.id
    paymentIntentStatus = $paymentIntentCreate.paymentIntent.status
    checkoutMode = $paymentIntentCreate.paymentIntent.checkoutMode
    hasInitPoint = [bool]($paymentIntentCreate.paymentIntent.initPoint -or $paymentIntentCreate.paymentIntent.sandboxInitPoint)
    visibleInAdmin = [bool]($paymentIntentsAfter.items | Where-Object { $_.id -eq $paymentIntentCreate.paymentIntent.id })
    responseOrigem = $paymentIntentCreate.client.origem
  }
} | ConvertTo-Json -Depth 12
