$ErrorActionPreference = 'Stop'
$ids = @(7444,16535,9809,36715,15028,50308,36914,34111,23861,17985,34756,50056,2205,15291,36820,2112,17657,2651,13542,21247,35350,48726,1788,2181,15271,17197,32520,19765,32509,50326,39505,33929,50174,50189,38563,38954,1881,34214,34288,49012,47367,47411,39135,48538,46865,36489,35392,37170,988,8979,50304,15029,50873,2058,36768,2327,23860,22131,37071,17648,1045,24732,21728,13636,39472,35268,36998,12169,39123,20771,19876,22166,47814,22542,36114,20155,22179)
$excludedIds = @('african-storybook-35350','african-storybook-50326','african-storybook-35392','african-storybook-37170','african-storybook-988','african-storybook-50304','african-storybook-50873','african-storybook-36768','african-storybook-2327','african-storybook-23860','african-storybook-24732')
$path = 'src\data\african-storybook-library.json'
$existing = @()
if (Test-Path $path) {
  $parsed = ConvertFrom-Json -InputObject (Get-Content -Raw $path)
  $existingList = [System.Collections.Generic.List[object]]::new()
  foreach ($entry in $parsed) { if ($entry -is [array]) { foreach ($nested in $entry) { $existingList.Add($nested) } } else { $existingList.Add($entry) } }
  $existing = $existingList.ToArray()
}
$known = @{}; foreach ($item in $existing) { $known[[string]$item.id] = $true }
$records = [System.Collections.Generic.List[object]]::new()
$target = 40
$needed = $target - $existing.Count
if ($needed -le 0) { Write-Output "The African Storybook target ($target) is already met."; exit 0 }
foreach ($bookId in $ids) {
  $url = "https://www.africanstorybook.org/newviewer/index.php?bt=2&dual=false&id=$bookId"
  try { $html = (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 25).Content } catch { Write-Output "HOLD · $bookId · page unavailable"; continue }
  $titleMatch = [regex]::Match($html, '(?is)<div class="backcover_title\s*">(.*?)</div>')
  $creditMatch = [regex]::Match($html, '(?is)<div class="bookcover_author">(.*?)</div>')
  if (!$titleMatch.Success -or !$creditMatch.Success) { Write-Output "HOLD · $bookId · missing title or credits"; continue }
  $title = [System.Net.WebUtility]::HtmlDecode([regex]::Replace($titleMatch.Groups[1].Value, '<[^>]+>', ' ')).Trim()
  $creditHtml = [regex]::Replace($creditMatch.Groups[1].Value, '(?i)<br\s*/?>', '|')
  $credits = [System.Net.WebUtility]::HtmlDecode([regex]::Replace($creditHtml, '<[^>]+>', ' '))
  $fields = @{}
  foreach ($field in [regex]::Matches($credits, '(?i)(Author|Adaptation|Translation|Illustration|Language|Level)\s*-\s*([^|]+)')) { $fields[$field.Groups[1].Value] = $field.Groups[2].Value.Trim() }
  $paragraphs = [System.Collections.Generic.List[string]]::new()
  foreach ($p in [regex]::Matches($html, '(?is)<p class="single-text\s*">(.*?)</p>')) {
    $text = [regex]::Replace($p.Groups[1].Value, '(?i)<br\s*/?>', ' ')
    $text = [System.Net.WebUtility]::HtmlDecode([regex]::Replace($text, '<[^>]+>', ' '))
    $text = [regex]::Replace($text, '\s+', ' ').Trim()
    if ($text) { $paragraphs.Add($text) }
  }
  $summary = $paragraphs -join "`n`n"
  $wordCount = ($summary -split '\s+' | Where-Object { $_ }).Count
  $licenseMatch = [regex]::Match($html, '(?is)<div class="backcover_copyright">(.*?)</div>')
  $licenseText = [System.Net.WebUtility]::HtmlDecode([regex]::Replace($licenseMatch.Groups[1].Value, '<[^>]+>', ' '))
  $level = [string]$fields['Level']; $language = [string]$fields['Language']
  $coverMatch = [regex]::Match($html, '(?is)id="cover-image"[^>]+url\(([^)]+)\)')
  if (!$coverMatch.Success) { $coverMatch = [regex]::Match($html, '(?is)<image[^>]+src="([^"]+)"') }
  $cover = if ($coverMatch.Success) { $coverMatch.Groups[1].Value } else { $null }
  $id = "african-storybook-$bookId"
  if ($id -in $excludedIds) { Write-Output "HOLD · $title · quality or safety fit"; continue }
  if ($known.ContainsKey($id)) { Write-Output "SKIP · $title · already imported"; continue }
  if ($language -ne 'English' -or $licenseText -notmatch 'Creative Commons:\s*Attribution 4\.0' -or $wordCount -lt 150 -or $wordCount -gt 900 -or !$cover) { Write-Output "HOLD · $title · language/license/length/cover · $wordCount words"; continue }
  if ($summary -match '(?i)graphic|blood|murder|drown|behead|torture') { Write-Output "HOLD · $title · safety review · $wordCount words"; continue }
  $author = [string]$fields['Author']; $adaptation = [string]$fields['Adaptation']; $translation = [string]$fields['Translation']; $illustrator = [string]$fields['Illustration']
  $attribution = "Author: $author; illustrator: $illustrator"
  if ($adaptation) { $attribution += "; adaptation: $adaptation" }; if ($translation) { $attribution += "; translation: $translation" }
  $cefr = if ($level -match 'First words') { 'A1' } elseif ($level -match 'Longer paragraphs') { 'B1' } else { 'A2' }
  $genre = if ($title -match '(?i)Anansi|elephant|folktale|lion|tortoise|hare') { 'narrative' } else { 'narrative' }
  $records.Add([ordered]@{ id=$id; title=$title; kind='text'; author=$author; url=$url; youtubeId=$null; durationSecs=$null; wordCount=$wordCount; summary=$summary; images=@(@{url=$cover; alt="Cover illustration for $title"}); description="An illustrated African Storybook at the official $level reading level."; topicTags=@('african-storybook','children','reading','narrative'); genre=$genre; difficultyLevel='Beginner'; cefr=$cefr; ageBand='kids'; place=$null; license='CC BY 4.0'; attribution=$attribution; needsReview=$true })
  $known[$id]=$true
  Write-Output "SCREENED · $title · $level · $wordCount words"
  if ($records.Count -ge $needed) { break }
}
$all = @($existing) + @($records)
$all | ConvertTo-Json -Depth 25 | Set-Content -LiteralPath $path -Encoding utf8
Write-Output "Added $($records.Count) African Storybook items."
