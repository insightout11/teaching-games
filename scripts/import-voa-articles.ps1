param()

$ErrorActionPreference = 'Stop'
$root = 'https://learningenglish.voanews.com'
$candidates = @(
  @{ slug='gerunds-infinitives'; url='/a/everyday-grammar-gerunds-infinitives/2722827.html'; tags=@('grammar','gerunds','infinitives','verbs','writing','english-learning') },
  @{ slug='phrasal-verbs'; url='/a/everyday-grammar-introducing-phrasal-verbs/3010251.html'; tags=@('grammar','phrasal-verbs','vocabulary','verbs','register','english-learning') },
  @{ slug='commas'; url='/a/take-a-break-with-commas/3789406.html'; tags=@('grammar','punctuation','commas','writing','clarity','english-learning') },
  @{ slug='recommendations'; url='/a/grammar-and-recommendations-/7155122.html'; tags=@('grammar','recommendations','modals','speaking','choices','english-learning') },
  @{ slug='uncertainty'; url='/a/grammar-and-uncertainty/7296527.html'; tags=@('grammar','uncertainty','questions','verbs','communication','english-learning') },
  @{ slug='price-questions'; url='/a/grammar-and-the-economy-prices/7117170.html'; tags=@('grammar','prices','questions','shopping','economics','english-learning') },
  @{ slug='subject-verb-agreement'; url='/a/subject-verb-agreement-/5127843.html'; tags=@('grammar','subject-verb-agreement','verbs','singular','plural','english-learning') },
  @{ slug='do-does-agreement'; url='/a/everyday-grammar-do-does-you-understand-subject-verb-agreement/2977592.html'; tags=@('grammar','subject-verb-agreement','do-does','verbs','writing','english-learning') },
  @{ slug='native-speaker-mistakes'; url='/a/can-you-catch-these-native-speaker-mistakes/3666483.html'; tags=@('grammar','common-mistakes','usage','writing','vocabulary','english-learning') },
  @{ slug='grammar-quiz'; url='/a/test-yourself-with-this-everyday-grammar-quiz/5427968.html'; tags=@('grammar','review','quiz','usage','practice','english-learning') },
  @{ slug='articles'; url='/a/using-right-article-everyday-grammar/2819461.html'; tags=@('grammar','articles','nouns','writing','usage','english-learning') },
  @{ slug='transitions'; url='/a/everyday-grammar-using-transitions-for-smoother-writing/3029586.html'; tags=@('grammar','transitions','writing','cohesion','connectors','english-learning') },
  @{ slug='future-tenses'; url='/a/everyday-grammar-fun-with-future-tenses/2935173.html'; tags=@('grammar','future-tense','verbs','predictions','plans','english-learning') },
  @{ slug='changing-grammar-rules'; url='/a/everyday-grammar-three-grammar-rules-that-are-dying/3053579.html'; tags=@('grammar','language-change','usage','prepositions','pronouns','english-learning') },
  @{ slug='permission-modals'; url='/a/everyday-grammar-modals-permission-can-may/2877141.html'; tags=@('grammar','modals','politeness','requests','permission','english-learning') },
  @{ slug='disagreement'; url='/a/everyday-grammar-disagreements-in-conversation/3725998.html'; tags=@('grammar','conversation','opinions','disagreement','politeness','english-learning') },
  @{ slug='exercise-grammar'; url='/a/grammar-for-exercise/6865254.html'; tags=@('grammar','exercise','health','phrasal-verbs','gerunds','english-learning') },
  @{ slug='exercise-grammar-part-2'; url='/a/grammar-for-exercise-part-2/6876693.html'; tags=@('grammar','exercise','health','prepositions','vocabulary','english-learning') },
  @{ slug='wishes'; url='/a/everyday-grammar-making-wishes/3218288.html'; tags=@('grammar','wishes','verbs','hypotheticals','hopes','english-learning') },
  @{ slug='news-subject-verb-agreement'; url='/a/subject-verb-agreement-and-the-news/5137616.html'; tags=@('grammar','news','subject-verb-agreement','nouns','singular','english-learning') },
  @{ slug='auxiliary-verbs'; url='/a/auxiliary-verbs-in-everyday-speech-/6381177.html'; tags=@('grammar','auxiliary-verbs','pronunciation','speech','listening','english-learning') },
  @{ slug='comparatives-superlatives'; url='/a/everyday-grammar-comparatives-superlatives/2989386.html'; tags=@('grammar','adjectives','comparatives','superlatives','descriptions','english-learning') },
  @{ slug='past-present-perfect'; url='/a/everyday-grammar-simple-past-and-present-perfect/2752310.html'; tags=@('grammar','past-tense','present-perfect','verbs','time','english-learning') },
  @{ slug='thingamajig'; url='/a/what-is-this-thing-called-words-and-their-stories/2855544.html'; tags=@('vocabulary','idioms','objects','informal-english','words-and-stories','english-learning') },
  @{ slug='world-is-your-oyster'; url='/a/words-and-their-stories-the-world-is-your-oyster/3937500.html'; tags=@('vocabulary','idioms','animals','ocean','expressions','english-learning') },
  @{ slug='arm-twisting'; url='/a/words-and-their-stories-arm-twisting/4414858.html'; tags=@('vocabulary','idioms','persuasion','communication','expressions','english-learning') },
  @{ slug='monkeys-to-potatoes'; url='/a/words-and-their-stories-from-monkeys-to-potatoes/4141925.html'; tags=@('vocabulary','idioms','food','animals','expressions','english-learning') },
  @{ slug='real-mccoy'; url='/a/words-and-their-stories-the-real-mccoy/3389659.html'; tags=@('vocabulary','idioms','authenticity','history','expressions','english-learning') },
  @{ slug='shark-idioms'; url='/a/words-and-their-stories-sharks/3882789.html'; tags=@('vocabulary','idioms','animals','popular-culture','expressions','english-learning') },
  @{ slug='alice-in-wonderland-expressions'; url='/a/3240888.html'; tags=@('vocabulary','idioms','literature','Alice-in-Wonderland','expressions','english-learning') },
  @{ slug='stay-on-your-toes'; url='/a/words-and-their-stories-stay-on-your-toes/4276571.html'; tags=@('vocabulary','idioms','movement','attention','expressions','english-learning') },
  @{ slug='pan-out'; url='/a/words-and-their-stories-expressions-that-dont-pan-out-92004109/115808.html'; tags=@('vocabulary','idioms','gold-rush','history','expressions','english-learning') },
  @{ slug='golden-expressions'; url='/a/words-and-their-stories-golden-rules-and-golden-oldies-95641684/118653.html'; tags=@('vocabulary','idioms','gold','values','expressions','english-learning') },
  @{ slug='green-expressions'; url='/a/words-and-their-stories-green-expressions-94649004/118650.html'; tags=@('vocabulary','idioms','colors','plants','expressions','english-learning') }
)

$path = 'src\data\voa-library.json'
$existing = @(Get-Content -Raw -LiteralPath $path | ConvertFrom-Json)
$urls = @{}
foreach ($item in $existing) { if ($item.url) { $urls[$item.url.TrimEnd('/').ToLowerInvariant()] = $true } }
$newItems = [System.Collections.Generic.List[object]]::new()

foreach ($candidate in $candidates) {
  $url = "$root$($candidate.url)"
  $normalized = $url.TrimEnd('/').ToLowerInvariant()
  if ($urls.ContainsKey($normalized)) { Write-Output "SKIP · already imported · $url"; continue }
  $html = (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30).Content
  $h1 = [regex]::Match($html, '(?is)<h1[^>]*>(.*?)</h1>')
  if (!$h1.Success) { throw "Missing title: $url" }
  $title = [System.Net.WebUtility]::HtmlDecode(([regex]::Replace($h1.Groups[1].Value, '<[^>]+>', ' '))).Trim()
  $bodyMatch = [regex]::Match($html, '<div class="wsw"\s*>')
  $bodyStart = if ($bodyMatch.Success) { $bodyMatch.Index } else { -1 }
  $bodyEnd = -1
  if ($bodyStart -ge 0) {
    $depth = 0
    foreach ($token in [regex]::Matches($html.Substring($bodyStart), '(?is)<div\b[^>]*>|</div>')) {
      if ($token.Value -match '^</div') { $depth-- } else { $depth++ }
      if ($depth -eq 0) { $bodyEnd = $bodyStart + $token.Index + $token.Length; break }
    }
  }
  if ($bodyStart -lt 0 -or $bodyEnd -le $bodyStart) { throw "Could not isolate article body: $url" }
  $body = $html.Substring($bodyStart, $bodyEnd - $bodyStart)
  $glossary = [regex]::Match($body, '(?i)Words in This Story|Words in This Stories|Vocabulary')
  if ($glossary.Success) { $body = $body.Substring(0, $glossary.Index) }
  $paragraphs = [System.Collections.Generic.List[string]]::new()
  foreach ($match in [regex]::Matches($body, '(?is)<p[^>]*>(.*?)</p>')) {
    $plain = [regex]::Replace($match.Groups[1].Value, '(?is)<(script|style)[^>]*>.*?</\1>', ' ')
    $plain = [regex]::Replace($plain, '(?i)<br\s*/?>', ' ')
    $plain = [System.Net.WebUtility]::HtmlDecode(([regex]::Replace($plain, '(?is)<[^>]+>', ' ')))
    $plain = [regex]::Replace($plain, '\s+', ' ').Trim()
    if ($plain -and $plain -notmatch '^(No media source|Direct link|Pop-out player|\d+:\d+)') { $paragraphs.Add($plain) }
  }
  $summary = $paragraphs -join "`n`n"
  $wordCount = ($summary -split '\s+' | Where-Object { $_ }).Count
  if ($wordCount -lt 150 -or $wordCount -gt 900) { Write-Output "HOLD · $title · $wordCount words"; continue }
  if ($summary -match '(?i)Reuters|Associated Press|Agence France-Presse|AP News') { Write-Output "HOLD · $title · third-party source mention"; continue }
  if ($summary -match '(?i)(suicid|self-harm|graphic|killed|murder|lyrics|song sings|song at the end)') { Write-Output "HOLD · $title · safety or third-party content"; continue }
  $descriptionMatch = [regex]::Match($html, '(?is)<meta name="description" content="([^"]+)"')
  $description = if ($descriptionMatch.Success) { [System.Net.WebUtility]::HtmlDecode($descriptionMatch.Groups[1].Value).Trim() } else { "A VOA Learning English lesson about $title." }
  $newItems.Add([ordered]@{
    id = "voa-article-$($candidate.slug)"
    title = $title
    kind = 'text'
    author = 'VOA Learning English'
    url = $url
    youtubeId = $null
    durationSecs = $null
    wordCount = $wordCount
    summary = $summary
    images = @()
    description = $description
    topicTags = @($candidate.tags)
    genre = 'expository'
    difficultyLevel = 'Intermediate'
    cefr = 'B1'
    ageBand = 'all'
    place = $null
    license = 'Public domain (VOA Learning English original text)'
    attribution = 'VOA Learning English; original article text, excluding third-party media and glossary.'
    needsReview = $false
  })
  $urls[$normalized] = $true
  Write-Output "SCREENED · $title · $wordCount words"
}

$all = [System.Collections.Generic.List[object]]::new()
foreach ($item in $existing) { $all.Add($item) }
foreach ($item in $newItems) { $all.Add($item) }
ConvertTo-Json -InputObject $all -Depth 25 | Set-Content -LiteralPath $path -Encoding utf8
Write-Output "Added $($newItems.Count) original VOA Learning English articles."
