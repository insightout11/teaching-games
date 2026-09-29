param(
  [Parameter(Mandatory = $true)] [string[]] $SourceFiles,
  [string] $OutputPath = 'src/data/storyweaver-library.json'
)

$ErrorActionPreference = 'Stop'
$apiRoot = 'https://storyweaver.org.in/api/v1/books-search?query='
$rawRoot = 'https://raw.githubusercontent.com/global-asp/pb-source/master/en/'
$records = @()

foreach ($sourceFile in $SourceFiles) {
  $markdown = (Invoke-WebRequest -Uri ($rawRoot + [uri]::EscapeDataString($sourceFile)) -UseBasicParsing -TimeoutSec 30).Content
  $parts = $markdown -split '(?m)^\* License: ', 2
  if ($parts.Count -ne 2) { throw "Missing story license metadata: $sourceFile" }
  $body = $parts[0]
  $credits = $parts[1]
  $titleMatch = [regex]::Match($body, '(?m)^#\s+(.+)$')
  if (!$titleMatch.Success) { throw "Missing story title: $sourceFile" }
  $title = $titleMatch.Groups[1].Value.Trim()
  $licenseName = ([regex]::Match($credits, '^\[([^\]]+)\]', 'Singleline')).Groups[1].Value
  if ($licenseName -notin @('CC-BY', 'PD')) { throw "Unsupported StoryWeaver license '$licenseName': $sourceFile" }

  $text = ($body -replace '(?m)^#\s+.+\r?\n?', '' -replace '(?m)^##\s*$', '' -replace '\r?\n{3,}', "`n`n").Trim()
  $text = $text -replace 'net!They', 'net! They'
  $text = $text -replace '(?s)(Use your imagination and colour this picture any way YOU like\.)\s+\1', '$1'
  $wordCount = ($text.Trim() -split '\s+').Count
  if ($wordCount -lt 150 -or $wordCount -gt 900) { throw "Story outside 150–900 word range ($wordCount): $title" }

  $search = Invoke-RestMethod -Uri ($apiRoot + [uri]::EscapeDataString($title)) -TimeoutSec 30
  $book = $search.data | Where-Object { $_.title.Trim().ToLowerInvariant() -eq $title.ToLowerInvariant() -and $_.language -eq 'English' } | Select-Object -First 1
  if (!$book) { throw "No exact English StoryWeaver catalog record found: $title" }
  if ([string]$book.level -notin @('1', '2', '3', '4')) { throw "Unsupported reading level for $title" }

  $authors = @($book.authors | ForEach-Object { $_.name })
  $illustrators = @($book.illustrators | ForEach-Object { $_.name })
  $publisher = if ($book.publisher.name) { $book.publisher.name } else { 'Publisher not listed' }
  $langName = ([regex]::Match($credits, '(?m)^\* Language: (.+)$')).Groups[1].Value
  $archiveAuthors = ([regex]::Match($credits, '(?m)^\* Text: (.+)$')).Groups[1].Value
  $archiveIllustrator = ([regex]::Match($credits, '(?m)^\* Illustration: (.+)$')).Groups[1].Value
  $archiveTranslator = ([regex]::Match($credits, '(?m)^\* Translation: (.+)$')).Groups[1].Value
  $attribution = "$title ($langName), text by $archiveAuthors, illustration by $archiveIllustrator"
  if ($archiveTranslator) { $attribution += ", translated by $archiveTranslator" }
  $attribution += ", published by $publisher under $licenseName 4.0 on StoryWeaver. Donor/funder not listed in the source text archive."

  $cover = $book.coverImage.sizes | Where-Object { $_.height -ge 308 } | Select-Object -First 1
  if (!$cover) { throw "No cover image found: $title" }
  $level = [int]$book.level
  $cefr = if ($level -le 2) { 'A1' } elseif ($level -eq 3) { 'A2' } else { 'B1' }
  $ageBand = if ($level -le 3) { 'kids' } else { 'teens' }
  $slug = [regex]::Match($book.slug, '^\d+').Value
  $genre = if ($title -match 'poem') { 'poem' } else { 'narrative' }
  $place = $null
  if ($title -eq 'The Missing Bat') { $place = @{ name = 'Srinagar, India'; lat = 34.0837; lng = 74.7973 } }
  elseif ($title -eq 'Lassi, Ice-cream or Falooda?') { $place = @{ name = 'Delhi, India'; lat = 28.6139; lng = 77.2090 } }
  elseif ($text -match '(?i)\bIndia\b|\bHoli\b|\bDiwali\b|\bOnam\b|\bVasant Panchami\b|\bGujarat\b|\bTamil Nadu\b|\bKerala\b|\bBengaluru\b|\bSrinagar\b') { $place = @{ name = 'India'; lat = 20.5937; lng = 78.9629 } }
  $topicTagsByTitle = @{
    'Everything looks new!' = @('seasons', 'plants', 'festivals', 'India')
    'Hot Tea and Warm Rugs' = @('seasons', 'weather', 'family', 'India')
    'Kheer on a Full Moon Night' = @('food', 'festivals', 'seasons', 'India')
    'Peacocks and Pakodas!' = @('animals', 'food', 'family', 'India')
    'Little by Little' = @('animals', 'kindness', 'folktale', 'safety')
    'The Missing Bat' = @('cricket', 'mystery', 'family', 'Kashmir')
    'Going to a Wedding' = @('family', 'weddings', 'celebrations', 'India')
    'Paper Play' = @('crafts', 'creativity', 'recycling', 'school')
    'The Jungle School' = @('animals', 'school', 'learning', 'friendship')
    "Ramya's Stars" = @('astronomy', 'stars', 'family', 'science')
    'Too Many Bananas' = @('farming', 'food', 'problem-solving', 'India')
    'Goodnight, Tinku!' = @('animals', 'pets', 'bedtime', 'family')
    'Annual Haircut Day' = @('humor', 'animals', 'family', 'India')
    'Lassi, Ice-cream or Falooda?' = @('food', 'family', 'Delhi', 'India')
    "Gulli's Box of Things" = @('kindness', 'problem-solving', 'family', 'community')
    "Cheenu's Gift" = @('family', 'gifts', 'kindness', 'creativity')
    'The Day the Vegetables Came to School' = @('vegetables', 'food', 'school', 'imagination')
    'When Amma Went to School' = @('education', 'family', 'school', 'lifelong-learning')
    'Grandpa Fish and the Radio' = @('animals', 'rivers', 'pollution', 'environment')
    'Flying High' = @('aviation', 'dreams', 'family', 'ambition')
    'The Rainbow Story' = @('colours', 'birds', 'family', 'art')
    'Animals Are Kind' = @('animals', 'kindness', 'behavior', 'community')
    'The boy who hated vegetables' = @('vegetables', 'food', 'health', 'habits')
    'The Surprise' = @('music', 'guitar', 'creativity', 'family')
    'Where Is My Mother?' = @('birds', 'family', 'search', 'persistence')
    'Kaushik, the Kind Detective' = @('mystery', 'animals', 'forest', 'observation')
    'The party' = @('friends', 'party', 'celebrations', 'animals')
    'The Unusual Rainmaking Duet' = @('folklore', 'music', 'rain', 'desert')
    'Sheela Learns to make friends' = @('friendship', 'school', 'social-skills', 'emotions')
    'The Story of Stories' = @('reading', 'storytelling', 'imagination', 'forest')
    'No Tricking Kutti' = @('day-and-night', 'sleep', 'science', 'family')
    'Granny and her Bird Friend' = @('friendship', 'birds', 'grandparents', 'community')
    "Shruti's secret to winning" = @('school', 'competition', 'teachers', 'honesty')
    "Windy's adventure" = @('adventure', 'wind', 'weather', 'dreams')
    "Dia's favourite festivals" = @('festivals', 'culture', 'family', 'India')
    'The love of art' = @('art', 'creativity', 'family', 'new-home')
    'Nina Plays With the Butterflies' = @('butterflies', 'nature', 'garden', 'family')
    "Aditi's Trip To Moon" = @('moon', 'space', 'dreams', 'imagination')
    'King of Birds' = @('birds', 'leadership', 'folktale', 'Africa')
    'Croaky the Frog' = @('frogs', 'animals', 'music', 'practice')
  }
  $tags = @('storyweaver', "reading-level-$level") + @($topicTagsByTitle[$title])

  $records += [pscustomobject][ordered]@{
    id = "storyweaver-$($book.slug)"
    title = $title
    kind = 'picture-book'
    author = if ($archiveAuthors) { $archiveAuthors } else { ($authors -join ', ') }
    url = "https://storyweaver.org.in/en/stories/$($book.slug)"
    youtubeId = $null
    durationSecs = $null
    wordCount = $wordCount
    summary = $text
    images = @(@{ url = $cover.url; alt = "$title cover illustration" })
    description = if ($book.description) { $book.description } else { "An illustrated StoryWeaver story at reading level $level." }
    topicTags = @($tags | Select-Object -Unique)
    genre = $genre
    difficultyLevel = "StoryWeaver Level $level"
    cefr = $cefr
    ageBand = $ageBand
    place = $place
    license = if ($licenseName -eq 'PD') { 'Public domain' } else { 'CC BY 4.0' }
    attribution = $attribution
    needsReview = $true
  }
}

$existing = @()
if (Test-Path -LiteralPath $OutputPath) { $existing = @(Get-Content -LiteralPath $OutputPath -Raw | ConvertFrom-Json) }
$replacementIds = @($records | ForEach-Object { $_.id })
$merged = @($existing | Where-Object { $_.id -notin $replacementIds }) + @($records)
$duplicates = $merged | Group-Object id | Where-Object Count -gt 1
if ($duplicates) { throw "Duplicate StoryWeaver IDs: $($duplicates.Name -join ', ')" }
$json = ConvertTo-Json -InputObject $merged -Depth 20
Set-Content -LiteralPath $OutputPath -Value $json -Encoding utf8
Write-Output "Added $($records.Count) StoryWeaver books (new total $($merged.Count)). Review candidate titles and run scripts/validate-library.ts."
