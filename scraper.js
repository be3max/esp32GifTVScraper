/**
 * ESP32 GIF Scraper - Main orchestration
 * Fetches small GIFs from GIPHY, filters by size, updates GitHub Gist
 */

const { loadConfig } = require('./lib/config');
const { fetchAllTags, filterBySize } = require('./lib/giphy');
const { updateGist } = require('./lib/gist');

async function main() {
  try {
    console.log('🎬 Starting ESP32 GIF Scraper\n');

    // Load and validate configuration
    const config = loadConfig();
    console.log(`✓ Configuration loaded (${config.tags.length} tags, target: ${config.targetCount} GIFs)\n`);

    // Fetch all GIFs in parallel
    const allGifs = await fetchAllTags(config);
    console.log();

    // Filter by size constraints with concurrent HEAD requests
    const validGifs = await filterBySize(allGifs, config);
    console.log();

    // Select and upload
    const selected = validGifs.slice(0, config.targetCount);

    if (selected.length === 0) {
      throw new Error('No valid GIFs found after filtering');
    }

    console.log(`Uploading ${selected.length} URLs to Gist...`);
    const urls = selected.map(g => g.url);
    await updateGist(config, urls);

    console.log(`\n✓ Done! Gist updated with ${selected.length} GIF URLs.\n`);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

main();
