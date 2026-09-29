param(
  [Parameter(Mandatory = $true)]
  [int[]]$LessonNumbers
)

$ErrorActionPreference = 'Stop'
$root = 'https://learningenglish.voanews.com'
$catalog = (Invoke-WebRequest -Uri "$root/p/5644.html" -UseBasicParsing).Content
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
  if ($wordCount -lt 150 -or $wordCount -gt 900) { throw "$($lesson.label) has $wordCount words, outside the required 150 to 900 range." }

  $title = ($lesson.label -replace '^Lesson\s+\d+:\s*', '').Trim()
  $slug = ($title.ToLowerInvariant() -replace '[^a-z0-9]+', '-').Trim('-')
  $id = "voa-level1-lesson-$number-$slug"
  if ($existingIds.ContainsKey($id) -and $existingIds[$id].url -ne $lesson.url) { throw "Duplicate library ID: $id" }
  $normalizedUrl = $lesson.url.TrimEnd('/').ToLowerInvariant()
  if ($existingUrls.ContainsKey($normalizedUrl) -and -not $existingIds.ContainsKey($id)) { throw "Duplicate library URL: $($lesson.url)" }

  $tags = switch ($number) {
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
  }
  $cefr = if ($number -le 29) { 'A1' } else { 'A2' }
  $difficulty = if ($cefr -eq 'A1') { 'Beginner' } else { 'Pre-Intermediate' }

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
    ageBand = 'kids'
    place = $null
    license = 'Public domain (VOA Learning English)'
    attribution = 'VOA Learning English, lesson dialogue'
    needsReview = $false
  })
  $existingIds[$id] = $true
  $existingUrls[$normalizedUrl] = $true
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
Write-Output "Added $($newItems.Count) VOA Level 1 reading dialogues."
$newItems | Select-Object id, title, wordCount, cefr, ageBand | Format-Table -AutoSize
