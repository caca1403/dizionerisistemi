import { useState } from 'react';
import { Bookmark, CalendarDays, Check, ChevronDown, Clapperboard, Image, Play, Share2, Sparkles, Star, ThumbsDown, ThumbsUp, Tv } from 'lucide-react';
import type { CastMember } from '../../types';
import { CastSlider } from '../cast/CastSlider';

export type DossierStatus = 'watching' | 'plan_to_watch' | 'completed';
export interface SeriesDossierProps {
  title: string;
  originalTitle?: string;
  year: number;
  rating: number;
  genres: string[];
  seasons: number;
  episodes: number;
  streamingPlatform: { name: string; url: string };
  synopsis: string;
  whyItFits: string;
  matchScore: number;
  cast: CastMember[];
  backdropUrl: string;
  onPlayTrailer: () => void;
  onStatusChange: (status: DossierStatus) => void;
  onFeedback: (type: 'like' | 'dislike') => void;
  onShare: () => void;
  isSaved: boolean;
}

const labels: Record<DossierStatus, string> = { plan_to_watch: 'İzlenecek', watching: 'İzleniyor', completed: 'Tamamlandı' };

/** Reusable visual dossier: all content actions remain controlled by the host. */
export function SeraSeriesDossier(props: SeriesDossierProps) {
  const [status, setStatus] = useState<DossierStatus>('plan_to_watch');
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const changeStatus = (next: DossierStatus) => { setStatus(next); props.onStatusChange(next); };
  const feedbackAction = (next: 'like' | 'dislike') => { const value = feedback === next ? null : next; setFeedback(value); if (value) props.onFeedback(value); };
  return <div className="sera-dossier-content">
    <figure className="sera-dossier-landscape"><img src={props.backdropUrl} alt={`${props.title} yatay afişi`}/><span/><figcaption><small>SÉRA / YATAY DOSYA</small><b>{props.title}</b></figcaption></figure>
    <header className="sera-dossier-heading">
      <div className="sera-dossier-kicker"><Sparkles size={13}/> SÉRA YAPIM DOSYASI</div>
      <div className="sera-title-row"><span className="sera-match-score"><Sparkles size={13}/> %{props.matchScore} ruh hâli uyumu</span></div>
      <div className="sera-meta-bar">
        <span><CalendarDays size={14}/>{props.year || '—'}</span><span className="sera-rating"><Star size={14} fill="currentColor"/>{props.rating || '—'} / 10</span><span><Clapperboard size={14}/>{props.genres.slice(0, 3).join(', ')}</span><span><Tv size={14}/>{props.seasons || '—'} sezon · {props.episodes || '—'} bölüm</span>
      </div>
      {props.streamingPlatform.url ? <a className="sera-stream-cta" href={props.streamingPlatform.url} target="_blank" rel="noreferrer"><small>Nereden izlenir</small><b>{props.streamingPlatform.name}</b><span>Seçenekleri gör →</span></a> : <span className="sera-stream-cta sera-stream-unavailable"><small>Nereden izlenir</small><b>Türkiye’de yayın bilgisi yok</b></span>}
    </header>
    <div className="sera-dossier-body">
      <p className="sera-synopsis">{props.synopsis}</p>
      <aside className="sera-why-card"><Sparkles size={18}/><div><b>Neden senin için uygun?</b><p>{props.whyItFits}</p></div></aside>
      <section className="sera-cast-block" aria-label="Oyuncular"><div className="sera-section-label"><span>Oyuncu kadrosu</span><small>{props.cast.length} kişi</small></div><CastSlider cast={props.cast.slice(0, 10)} /></section>
      <footer className="sera-action-toolbar">
        <button className="sera-trailer-button" onClick={props.onPlayTrailer}><Play size={16} fill="currentColor"/> Fragmanı izle</button>
        <details className="sera-status-dropdown"><summary><Bookmark size={16}/>{props.isSaved ? labels[status] : 'Listeme ekle'}<ChevronDown size={15}/></summary><div>{(Object.keys(labels) as DossierStatus[]).map(option => <button key={option} onClick={() => changeStatus(option)}><Check size={15}/>{labels[option]}</button>)}</div></details>
        <span className="sera-feedback-capsule"><button className={feedback === 'like' ? 'chosen-like' : ''} onClick={() => feedbackAction('like')} aria-label="Beğendim"><ThumbsUp size={17}/></button><button className={feedback === 'dislike' ? 'chosen-dislike' : ''} onClick={() => feedbackAction('dislike')} aria-label="Beğenmedim"><ThumbsDown size={17}/></button></span>
        <button className="sera-share-button" onClick={props.onShare} aria-label="Yapımı paylaş"><Share2 size={17}/></button>
      </footer>
    </div>
  </div>;
}
