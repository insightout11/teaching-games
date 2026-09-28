# Sources API

Standalone backend for the existing lesson engine. No Live Room runtime, material storage, student state, generation, scoring or projection dependencies. Responses are private; the UI decides what to show. No provider calls were used for validation.

## Configuration and access

- `SOURCES_ENABLED=true` enables both endpoints; otherwise 503 `SOURCES_DISABLED`. Mock mode never permits outbound work.
- `SERPER_API_KEY` enables search. Missing/blank key returns 503 `SEARCH_UNAVAILABLE`; direct reads still work.
- `LIVE_ROOM_SEARCH_DAILY_CAP`: integer 0–100000, default 100. Counts search requests across **all sessions and surfaces per teacher**, not Serper credits or dollars. Different endpoints may have different provider costs. Zero disables new searches.
- Node.js runtime; installed jsdom requires Node `^20.19.0 || ^22.13.0 || >=24.0.0`.
- Teacher authentication plus existing `sessions.class_id → classes.teacher_id` ownership check. Owned closed sessions are readable too. No caller-supplied teacher ID. JSON body, maximum 8 KiB; query-string parameters and foreign Origin headers are rejected. All responses, including errors, have `Cache-Control: private, no-store`.

## Search

`POST /api/sessions/[sessionId]/sources/search`

```ts
type Surface = 'web' | 'images' | 'news' | 'places' | 'videos';
type Request = { surface: Surface; query: string; page?: number };
type Response = {
  schemaVersion: 1; surface: Surface; query: string; page: number;
  items: Item[]; nextPage: number | null; retrievedAt: string;
  filtering: 'strict' | 'not-applicable';
};
type Item =
  | { kind: 'reference'; surface: 'web'|'images'|'news'; result: {
      id: string; title: string; url: string; description: string;
      publisher: string|null; publishedAt: string|null; imageUrl: string|null;
    }}
  | { kind: 'place'; result: {
      id: string; title: string; address: string|null;
      coordinates: { latitude: number; longitude: number }|null;
      referenceUrl: string; websiteUrl: string|null; providerPlaceId: string|null;
    }}
  | { kind: 'video'; result: {
      id: string; title: string; referenceUrl: string; publisher: string|null;
      publishedAt: string|null; durationSeconds: number|null; thumbnailUrl: string|null;
      playback: { provider: 'youtube'; videoId: string }|null;
    }};
```

Query: trimmed, 1–300 characters, at most 50 whitespace-separated words. Page defaults to 0: web/news accept 0–9; images/places/videos accept only 0. Maximum 10 normalized items; unsafe/duplicate rows are omitted. `nextPage` is currently always null because the adapter has no authoritative provider continuation signal. Do not infer another page from ten results.

Server-owned settings: English, safe filtering requested, no caller geography override, news past-week filter. Omitted country is **not a verified global-results guarantee**. Web/images/news/videos require the provider's `safe: active` acknowledgement; missing acknowledgement fails closed. `filtering: strict` records that acknowledgement, not a guarantee that every result is classroom-appropriate. Places use `not-applicable`. Preview before showing.

Only supplied absolute dates become `publishedAt`; relative ages stay null. Images retain the source-page URL separately from the image URL. Places are references, not extracted articles; CID is namespaced `serper:cid:…`, not a Google Place ID. Video playback metadata is only a parsed YouTube identity, not permission or code to embed/play. Provider terms and live response compatibility still require verification before enabling production search.

## Direct article read

`POST /api/sessions/[sessionId]/sources/read` with `{ "url": "https://example.com/article" }`.

```ts
type ReaderResponse = {
  originalUrl: string; finalUrl: string; title: string; text: string;
  publisher: string|null; publishedAt: string|null; retrievedAt: string;
  status: 'plain-text'|'extracted'|'unavailable'; reason: string|null;
};
```

`originalUrl` preserves the submitted reference (fragment removed); `finalUrl` records redirects. No search, API key or quota reservation is needed. No stored articles, HTML, images, scripts or iframe markup are returned. Unreadable HTML returns 200 with `status: unavailable`, empty text and `reason: NO_READABLE_TEXT`.

Protections: public HTTP(S) only, default ports, no credentials/private/special-use IPs, validate all DNS answers and each redirect, pin the validated connection address while retaining Host/TLS verification, at most 3 redirects, 10-second network deadline, 2 MiB compressed and decompressed body limits, HTML/plain-text UTF-8/ASCII only. The parser does not execute scripts or fetch subresources; 20,000-node/markup-density limit. Returned text is capped at 12,000 characters. No separate daily read quota in this scope.

## Errors and spending semantics

Errors use `{ error: string }`, never raw database/provider details.

| Status | Codes |
|---|---|
| 400 | `INVALID_REQUEST`, `INVALID_SESSION`, `INVALID_QUERY`, `INVALID_TAB`, `INVALID_PAGE`, `INVALID_JSON`, `UNSAFE_URL`, `UNSAFE_ADDRESS` |
| 401 | `AUTH_REQUIRED` |
| 403/404 | `SESSION_NOT_ACCESSIBLE`; 403 `INVALID_ORIGIN` |
| 413 | `REQUEST_TOO_LARGE`, `SOURCE_TOO_LARGE` |
| 415 | `JSON_REQUIRED`, `SOURCE_CONTENT_TYPE`, `SOURCE_CHARSET`, `SOURCE_ENCODING` |
| 422 | `SOURCE_REDIRECT_LIMIT`, `SOURCE_HTTP_ERROR`, `SOURCE_DECODE_FAILED`, `SOURCE_TOO_COMPLEX` |
| 429 | `SOURCE_LIMIT`, `PROVIDER_RATE_LIMIT` |
| 502 | `PROVIDER_UNAVAILABLE`, `PROVIDER_RESPONSE_INVALID`, `PROVIDER_RESPONSE_TOO_LARGE`, `SOURCE_FETCH_FAILED` |
| 503 | `SOURCES_DISABLED`, `SEARCH_UNAVAILABLE`, `SEARCH_CONFIGURATION_INVALID`, `SOURCE_BUDGET_UNAVAILABLE`, `SOURCE_SERVICE_UNAVAILABLE` |
| 504 | `SOURCE_TIMEOUT` |

Migration `057_teacher_source_search_usage.sql` adds one private table and one service-only atomic reservation RPC. It is **PR-only, not applied**. The database assigns the request to the UTC day at statement start. Concurrent requests conditionally increment one teacher/day row before contacting Serper. Provider failures consume the reservation; no refunds or automatic retries. A retry is a new lookup. Midnight starts another date row; refresh and new sessions do not reset usage. Invalid/auth-denied requests or a missing key do not reserve quota.

Missing migration or storage errors fail closed for search but leave reading available. UI copy for `SOURCE_LIMIT`: “Daily search limit reached. You can still paste a link and keep teaching.” Atomicity/UTC tests use a mocked RPC, not a live PostgreSQL acceptance claim.

Rollback: `scripts/rollback-teacher-source-search-usage.sql` (not executed). Disable sources first. It drops the function/table and destroys counters; coordinate migration-ledger rollback separately. No deployment, DB application or search enablement is included in this PR.
