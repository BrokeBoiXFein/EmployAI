// ============================================================
// URL validation helper
// ============================================================
// We store apply-URLs that later get rendered as <a href> links in the
// frontend. A value like "javascript:alert(document.cookie)" would run
// as script when clicked, so we only accept real http(s) URLs here —
// at the point the value enters our database.
// ============================================================

function isSafeHttpUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  let parsed;
  try {
    parsed = new URL(value);
  } catch (_) {
    return false;
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:';
}

module.exports = { isSafeHttpUrl };
