import { Compass, Dice5, Heart, Network, Search, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { TVSeries } from '../../types';
import { searchLiveTMDB } from '../../services/tmdbLive';

type Props = {
  onStart: () => void;
  onRandom: () => void;
  onWatchlist: () => void;
  savedCount: number;
  onOpenSeries: (series: TVSeries) => void;
  onSearch: (query: string) => void;
};

export function Navbar({ onStart, onRandom, onWatchlist, savedCount, onOpenSeries, onSearch }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TVSeries[]>([]);
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(() => { void searchLiveTMDB(query, controller.signal).then(items => { setResults(items); setOpen(true); }).catch(() => undefined); }, 260);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [query]);
  const select = (series: TVSeries) => { setQuery(series.title); setOpen(false); onSearch(series.title); onOpenSeries(series); };
  return <header className="engine-navbar">
    <nav className="engine-nav page-shell" aria-label="Ana menü">
      <a href="#top" className="engine-brand" aria-label="SÉRA ana sayfa"><span className="engine-logo"><Network size={17}/><i/><i/><i/></span><b>SÉRA</b><em>ENGINE</em></a>
      <div className="engine-nav-links">
        <a href="#motor">Öneri Motoru</a><a href="#duygu">Duygu Matrisi</a><a href="#postercnn">Poster Profili</a><a href="#yapim-dosyasi">Yapım Dosyası</a><a href="#nasil-calisir">Metodoloji</a>
      </div>
      <div className="engine-live-search"><Search size={15}/><input ref={input} value={query} onChange={event => { setQuery(event.target.value); setOpen(true); }} onFocus={() => setOpen(Boolean(query))} placeholder="TMDB'de ara" aria-label="TMDB'de dizi ara"/>{query && <button type="button" aria-label="Aramayı temizle" onClick={() => { setQuery(''); setOpen(false); }}><X size={13}/></button>}{open && results.length > 0 && <div className="engine-search-results" role="listbox">{results.map(series => <button type="button" role="option" key={series.id} onMouseDown={event => event.preventDefault()} onClick={() => select(series)}><img src={series.posterUrl} alt=""/><span><b>{series.title}</b><small>{series.releaseYear || 'Yakında'} · {series.imdbRating ? series.imdbRating.toFixed(1) : 'TMDB'}</small></span></button>)}</div>}</div>
      <div className="engine-nav-actions">
        <button type="button" className="engine-random" onClick={onRandom}><Dice5 size={16}/> <span>Rastgele</span></button>
        <button type="button" className="engine-watchlist" onClick={onWatchlist} aria-label="İzleme listesini aç"><Heart size={17}/>{savedCount > 0 && <i>{savedCount}</i>}</button>
        <button type="button" className="engine-nav-cta" onClick={onStart}><Sparkles size={15}/> Öneri Başlat</button>
        <button type="button" className="engine-mobile-search" aria-label="Arama alanını aç" onClick={() => input.current?.focus()}><Search size={17}/></button>
        <a className="engine-menu" href="#discover" aria-label="Keşif rotalarına git"><Compass size={17}/><span>Rotalar</span></a>
      </div>
    </nav>
  </header>;
}
