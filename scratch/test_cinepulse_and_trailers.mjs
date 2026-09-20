// Pure JS test verifying YouTube parsing and Cine Pulse calibration logic

function extractYouTubeKey(url) {
  if (!url) return null;
  const embedMatch = /\/embed\/([a-zA-Z0-9_-]{11})/.exec(url);
  if (embedMatch) return embedMatch[1];
  const watchMatch = /[?&]v=([a-zA-Z0-9_-]{11})/.exec(url);
  if (watchMatch) return watchMatch[1];
  const shortMatch = /youtu\.be\/([a-zA-Z0-9_-]{11})/.exec(url);
  if (shortMatch) return shortMatch[1];
  const vMatch = /\/v\/([a-zA-Z0-9_-]{11})/.exec(url);
  if (vMatch) return vMatch[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
    return url.trim();
  }
  return null;
}

function getYouTubeEmbedUrl(urlOrKey) {
  const key = extractYouTubeKey(urlOrKey);
  if (!key) return null;
  return `https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
}

function getYouTubeWatchUrl(urlOrKey, fallbackTitle) {
  const key = extractYouTubeKey(urlOrKey);
  if (key) {
    return `https://www.youtube.com/watch?v=${key}`;
  }
  const query = fallbackTitle ? `${fallbackTitle} dizi resmi fragman official trailer` : 'official trailer dizi';
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function calibrateCinePulse(items, page = 0) {
  return items.map((item, index) => {
    const rank = page * 20 + index;
    let baseScore;

    if (rank === 0) baseScore = 99;
    else if (rank === 1) baseScore = 99;
    else if (rank === 2) baseScore = 98;
    else if (rank === 3) baseScore = 97;
    else if (rank === 4) baseScore = 95;
    else if (rank === 5) baseScore = 91;
    else if (rank === 6) baseScore = 88;
    else if (rank === 7) baseScore = 85;
    else if (rank === 8) baseScore = 82;
    else if (rank === 9) baseScore = 78;
    else if (rank === 10) baseScore = 74;
    else if (rank === 11) baseScore = 71;
    else if (rank === 12) baseScore = 68;
    else if (rank === 13) baseScore = 65;
    else if (rank === 14) baseScore = 62;
    else if (rank <= 20) baseScore = Math.max(52, 60 - (rank - 15) * 1.5);
    else if (rank <= 35) baseScore = Math.max(42, 51 - (rank - 21) * 0.7);
    else baseScore = Math.max(38, 41 - (rank - 36) * 0.3);

    const ratingNudge = item.imdbRating >= 8.8 ? 1 : item.imdbRating < 7.0 ? -1 : 0;
    const maxAllowed = rank <= 1 ? 99 : rank === 2 ? 98 : rank === 3 ? 97 : rank === 4 ? 95 : rank === 5 ? 91 : rank === 6 ? 88 : rank === 7 ? 85 : 82;
    const finalScore = Math.min(maxAllowed, Math.max(38, Math.round(baseScore + ratingNudge)));

    return {
      ...item,
      matchScore: finalScore,
    };
  });
}

console.log('--- 1. Testing YouTube Extraction ---');
const testCases = [
  { in: 'https://www.youtube-nocookie.com/embed/ESEUoa-mz2c?autoplay=1&rel=0', expected: 'ESEUoa-mz2c' },
  { in: 'https://www.youtube.com/watch?v=xEQP4VVuyrY', expected: 'xEQP4VVuyrY' },
  { in: 'https://youtu.be/N6HGuJC--rk', expected: 'N6HGuJC--rk' },
  { in: 'BwPcMIDFVKw', expected: 'BwPcMIDFVKw' },
  { in: 'https://www.youtube.com/results?search_query=test', expected: null },
];

for (const tc of testCases) {
  const extracted = extractYouTubeKey(tc.in);
  if (extracted !== tc.expected) {
    console.error(`FAIL: ${tc.in} -> got ${extracted}, expected ${tc.expected}`);
    process.exit(1);
  }
  console.log(`PASS: ${tc.in} -> ${extracted}`);
}

console.log('\n--- 2. Testing Watch and Embed URLs ---');
const embed = getYouTubeEmbedUrl('https://www.youtube.com/watch?v=ZO-XX1UpsqY');
const watch = getYouTubeWatchUrl('https://www.youtube-nocookie.com/embed/ZO-XX1UpsqY?autoplay=1');
console.log('Embed URL:', embed);
console.log('Watch URL:', watch);
if (!embed.includes('/embed/ZO-XX1UpsqY') || !watch.includes('watch?v=ZO-XX1UpsqY')) {
  console.error('FAIL on embed or watch URL format!');
  process.exit(1);
}

console.log('\n--- 3. Testing Cine Pulse Match Scores Distribution ---');
const dummyItems = Array.from({ length: 25 }, (_, i) => ({
  id: `test-${i}`,
  title: `Dizi ${i}`,
  imdbRating: 8.5,
}));

const result = calibrateCinePulse(dummyItems, 0);
result.forEach((item, idx) => {
  console.log(`Rank ${idx.toString().padStart(2, ' ')}: %${item.matchScore} (${item.title})`);
});

const topTierItems = result.filter(item => item.matchScore >= 95);
console.log(`\nItems with matchScore >= 95%: ${topTierItems.length}`);
if (topTierItems.length > 5) {
  console.error(`FAIL: Found ${topTierItems.length} items >= 95%! Expected at most 5.`);
  process.exit(1);
}

const rank4 = result[4].matchScore;
const rank5 = result[5].matchScore;
console.log(`Rank 4: %${rank4}, Rank 5: %${rank5}. Gap: ${rank4 - rank5}%`);
if (rank5 > 91) {
  console.error(`FAIL: Rank 5 is too high: %${rank5}`);
  process.exit(1);
}
if (rank4 - rank5 < 3) {
  console.error(`FAIL: Gap between rank 4 and 5 is too small!`);
  process.exit(1);
}

console.log('\n=== ALL CINE PULSE & YOUTUBE UNIT CHECKS PASSED SUCCESSFULLY ===');
