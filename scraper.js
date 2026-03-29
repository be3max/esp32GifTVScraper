/**
 * ESP32 GIF Scraper - Main orchestration
 * Fetches small GIFs from GIPHY, filters by size, updates GitHub Gist
 */

const { loadConfig } = require('./lib/config');
const { fetchAllTags, filterBySize, shuffle } = require('./lib/giphy');
const { updateGist, readGist } = require('./lib/gist');

async function main() {
  try {
    console.log('🎬 Starting ESP32 GIF Scraper\n');

    // Load and validate configuration
    const config = loadConfig();
    console.log(`✓ Configuration loaded (${config.tags.length} tags, target: ${config.targetCount} GIFs)\n`);

    // Fetch GIFs and read previous Gist in parallel (independent operations)
    const [allGifs, previousUrls] = await Promise.all([
      fetchAllTags(config),
      readGist(config),
    ]);
    console.log();

    // Filter by size constraints — collect 2× candidates to ensure fresh variety
    const validGifs = await filterBySize(allGifs, config, config.targetCount * 2);
    console.log();

    // Prefer GIFs not seen in the previous run
    const previousSet = new Set(previousUrls);
    const shuffledValid = shuffle(validGifs);
    const freshGifs = shuffledValid.filter(g => !previousSet.has(g.url));
    const seenGifs  = shuffledValid.filter(g =>  previousSet.has(g.url));
    const selected  = [...freshGifs, ...seenGifs].slice(0, config.targetCount);

    const freshCount = Math.min(freshGifs.length, config.targetCount);
    const reusedCount = selected.length - freshCount;
    console.log(`Selected ${freshCount} fresh + ${reusedCount} reused GIFs`);

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
