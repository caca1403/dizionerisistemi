import * as Dialog from '@radix-ui/react-dialog';
import { ChevronRight, Cpu, FolderPlus, X } from 'lucide-react';
import { useEffect, useRef, useState, type WheelEvent } from 'react';
import type { CustomList, TasteProfile, TVSeries, WatchState } from '../../types';
import { getTMDBDetails } from '../../services/tmdbLive';
import { SeraSeriesDossier, type DossierStatus } from '../dossier/SeraSeriesDossier';
import { calibrateCinePulse } from '../../lib/recommend';
import { TrailerModal } from './TrailerModal';

type Props = {
  series: TVSeries | null;
  candidates: TVSeries[];
  profile: TasteProfile | null;
  history: Array<{ series: TVSeries; state: WatchState }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSeries: (series: TVSeries) => void;
  isSaved: boolean;
  onWatchStateChange: (series: TVSeries, state?: WatchState) => void;
  onToast: (message: string) => void;
  customLists: CustomList[];
  onAddToList: (listId: string, series: TVSeries) => void;
};

const localToWatch: Record<DossierStatus, WatchState> = {
  plan_to_watch: 'plan',
  watching: 'watching',
  completed: 'completed',
};

function computeInstantSimilarSeries(
  target: TVSeries,
  pool: TVSeries[],
  profile: TasteProfile | null,
  history: Array<{ series: TVSeries; state: WatchState }>
): TVSeries[] {
  const explicitIds = new Set(target.similarSeriesIds || []);
  const baseGenres = new Set(target.genres);
  const baseMoods = new Set(target.moodTags);
  const likedGenres = new Set<string>();

  // Collect genres from watch history
  history.forEach(h => {
    if (h.state === 'completed' || h.state === 'watching') {
      h.series.genres.forEach((g: string) => likedGenres.add(g));
    }
  });

  const scored = pool
    .filter(candidate => candidate.id !== target.id)
    .map(candidate => {
      let score = 50;
      if (explicitIds.has(candidate.id)) {
        score += 38;
      }
      const commonGenres = candidate.genres.filter((g: string) => baseGenres.has(g));
      score += commonGenres.length * 10;

      const commonMoods = candidate.moodTags.filter((m) => baseMoods.has(m as string as any));
      score += commonMoods.length * 8;

      // Use available EmotionProfile fields: mystery, psychological, pacing, humor, complexity
      if (target.emotionProfile && candidate.emotionProfile) {
        const ep1 = target.emotionProfile;
        const ep2 = candidate.emotionProfile;
        const diff = Math.abs(ep1.mystery - ep2.mystery) +
                     Math.abs(ep1.psychological - ep2.psychological) +
                     Math.abs(ep1.pacing - ep2.pacing) +
                     Math.abs(ep1.complexity - ep2.complexity);
        score += Math.max(0, 18 - (diff / 22));
      }

      const userGenreMatch = candidate.genres.filter((g: string) => likedGenres.has(g)).length;
      score += userGenreMatch * 3;

      if (candidate.imdbRating) {
        score += (candidate.imdbRating - 7) * 2;
      }

      return {
        candidate,
        rawScore: score,
        hasShared: commonGenres.length > 0 || commonMoods.length > 0 || explicitIds.has(candidate.id)
      };
    })
    .filter(item => item.hasShared)
    .sort((a, b) => b.rawScore - a.rawScore)
    .slice(0, 6)
    .map((item, idx) => ({
      ...item.candidate,
      matchScore: Math.min(97, Math.max(68, Math.round(95 - idx * 3.8)))
    }));

  return calibrateCinePulse(scored, 0);
}

export function SeriesDetailModal({
  series,
  candidates,
  profile,
  history,
  open,
  onOpenChange,
  onOpenSeries,
  isSaved,
  onWatchStateChange,
  onToast,
  customLists,
  onAddToList,
}: Props) {
  const [dossier, setDossier] = useState<TVSeries | null>(series);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [similar, setSimilar] = useState<TVSeries[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = '';
      document.documentElement.style.overscrollBehavior = '';
      window.dispatchEvent(new CustomEvent('sera-overlay-scroll-lock', { detail: false }));
      return;
    }
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    window.dispatchEvent(new CustomEvent('sera-overlay-scroll-lock', { detail: true }));
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overscrollBehavior = '';
      window.dispatchEvent(new CustomEvent('sera-overlay-scroll-lock', { detail: false }));
    };
  }, [open]);

  const activeSeries = dossier?.id === series?.id ? dossier : series;

  // Immediate similarity calculation on open (0 ms)
  useEffect(() => {
    setDossier(series);
    setTrailerOpen(false);
    scrollRef.current?.scrollTo({ top: 0 });

    if (!open || !series) {
      setSimilar([]);
      return;
    }

    // Instant local calculation: NO SPINNER DELAY
    const instant = computeInstantSimilarSeries(series, candidates, profile, history);
    setSimilar(instant);

    const controller = new AbortController();
    // Background TMDB enrich with fast abort
    getTMDBDetails(series, controller.signal).then(next => {
      if (!controller.signal.aborted) setDossier(next);
    }).catch(() => undefined);

    return () => controller.abort();
  }, [open, series, candidates, profile, history]);

  if (!series || !activeSeries) return null;

  const share = async () => {
    try {
      const data = { title:`SÉRA · ${activeSeries.title}`, text:`${activeSeries.title} için SÉRA yapım dosyası`, url:window.location.href };
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard?.writeText(window.location.href); onToast('Bağlantı panoya kopyalandı.'); }
    } catch { /* Paylaşım iptal edilebilir. */ }
  };

  const stopWheelPropagation = (event: WheelEvent<HTMLDivElement>) => event.stopPropagation();

  return <>
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="sera-dialog-overlay"/>
        <Dialog.Content className="series-detail-modal" aria-describedby="series-detail-summary">
          <div className="detail-backdrop" style={{ backgroundImage:`url(${activeSeries.backdropUrl})` }} aria-hidden="true"/>
          <div className="detail-vignette" aria-hidden="true"/>
          <Dialog.Close className="detail-close" aria-label="Detay penceresini kapat"><X size={19}/></Dialog.Close>
          <div ref={scrollRef} className="detail-scroll" data-lenis-prevent data-lenis-prevent-wheel onWheelCapture={stopWheelPropagation} onTouchMove={event => event.stopPropagation()}>
            <Dialog.Title className="sr-only">{activeSeries.title} yapım dosyası</Dialog.Title>
            <SeraSeriesDossier
              title={activeSeries.title}
              originalTitle={activeSeries.originalTitle}
              year={activeSeries.releaseYear}
              rating={activeSeries.imdbRating}
              genres={activeSeries.genres}
              seasons={activeSeries.seasonsCount}
              episodes={activeSeries.totalEpisodes}
              streamingPlatform={{ name:activeSeries.platforms.join(' · ') || 'Türkiye’de yayın bilgisi yok', url:activeSeries.deepLinkUrl }}
              synopsis={activeSeries.synopsis}
              whyItFits={activeSeries.aiRecommendationReason}
              matchScore={activeSeries.matchScore}
              cast={activeSeries.cast}
              backdropUrl={activeSeries.backdropUrl}
              onPlayTrailer={() => setTrailerOpen(true)}
              onStatusChange={state => { onWatchStateChange(activeSeries, localToWatch[state]); onToast('İzleme durumun kişisel modele eklendi.'); }}
              onFeedback={type => onToast(type === 'like' ? 'Beğenin kişisel sıralamaya eklendi.' : 'Bu yapımın ağırlığı azaltıldı.')}
              onShare={share}
              isSaved={isSaved}
            />

            <section className="detail-similar" aria-labelledby="detail-similar-title">
              <header><div><p className="eyebrow"><Cpu size={13}/> KİŞİSEL BENZERLİK</p><h3 id="detail-similar-title">Bu dosyanın izlerini taşıyanlar.</h3></div><small>Duygu, tür ve anlatı DNA eşleşmesi</small></header>
              {similar.length > 0 ? (
                <div className="detail-similar-grid">
                  {similar.map(item => (
                    <button key={item.id} onClick={() => onOpenSeries(item)}>
                      <img src={item.posterUrl} alt="" loading="lazy"/>
                      <span>
                        <b>{item.title}</b>
                        <small>%{item.matchScore} · {item.genres.slice(0, 2).join(' / ')}</small>
                      </span>
                      <ChevronRight size={15}/>
                    </button>
                  ))}
                </div>
              ) : null}
            </section>

            {customLists.length ? <div className="detail-collections"><FolderPlus size={15}/><span>Listeye ekle</span>{customLists.map(list => <button key={list.id} onClick={() => onAddToList(list.id, activeSeries)}>{list.name}</button>)}</div> : <p className="detail-collections-empty">Arşiv panelinden isimli bir liste oluştur; sonra bu yapımı doğrudan ekleyebilirsin.</p>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    <TrailerModal series={activeSeries} open={trailerOpen} onOpenChange={setTrailerOpen}/>
  </>;
}
