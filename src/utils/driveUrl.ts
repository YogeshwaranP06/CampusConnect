/**
 * Google Drive URL Normalizer & Image Resolver
 * Converts varied Google Drive share links into accessible image preview URLs
 * and validates URL safety.
 */

export function extractGoogleDriveId(urlOrId: string | undefined | null): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const clean = urlOrId.trim();

  // If already just an ID (alphanumeric with underscores/dashes, typically 25-45 chars)
  if (/^[a-zA-Z0-9_-]{25,50}$/.test(clean)) {
    return clean;
  }

  // Format: https://drive.google.com/file/d/{ID}/view
  const fileDMatch = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }

  // Format: https://drive.google.com/open?id={ID} or id={ID}
  const idQueryMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idQueryMatch && idQueryMatch[1]) {
    return idQueryMatch[1];
  }

  // Format: https://drive.google.com/uc?id={ID}
  const ucMatch = clean.match(/\/uc\?(?:.*&)?id=([a-zA-Z0-9_-]+)/);
  if (ucMatch && ucMatch[1]) {
    return ucMatch[1];
  }

  return null;
}

/**
 * Returns a high-res direct image URL for a Google Drive file ID
 */
export function getDriveDirectImageUrl(driveId: string): string {
  // lh3.googleusercontent.com/d/{ID}=w1200 provides fast, high-res direct rendering for public drive files
  return `https://lh3.googleusercontent.com/d/${driveId}=w1200`;
}

/**
 * Resolves the preferred banner URL from either banner_url or drive_file_ref
 */
export function resolveEventPosterUrl(bannerUrl?: string, driveRef?: string): string | null {
  if (bannerUrl && isValidHttpUrl(bannerUrl)) {
    // If it's a Drive URL passed in banner_url, normalize it
    const driveId = extractGoogleDriveId(bannerUrl);
    if (driveId) {
      return getDriveDirectImageUrl(driveId);
    }
    return bannerUrl;
  }

  if (driveRef) {
    const driveId = extractGoogleDriveId(driveRef);
    if (driveId) {
      return getDriveDirectImageUrl(driveId);
    }
  }

  return null;
}

/**
 * Strict URL safety validation
 * Rejects javascript:, vbscript:, data:, and empty values
 */
export function isValidHttpUrl(stringToTest: string | undefined | null): boolean {
  if (!stringToTest || typeof stringToTest !== 'string') return false;
  const trimmed = stringToTest.trim();
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitizes external link for click handlers
 */
export function sanitizeExternalUrl(url: string | undefined | null): string | null {
  if (!url || !isValidHttpUrl(url)) return null;
  return url.trim();
}
