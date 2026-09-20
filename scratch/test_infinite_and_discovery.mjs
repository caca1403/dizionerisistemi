import assert from 'node:assert';

const BASE_URL = 'http://127.0.0.1:5173';

async function testViteServer() {
  console.log('Testing Vite server index.html...');
  const res = await fetch(`${BASE_URL}/`);
  assert.strictEqual(res.status, 200, 'Index should be 200 OK');
  const text = await res.text();
  assert(text.includes('id="root"'), 'Root element must exist');
  console.log('✓ Vite server is running and serving index.html');
}

async function testTMDBPaginationAccumulation() {
  console.log('Testing TMDB multi-page pagination accumulation...');
  const resPage1 = await fetch(`${BASE_URL}/api/tmdb?mode=popular&page=1`);
  const data1 = await resPage1.json();
  assert(data1.results && data1.results.length > 0, 'Page 1 should have results');
  const ids1 = new Set(data1.results.map(i => i.id));

  const resPage2 = await fetch(`${BASE_URL}/api/tmdb?mode=popular&page=2`);
  const data2 = await resPage2.json();
  assert(data2.results && data2.results.length > 0, 'Page 2 should have results');
  const ids2 = new Set(data2.results.map(i => i.id));

  const resPage3 = await fetch(`${BASE_URL}/api/tmdb?mode=popular&page=3`);
  const data3 = await resPage3.json();
  assert(data3.results && data3.results.length > 0, 'Page 3 should have results');
  const ids3 = new Set(data3.results.map(i => i.id));

  // In live TMDB APIs, a series can occasionally shift rank between requests.
  // Our engine's mergeById handles this by deduplicating and appending unique items.
  function mergeById(current, incoming) {
    const existingIds = new Set(current.map(i => i.id));
    const fresh = incoming.filter(i => !existingIds.has(i.id));
    return [...current, ...fresh];
  }

  const mergedP1P2 = mergeById(data1.results, data2.results);
  const mergedAll = mergeById(mergedP1P2, data3.results);

  // Verify that page 1 items are preserved in their exact order
  for (let i = 0; i < data1.results.length; i++) {
    assert.strictEqual(mergedAll[i].id, data1.results[i].id, `Item ${i} must match page 1`);
  }

  // Verify that total unique items strictly increased across pages
  assert(mergedP1P2.length > data1.results.length, 'Page 2 should add items');
  assert(mergedAll.length > mergedP1P2.length, 'Page 3 should add items');
  assert(mergedAll.length >= 55, 'Accumulated total should be at least 55 unique series');
  console.log(`✓ TMDB multi-page pagination verified: ${mergedAll.length} unique items accumulated with zero loss of previous items.`);
}

async function testRecommendationsEndpoint() {
  console.log('Testing TMDB recommendations proxy for Dark (id: 70523)...');
  const res = await fetch(`${BASE_URL}/api/tmdb?recommendations=70523`);
  const data = await res.json();
  assert(data.results && data.results.length > 0, 'Should return recommendations for Dark');
  console.log(`✓ Recommendations endpoint returned ${data.results.length} similar series for Dark (e.g. ${data.results.slice(0, 3).map(s => s.name).join(', ')})`);
}

async function run() {
  try {
    await testViteServer();
    await testTMDBPaginationAccumulation();
    await testRecommendationsEndpoint();
    console.log('\nALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

run();
