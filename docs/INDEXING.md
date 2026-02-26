# Indexing & Crawl Control

LessonCaptain uses environment variables to control search-engine indexing. This lets the site run in a fully noindex state during testing and enables fine-grained control later.

---

## Environment variables

| Variable | Values | Effect |
|---|---|---|
| `SITE_NOINDEX` | `1` or unset | **Master switch.** When `1`, blocks indexing site-wide. |
| `LANDING_PAGES_NOINDEX` | `1` or unset | Blocks indexing of `/classroom-games` and `/classroom-activities` only. Ignored when `SITE_NOINDEX=1`. |
| `WORKSHEETS_NOINDEX` | `1` or unset | Blocks indexing of `/worksheets` only. Ignored when `SITE_NOINDEX=1`. |

---

## Behavior by flag

### `SITE_NOINDEX=1` (testing / pre-launch)

- **robots meta** — `noindex, nofollow, nocache` emitted on every page via root layout `metadata`.
- **`/robots.txt`** — Returns `Disallow: /` for all user-agents. No sitemap link.
- **`/sitemap.xml`** — Returns an empty document (zero URLs).

### `SITE_NOINDEX` unset or `0` (normal)

- **robots meta** — No global robots override. Per-page metadata applies.
- **`/robots.txt`** — Allows `/classroom-games`, `/classroom-activities`, `/worksheets`; disallows `/api/`, `/login`, `/sessions/`, etc.
- **`/sitemap.xml`** — Lists all hubs, categories, and detail pages unless the section-level flags below are set.

### Section flags (only active when `SITE_NOINDEX` is not `1`)

- `LANDING_PAGES_NOINDEX=1` — Omits landing pages from sitemap; adds `noindex` to those pages' metadata.
- `WORKSHEETS_NOINDEX=1` — Omits worksheet pages from sitemap; adds `noindex` to those pages' metadata.

---

## How to set for local dev

Add to `.env.local`:

```
SITE_NOINDEX=1
```

For Vercel, set in **Project → Settings → Environment Variables** for Preview environments only. Leave unset (or `0`) for Production when ready to launch.
