# ESP32 GIF Scraper Setup

## Prerequisites

1. **GitHub Gist** — Create a public Gist called "gif-urls.txt" with placeholder content
2. **GIPHY API Key** — Get one from [developers.giphy.com](https://developers.giphy.com)
3. **GitHub Token** — Your repo already has `GITHUB_TOKEN` available in Actions

## Configuration Steps

### 1. Create a GitHub Gist
- Go to [gist.github.com](https://gist.github.com)
- Create a new Gist with filename `gif-urls.txt` and some placeholder content
- Copy the Gist ID from the URL (format: `https://gist.github.com/username/GIST_ID`)

### 2. Add Repository Secrets
In your GitHub repo settings (`Settings` → `Secrets and variables` → `Actions`):

- **GIPHY_API_KEY** — Your API key from GIPHY developers
- **GIST_ID** — The ID from your Gist URL

### 3. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: GIF scraper setup"
git remote add origin https://github.com/YOUR_USERNAME/esp32GifScarper.git
git push -u origin main
```

## How It Works

### GitHub Actions Workflow (`refresh-gifs.yml`)
- **Schedule**: Runs every Sunday at 2 AM UTC
- **Manual trigger**: Can be run manually from `Actions` tab
- **Steps**:
  1. Checks out code
  2. Sets up Node.js 18
  3. Installs dependencies
  4. Runs `scraper.js`

### Scraper Script (`scraper.js`)
- Fetches GIFs from GIPHY with tags: pixel art, retro game, 8bit, arcade, cute
- Filters by constraints:
  - Max 200×200px
  - Max 100KB
  - Uses `fixed_height_small` rendition (100px tall)
- Collects 50 valid GIFs
- Updates your Gist with the URLs (one per line)

## Testing Locally

To test the scraper before pushing:

```bash
export GIPHY_API_KEY="your_api_key"
export GIST_ID="your_gist_id"
export GITHUB_TOKEN="your_github_token"
node scraper.js
```

## ESP32 Integration

Your ESP32 should:
1. Fetch the raw Gist URL: `https://gist.githubusercontent.com/USERNAME/GIST_ID/raw/gif-urls.txt`
2. Split response by newline to get URL array
3. Pick a random URL
4. Fetch and display on ST7789 display

Example URLs will look like:
```
https://giphy.com/gifs/...
https://giphy.com/gifs/...
```

## Troubleshooting

### Workflow fails: "Failed to parse JSON"
- Check that `GIPHY_API_KEY` is correct
- Verify the Gist ID is valid

### No GIFs found after filtering
- The size constraint (100KB) might be too strict
- Check GIPHY's available renditions for your tags
- Consider adjusting MAX_SIZE_BYTES in scraper.js

### Gist doesn't update
- Verify `GITHUB_TOKEN` has appropriate permissions
- Check that the Gist filename is exactly `gif-urls.txt`
