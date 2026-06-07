/**
 * Configuration module: validates env vars and returns typed config object
 * Single source of truth for all constants and settings
 */

const DEFAULT_TAGS = [
  // retro OS / demoscene
  'demoscene', 'pixel art', 'commodore 64', 'amiga 500', 'ms-dos', 'windows 95', 'windows 98', 'atari',
  // consoles
  'snes gameplay', 'sega genesis', 'game boy', 'atari 2600',
  // FPS classics
  'doom', 'quake', 'half-life', 'wolfenstein 3d', 'duke nukem 3d', 'heretic', 'hexen', 'blood game',
  // RPG / action
  'diablo', 'diablo 2', 'baldurs gate', 'fallout 1', 'ultima',
  // RTS / strategy
  'starcraft', 'warcraft 2', 'command conquer', 'red alert', 'age of empires',
  // open world / racing
  'gta vice city', 'gta san andreas', 'carmageddon', 'need for speed 2',
  // platformers
  'mario', 'sonic', 'mega man', 'castlevania', 'metroid', 'zelda',
  // action / adventure
  'tomb raider', 'prince of persia', 'alone in the dark',
  // adventure / puzzle
  'monkey island', 'myst', 'theme hospital', 'transport tycoon',
  // fighting
  'mortal kombat', 'street fighter 2',
  // puzzle / misc
  'worms game', 'lemmings', 'tetris', 'pacman',
  // late-90s multiplayer
  'unreal tournament', 'counter-strike', 'quake 3 arena',
  // more platformers
  'jazz jackrabbit', 'commander keen',
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
    maxOffset: parseInt(process.env.MAX_OFFSET || '100'),

    // GIF filtering constraints
    targetCount: parseInt(process.env.TARGET_COUNT || '50'),
    maxSizeBytes: parseInt(process.env.MAX_SIZE_BYTES || '102400'), // 100KB
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
