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

  $catalogTitle = if ($title -eq '"My fish!" "No, my fish!"') { 'My fish! No, my fish!' }
    elseif ($title -eq 'The Hare & the Tortoise (Again!)') { 'The Hare and the Tortoise (Again!)' }
    else { $title }
  $search = Invoke-RestMethod -Uri ($apiRoot + [uri]::EscapeDataString($catalogTitle)) -TimeoutSec 30
  $book = $search.data | Where-Object { $_.title.Trim().ToLowerInvariant() -eq $catalogTitle.ToLowerInvariant() -and $_.language -eq 'English' } | Select-Object -First 1
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
  if ($title -eq 'First House') { $place = @{ name = 'Arunachal Pradesh, India'; lat = 28.2180; lng = 94.7278 } }
  elseif ($title -eq 'Singing in the Rain') { $place = @{ name = 'Rajasthan, India'; lat = 27.0238; lng = 74.2179 } }
  elseif ($title -eq "Nadir's Pet") { $place = @{ name = 'Adyar, Chennai, India'; lat = 13.0067; lng = 80.2565 } }
  elseif ($title -eq 'The Missing Bat') { $place = @{ name = 'Srinagar, India'; lat = 34.0837; lng = 74.7973 } }
  elseif ($title -eq 'Lassi, Ice-cream or Falooda?') { $place = @{ name = 'Delhi, India'; lat = 28.6139; lng = 77.2090 } }
  elseif ($text -match '(?i)\bDhanushkodi\b') { $place = @{ name = 'Dhanushkodi, Tamil Nadu, India'; lat = 9.1710; lng = 79.4150 } }
  elseif ($text -match '(?i)\bGujarat\b|\bTamil Nadu\b|\bKerala\b|\bBengaluru\b|\bSrinagar\b') { $place = @{ name = 'India'; lat = 20.5937; lng = 78.9629 } }
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
    'Smile Please!' = @('photography', 'family', 'memories', 'India')
    'Chuskit Goes to School!' = @('education', 'accessibility', 'friendship', 'India')
    'Counting on Moru' = @('math', 'animals', 'counting', 'India')
    'Listen to My Body' = @('health', 'body-awareness', 'safety', 'wellbeing')
    "Sister, Sister, Where Does the Sun Go at Night?" = @('astronomy', 'day-and-night', 'science', 'family')
    "Susheela's Kolams" = @('art', 'patterns', 'family', 'India')
    'The Cat in the Ghat!' = @('animals', 'mountains', 'adventure', 'India')
    'Suraj and Sher Singh' = @('friendship', 'animals', 'courage', 'India')
    'Sister, Sister, Where Does Thunder Come From?' = @('weather', 'science', 'thunder', 'family')
    'Sister, Sister Why is the Sky So Blue?' = @('weather', 'science', 'sky', 'family')
    'Vayu, the Wind' = @('weather', 'wind', 'nature', 'India')
    'Rani''s First Day at School' = @('school', 'education', 'friendship', 'India')
    'Going Home' = @('family', 'travel', 'home', 'India')
    'Timmy and Pepe' = @('animals', 'pets', 'friendship', 'India')
    'The Scarecrows on Parade' = @('farming', 'animals', 'community', 'India')
    'What Does Anu See?' = @('observation', 'nature', 'animals', 'India')
    'Bheema, the Sleepyhead' = @('animals', 'sleep', 'humor', 'India')
    'The Generous Crow' = @('folktale', 'birds', 'kindness', 'India')
    'Not Now, Not Now!' = @('family', 'patience', 'play', 'feelings')
    '"My fish!" "No, my fish!"' = @('animals', 'friendship', 'fishing', 'sharing')
    "Aunty Jui's Baby" = @('family', 'babies', 'siblings', 'growing-up')
    'I Want That One!' = @('family', 'choices', 'patience', 'everyday-life')
    'Goloo the Circle' = @('shapes', 'geometry', 'nature', 'early-learning')
    'My Balwadi' = @('school', 'early-learning', 'community', 'daily-life')
    'The Timid Train' = @('trains', 'travel', 'courage', 'adventure')
    "Ritu's Letter Gets Longer!" = @('writing', 'letters', 'family', 'reading')
    'The Red Raincoat' = @('weather', 'rain', 'family', 'clothing')
    'Colours of Nature' = @('poetry', 'colours', 'animals', 'nature')
    'The Boat Ride' = @('animals', 'river', 'friendship', 'adventure')
    'The Sparrow and The Fruit' = @('birds', 'fruit', 'problem-solving', 'folktale')
    'Going to Buy a Book' = @('books', 'reading', 'family', 'shopping')
    'Samira Goes Shopping' = @('shopping', 'food', 'family', 'math')
    'The Hare & the Tortoise (Again!)' = @('folktale', 'animals', 'competition', 'humor')
    'Here Comes the Camel and Other Poems' = @('poetry', 'animals', 'rhythm', 'nature')
    'Mouse in the House' = @('humor', 'family', 'animals', 'home')
    'What If?' = @('poetry', 'imagination', 'school', 'dreams')
    'The Royal Toothache' = @('animals', 'health', 'teeth', 'humor')
    'Smart Sona Helps Her Mother' = @('family', 'textiles', 'art', 'creativity')
    'Veeru Goes to the Circus' = @('circus', 'performance', 'family', 'imagination')
    'Bani' = @('school', 'family', 'dreams', 'imagination')
    'Sniffles, the Crocodile and Punch, the Butterfly' = @('animals', 'emotions', 'friendship', 'kindness')
    'Too Much Noise' = @('farming', 'animals', 'noise', 'problem-solving')
    "Phani's Funny Chappals" = @('school', 'family', 'humor', 'daily-life')
    'Pehelwaan ji Plays Cricket' = @('cricket', 'sports', 'teamwork', 'friendship')
    'Saboo and Jojo' = @('animals', 'friendship', 'imagination', 'family')
    'First House' = @('folktale', 'homes', 'architecture', 'friendship')
    "Grandma's Glasses" = @('family', 'grandparents', 'humor', 'daily-life')
    'Busy Ants' = @('insects', 'science', 'communication', 'nature')
    'Clean Cat' = @('cats', 'pets', 'family', 'humor')
    'Noisy Crows' = @('birds', 'animals', 'nature', 'food')
    'We Are All Animals' = @('animals', 'humans', 'drama', 'comparison')
    'Singing in the Rain' = @('music', 'weather', 'celebrations', 'Rajasthan')
    'Thangwang and Bhalluka' = @('friendship', 'animals', 'communication', 'adventure')
    'My Juggling Granny' = @('grandparents', 'humor', 'poetry', 'family')
    'Where is Gogo?' = @('animals', 'search', 'zoo', 'adventure')
    'My Musical Adventure' = @('music', 'creativity', 'family', 'ambition')
    "Mili's birthday celebration" = @('birthday', 'family', 'celebrations', 'India')
    "Ammu's Puppy" = @('pets', 'friendship', 'honesty', 'family')
    'No Smiles Today' = @('emotions', 'friendship', 'school', 'kindness')
    "Samira's Awful Lunch" = @('food', 'family', 'school', 'humor')
    'Topsy Turvy' = @('poetry', 'imagination', 'opposites', 'humor')
    'Wailers Three - A Folktale From China' = @('folktale', 'China', 'humor', 'community')
    'Tok Tok' = @('folktale', 'humor', 'animals', 'problem-solving')
    "Anaya's Thumb" = @('family', 'habits', 'growing-up', 'health')
    'Naughty Dog' = @('pets', 'family', 'responsibility', 'humor')
    'Pishi Caught in a Storm' = @('ocean', 'manta-rays', 'weather', 'friendship')
    'Tara Finds Her Stars' = @('astronomy', 'trains', 'family', 'adventure')
    'BooBoo sings for Vihaan' = @('music', 'babies', 'family', 'humor')
    'Mangoes For Moidootty' = @('folktale', 'food', 'family', 'imagination')
    'The Woman With No Soul' = @('humor', 'water-buffalo', 'family', 'storytelling')
    'The Princess and the Veggy Lion' = @('folktale', 'animals', 'food', 'courage')
    'Asha gives up a bad habit!' = @('health', 'habits', 'family', 'school')
    "Jaggee's mornings" = @('school', 'daily-life', 'sleep', 'family')
    'My Friend Trace Roger the robot!' = @('robots', 'imagination', 'school', 'friendship')
    "Nadir's Pet" = @('pets', 'animals', 'Chennai', 'family')
    'Long Water' = @('rivers', 'nature', 'water', 'riddles')
    'The Day It Rained Fish' = @('animals', 'imagination', 'birthday', 'zoo')
    'Little Painters' = @('art', 'painting', 'family', 'creativity')
    'The Flyaway Cradle' = @('family', 'siblings', 'wind', 'adventure')
    'Rumniya' = @('family', 'weddings', 'problem-solving', 'folktale')
    'Prakruti' = @('nature', 'environment', 'family', 'India')
    'Happy world' = @('dreams', 'kindness', 'animals', 'friendship')
    'Tina and the crazy animal' = @('adventure', 'animals', 'forest', 'courage')
    "Richard's unlucky day" = @('daily-life', 'problem-solving', 'humor', 'school')
    'Gargi and Soapy' = @('beach', 'animals', 'friendship', 'adventure')
    "Wonders of Martina's Adventure" = @('adventure', 'ocean', 'nature', 'travel')
    'Guess this place? Ghost Town!' = @('riddles', 'geography', 'Tamil Nadu', 'history')
  }
  $tags = @('storyweaver', "reading-level-$level") + @($topicTagsByTitle[$title])

  $records += [pscustomobject][ordered]@{
    id = "storyweaver-$($book.slug)"
    title = $catalogTitle
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
