import { memo, useEffect, useState } from 'react';
import { BookmarkPlus, Check, Clapperboard, Play, Star } from 'lucide-react';
import type { TVSeries } from '../../types';

type Props = {
  item: TVSeries;
  onOpen: (series: TVSeries) => void;
  onToggle: (series: TVSeries) => void;
  saved: boolean;
};

function excerpt(value: string, limit = 156) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= limit) return normalized;
  const cut = normalized.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 90 ? lastSpace : cut.length).trimEnd()}…`;
}

export const SeriesCard = memo(function SeriesCard({ item, onOpen, onToggle, saved }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const summary = excerpt(item.synopsis);

  useEffect(() => {
    setImageFailed(false);
  }, [item.id, item.posterUrl]);

  return <article className="series-card">
    <button className={`bookmark ${saved ? 'saved' : ''}`} aria-label={`${item.title} izleme listesi`} aria-pressed={saved} onClick={() => onToggle(item)}>
      {saved ? <Check size={16}/> : <BookmarkPlus size={16}/>}<span className="sr-only">{saved ? 'Listeden çıkar' : 'Listeye ekle'}</span>
    </button>
    <button className="card-main" onClick={() => onOpen(item)}>
      {!imageFailed && item.posterUrl
        ? <img src={item.posterUrl} alt={`${item.title} posteri`} loading="lazy" decoding="async" width="342" height="513" onError={() => setImageFailed(true)}/>
        : <div className="poster-fallback" aria-label={`${item.title} için sinematik afiş`}>
            <div className="fallback-inner">
              <Clapperboard size={28} className="fallback-icon"/>
              <span className="fallback-title">{item.title}</span>
              <span className="fallback-meta">{item.releaseYear || 'Dizi'} · {item.genres[0] || 'Arşiv'}</span>
            </div>
          </div>}
      <div className="poster-shade"/>
      <span className={`match ${item.matchScore >= 80 ? 'high' : 'mid'}`}><b>%{item.matchScore}</b> kişisel uyum</span>
      <div className="card-copy">
        <h3>{item.title}</h3>
        <p>{item.releaseYear || '—'} · {item.platforms[0] || item.genres[0] || 'Dizi'}</p>
        <div className="card-meta"><span><Star size={13} fill="currentColor"/> IMDb {item.imdbRating || '—'}</span><span>{item.status === 'Ended' ? 'Final' : 'Devam ediyor'}</span></div>
        <div className="tags">{item.genres.slice(0, 2).map(tag => <span key={tag}>#{tag}</span>)}</div>
      </div>
      <div className="card-hover"><p>{summary}</p><span><Play size={14} fill="currentColor"/> Dosyayı aç</span></div>
    </button>
  </article>;
});
