/**
 * Configuration module: validates env vars and returns typed config object
 * Single source of truth for all constants and settings
 */

const DEFAULT_TAGS = [
  'pixel art', 'retro game', '8bit', 'arcade', 'cute',
  'windows 95', 'windows 98', 'windows xp', 'ms-dos',
  'snes', 'Doom 1', 'Doom 2', 'Quake', 'Quake 2', 'Quake 3',
  'Unreal Tournament', 'Half-Life', 'Half-Life 2', 'Portal',
  'Diablo 1', 'Diablo 2'
];

const REQUIRED_ENV_VARS = ['GIPHY_API_KEY', 'GIST_ID', 'GH_TOKEN'];

function loadConfig() {
  // Validate required environment variables
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    // API credentials (required)
    giphyApiKey: process.env.GIPHY_API_KEY,
    gistId: process.env.GIST_ID,
    githubToken: process.env.GH_TOKEN,

    // Search configuration
    tags: process.env.TAGS
      ? process.env.TAGS.split(',').map(t => t.trim())
      : DEFAULT_TAGS,
    fetchLimit: parseInt(process.env.FETCH_LIMIT || '50'),

    // GIF filtering constraints
    targetCount: parseInt(process.env.TARGET_COUNT || '50'),
    maxSizeBytes: parseInt(process.env.MAX_SIZE_BYTES || String(100 * 1024)), // 100KB
    maxWidth: parseInt(process.env.MAX_WIDTH || '200'),
    maxHeight: parseInt(process.env.MAX_HEIGHT || '200'),

    // Output settings
    gistFilename: 'gif-urls.txt',

    // HTTP settings
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '10000'), // 10 seconds
    maxRedirects: 3,

    // Performance settings
    concurrency: parseInt(process.env.CONCURRENCY || '10'), // parallel HEAD requests
  };
}

module.exports = { loadConfig, DEFAULT_TAGS };
