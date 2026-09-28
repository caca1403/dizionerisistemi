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
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const pages = Math.min(500, Math.max(1, Math.ceil(total / 20)));
  const hasMore = page < pages - 1;

  // Render all items without slicing so infinite scrolling never erases previous entries
  const renderedItems = items;

  const requestMore = useCallback(() => {
    if (loading || !hasMore) return;
    onPage(page + 1);
  }, [hasMore, loading, onPage, page]);

  useEffect(() => {
    if (loading || !hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // Arşiv belge akışının parçası; pencerenin kendi içinde ayrı bir scroll alanı
    // oluşturmak Lenis ve IntersectionObserver'ı birbirinden koparıyordu.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          requestMore();
        }
      },
      { root: null, rootMargin: '500px 0px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, requestMore]);

  return <section className="showcase" id="all-series-archive">
    <div className="section-heading archive-heading">
      <div>
        <p className="eyebrow"><Sparkles size={13}/> TMDB DİZİ KATALOĞU</p>
        <h2>Tüm Dizi Arşivi</h2>
        <p className="archive-subtext">Seçtiğin rota ve filtrelere göre sıralanan dizi arşivi. Aşağı indikçe devam eder.</p>
      </div>
      <div className="archive-heading-actions">
        <span className="result-count">
          {loading && !items.length ? 'Arşiv hazırlanıyor…' : `${items.length} / ${total > 0 ? total : items.length} yapım`}
        </span>
        <a href="#engine-methodology" className="archive-jump-btn" title="Sayfanın altındaki metodoloji ve sık sorulan sorulara atla">
          Alt Bölümlere İn ↓
        </a>
      </div>
    </div>
    <div className="archive-scroll-region" aria-label="Dizi arşivi">
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
