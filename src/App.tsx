import { useEffect, useMemo, useState } from 'react';
import { Compass } from 'lucide-react';
import { series } from './data/mockSeries';
import { filterSeries } from './lib/recommend';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useArchiveEngine } from './hooks/useArchiveEngine';
import type { ArchiveRankMode, CustomList, Filters, MoodTag, TasteProfile, TVSeries, WatchlistItem, WatchState } from './types';
import { Navbar } from './components/navbar/Navbar';
import { Footer } from './components/layout/Footer';
import { HeroTerminal } from './components/hero/HeroTerminal';
import { EngineStats, CapabilityBento, EngineFAQ, EngineMethodology } from './components/sections/EngineSections';
import { DiscoveryJourney } from './components/sections/DiscoveryJourney';
import { TasteGuide } from './components/onboarding/TasteGuide';
import { RecommendationEngine } from './components/discovery/RecommendationEngine';
import { RouteProfile } from './components/discovery/RouteProfile';
import { SimilarityRows } from './components/discovery/SimilarityRows';

import { SeriesDetailModal } from './components/modal/SeriesDetailModal';
import { WatchlistDrawer } from './components/watchlist/WatchlistDrawer';
import { Toast } from './components/ui/Toast';
import { SmoothScroll } from './components/ui/SmoothScroll';
import { ScrollProgress } from './components/ui/ScrollProgress';
import { CinemaWelcome } from './components/welcome/CinemaWelcome';

import { findMatchingThemes } from './services/thematicEngine';

const initialFilters: Filters = { mood: 'Tümü', genre: 'Tümü', platform: 'Tümü', minRating: 7, status: 'Tümü', pacing: [0, 100], complexity: [0, 100], query: '' };
const wordDiscoveryFilters = (value: string): Pick<Filters, 'mood' | 'genre'> => {
  const themes = findMatchingThemes(value);
  if (themes.length > 0) {
    const primary = themes[0];
    return {
      mood: (primary.targetMoods[0] as MoodTag) || 'Tümü',
      genre: (primary.targetGenres[0] as any) || 'Tümü',
    };
  }
  return { mood: 'Tümü', genre: 'Tümü' };
};

export default function App() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [searchInput, setSearchInput] = useState('');
  const [activeSeries, setActiveSeries] = useState<TVSeries | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [rankMode, setRankMode] = useState<ArchiveRankMode>('match');
  const [routeSignals, setRouteSignals] = useState<string[]>([]);
  const [routeReferences, setRouteReferences] = useState<TVSeries[]>([]);
  const [wordQuery, setWordQuery] = useState('');
  const [routePage, setRoutePage] = useState(0);
  const [wordPage, setWordPage] = useState(0);
  const [filterPage, setFilterPage] = useState(0);
  const [welcomeOpen, setWelcomeOpen] = useState(true);
  const [guideMood, setGuideMood] = useState<MoodTag | undefined>();
  const [tasteProfile, setTasteProfile] = useLocalStorage<TasteProfile | null>('sera-taste-profile-v1', null);
  const [watchlist, setWatchlist] = useLocalStorage<WatchlistItem[]>('sera-watchlist-v1', []);
  const [customLists, setCustomLists] = useLocalStorage<CustomList[]>('sera-custom-lists-v1', []);

  // Always start from top on load / refresh – clear any hash anchor first
  useEffect(() => {
    // Remove hash so browser doesn't anchor-jump after load
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    // Double-rAF ensures browser has processed layout before forcing scroll
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
    });
  }, []);

  const routeFilters = useMemo<Filters>(() => ({
    ...initialFilters,
    minRating: 6,
    referenceSignals: routeSignals.length ? routeSignals : tasteProfile?.referenceSignals,
    referenceSeries: routeReferences,
    referenceSeriesIds: routeReferences.map(r => r.id),
  }), [routeSignals, tasteProfile, routeReferences]);
  const wordFilters = useMemo<Filters>(() => ({ ...initialFilters, minRating: 5.5, semanticQuery: wordQuery, ...wordDiscoveryFilters(wordQuery) }), [wordQuery]);
  const filterFilters = useMemo<Filters>(() => ({ ...filters }), [filters]);
  const routeArchive = useArchiveEngine(routeFilters, tasteProfile, 'match', routePage, Boolean(tasteProfile));
  const wordArchive = useArchiveEngine(wordFilters, tasteProfile, 'match', wordPage, Boolean(tasteProfile && wordQuery.trim().length >= 2));
  const filterArchive = useArchiveEngine(filterFilters, tasteProfile, rankMode, filterPage, Boolean(tasteProfile));
  useEffect(() => { const timeout = window.setTimeout(() => { setFilterPage(0); setFilters(current => ({ ...current, query: searchInput.trim() })); }, 220); return () => window.clearTimeout(timeout); }, [searchInput]);
  useEffect(() => { if (!toast) return; const timeout = window.setTimeout(() => setToast(null), 3000); return () => window.clearTimeout(timeout); }, [toast]);
  const mergeRanked = (primary: TVSeries[], fallback: TVSeries[]) => {
    const map = new Map<string, TVSeries>();
    for (const item of fallback) map.set(item.id, item);
    for (const item of primary) map.set(item.id, item);
    return Array.from(map.values()).sort((left, right) => right.matchScore - left.matchScore);
  };
  const routeResults = useMemo(() => {
    if (!tasteProfile) return [];
    if (routeReferences.length > 0) {
      return routeArchive.results;
    }
    return mergeRanked(routeArchive.results, filterSeries(series, routeFilters, tasteProfile));
  }, [routeArchive.results, routeFilters, tasteProfile, routeReferences]);
  const wordResults = useMemo(() => wordQuery.trim().length >= 2 ? wordArchive.results : [], [wordArchive.results, wordQuery]);
  const filterResults = useMemo(() => {
    if (!tasteProfile) return [];
    const remote = filterArchive.results;
    const local = filterSeries(series, filterFilters, tasteProfile);
    const seen = new Set<string>();
    const list: TVSeries[] = [];
    if (filterPage === 0 && local.length > 0) {
      for (const item of local) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          list.push(item);
        }
      }
    }
    for (const item of remote) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        list.push(item);
      }
    }
    return list;
  }, [filterArchive.results, filterFilters, tasteProfile, filterPage]);
  const spotlight = useMemo(() => { const visualArchive = filterArchive.results.filter(item => item.posterUrl && item.backdropUrl); if (!visualArchive.length) return series.find(item => item.id === 'ted-lasso') ?? series[0]; const day = Math.floor(Date.now() / 86_400_000); return visualArchive[day % visualArchive.length]; }, [filterArchive.results]);
  const archivePool = useMemo(() => [...series, ...routeArchive.results, ...wordArchive.results, ...filterArchive.results], [routeArchive.results, wordArchive.results, filterArchive.results]);
  const savedIds = useMemo(() => new Set(watchlist.map(item => item.seriesId)), [watchlist]);
  const watchStates = useMemo(() => new Map(watchlist.map(item => [item.seriesId, item.state])), [watchlist]);
  const savedSeries = useMemo(() => watchlist.map(item => ({ item, series: archivePool.find(show => show.id === item.seriesId) })).filter((value): value is { item: WatchlistItem; series: TVSeries } => Boolean(value.series)), [watchlist, archivePool]);
  const personalHistory = useMemo(() => savedSeries.map(({ item, series: show }) => ({ series: show, state: item.state })), [savedSeries]);
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const startGuide = () => scrollTo(tasteProfile ? 'recommendation-engine' : 'taste-guide');
  const updateWatchState = (show: TVSeries, state: WatchState = 'plan') => { setWatchlist(current => { const existing = current.find(item => item.seriesId === show.id); return existing ? current.map(item => item.seriesId === show.id ? { ...item, state } : item) : [...current, { seriesId: show.id, state, episode: 0 }]; }); setToast('İzleme durumun SÉRA profiline kaydedildi.'); };
  const toggleWatchlist = (show: TVSeries) => setWatchlist(current => current.some(item => item.seriesId === show.id) ? current.filter(item => item.seriesId !== show.id) : [...current, { seriesId: show.id, state: 'plan', episode: 0 }]);
  const createList = (name: string) => { setCustomLists(current => [...current, { id: `list-${Date.now().toString(36)}`, name, items: [], createdAt: Date.now() }]); setToast(`“${name}” listesi oluşturuldu.`); };
  const addToList = (listId: string, show: TVSeries) => { setCustomLists(current => current.map(list => list.id === listId ? { ...list, items: (list.items || []).some(item => item.id === show.id) ? (list.items || []) : [...(list.items || []), show] } : list)); setToast('Yapım seçtiğin listeye eklendi.'); };
  const chooseMood = (mood: MoodTag) => { if (!tasteProfile) { setGuideMood(mood); startGuide(); return; } setFilterPage(0); setFilters(current => ({ ...current, mood })); scrollTo('filter-results'); };
  const completeGuide = (profile: TasteProfile) => { setTasteProfile(profile); setFilters(current => ({ ...initialFilters, query: current.query })); window.setTimeout(() => scrollTo('recommendation-engine'), 0); };
  const chooseRandom = () => { if (!tasteProfile) { startGuide(); return; } const pool = routeResults.length ? routeResults : series; setActiveSeries(pool[Math.floor(Math.random() * pool.length)]); };
  return <SmoothScroll>{welcomeOpen && <CinemaWelcome onEnter={() => setWelcomeOpen(false)}/>}<div id="top" className="app-shell">
    <ScrollProgress/>
    <Navbar onStart={startGuide} onRandom={chooseRandom} onWatchlist={() => setDrawerOpen(true)} savedCount={watchlist.length} onOpenSeries={setActiveSeries} onSearch={query => { setSearchInput(query); setFilterPage(0); setFilters(current => ({ ...current, query, referenceSignals: undefined })); }}/>
    <main>
      <HeroTerminal spotlight={spotlight} searchItems={[...filterArchive.results, ...series]} query={searchInput} setQuery={setSearchInput} mood={filters.mood} onMood={chooseMood} onStart={startGuide} onOpenDossier={setActiveSeries}/>
      {tasteProfile && <><EngineStats/><DiscoveryJourney/><CapabilityBento/></>}
      <div className="page-shell vertical-journey">
        {!tasteProfile ? <TasteGuide onComplete={completeGuide} initialMood={guideMood}/> : <RouteProfile profile={tasteProfile} items={[...series, ...filterArchive.results]} watchStates={watchStates} onWatchState={updateWatchState} onUpdate={setTasteProfile} onReset={() => setTasteProfile(null)} onExplore={() => scrollTo('recommendation-engine')}/>} 

        {tasteProfile ? <><RecommendationEngine filters={filters} setFilters={setFilters} routeItems={routeResults} routeLoading={routeArchive.isLoading} routeTotal={routeArchive.matchTotal} routePage={routePage} onRoutePage={setRoutePage} wordItems={wordResults} wordLoading={wordArchive.isLoading} wordTotal={wordArchive.matchTotal} wordPage={wordPage} onWordPage={setWordPage} filterItems={filterResults} filterLoading={filterArchive.isLoading} filterTotal={filterArchive.matchTotal} filterPage={filterPage} onFilterPage={setFilterPage} rankMode={rankMode} onRankMode={mode => { setFilterPage(0); setRankMode(mode); }} onQuery={(query, referenceSignals, stream, referenceSeries) => { if (stream === 'route') { setRouteSignals(referenceSignals || []); setRouteReferences(referenceSeries || []); setRoutePage(0); } else if (stream === 'word') { setWordQuery(query); setWordPage(0); } else { setFilterPage(0); setFilters(current => ({ ...current, query })); } }} onToast={message => setToast(message)} onOpen={setActiveSeries} onToggle={toggleWatchlist} savedIds={savedIds}/><SimilarityRows all={archivePool} profile={tasteProfile} history={personalHistory} onOpen={setActiveSeries}/></> : <section id="recommendation-engine" className="archive-route-lock"><Compass size={28}/><p className="eyebrow">KİŞİSEL ARŞİV KİLİDİ</p><h2>Arşivi açmak için rotanı tamamla.</h2><p>Sİralama ve filtreler, beş rota cevabın tamamlanmadan rastgele bir profil üretmez.</p><div className="archive-lock-preview"><img src={spotlight.posterUrl} alt=""/><span><b>{spotlight.title}</b><small>{spotlight.genres.slice(0,2).join(' · ')} · rota tamamlanınca kişisel puanlanacak</small></span></div><button type="button" onClick={() => scrollTo('taste-guide')}>Rotaya dön</button></section>}
      </div>
      {tasteProfile && <><EngineMethodology/><EngineFAQ/></>}
    </main>
    <Footer/>
    <SeriesDetailModal series={activeSeries} candidates={archivePool} profile={tasteProfile} history={personalHistory} open={Boolean(activeSeries)} onOpenChange={open => !open && setActiveSeries(null)} onOpenSeries={setActiveSeries} isSaved={activeSeries ? savedIds.has(activeSeries.id) : false} onWatchStateChange={updateWatchState} onToast={setToast} customLists={customLists} onAddToList={addToList}/>
    <WatchlistDrawer open={drawerOpen} onOpenChange={setDrawerOpen} items={savedSeries} lists={customLists} onCreateList={createList} onDeleteList={id => setCustomLists(current => current.filter(list => list.id !== id))} onRemoveFromList={(listId, seriesId) => setCustomLists(current => current.map(list => list.id === listId ? { ...list, items: (list.items || []).filter(item => item.id !== seriesId) } : list))} onStateChange={(seriesId, state) => setWatchlist(current => current.map(item => item.seriesId === seriesId ? { ...item, state } : item))} onRemove={seriesId => setWatchlist(current => current.filter(item => item.seriesId !== seriesId))} onOpenSeries={show => { setDrawerOpen(false); setActiveSeries(show); }} onImport={({ watchlist: wl }) => { setWatchlist(wl); setToast('Arşiv başarıyla içe aktarıldı!'); }}/>
    <Toast message={toast}/>
  </div></SmoothScroll>;
}
