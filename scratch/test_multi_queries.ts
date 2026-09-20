import { series } from '../src/data/mockSeries.ts';
import { scoreThematicItem, findMatchingThemes } from '../src/services/thematicEngine.ts';
import { rerankWithLexicalSignals } from '../src/services/semanticRanker.ts';
import { calibrateCinePulse } from '../src/lib/recommend.ts';

const queries = [
  'zaman döngüsü ve gizem',
  'mutfak restoran ve şef',
  'hacker siber dünya ve yapay zeka',
  'finans borsa ve şirket savaşları'
];

for (const q of queries) {
  console.log(`\n=== QUERY: "${q}" ===`);
  const matched = findMatchingThemes(q);
  console.log('Themes:', matched.map(m => m.themeName));
  let scored = series.map(item => ({
    ...item,
    matchScore: scoreThematicItem(q, item)
  })).sort((a, b) => b.matchScore - a.matchScore);
  scored = rerankWithLexicalSignals(q, scored);
  const calibrated = calibrateCinePulse(scored, 0);
  calibrated.slice(0, 3).forEach((item, idx) => {
    console.log(`  ${idx + 1}. [${item.matchScore}%] ${item.title}`);
  });
}
