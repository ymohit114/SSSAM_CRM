/**
 * SSSAM Academy - App Version Configuration
 * Current installed client version on this build
 */

export const CURRENT_APP_VERSION = '1.0.0';
export const CURRENT_BUILD_NUMBER = 1;

/**
 * Compare two semver strings (e.g. '1.0.0' and '1.1.0')
 * Returns:
 *   1 if v2 > v1 (update available)
 *   0 if equal
 *  -1 if v1 > v2
 */
export function compareVersions(current, latest) {
  if (!latest || !current) return 0;
  
  const v1Parts = current.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  const v2Parts = latest.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);

  const maxLen = Math.max(v1Parts.length, v2Parts.length);
  for (let i = 0; i < maxLen; i++) {
    const num1 = v1Parts[i] || 0;
    const num2 = v2Parts[i] || 0;
    if (num2 > num1) return 1;  // Newer version available
    if (num2 < num1) return -1; // Current is newer
  }
  return 0; // Identical
}
