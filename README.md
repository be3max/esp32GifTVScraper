# ESP32 GIF Scraper 🎬

Automatically fetch pixel art and retro GIFs from GIPHY and store them in a GitHub Gist. Perfect for an ESP32 screensaver - https://github.com/be3max/esp32GifTV that displays random animated GIFs.

## Quick Reference

```bash
# First time: install dependencies
npm install

# Create credentials file from template
cp .env.example .env
# Edit .env and fill in your three values:
#   - GIPHY_API_KEY
#   - GIST_ID
#   - GH_TOKEN

# Test locally
npm run test:local

# Expected output: "✓ Done! Gist updated with 50 GIF URLs."

# Run production job
npm run scrape

# Verify in your Gist
# Visit: https://gist.github.com/USERNAME/GIST_ID
# Should show 50 URLs in gif-urls.txt
```

---

## What It Does

This GitHub Actions workflow runs automatically every week to:
1. Query GIPHY API for pixel art, retro game, 8bit, arcade, and cute GIFs
2. Filter GIFs by size (max 200×200px, max 100KB)
3. Save 50 GIF URLs to a GitHub Gist
4. Your ESP32 can then fetch and display these GIFs on a display

## Quick Start

### 1. Create a GitHub Gist
- Go to [gist.github.com](https://gist.github.com)
- Create a new public Gist with filename `gif-urls.txt`
- Add some placeholder text (e.g., "GIFs will be added here")
- Copy the Gist ID from the URL: `https://gist.github.com/USERNAME/**GIST_ID**`

### 2. Get a GIPHY API Key
- Sign up at [developers.giphy.com](https://developers.giphy.com)
- Create an app to get your API key

### 3. Add Repository Secrets
Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:
- `GIPHY_API_KEY` — Your GIPHY API key
- `GIST_ID` — Your Gist ID from step 1

### 4. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: GIF scraper setup"
git remote add origin https://github.com/YOUR_USERNAME/esp32GifScarper.git
git push -u origin main
```

### 5. Test It
Go to your repo → **Actions** tab → **Refresh GIF URLs** → **Run workflow**

After a few seconds, your Gist should have 50 GIF URLs (one per line).

## How It Works

### Automatic Schedule
- **Runs every Sunday at 2 AM UTC** (adjustable)
- **Manual trigger available** via GitHub Actions tab

### Filtering Process
```
Query GIPHY → Fetch 50 GIFs per tag (tags shuffled for variety)
                    ↓
            Read previous Gist URLs (parallel with fetch)
                    ↓
            Check dimensions (200×200px max)
                    ↓
            Check file size (100KB max)
                    ↓
            Collect 100 valid GIF candidates (2× buffer)
                    ↓
            Shuffle + pick fresh GIFs first, reuse as fallback
                    ↓
            Select 50 GIFs → Update GitHub Gist
```

### Output Format
Your Gist `gif-urls.txt` will look like:
```
https://giphy.com/gifs/pixel-art-1-abc123...
https://giphy.com/gifs/retro-game-xyz789...
https://giphy.com/gifs/8bit-qwe456...
(50 URLs total)
```

## Using With ESP32

Your ESP32 firmware should:

1. **Fetch the Gist URL:**
   ```
   https://gist.githubusercontent.com/USERNAME/GIST_ID/raw/gif-urls.txt
   ```

2. **Parse the response:** Split by newline to get URL array

3. **Pick a random URL:** Select one from the list

4. **Fetch the GIF:** Download and display on your ST7789 display

## Customization

All configuration is managed via **environment variables** — no code changes needed!

### Option A: Edit `.env` File (Local Testing)
Edit `.env` to override defaults:
```bash
# Change the tags
TAGS=pixel art,8bit,arcade

# Change how many GIFs to collect
TARGET_COUNT=100

# Increase size limit (in bytes)
MAX_SIZE_BYTES=524288  # 512KB instead of 100KB

# Change dimensions
MAX_WIDTH=256
MAX_HEIGHT=256

# Adjust concurrency (parallel requests)
CONCURRENCY=20

# Change request timeout (milliseconds)
REQUEST_TIMEOUT=15000  # 15 seconds
```

Then run:
```bash
npm run test:local
```

### Option B: Set in GitHub Secrets (for CI)
Add these to your repo → Settings → Secrets and variables → Actions:
- `TAGS` (optional) — comma-separated list
- `TARGET_COUNT` (optional) — default 50
- `MAX_SIZE_BYTES` (optional) — default 102400 (100KB)
- `MAX_WIDTH` (optional) — default 200
- `MAX_HEIGHT` (optional) — default 200
- `CONCURRENCY` (optional) — default 10

### Option C: Change Workflow Schedule
Edit `.github/workflows/refresh-gifs.yml`:
```yaml
- cron: '0 2 * * 0'  # Sunday 2 AM UTC
```

Common cron examples:
- `'0 */6 * * *'` — Every 6 hours
- `'0 12 * * *'` — Daily at noon UTC
- `'0 9 * * 1'` — Weekly on Monday at 9 AM UTC
- `'0 0 * * *'` — Daily at midnight UTC

### Default Tags
By default, the scraper searches these 21 tags:
```
pixel art, retro game, 8bit, arcade, cute,
windows 95, windows 98, windows xp, ms-dos,
snes, Doom 1, Doom 2, Quake, Quake 2, Quake 3,
Unreal Tournament, Half-Life, Half-Life 2, Portal,
Diablo 1, Diablo 2
```

To use custom tags, set `TAGS` env var:
```bash
TAGS="pixel art,pokemon,kirby"
npm run test:local
```

## Testing Locally

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create `.env` File
Copy the template:
```bash
cp .env.example .env
```

Edit `.env` in your editor and fill in your credentials:
```
GIPHY_API_KEY=your_giphy_api_key_here
GIST_ID=your_gist_id_here
GH_TOKEN=your_github_token_here
```

**How to get each value:**

**GIPHY_API_KEY:**
- Go to [developers.giphy.com](https://developers.giphy.com)
- Sign up or log in
- Create an app to get your API key
- Paste it into `.env`

**GIST_ID:**
- Create a Gist at [gist.github.com](https://gist.github.com)
- Add filename: `gif-urls.txt` with placeholder content
- Copy the ID from the URL: `https://gist.github.com/USERNAME/**GIST_ID**`
- Paste it into `.env`

**GH_TOKEN:**
- Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Click "Generate new token"
- Name: `ESP32 GIF Scraper`
- Select scope: **`gist`** (check the checkbox)
- Click "Generate token"
- Copy the token and paste into `.env`

### Step 3: Run Local Test
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

### Step 4: Verify in Your Gist
1. Go to your Gist: `https://gist.github.com/USERNAME/GIST_ID`
2. Refresh the page
3. You should see 50 GIF URLs in `gif-urls.txt` (one per line)
4. Each URL should be a GIPHY CDN link like: `https://media.giphy.com/media/...`

### Step 5: Run Production Job (Optional)
```bash
npm run scrape
```

This runs without dotenv, so environment variables must be set directly:
```bash
# PowerShell
$env:GIPHY_API_KEY = "..."; $env:GIST_ID = "..."; $env:GH_TOKEN = "..."; npm run scrape

# Bash/macOS/Linux
export GIPHY_API_KEY="..." GIST_ID="..." GH_TOKEN="..." && npm run scrape
```

## Troubleshooting

### ❌ Error: "Missing required environment variables"
**Problem:** One or more of the required env vars is missing from `.env`

**Solution:**
```bash
# Check your .env file has all three:
cat .env
```

Must contain:
```
GIPHY_API_KEY=your_key
GIST_ID=your_id
GH_TOKEN=your_token
```

All three are **required**. If any are missing or empty, add them.

---

### ❌ Error: "HTTP 401: Unauthorized"
**Problem:** GitHub token is invalid or doesn't have `gist` permission

**Solution:**
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Check your token exists and has `gist` scope
3. If not, create a new token:
   - Click "Generate new token"
   - Name: `ESP32 GIF Scraper`
   - Select: **`gist`** checkbox only
   - Click "Generate token"
4. Copy the new token into `.env`

---

### ❌ Error: "HTTP 404: Not Found"
**Problem:** Gist doesn't exist or `GIST_ID` is wrong

**Solution:**
1. Verify your Gist exists: `https://gist.github.com/USERNAME/GIST_ID`
2. Check the ID in your `.env` matches the Gist URL
3. If needed, create a new Gist at [gist.github.com](https://gist.github.com):
   - Filename: `gif-urls.txt`
   - Content: `Placeholder`
4. Copy the new ID into `.env`

---

### ❌ Error: "HTTP 403: Forbidden (from GIPHY)"
**Problem:** GIPHY API key is invalid or expired

**Solution:**
1. Go to [developers.giphy.com](https://developers.giphy.com)
2. Check your app and API key
3. Create a new app if needed
4. Copy the new API key into `.env`

---

### ❌ No GIFs found after filtering
**Problem:** All GIFs are too large or oversized for the constraints

**Solution:**
```bash
# Increase size limit in .env
MAX_SIZE_BYTES=262144  # 256KB instead of 100KB

# Or make dimensions larger
MAX_WIDTH=300
MAX_HEIGHT=300

# Then test again
npm run test:local
```

---

### ❌ Gist isn't updating
**Problem:** The scraper ran but the Gist remained unchanged

**Check the logs:**
1. Did the script print "✓ Updated Gist with X URLs"?
2. If not, check for error messages above
3. Refresh your Gist page (hard refresh: Ctrl+Shift+R)

---

### ❌ Workflow fails on GitHub Actions
**Problem:** The scheduled workflow or manual run failed

**Solution:**
1. Go to your repo → **Actions** tab
2. Click **Refresh GIF URLs** workflow
3. Click the failed run
4. Check the logs under **"Fetch and update GIFs"** step
5. Look for the error message
6. Fix in `.env` or GitHub Secrets

Common fixes:
- Verify secrets are set: repo → Settings → Secrets and variables
- Check Node version: should be 18+
- Ensure `npm install` completed successfully

---

### ❌ "Request timeout" error
**Problem:** Network is slow or GIPHY/GitHub API is unresponsive

**Solution:**
```bash
# Increase request timeout in .env
REQUEST_TIMEOUT=30000  # 30 seconds instead of 10 seconds

npm run test:local
```

---

### ⚠️ GIFs are too small
**Problem:** Filtered GIFs are smaller than desired

**Solution:**
```bash
# Adjust size/dimension constraints in .env
MAX_WIDTH=256
MAX_HEIGHT=256
MAX_SIZE_BYTES=307200  # 300KB

npm run test:local
```

---

### 💡 Want to adjust concurrency?
If the scraper is too aggressive (overwhelming CDN) or too slow:

```bash
# Less aggressive (fewer parallel requests)
CONCURRENCY=5
npm run test:local

# More aggressive (faster)
CONCURRENCY=20
npm run test:local
```

## Project Structure

```
esp32GifScarper/
├── .github/workflows/
│   └── refresh-gifs.yml           # GitHub Actions workflow (scheduled + manual)
├── lib/
│   ├── config.js                  # Configuration validation & defaults
│   ├── http.js                    # HTTPS transport layer
│   ├── giphy.js                   # GIPHY API client (parallel fetching)
│   └── gist.js                    # GitHub Gist API client
├── scraper.js                     # Main orchestration (entry point)
├── test-local.js                  # Local test runner (uses dotenv)
├── package.json                   # Node.js dependencies
├── .env.example                   # Template for local credentials
├── .env                           # Local credentials (gitignored)
├── README.md                      # This file (user guide)
├── CLAUDE.md                      # Developer guide
├── REFACTORING.md                 # Technical refactoring notes
├── SETUP.md                       # Initial setup guide
└── .gitignore                     # Git ignore rules
```

**Key files:**
- **scraper.js** — Entry point, orchestrates the workflow
- **lib/config.js** — Loads and validates environment variables
- **lib/http.js** — Low-level HTTPS requests with error handling
- **lib/giphy.js** — Fetches GIFs in parallel, deduplicates
- **lib/gist.js** — Updates GitHub Gist with results
- **.env** — Your local credentials (never committed)

## License

MIT

## Related

- [GIPHY API Docs](https://developers.giphy.com/docs/api/endpoint)
- [GitHub Gist API Docs](https://docs.github.com/en/rest/gists/gists)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
