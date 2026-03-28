/**
 * HTTP transport layer: low-level HTTPS utilities
 * Features: status code checking, timeout handling, redirect following
 */

const https = require('https');
const { URL } = require('url');

class HttpError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

/**
 * Make an HTTPS request with proper error handling
 * @param {string} url - Full URL
 * @param {object} options - { method, headers, body, timeout, maxRedirects }
 * @returns {Promise<{ statusCode, headers, body }>}
 */
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const {
      method = 'GET',
      headers = {},
      body = null,
      timeout = 10000,
      maxRedirects = 3,
      _redirectCount = 0,
    } = options;

    // Check redirect limit
    if (_redirectCount > maxRedirects) {
      reject(new HttpError(`Too many redirects (max ${maxRedirects})`, 0));
      return;
    }

    const urlObj = new URL(url);
    const httpsOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'User-Agent': 'ESP32-GIF-Scraper/1.0',
        ...headers,
      },
      timeout,
    };

    const req = https.request(httpsOptions, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.destroy();
        const redirectUrl = res.headers.location;
        request(redirectUrl, {
          ...options,
          _redirectCount: _redirectCount + 1,
        })
          .then(resolve)
          .catch(reject);
        return;
      }

      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        // Check for non-2xx status code
        if (res.statusCode < 200 || res.statusCode >= 300) {
          const summary = data.substring(0, 200);
          reject(
            new HttpError(
              `HTTP ${res.statusCode}: ${res.statusMessage || 'Error'} (${summary})`,
              res.statusCode
            )
          );
          return;
        }

        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new HttpError(`Request timeout (${timeout}ms)`, 0));
    });

    req.on('error', (err) => {
      reject(new HttpError(`Network error: ${err.message}`, 0));
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

/**
 * Parse JSON response and throw if not valid JSON
 * @param {{ body: string }} response - HTTPS response object
 * @returns {object} Parsed JSON
 */
function parseJson(response) {
  try {
    return JSON.parse(response.body);
  } catch (err) {
    throw new HttpError(`Invalid JSON response: ${response.body.substring(0, 100)}`, 0);
  }
}

module.exports = { request, parseJson, HttpError };
