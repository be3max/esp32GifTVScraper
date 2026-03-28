# GIF Filtering Constraints

This document explains exactly how the scraper filters GIFs based on size, width, and height constraints.

## Default Constraints

```
Max Width:  200px
Max Height: 200px
Max Size:   100KB (102,400 bytes)
```

## Filtering Logic

A GIF is **included** only if it passes **ALL three checks**:

```javascript
// Check 1: Width must be <= maxWidth
if (width > maxWidth) {
  return null; // REJECT
}

// Check 2: Height must be <= maxHeight
if (height > maxHeight) {
  return null; // REJECT
}

// Check 3: File size must be <= maxSizeBytes
if (size > 0 && size > maxSizeBytes) {
  return null; // REJECT
}

// If all checks pass:
return { id, url, size }; // ACCEPT
```

## Examples

### ✓ PASS: All constraints met

| Dimension | Size | Result | Reason |
|-----------|------|--------|--------|
| 100×100px | 50KB | ✓ PASS | All under limits |
| 200×200px | 100KB | ✓ PASS | At exact limits |
| 150×75px | 80KB | ✓ PASS | All under limits |

### ✗ FAIL: At least one constraint exceeded

| Dimension | Size | Result | Reason |
|-----------|------|--------|--------|
| 250×100px | 50KB | ✗ FAIL | Width (250px) > max (200px) |
| 100×250px | 50KB | ✗ FAIL | Height (250px) > max (200px) |
| 100×100px | 150KB | ✗ FAIL | Size (150KB) > max (100KB) |
| 250×250px | 150KB | ✗ FAIL | Width, height, AND size exceed |
| 100×100px | 100.001KB | ✗ FAIL | Size exceeds by even 1 byte |

## Special Case: Unknown Size (size = 0)

If the HEAD request fails and file size cannot be determined:

```javascript
if (size === 0) {
  console.warn(`⚠ Including GIF with unknown size: ${url}`);
  return { id, url, size }; // INCLUDE (with warning)
}
```

**Behavior**: GIF is **included** but a warning is logged.

**Example output**:
```
⚠ Including GIF with unknown size: https://media.giphy.com/media/xyz123...
```

## Customizing Constraints

### Via Environment Variable

Edit `.env`:
```bash
MAX_WIDTH=256
MAX_HEIGHT=256
MAX_SIZE_BYTES=262144  # 256KB
```

Then run:
```bash
npm run test:local
```

### Verify New Constraints

The scraper logs the active constraints when starting:
```
Filtering 250 GIFs by constraints: max 256×256px, max 256KB
```

## Code Location

The filtering logic is in [lib/giphy.js](lib/giphy.js):

**Lines 111-124**: Dimension and size checks
**Lines 89-152**: Complete `filterBySize()` function

## Verification

Run the filtering verification test:
```bash
node verify-filtering.js
```

Output shows:
- Current constraints
- Test cases for each scenario
- Pass/fail results for each test

## Performance Notes

- **HEAD requests are batched** — checked in parallel (default: 10 concurrent)
- **Early exit** — stops filtering once `targetCount` GIFs are found
- **Deduplication** — same GIF ID never appears twice

## Troubleshooting

### "Found 0 valid GIFs"
Your constraints are too strict. GIFs available on GIPHY don't meet your criteria.

**Solution:**
```bash
# Make constraints more lenient:
MAX_WIDTH=256
MAX_HEIGHT=256
MAX_SIZE_BYTES=262144  # 256KB

npm run test:local
```

### "Including GIF with unknown size" warnings
HEAD request failed for some GIFs. They're included but size is unverified.

**Cause**: Network issue, CDN timeout, or GIF no longer exists
**Impact**: Those GIFs might exceed the size limit
**Solution**: Increase `REQUEST_TIMEOUT` in `.env`:

```bash
REQUEST_TIMEOUT=15000  # 15 seconds instead of 10
npm run test:local
```

## API Rendition Used

The scraper uses GIPHY's `fixed_height_small` rendition (100px tall):

```javascript
const rendition = gif.images.fixed_height_small || gif.images.original;
```

This provides:
- **Consistent height**: 100 pixels
- **Variable width**: Maintains aspect ratio
- **Small file size**: Optimized for small displays
- **Fallback**: Uses `original` if `fixed_height_small` unavailable

## Summary

```
Input: GIF from GIPHY API
  ↓
Check: width <= MAX_WIDTH (default 200px)
Check: height <= MAX_HEIGHT (default 200px)
Check: size <= MAX_SIZE_BYTES (default 100KB)
  ↓
Output: Valid GIF or rejected
```

Only GIFs passing **all three checks** are included in the final Gist.
