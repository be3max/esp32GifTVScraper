/**
 * GIPHY API client
 * Features: parallel tag fetching, deduplication, size checking
 */

const { request, parseJson } = require('./http');

const GIPHY_API_BASE = 'https://api.giphy.com/v1/gifs/search';

/**
 * Fisher-Yates shuffle - randomize array order without mutation
 * @param {array} array - Array to shuffle
 * @returns {array} New shuffled array
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Search GIPHY for GIFs with a specific tag
 * @param {string} tag - Search tag
 * @param {object} config - Config object with giphyApiKey, fetchLimit, requestTimeout
 * @returns {Promise<array>} Array of GIF objects
 */
async function searchTag(tag, config) {
  const url = `${GIPHY_API_BASE}?q=${encodeURIComponent(tag)}&limit=${config.fetchLimit}&api_key=${config.giphyApiKey}`;

  const response = await request(url, {
    timeout: config.requestTimeout,
  });

  const data = parseJson(response);
  return data.data || [];
}

/**
 * Fetch GIFs for all tags in parallel, deduplicate by ID
 * @param {object} config - Config object
 * @returns {Promise<array>} Deduplicated flat array of GIF objects
 */
async function fetchAllTags(config) {
  console.log(`Fetching GIFs for ${config.tags.length} tags in parallel...`);

  try {
    // Shuffle tag order for random variety
    const shuffledTags = shuffle(config.tags);

    const results = await Promise.all(
      shuffledTags.map(tag => searchTag(tag, config))
    );

    // Flatten and deduplicate by GIF ID
    const seenIds = new Set();
    const allGifs = [];

    results.forEach(tagResults => {
      tagResults.forEach(gif => {
        if (!seenIds.has(gif.id)) {
          seenIds.add(gif.id);
          allGifs.push(gif);
        }
      });
    });

    console.log(`Fetched ${allGifs.length} unique GIFs`);
    return allGifs;
  } catch (err) {
    throw new Error(`Failed to fetch GIFs: ${err.message}`);
  }
}

/**
 * Check GIF file size via HEAD request
 * @param {string} url - GIF CDN URL
 * @param {number} timeout - Request timeout in ms
 * @returns {Promise<number>} File size in bytes, or 0 if unknown
 */
async function getGifSize(url, timeout) {
  try {
    const response = await request(url, {
      method: 'HEAD',
      timeout,
    });
    const size = parseInt(response.headers['content-length'] || '0');
    return size;
  } catch (err) {
    // If size check fails, log warning and return 0
    // The GIF will be included unless we're strict about unknown sizes
    console.warn(`⚠ Could not determine size for ${url}: ${err.message}`);
    return 0;
  }
}

/**
 * Filter GIFs by dimensions and file size constraints
 * Runs HEAD requests in parallel batches to avoid overwhelming the CDN
 * @param {array} gifs - Array of GIF objects from GIPHY
 * @param {object} config - Config object with max constraints and concurrency setting
 * @returns {Promise<array>} Array of { id, url } objects that pass all filters
 */
async function filterBySize(gifs, config, limit = config.targetCount) {
  console.log(
    `Filtering ${gifs.length} GIFs by constraints: ` +
    `max ${config.maxWidth}×${config.maxHeight}px, max ${Math.round(config.maxSizeBytes / 1024)}KB`
  );

  const validGifs = [];
  const { concurrency } = config;

  // Process GIFs in batches to limit parallel requests
  for (let i = 0; i < gifs.length; i += concurrency) {
    const batch = gifs.slice(i, i + concurrency);

    const results = await Promise.all(
      batch.map(async (gif) => {
        // Use fixed_height_small rendition if available, otherwise original
        const rendition = gif.images.fixed_height_small || gif.images.original;

        if (!rendition) {
          return null;
        }

        // Check dimensions
        const width = parseInt(rendition.width);
        const height = parseInt(rendition.height);

        if (width > config.maxWidth || height > config.maxHeight) {
          return null;
        }

        // Check file size - use rendition.url (the CDN URL), not gif.url (HTML page)
        const size = await getGifSize(rendition.url, config.requestTimeout);

        if (size > 0 && size > config.maxSizeBytes) {
          return null;
        }

        // If size is 0 (unknown), we include it with a warning
        if (size === 0) {
          console.warn(`⚠ Including GIF with unknown size: ${rendition.url}`);
        }

        return {
          id: gif.id,
          url: rendition.url,
          size,
        };
      })
    );

    // Filter out nulls and add to valid array
    results.forEach(result => {
      if (result) validGifs.push(result);
    });

    // Early exit if we have enough candidates
    if (validGifs.length >= limit) {
      break;
    }
  }

  console.log(`Found ${validGifs.length} valid GIFs`);
  return validGifs;
}

module.exports = { searchTag, fetchAllTags, filterBySize, getGifSize, shuffle };
