import { findMatchingThemes, scoreThematicItem } from '../src/services/thematicEngine.js';
import { series } from '../src/data/mockSeries.js';
import { calibrateCinePulse } from '../src/lib/recommend.js';
import { rerankWithLexicalSignals } from '../src/services/semanticRanker.js';

console.log('Testing "uyuşturucu imparatorluğu":');
const query = 'uyuşturucu imparatorluğu';
const themes = findMatchingThemes(query);
console.log('Matched Themes:', themes.map(t => t.themeName));

let scored = series.map(item => ({
  ...item,
  matchScore: scoreThematicItem(query, item)
})).sort((a, b) => b.matchScore - a.matchScore);

scored = rerankWithLexicalSignals(query, scored);
const calibrated = calibrateCinePulse(scored, 0);

console.log('\nTop 8 Ranked Series:');
calibrated.slice(0, 8).forEach((item, index) => {
  console.log(`${index + 1}. [${item.matchScore}%] ${item.title} (IMDb: ${item.imdbRating}) - Genres: ${item.genres.join(', ')}`);
});
