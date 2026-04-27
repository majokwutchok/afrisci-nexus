/**
 * Generates dynamic article cover images for social media sharing
 * Optimized for OG image previews (1200x630px)
 */

export const generateArticleCoverImage = (manuscript, journal) => {
  // Create canvas
  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 630;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0F172A'); // slate-900
  gradient.addColorStop(1, '#1E3A8A'); // blue-900
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Accent bar on left
  ctx.fillStyle = '#0D9488'; // teal-600
  ctx.fillRect(0, 0, 12, height);

  // Journal badge background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(40, 40, 300, 60);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, 300, 60);

  // Journal name
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.fillText(journal?.title?.substring(0, 25) || 'AfriSci Nexus', 60, 75);

  // Title text
  ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.lineWidth = 5;

  // Wrap title text to multiple lines
  const titleLines = wrapText(ctx, manuscript.title, 1100, 48);
  let yOffset = 140;
  for (let i = 0; i < Math.min(titleLines.length, 3); i++) {
    ctx.fillText(titleLines[i], 40, yOffset);
    yOffset += 60;
  }

  // Author info
  ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  const authorName = manuscript.authors?.[0]?.name?.split(' ')[0] || 'Authors';
  ctx.fillText(`by ${authorName} et al.`, 40, yOffset + 40);

  // Footer - AfriSci branding and DOI
  ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.textAlign = 'left';
  ctx.fillText('afriscinexus.com', 40, height - 30);

  // DOI badge
  if (manuscript.doi) {
    ctx.fillStyle = 'rgba(13, 148, 136, 0.9)';
    ctx.fillRect(width - 340, height - 50, 300, 40);
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'right';
    ctx.fillText(`DOI: ${manuscript.doi}`, width - 30, height - 20);
  }

  // Return canvas as data URL
  return canvas.toDataURL('image/png', 1.0);
};

/**
 * Wraps text to fit within specified width
 */
const wrapText = (ctx, text, maxWidth, fontSize) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (let word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

/**
 * Generate optimized social media metadata
 */
export const generateSocialMetadata = (manuscript, journal, coverImageUrl) => {
  return {
    // Open Graph
    'og:title': manuscript.title,
    'og:description': manuscript.abstract?.substring(0, 150) || 'Read this research article',
    'og:image': coverImageUrl,
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:type': 'article',
    'og:url': `https://afriscinexus.com/article/${manuscript.doi || manuscript.id}`,

    // Twitter
    'twitter:card': 'summary_large_image',
    'twitter:title': manuscript.title,
    'twitter:description': manuscript.abstract?.substring(0, 150) || 'Read this research article',
    'twitter:image': coverImageUrl,
    'twitter:creator': '@AfriSciNexus',

    // Article metadata
    'article:published_time': manuscript.publication_date,
    'article:author': manuscript.authors?.map(a => a.name).join(', ') || 'Authors',
    'article:section': journal?.category || 'Research'
  };
};

export default {
  generateArticleCoverImage,
  generateSocialMetadata
};