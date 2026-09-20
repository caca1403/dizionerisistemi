import { useState, type ReactNode } from 'react';
import { BookmarkPlus, Check, ChevronUp, Eye, Loader2, Plus, Sparkles, Star, X } from 'lucide-react';
import type { TVSeries } from '../../types';

type Props = {
  id: string;
  isOpen: boolean;
  onToggleOpen: () => void;
  title: string;
  subtitle: string;
  badgeLabel?: string;
  icon: ReactNode;
  items: TVSeries[];
  loading: boolean;
  total: number;
  page: number;
  onPage: (page: number) => void;
  onOpen: (series: TVSeries) => void;
  onToggle: (series: TVSeries) => void;
  savedIds: Set<string>;
  onAddAsReference?: (series: TVSeries) => void;
  referenceIds?: Set<string>;
};

function excerpt(value: string, limit = 135) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= limit) return normalized;
  const cut = normalized.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 70 ? lastSpace : cut.length).trimEnd()}…`;
}

function PanelCard({
  item,
  onOpen,
  onToggle,
  isSaved,
  onAddAsReference,
  isReference,
}: {
  item: TVSeries;
  onOpen: (series: TVSeries) => void;
  onToggle: (series: TVSeries) => void;
  isSaved: boolean;
  onAddAsReference?: (series: TVSeries) => void;
  isReference?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const summary = excerpt(item.synopsis);

  return (
    <article className="lab-panel-card" tabIndex={0}>
      <div className="lab-panel-poster-wrap" onClick={() => onOpen(item)}>
        {!imgFailed && item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={item.title}
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="lab-panel-fallback">
            <span>{item.title.slice(0, 1)}</span>
          </div>
        )}
        <div className="lab-panel-poster-overlay" />
        <span className="lab-panel-match-badge">
          <b>%{item.matchScore}</b> Uyum
        </span>
        {item.imdbRating > 0 && (
          <span className="lab-panel-imdb-badge">
            <Star size={11} fill="currentColor" /> {item.imdbRating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="lab-panel-info">
        <h4 onClick={() => onOpen(item)} title={item.title}>
          {item.title}
        </h4>
        <div className="lab-panel-meta">
          <span>{item.releaseYear || '—'}</span>
          <span>·</span>
          <span>{item.genres[0] || 'Dizi'}</span>
          {item.status && (
            <>
              <span>·</span>
              <span className="lab-panel-status">
                {item.status === 'Ended' ? 'Final' : 'Devam'}
              </span>
            </>
          )}
        </div>
        <p className="lab-panel-summary">{summary}</p>

        <div className="lab-panel-actions">
          <button
            type="button"
            className="lab-panel-btn-detail"
            onClick={() => onOpen(item)}
            title="Dizi detaylarını aç"
          >
            <Eye size={13} /> İncele
          </button>
          <button
            type="button"
            className={`lab-panel-btn-save ${isSaved ? 'saved' : ''}`}
            onClick={() => onToggle(item)}
            title={isSaved ? 'Listeden çıkar' : 'Listeme ekle'}
          >
            {isSaved ? <Check size={13} /> : <BookmarkPlus size={13} />}
            <span>{isSaved ? 'Kayıtlı' : 'Kaydet'}</span>
          </button>
          {onAddAsReference && (
            <button
              type="button"
              className={`lab-panel-btn-ref ${isReference ? 'in-route' : ''}`}
              onClick={() => onAddAsReference(item)}
              title={isReference ? 'Rotaya eklendi' : 'Rotaya referans olarak ekle'}
              disabled={isReference}
            >
              {isReference ? <Check size={13} /> : <Plus size={13} />}
              <span>{isReference ? 'Rotada' : 'Rotaya Kat'}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function LabExpandedPanel({
  id,
  isOpen,
  onToggleOpen,
  title,
  subtitle,
  badgeLabel,
  icon,
  items,
  loading,
  total,
  page,
  onPage,
  onOpen,
  onToggle,
  savedIds,
  onAddAsReference,
  referenceIds,
}: Props) {
  if (!isOpen) return null;

  const hasMore = items.length < total;

  return (
    <div className="lab-expanded-panel" id={id} role="region" aria-label={title}>
      <header className="lab-expanded-head">
        <div className="lab-expanded-title-area">
          <div className="lab-expanded-icon-pill">{icon}</div>
          <div>
            <div className="lab-expanded-header-row">
              <h3>{title}</h3>
              {badgeLabel && <span className="lab-expanded-tag">{badgeLabel}</span>}
              <span className="lab-expanded-count">
                {loading && !items.length ? 'Analiz ediliyor…' : `${items.length} Yapım`}
              </span>
            </div>
            <p className="lab-expanded-sub">{subtitle}</p>
          </div>
        </div>

        <div className="lab-expanded-head-actions">
          <button
            type="button"
            className="lab-expanded-close-btn"
            onClick={onToggleOpen}
            aria-label="Pencereyi kapat"
          >
            <X size={15} /> <span>Pencereyi Kapat</span>
          </button>
        </div>
      </header>

      <div className="lab-expanded-body">
        {loading && !items.length ? (
          <div className="lab-expanded-skeleton-grid">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="lab-panel-skeleton" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="lab-expanded-grid">
            {items.map((series) => (
              <PanelCard
                key={series.id}
                item={series}
                onOpen={onOpen}
                onToggle={onToggle}
                isSaved={savedIds.has(series.id)}
                onAddAsReference={onAddAsReference}
                isReference={referenceIds?.has(series.id)}
              />
            ))}
          </div>
        ) : (
          <div className="lab-expanded-empty">
            <Sparkles size={20} />
            <p>Bu arama için uygun aday bulunamadı. Farklı bir yapım veya ifade deneyebilirsin.</p>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <footer className="lab-expanded-footer">
          {hasMore ? (
            <button
              type="button"
              className="lab-expanded-more-btn"
              onClick={() => onPage(page + 1)}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Yükleniyor…
                </>
              ) : (
                <>
                  <Plus size={14} /> Daha Fazla Benzer Yapım Göster
                </>
              )}
            </button>
          ) : (
            <span className="lab-expanded-all-loaded">
              Tüm benzer yapımlar görüntülendi ({items.length} yapım).
            </span>
          )}

          <button
            type="button"
            className="lab-expanded-collapse-text-btn"
            onClick={onToggleOpen}
          >
            <ChevronUp size={14} /> Daralt
          </button>
        </footer>
      )}
    </div>
  );
}
