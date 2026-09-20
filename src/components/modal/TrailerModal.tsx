import * as Dialog from '@radix-ui/react-dialog';
import { Check, Copy, ExternalLink, Film, LoaderCircle, Sparkles, X, Youtube } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { TVSeries } from '../../types';
import { getTMDBDetails } from '../../services/tmdbLive';
import { extractYouTubeKey, getYouTubeEmbedUrl, getYouTubeSearchUrl, getYouTubeWatchUrl } from '../../lib/youtube';

export function TrailerModal({
  series,
  open,
  onOpenChange,
}: {
  series: TVSeries;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [resolvedKey, setResolvedKey] = useState<string | null>(() => extractYouTubeKey(series.trailerUrl));
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCopied(false);

    const initialKey = extractYouTubeKey(series.trailerUrl);
    if (initialKey) {
      setResolvedKey(initialKey);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    const controller = new AbortController();

    getTMDBDetails(series, controller.signal)
      .then(hydrated => {
        if (!active) return;
        const foundKey = extractYouTubeKey(hydrated.trailerUrl);
        setResolvedKey(foundKey);
      })
      .catch(() => {
        if (active) setResolvedKey(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [open, series]);

  const embedUrl = resolvedKey ? getYouTubeEmbedUrl(resolvedKey) : null;
  const watchUrl = resolvedKey ? getYouTubeWatchUrl(resolvedKey) : getYouTubeSearchUrl(series.title, series.releaseYear);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard?.writeText(watchUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // sessizce devam et
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="sera-dialog-overlay trailer-overlay" />
        <Dialog.Content className="trailer-modal" aria-describedby="trailer-description">
          <header className="trailer-header">
            <div className="trailer-title-group">
              <p className="eyebrow">
                <Film size={13} /> FRAGMAN SALONU
                {series.matchScore ? <span className="trailer-match"><Sparkles size={11} /> %{series.matchScore} Uyum</span> : null}
              </p>
              <Dialog.Title>{series.title}</Dialog.Title>
            </div>
            <div className="trailer-header-actions">
              <a
                href={watchUrl}
                target="_blank"
                rel="noreferrer"
                className="trailer-direct-link"
                title="YouTube'da Aç"
              >
                <Youtube size={15} />
                <span>YouTube'da Aç</span>
                <ExternalLink size={13} />
              </a>
              <Dialog.Close aria-label="Fragmanı kapat" className="trailer-close-button">
                <X size={19} />
              </Dialog.Close>
            </div>
          </header>

          {isLoading ? (
            <div className="trailer-loading">
              <LoaderCircle size={28} className="spin" />
              <p>Resmi YouTube fragmanı getiriliyor…</p>
            </div>
          ) : embedUrl ? (
            <div className="trailer-player-wrap">
              <div className="trailer-frame">
                <iframe
                  src={embedUrl}
                  title={`${series.title} resmi fragmanı`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <footer className="trailer-footer-bar">
                <div className="trailer-bar-left">
                  <span className="trailer-indicator-dot" />
                  <small id="trailer-description">
                    Resmi YouTube akışı. Dağıtıcı kısıtlaması varsa sağdaki bağlantıdan doğrudan YouTube uygulamasında veya yeni sekmede izleyebilirsin.
                  </small>
                </div>
                <div className="trailer-bar-buttons">
                  <button type="button" onClick={handleCopyLink} className="trailer-copy-btn">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Kopyalandı' : 'Bağlantıyı Kopyala'}</span>
                  </button>
                  <a
                    href={watchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="trailer-watch-btn"
                  >
                    <Youtube size={15} />
                    <span>YouTube'da İzle</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </footer>
            </div>
          ) : (
            <div className="trailer-fallback">
              <Film size={34} />
              <h3>Gömülebilir YouTube fragmanı bulunamadı</h3>
              <p id="trailer-description">
                <b>{series.title}</b> yapımı için YouTube üzerinde doğrulanmış resmi tanıtım ve fragman araması hazırlandı.
              </p>
              <a href={watchUrl} target="_blank" rel="noreferrer" className="trailer-fallback-cta">
                <Youtube size={16} />
                <span>YouTube'da Doğrudan Ara ve İzle</span>
                <ExternalLink size={15} />
              </a>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
