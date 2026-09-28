import { memo, useCallback, useEffect, useRef } from 'react';
import { Loader2, Plus, Sparkles } from 'lucide-react';
import type { TVSeries } from '../../types';
import { SeriesCard } from './SeriesCard';

type Props = {
  items: TVSeries[];
  loading: boolean;
  total: number;
  page: number;
  onPage: (page: number) => void;
  onOpen: (series: TVSeries) => void;
  onToggle: (series: TVSeries) => void;
  savedIds: Set<string>;
};

const ArchiveCard = memo(function ArchiveCard({ item, saved, onOpen, onToggle }: {
  item: TVSeries;
  saved: boolean;
  onOpen: (series: TVSeries) => void;
  onToggle: (series: TVSeries) => void;
}) {
  return <div className="archive-card-slot"><SeriesCard item={item} onOpen={onOpen} onToggle={onToggle} saved={saved}/></div>;
});

export function SeriesGrid({ items, loading, total, page, onPage, onOpen, onToggle, savedIds }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const pages = Math.max(1, Math.ceil(total / 20));
  const hasMore = page < pages - 1;

  const renderedItems = items;

  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;

  const pageRef = useRef(page);
  pageRef.current = page;

  const onPageRef = useRef(onPage);
  onPageRef.current = onPage;

  const lastTriggerTime = useRef(0);

  const requestMore = useCallback(() => {
    const now = Date.now();
    if (loadingRef.current || !hasMoreRef.current) return;
    if (now - lastTriggerTime.current < 600) return;
    lastTriggerTime.current = now;
    onPageRef.current(pageRef.current + 1);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scrollRegion = scrollRef.current;
    if (!sentinel || !scrollRegion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !loadingRef.current && hasMoreRef.current) {
          requestMore();
        }
      },
      { root: scrollRegion, rootMargin: '100px 0px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [requestMore]);

  return <section className="showcase" id="all-series-archive">
    <div className="section-heading archive-heading">
      <div>
        <p className="eyebrow"><Sparkles size={13}/> TMDB DİZİ KATALOĞU</p>
        <h2>Tüm Dizi Arşivi</h2>
        <p className="archive-subtext">Seçtiğin rota ve filtrelere göre sıralanan dizi arşivi. Aşağı indikçe devam eder.</p>
      </div>
      <div className="archive-heading-actions">
        <span className="result-count">
          {loading && !items.length
            ? 'Arşiv taranıyor…'
            : total >= 300
              ? `${items.length} / 50.000+ yapım listelendi`
              : total > 0
                ? `${items.length} / ${total.toLocaleString('tr-TR')} yapım listelendi`
                : `${items.length} yapım listelendi`}
        </span>
      </div>
    </div>
    <div ref={scrollRef} className="archive-scroll-region" aria-label="Dizi arşivi" tabIndex={0} data-lenis-prevent>
      <div className="series-grid" aria-busy={loading}>
        {loading && !items.length
          ? Array.from({ length: 12 }, (_, index) => <div className="skeleton-card" key={index}/>)
          : renderedItems.map(item => <ArchiveCard key={item.id} item={item} saved={savedIds.has(item.id)} onOpen={onOpen} onToggle={onToggle}/>)}
      </div>
      {items.length > 0 ? (
        <div ref={sentinelRef} className="archive-endcap" aria-live="polite">
          {loading ? (
            <div className="archive-loading-state">
              <Loader2 size={16} className="animate-spin"/> <span>Sonraki yapımlar ekleniyor…</span>
            </div>
          ) : hasMore ? (
            <div className="archive-load-more-container">
              <p>Akışın sonuna yaklaştığında yapımlar otomatik eklenir.</p>
              <button type="button" className="archive-manual-more-btn" onClick={requestMore}>
                <Plus size={15}/> Daha Fazla Dizi Yükle (+20)
              </button>
            </div>
          ) : (
            <div className="archive-end-message">
              ✦ Bu seçkinin tümüne ulaştın ({items.length} yapım listelendi).
            </div>
          )}
        </div>
      ) : null}
    </div>
    {!loading && !items.length ? <div className="empty-state">Bu filtrelerin kesişiminde yapım bulunamadı. Puan veya tür sınırını gevşetebilirsin.</div> : null}
  </section>;
}
