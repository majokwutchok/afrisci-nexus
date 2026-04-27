/**
 * Utility functions for constructing AfriSci Nexus Discovery URLs
 * Centralizes domain management and ensures consistent branding across the platform
 */

const AFRISCI_DOMAIN = 'https://afriscinexus.com';

/**
 * Get the base URL for AfriSci Nexus
 */
export const getAfriSciBase = () => AFRISCI_DOMAIN;

/**
 * Convert a base44 media URL to afriscinexus.com format
 * Falls back to original URL if conversion isn't possible
 */
export const convertToAfriSciURL = (base44Url) => {
  if (!base44Url) return null;
  
  // If already an afriscinexus URL, return as-is
  if (base44Url.includes('afriscinexus.com')) {
    return base44Url;
  }
  
  // If it's a base44 media URL, keep the file path
  if (base44Url.includes('media.base44.com')) {
    // Extract the file path from base44 URL
    const urlObj = new URL(base44Url);
    const filePath = urlObj.pathname;
    return `${AFRISCI_DOMAIN}${filePath}`;
  }
  
  // For other URLs, return as-is (could be relative paths, etc)
  return base44Url;
};

/**
 * Get article read-online URL
 */
export const getArticleReadOnlineURL = (manuscriptId, title) => {
  const slug = title 
    ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : manuscriptId;
  return `${AFRISCI_DOMAIN}/article/${slug}`;
};

/**
 * Get manuscript file download URL
 */
export const getManuscriptFileURL = (fileUrl, type = 'pdf') => {
  if (!fileUrl) return null;
  return convertToAfriSciURL(fileUrl);
};

/**
 * Get article citation URL for sharing
 */
export const getArticleCitationURL = (manuscriptId, doi) => {
  if (doi) {
    return `https://doi.org/${doi}`;
  }
  return `${AFRISCI_DOMAIN}/manuscript/${manuscriptId}`;
};

/**
 * Get journal-specific article URL
 */
export const getJournalArticleURL = (journalId, manuscriptId, title) => {
  const slug = title 
    ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : manuscriptId;
  return `${AFRISCI_DOMAIN}/journal/${journalId}/${slug}`;
};

/**
 * Format file name for download with journal branding
 */
export const formatDownloadFileName = (baseFileName, journalTitle) => {
  const cleanJournal = journalTitle 
    ? journalTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20)
    : 'afriscinexus';
  return `${baseFileName}_${cleanJournal}`.replace(/_{2,}/g, '_');
};

export default {
  getAfriSciBase,
  convertToAfriSciURL,
  getArticleReadOnlineURL,
  getManuscriptFileURL,
  getArticleCitationURL,
  getJournalArticleURL,
  formatDownloadFileName
};