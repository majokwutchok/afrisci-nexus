/**
 * Validates ORCID format: XXXX-XXXX-XXXX-XXXX or XXXX-XXXX-XXXX-XXXC
 * Valid format: 4 groups of 4 characters separated by hyphens
 * Last character can be 0-9 or X
 */
export function isValidOrcid(orcid) {
  if (!orcid || typeof orcid !== 'string') return false;
  const orcidRegex = /^(\d{4}-){3}\d{3}[\dX]$/;
  return orcidRegex.test(orcid.trim().toUpperCase());
}

/**
 * Normalizes ORCID to uppercase
 */
export function normalizeOrcid(orcid) {
  return orcid ? orcid.trim().toUpperCase() : '';
}

/**
 * Builds ORCID profile URL
 */
export function getOrcidUrl(orcid) {
  if (!isValidOrcid(orcid)) return null;
  return `https://orcid.org/${normalizeOrcid(orcid)}`;
}