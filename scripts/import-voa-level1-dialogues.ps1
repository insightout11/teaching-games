param(
  [Parameter(Mandatory = $true)]
  [int[]]$LessonNumbers,
  [ValidateSet('1', '2')]
  [string]$Level = '1',
  [switch]$Preview
)

$ErrorActionPreference = 'Stop'
$root = 'https://learningenglish.voanews.com'
$catalogPath = if ($Level -eq '1') { '/p/5644.html' } else { '/p/6765.html' }
$catalog = (Invoke-WebRequest -Uri "$root$catalogPath" -UseBasicParsing).Content
$anchors = [regex]::Matches($catalog, '(?is)<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>')
$lessonLinks = @{}
foreach ($anchor in $anchors) {
  $label = [System.Net.WebUtility]::HtmlDecode(([regex]::Replace($anchor.Groups[2].Value, '<[^>]+>', ' '))).Trim()
  if ($label -match '^Lesson\s+(\d+):') {
    $number = [int]$Matches[1]
    $lessonLinks[$number] = [pscustomobject]@{ label = $label; url = "$root$($anchor.Groups[1].Value)" }
  }
}

$path = 'src\data\voa-library.json'
$existing = @(Get-Content -Raw -LiteralPath $path | ConvertFrom-Json)
$existingIds = @{}
$existingUrls = @{}
foreach ($item in $existing) {
  $existingIds[$item.id] = $item
  if ($item.url) { $existingUrls[$item.url.TrimEnd('/').ToLowerInvariant()] = $true }
}

$newItems = [System.Collections.Generic.List[object]]::new()
foreach ($number in $LessonNumbers) {
  if (-not $lessonLinks.ContainsKey($number)) { throw "Lesson $number was not found in the official VOA course index." }
  $lesson = $lessonLinks[$number]
  $html = (Invoke-WebRequest -Uri $lesson.url -UseBasicParsing -TimeoutSec 30).Content
  $conversation = $html.IndexOf('class="wsw__h2">Conversation')
  if ($conversation -lt 0) { $conversation = $html.IndexOf('>Conversation<') }
  $start = $html.IndexOf('Anna:', $conversation)
  if ($start -lt 0) { throw "Could not locate dialogue start for $($lesson.label)." }
  $end = -1
  $laterHeadings = [regex]::Matches($html.Substring($start), '(?is)<h[1-6][^>]*>(.*?)</h[1-6]>')
  foreach ($heading in $laterHeadings) {
    $headingText = [System.Net.WebUtility]::HtmlDecode(([regex]::Replace($heading.Groups[1].Value, '<[^>]+>', ' '))).Trim()
    if ($headingText -match 'Quiz') {
      $end = $start + $heading.Index
      break
    }
  }
  if ($end -lt 0) { throw "Could not locate end of dialogue for $($lesson.label)." }

  $fragment = $html.Substring($start, $end - $start)
  $fragment = [regex]::Replace($fragment, '(?i)<br\s*/?>', "`n`n")
  $fragment = [regex]::Replace($fragment, '(?i)</p\s*>', "`n`n")
  $plainText = [System.Net.WebUtility]::HtmlDecode(([regex]::Replace($fragment, '(?is)<[^>]+>', ' ')))
  $paragraphs = @($plainText -split '\r?\n' | ForEach-Object {
    [regex]::Replace([regex]::Replace($_, '\s+', ' ').Trim(), '\s+([,.;?!])', '$1')
  } | Where-Object { $_ })
  $summary = $paragraphs -join "`n`n"
  $wordCount = @($summary -split '\s+' | Where-Object { $_ }).Count
  if ($wordCount -lt 150 -or $wordCount -gt 900) {
    if ($Preview) { Write-Output "HOLD · $($lesson.label) · $wordCount words"; continue }
    throw "$($lesson.label) has $wordCount words, outside the required 150 to 900 range."
  }

  $title = ($lesson.label -replace '^Lesson\s+\d+:\s*', '').Trim()
  $slug = ($title.ToLowerInvariant() -replace '[^a-z0-9]+', '-').Trim('-')
  $id = "voa-level$Level-lesson-$number-$slug"
  if ($existingIds.ContainsKey($id) -and $existingIds[$id].url -ne $lesson.url) { throw "Duplicate library ID: $id" }
  $normalizedUrl = $lesson.url.TrimEnd('/').ToLowerInvariant()
  if ($existingUrls.ContainsKey($normalizedUrl) -and -not $existingIds.ContainsKey($id)) { throw "Duplicate library URL: $($lesson.url)" }

  $tags = if ($Level -eq '1') { switch ($number) {
    3 { @('introductions', 'greetings', 'names', 'classroom', 'speaking-practice', 'conversation') }
    4 { @('objects', 'descriptions', 'questions', 'vocabulary', 'classroom', 'conversation') }
    6 { @('directions', 'places', 'neighborhood', 'gym', 'asking-for-help', 'conversation') }
    7 { @('daily-activities', 'present-continuous', 'actions', 'grammar', 'observations', 'conversation') }
    8 { @('schedules', 'availability', 'time', 'plans', 'daily-life', 'conversation') }
    9 { @('weather', 'clothing', 'seasons', 'descriptions', 'small-talk', 'conversation') }
    10 { @('invitations', 'visiting', 'home', 'friends', 'polite-requests', 'conversation') }
    11 { @('neighborhood', 'community', 'places', 'directions', 'local-area', 'conversation') }
    12 { @('family', 'relationships', 'people', 'introductions', 'descriptions', 'conversation') }
    13 { @('William-Shakespeare', 'history', 'birthdays', 'culture', 'famous-people', 'conversation') }
    14 { @('shopping', 'clothing', 'preferences', 'choices', 'demonstratives', 'conversation') }
    15 { @('people-watching', 'descriptions', 'actions', 'public-places', 'observations', 'conversation') }
    16 { @('countries', 'nationalities', 'origins', 'introductions', 'geography', 'conversation') }
    17 { @('schedules', 'plans', 'invitations', 'weekends', 'time', 'conversation') }
    18 { @('habits', 'personality', 'relationships', 'present-tense', 'descriptions', 'conversation') }
    19 { @('jobs', 'workplace', 'starting-work', 'schedules', 'career', 'conversation') }
    20 { @('jobs', 'workplace', 'skills', 'career-advice', 'interviews', 'conversation') }
    21 { @('parties', 'invitations', 'social-plans', 'friends', 'polite-requests', 'conversation') }
    22 { @('future-plans', 'summer-vacation', 'travel', 'leisure', 'calendar', 'conversation') }
    23 { @('food', 'shopping', 'preferences', 'ordering', 'daily-life', 'conversation') }
    24 { @('past-tense', 'weekend', 'activities', 'memories', 'storytelling', 'conversation') }
    25 { @('safety', 'warnings', 'advice', 'imperatives', 'precautions', 'conversation') }
    26 { @('games', 'play', 'instructions', 'hobbies', 'competition', 'conversation') }
    27 { @('appointments', 'scheduling', 'access', 'communication', 'problem-solving', 'conversation') }
    28 { @('exams', 'school', 'achievement', 'past-tense', 'celebrations', 'conversation') }
    29 { @('history', 'past-tense', 'memories', 'time-expressions', 'storytelling', 'conversation') }
    30 { @('music', 'river', 'leisure', 'idioms', 'culture', 'conversation') }
    31 { @('baseball', 'sports', 'stadium', 'American-culture', 'traditions', 'conversation') }
    32 { @('treehouse', 'teamwork', 'collaboration', 'building', 'problem-solving', 'conversation') }
    33 { @('baseball', 'sports', 'american-culture', 'history', 'rules', 'conversation') }
    34 { @('future', 'decisions', 'goals', 'career-planning', 'possibilities', 'conversation') }
    35 { @('cooking', 'food', 'kitchen', 'recipes', 'instructions', 'conversation') }
    36 { @('repairs', 'tools', 'problem-solving', 'practical-skills', 'home', 'conversation') }
    37 { @('opinions', 'agreement', 'disagreement', 'polite-language', 'discussion', 'conversation') }
    38 { @('friendship', 'relationships', 'feelings', 'describing-people', 'social-skills', 'conversation') }
    39 { @('surprise', 'reactions', 'emotions', 'expressions', 'storytelling', 'conversation') }
    40 { @('nature', 'forest', 'wildlife', 'outdoors', 'environment', 'conversation') }
    41 { @('teamwork', 'collaboration', 'roles', 'team-projects', 'communication', 'conversation') }
  }} else { switch ($number) {
    1 { @('budgets', 'school-costs', 'finance', 'workplace', 'money', 'conversation') }
    2 { @('job-interviews', 'careers', 'employment', 'workplace', 'questions', 'conversation') }
    3 { @('reported-speech', 'relationships', 'misunderstandings', 'communication', 'hearsay', 'conversation') }
    5 { @('vacations', 'travel', 'summer', 'activities', 'planning', 'conversation') }
    6 { @('science', 'floating', 'experiments', 'materials', 'predictions', 'conversation') }
    7 { @('tourism', 'tour-guides', 'politeness', 'tips', 'travel-etiquette', 'conversation') }
    8 { @('barbecue', 'food', 'cooking', 'american-culture', 'meals', 'conversation') }
    9 { @('pets', 'animals', 'families', 'responsibility', 'care', 'conversation') }
    10 { @('Peru', 'travel', 'South-America', 'culture', 'geography', 'conversation') }
    11 { @('snow', 'weather', 'winter', 'seasons', 'clothing', 'conversation') }
    12 { @('bees', 'insects', 'wildlife', 'gardens', 'nature', 'conversation') }
    13 { @('bees', 'pollination', 'conservation', 'gardening', 'agriculture', 'conversation') }
    14 { @('relationships', 'compatibility', 'people', 'describing-character', 'social-skills', 'conversation') }
    15 { @('sequences', 'before-and-after', 'time-expressions', 'change', 'daily-life', 'conversation') }
    16 { @('happiness', 'wellbeing', 'emotions', 'interests', 'healthy-habits', 'conversation') }
    17 { @('parenthood', 'research', 'reflexive-pronouns', 'grammar', 'school-project', 'conversation') }
    18 { @('parenthood', 'cooking', 'accidents', 'reflexive-pronouns', 'grammar', 'conversation') }
    19 { @('movies', 'entertainment', 'opinions', 'cinema', 'friends', 'conversation') }
    20 { @('cars', 'test-drives', 'transportation', 'shopping', 'decisions', 'conversation') }
    21 { @('recycling', 'upcycling', 'art', 'creativity', 'sustainability', 'conversation') }
    22 { @('recycling', 'waste', 'crafts', 'creativity', 'sustainability', 'conversation') }
    23 { @('rock-music', 'music', 'performance', 'talent', 'entertainment', 'conversation') }
    30 { @('dreams', 'goals', 'future-plans', 'careers', 'aspirations', 'conversation') }
  }}
  $cefr = if ($Level -eq '2') { 'B1' } elseif ($number -le 29) { 'A1' } else { 'A2' }
  $difficulty = if ($Level -eq '2') { 'Intermediate' } elseif ($cefr -eq 'A1') { 'Beginner' } else { 'Pre-Intermediate' }
  $ageBand = if ($Level -eq '2') { 'teens' } else { 'kids' }
  $place = $null
  if ($summary -match '(?i)Washington, D\.C\.') {
    $place = @{ name = 'Washington, D.C.'; lat = 38.9072; lng = -77.0369 }
  } elseif ($summary -match '(?i)\bPeru\b') {
    $place = @{ name = 'Peru'; lat = -9.19; lng = -75.0152 }
  } elseif ($summary -match '(?i)\bUnited States\b|\bAmerica\b') {
    $place = @{ name = 'United States'; lat = 39.8283; lng = -98.5795 }
  }

  $descriptionMatch = [regex]::Match($html, '(?is)<meta name="description" content="([^"]+)"')
  $description = if ($descriptionMatch.Success) {
    [System.Net.WebUtility]::HtmlDecode($descriptionMatch.Groups[1].Value).Trim()
  } else {
    "A beginner $cefr dialogue for reading aloud and speaking practice."
  }
  $newItems.Add([ordered]@{
    id = $id
    title = $title
    kind = 'text'
    author = 'VOA Learning English'
    url = $lesson.url
    youtubeId = $null
    durationSecs = $null
    wordCount = $wordCount
    summary = $summary
    images = @()
    description = $description
    topicTags = @($tags)
    genre = 'dialogue'
    difficultyLevel = $difficulty
    cefr = $cefr
    ageBand = $ageBand
    place = $place
    license = 'Public domain (VOA Learning English)'
    attribution = 'VOA Learning English, lesson dialogue'
    needsReview = ($Level -eq '2' -and $number -in @(7, 18, 30))
  })
  if ($Preview) { Write-Output "KEEP · $($lesson.label) · $wordCount words" }
  $existingIds[$id] = $true
  $existingUrls[$normalizedUrl] = $true
}

if ($Preview) {
  Write-Output "Preview complete: $($newItems.Count) candidate(s) meet the 150–900 word rule."
  return
}

$allItems = [System.Collections.Generic.List[object]]::new()
foreach ($item in $existing) { $allItems.Add($item) }
foreach ($item in $newItems) {
  $existingIndex = -1
  for ($index = 0; $index -lt $allItems.Count; $index++) {
    if ($allItems[$index].id -eq $item.id) { $existingIndex = $index; break }
  }
  if ($existingIndex -ge 0) { $allItems[$existingIndex] = $item }
  else { $allItems.Add($item) }
}
ConvertTo-Json -InputObject $allItems -Depth 20 | Set-Content -LiteralPath $path -Encoding utf8
Write-Output "Added $($newItems.Count) VOA Level $Level reading dialogues."
foreach ($item in $newItems) {
  Write-Output "- $($item['id']) · $($item['wordCount']) words · $($item['cefr']) · $($item['ageBand'])"
}
