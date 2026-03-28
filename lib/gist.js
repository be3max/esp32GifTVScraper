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
        'Check GITHUB_TOKEN has gist permission.'
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

module.exports = { updateGist };
