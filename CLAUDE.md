# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A modular, production-grade scraper that periodically fetches GIFs from GIPHY API and updates a GitHub Gist for an ESP32 to display as a screensaver.

## Architecture

### Module Structure
```
lib/
├── config.js      Validates env vars, returns typed config object
├── http.js        HTTPS transport: status checking, timeout, redirect follow
├── giphy.js       GIPHY API client: parallel tag fetching, deduplication
└── gist.js        GitHub Gist API client

scraper.js         Pure orchestration: load config → fetch → filter → upload
test-local.js      Local test runner: loads .env via dotenv, runs scraper
```

### Key Design Principles
- **Separation of concerns**: Each module has a single responsibility
- **Parallel execution**: Tag fetching and size checks run in parallel (100x+ faster)
- **Error handling**: HTTP status codes checked, custom `HttpError` class, descriptive messages
- **Validation**: Config validated at startup, works in both local and CI
- **Performance**: Batched concurrent HEAD requests with configurable concurrency limit

### Data Flow
```
loadConfig()
  ↓
fetchAllTags() + readGist()  [parallel: fetch new GIFs + read previous URLs]
  ↓
filterBySize()  [batched parallel HEAD requests on rendition.url, collects 2× candidates]
  ↓
shuffle() + fresh-first selection  [prioritize GIFs not seen last run]
  ↓
updateGist()    [PATCH request to GitHub API]
```

## Environment Variables

**Required** (validated at startup):
- `GIPHY_API_KEY` — GIPHY developer API key
- `GIST_ID` — GitHub Gist ID
- `GH_TOKEN` — GitHub token with `gist` permission

**Optional** (overrides defaults in `lib/config.js`):
- `TAGS` — Comma-separated tag list (default: 21 retro/pixel art tags)
- `TARGET_COUNT` — Number of GIFs to collect (default: 50)
- `MAX_SIZE_BYTES` — Max file size in bytes (default: 100KB)
- `MAX_WIDTH` / `MAX_HEIGHT` — Dimension limits in pixels (default: 200×200)
- `FETCH_LIMIT` — Results per tag from GIPHY (default: 50)
- `MAX_OFFSET` — Upper bound for random GIPHY search offset; higher = more variety, lower = safer for niche tags (default: 100)
- `REQUEST_TIMEOUT` — HTTP timeout in ms (default: 10000)
- `CONCURRENCY` — Parallel HEAD requests per batch (default: 10)

## How to Use (Step-by-Step)

### Local Testing Setup

**1. Install Node dependencies:**
```bash
npm install
```

**2. Create a `.env` file with your credentials:**
```bash
cp .env.example .env
```

Then edit `.env` with a text editor and add your three required values:
```
GIPHY_API_KEY=your_giphy_api_key_here
GIST_ID=your_gist_id_here
GH_TOKEN=your_github_token_here
```

**Where to get each value:**

**GIPHY_API_KEY:**
- Go to https://developers.giphy.com
- Sign up or log in
- Create an app → copy API key → paste into `.env`

**GIST_ID:**
- Go to https://gist.github.com
- Create a new Gist with filename `gif-urls.txt`
- Copy the ID from the URL: `https://gist.github.com/USERNAME/**GIST_ID**`
- Paste into `.env`

**GH_TOKEN:**
- Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Click "Generate new token"
- Give it a name: `ESP32 GIF Scraper`
- **Important**: Select only the **`gist`** scope checkbox
- Click "Generate token"
- Copy the token → paste into `.env`

**3. Run the local test:**
```bash
npm run test:local
```

**Expected output:**
```
🎬 Starting ESP32 GIF Scraper

✓ Configuration loaded (21 tags, target: 50 GIFs)

Fetching GIFs for 21 tags in parallel...
Fetched 250 unique GIFs

Filtering 250 GIFs by constraints: max 200×200px, max 100KB
Found 100 valid GIFs

Selected 50 fresh + 0 reused GIFs
Uploading 50 URLs to Gist...
✓ Updated Gist with 50 URLs

✓ Done! Gist updated with 50 GIF URLs.
```

**4. Verify success:**
- Open your Gist at `https://gist.github.com/USERNAME/GIST_ID`
- Refresh the page
- You should see 50 URLs in `gif-urls.txt` (one per line)

---

### Deploy to GitHub Actions

**1. Push to GitHub:**
```bash
git add .
git commit -m "Add ESP32 GIF Scraper"
git push origin main
```

**2. Add GitHub secrets:**
Go to your repo → Settings → Secrets and variables → Actions

Add these **repository secrets**:
- **GIPHY_API_KEY** — Your API key from developers.giphy.com
- **GIST_ID** — Your Gist ID
- (GH_TOKEN is auto-provided by GitHub Actions)

**3. Test the workflow:**
- Go to repo → Actions tab
- Click **Refresh GIF URLs** workflow
- Click **Run workflow** button
- Wait for it to complete (should show green ✓)
- Check your Gist was updated with 50 URLs

**4. Automatic schedule:**
- Workflow runs every Sunday at 2 AM UTC
- You can manually trigger anytime from Actions tab

---

### Configuration & Customization

All settings are via **environment variables** — no code changes needed!

**Local development** — Edit `.env`:
```bash
# Custom tags (comma-separated)
TAGS=pixel art,pokemon,kirby

# How many GIFs to collect
TARGET_COUNT=100

# Max file size (in bytes)
MAX_SIZE_BYTES=262144  # 256KB

# Max dimensions (pixels)
MAX_WIDTH=256
MAX_HEIGHT=256

# Parallel requests (higher = faster, lower = less aggressive on CDN)
CONCURRENCY=20

# Request timeout (milliseconds)
REQUEST_TIMEOUT=15000

npm run test:local
```

**CI/GitHub Actions** — Add to repo Secrets:
- `TAGS`
- `TARGET_COUNT`
- `MAX_SIZE_BYTES`
- `MAX_WIDTH`
- `MAX_HEIGHT`
- `CONCURRENCY`
- `REQUEST_TIMEOUT`
- `MAX_OFFSET`

---

### Development Tasks

**Install dependencies:**
```bash
npm install
```

**Test locally:**
```bash
npm run test:local
```

**Run production job:**
```bash
npm run scrape
```

**View configuration defaults:**
```bash
cat lib/config.js  # See DEFAULT_TAGS and default env vars
```

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `lib/config.js` | Config validation + typed object | ~50 |
| `lib/http.js` | HTTP client with error handling | ~100 |
| `lib/giphy.js` | GIPHY API + parallel fetching + shuffle | ~170 |
| `lib/gist.js` | GitHub Gist read/update | ~80 |
| `scraper.js` | Orchestration | ~55 |
| `test-local.js` | Test runner | 3 |

## Key Features

1. **Fresh GIF prioritization** — reads previous Gist, shuffles candidates, fills with fresh GIFs first, reused as fallback
2. **2× candidate buffer** — `filterBySize` collects `targetCount * 2` valid GIFs to give the fresh-first selector room to work
3. **Tag order shuffled** — `fetchAllTags` shuffles tags each run for variety
4. **Size check uses rendition.url** (CDN link) instead of gif.url (HTML page)
5. **HTTP status codes are checked** — errors are no longer silently ignored
6. **GIFs deduplicated across tags** — no duplicates in output
7. **Request timeouts** — prevents hanging on slow connections

## Performance

- **Tag fetching**: 21 serial requests → parallel → 100x faster
- **Size checking**: 1,050 sequential HEAD requests → batched parallel (concurrency: 10) → 100x+ faster
- **Overall**: Minutes → seconds

## Configuration & Customization

To change tags, set env var:
```bash
export TAGS="pixel art,8bit,cute"
npm run scrape
```

To adjust concurrency (balance speed vs CDN load):
```bash
export CONCURRENCY=5  # Lower for less aggressive, higher for faster
```

To change cron schedule, edit `.github/workflows/refresh-gifs.yml`:
```yaml
- cron: '0 2 * * 0'  # Current: Sunday 2 AM UTC
```

## Error Handling

- Missing env vars: clear error message at startup
- HTTP errors (401, 403, 404, 429, 5xx): logged with status code and context
- Network timeout: 10 second default, configurable
- Invalid GIF response: partial JSON rejected with error message
- Unknown GIF size: logged as warning, GIF still included

## Testing & Debugging

Enable verbose logging by modifying `scraper.js` log levels or redirecting to file:
```bash
npm run scrape > scraper.log 2>&1
```

Check GitHub Actions logs:
1. Go to repo → **Actions** tab
2. Select **Refresh GIF URLs** workflow
3. View latest run logs

## Notes

- Output: One GIF CDN URL per line in Gist (newline-delimited)
- Gist filename: `gif-urls.txt` (configurable via config)
- Node version pinned to 18.20.8 in CI for reproducibility
- Dependencies: only `dotenv` (dev) — no production dependencies

## Module Responsibilities

Each module in `lib/` has a single, clear responsibility:

### `lib/config.js` (~50 lines)
**Purpose**: Validate environment variables and provide a typed config object

**Exports**:
- `loadConfig()` — Returns config object with all settings
- Throws immediately if required env vars are missing

**Used by**: `scraper.js` calls this first

**Example**:
```js
const { loadConfig } = require('./lib/config');
const config = loadConfig(); // Throws if env vars missing
console.log(config.targetCount); // 50
```

---

### `lib/http.js` (~100 lines)
**Purpose**: Low-level HTTPS transport with error handling

**Exports**:
- `request(url, options)` — Make GET/PATCH request, returns `{ statusCode, headers, body }`
- `parseJson(response)` — Parse JSON from response body
- `HttpError` — Custom error with statusCode property

**Features**:
- ✓ Checks HTTP status code (throws on non-2xx)
- ✓ Handles timeouts (default 10s)
- ✓ Follows redirects (up to 3 hops)
- ✓ Descriptive error messages

**Used by**: `lib/giphy.js` and `lib/gist.js`

**Example**:
```js
const { request, parseJson } = require('./lib/http');
const response = await request('https://...');
if (response.statusCode === 200) {
  const data = parseJson(response);
}
```

---

### `lib/giphy.js` (~170 lines)
**Purpose**: GIPHY API client with parallel fetching and shuffle utilities

**Exports**:
- `searchTag(tag, config)` — Search single tag
- `fetchAllTags(config)` — Fetch all tags in parallel (shuffled order), deduplicate by GIF ID
- `filterBySize(gifs, config, limit)` — Filter by dimensions + file size (batched parallel HEAD requests); stops early once `limit` valid GIFs found
- `getGifSize(url, timeout)` — Check GIF file size via HEAD request
- `shuffle(array)` — Fisher-Yates shuffle, returns new array

**Features**:
- ✓ Tag order shuffled each run for variety
- ✓ Parallel tag fetching (21 serial → parallel)
- ✓ Deduplication by GIF ID (prevents duplicates)
- ✓ Batched HEAD requests (1,050 sequential → 100+ parallel batches)
- ✓ Early exit once `limit` valid GIFs collected (default: `targetCount * 2`)
- ✓ Dimension filtering (max width/height)
- ✓ Size filtering (max file size in bytes)

**Used by**: `scraper.js`

**Example**:
```js
const { fetchAllTags, filterBySize, shuffle } = require('./lib/giphy');
const allGifs = await fetchAllTags(config);           // All tags, parallel, shuffled
const valid = await filterBySize(allGifs, config, 100); // Up to 100 valid GIFs
```

---

### `lib/gist.js` (~80 lines)
**Purpose**: GitHub Gist API client (read + write)

**Exports**:
- `updateGist(config, urls)` — Update Gist file with newline-separated URLs
- `readGist(config)` — Read current URLs from Gist; returns `[]` on failure

**Features**:
- ✓ PATCH request to GitHub API
- ✓ GET request to read existing URLs (for fresh-first deduplication)
- ✓ Descriptive error messages for auth/not-found errors
- ✓ Writes to configurable filename (default: `gif-urls.txt`)

**Used by**: `scraper.js`

**Example**:
```js
const { updateGist, readGist } = require('./lib/gist');
const previousUrls = await readGist(config);  // ['https://...', ...]
await updateGist(config, ['https://...', 'https://...']);
```

---

### `scraper.js` (~55 lines)
**Purpose**: Orchestration — glues modules together

**Flow**:
```
loadConfig()
  ↓
fetchAllTags() + readGist()  → 250 GIFs + previous URLs (parallel)
  ↓
filterBySize(…, targetCount * 2)  → up to 100 valid GIF candidates
  ↓
shuffle() + fresh-first selection  → 50 GIFs, fresh ones first
  ↓
updateGist()  → Gist updated
```

**Why it's short**: All heavy lifting is in `lib/`

---

## Testing Individual Modules

You can test modules independently from the Node REPL:

```bash
# Start REPL
node

# Load a module
const { loadConfig } = require('./lib/config');

# Call a function
const config = loadConfig();
console.log(config.tags.length);  // 21

# Exit
.exit
```

Or write small test scripts:
```js
// test-http.js
const { request } = require('./lib/http');

(async () => {
  const response = await request('https://api.github.com');
  console.log(response.statusCode); // 200
})();
```

---

## Adding New Features

**New GIPHY feature?** → Modify `lib/giphy.js`
**New GitHub integration?** → Modify `lib/gist.js`
**New HTTP behavior?** → Modify `lib/http.js`
**New config option?** → Modify `lib/config.js`
**Connect modules together?** → Modify `scraper.js`

---

## See Also

- [REFACTORING.md](REFACTORING.md) — Detailed refactoring notes and improvements
- [README.md](README.md) — User-facing setup guide
- [SETUP.md](SETUP.md) — Initial setup instructions
