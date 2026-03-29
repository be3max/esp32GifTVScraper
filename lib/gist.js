/**
 * GitHub Gist API client
 * Features: updating gist files with GIF URLs
 */

const { request, parseJson } = require('./http');

const GITHUB_API_BASE = 'https://api.github.com/gists';

/**
 * Update a GitHub Gist with GIF URLs
 * @param {object} config - Config object with gistId, githubToken, gistFilename, requestTimeout
 * @param {array} urls - Array of GIF URLs to write to the gist
 * @returns {Promise<void>}
 */
async function updateGist(config, urls) {
  const url = `${GITHUB_API_BASE}/${config.gistId}`;

  const body = JSON.stringify({
    files: {
      [config.gistFilename]: {
        content: urls.join('\n'),
      },
    },
  });

  const headers = {
    'Authorization': `token ${config.githubToken}`,
    'Content-Type': 'application/json',
  };

  try {
    await request(url, {
      method: 'PATCH',
      headers,
      body,
      timeout: config.requestTimeout,
    });

    console.log(`✓ Updated Gist with ${urls.length} URLs`);
  } catch (err) {
    if (err.statusCode === 401 || err.statusCode === 403) {
      throw new Error(
        `GitHub authentication failed (${err.statusCode}). ` +
        'Check GH_TOKEN has gist permission.'
      );
    }
    if (err.statusCode === 404) {
      throw new Error(
        `Gist not found (${err.statusCode}). ` +
        'Check GIST_ID is correct.'
      );
    }
    throw err;
  }
}

/**
 * Read the current GIF URLs from an existing Gist
 * @param {object} config - Config object with gistId, githubToken, gistFilename, requestTimeout
 * @returns {Promise<string[]>} Array of URLs from last run, or [] if empty/unreachable
 */
async function readGist(config) {
  const url = `${GITHUB_API_BASE}/${config.gistId}`;
  try {
    const response = await request(url, {
      headers: { 'Authorization': `token ${config.githubToken}` },
      timeout: config.requestTimeout,
    });
    const data = parseJson(response);
    const file = data.files[config.gistFilename];
    if (!file || !file.content) return [];
    return file.content.split('\n').filter(line => line.trim());
  } catch (err) {
    console.warn('⚠ Could not read existing Gist — starting fresh');
    return [];
  }
}

module.exports = { updateGist, readGist };
