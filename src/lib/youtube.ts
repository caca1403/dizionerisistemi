/**
 * YouTube trailer helper utilities.
 * Handles parsing, embed generation, and direct watch URLs for reliable trailer playback.
 */

export function extractYouTubeKey(url?: string | null): string | null {
  if (!url) return null;

  // Match /embed/VIDEO_ID
  const embedMatch = /\/embed\/([a-zA-Z0-9_-]{11})/.exec(url);
  if (embedMatch) return embedMatch[1];

  // Match watch?v=VIDEO_ID
  const watchMatch = /[?&]v=([a-zA-Z0-9_-]{11})/.exec(url);
  if (watchMatch) return watchMatch[1];

  // Match youtu.be/VIDEO_ID
  const shortMatch = /youtu\.be\/([a-zA-Z0-9_-]{11})/.exec(url);
  if (shortMatch) return shortMatch[1];

  // Match /v/VIDEO_ID
  const vMatch = /\/v\/([a-zA-Z0-9_-]{11})/.exec(url);
  if (vMatch) return vMatch[1];

  // Raw 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
    return url.trim();
  }

  return null;
}

export function getYouTubeEmbedUrl(urlOrKey?: string | null): string | null {
  const key = extractYouTubeKey(urlOrKey);
  if (!key) return null;
  return `https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
}

export function getYouTubeWatchUrl(urlOrKey?: string | null, fallbackTitle?: string): string {
  const key = extractYouTubeKey(urlOrKey);
  if (key) {
    return `https://www.youtube.com/watch?v=${key}`;
  }
  const query = fallbackTitle ? `${fallbackTitle} dizi resmi fragman official trailer` : 'official trailer dizi';
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export function getYouTubeSearchUrl(title: string, year?: number): string {
  const yearStr = year ? ` ${year}` : '';
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title}${yearStr} dizi resmi fragman official trailer`)}`;
}
