import * as Dialog from '@radix-ui/react-dialog';
import { useMemo, useRef, useState } from 'react';
import {
  Bookmark, CheckCircle2, Clock3, Download, FolderPlus, ListVideo,
  PlayCircle, Plus, Trash2, Upload, X
} from 'lucide-react';
import type { CustomList, TVSeries, WatchState } from '../../types';

type Saved = { item: { seriesId: string; state: WatchState; episode: number }; series: TVSeries };
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Saved[];
  lists: CustomList[];
  onStateChange: (id: string, state: WatchState) => void;
  onRemove: (id: string) => void;
  onCreateList: (name: string) => void;
  onDeleteList: (id: string) => void;
  onRemoveFromList: (listId: string, seriesId: string) => void;
  onOpenSeries: (series: TVSeries) => void;
  onImport?: (data: { watchlist: Saved['item'][]; lists: CustomList[] }) => void;
};
const labels: Record<WatchState, string> = { plan: 'Planlıyorum', watching: 'İzliyorum', completed: 'İzledim' };

function exportArchive(items: Saved[], lists: CustomList[]) {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    watchlist: items.map(({ item }) => item),
    lists: lists.map(list => ({
      id: list.id,
      name: list.name,
      createdAt: list.createdAt,
      // Only store minimal series identifiers to keep file small
      items: (list.items || []).map(s => ({
        id: s.id,
        title: s.title,
        posterUrl: s.posterUrl,
        releaseYear: s.releaseYear,
        imdbRating: s.imdbRating,
        genres: s.genres,
      })),
    })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sera-arsiv-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function WatchlistDrawer({
  open, onOpenChange, items, lists, onStateChange, onRemove,
  onCreateList, onDeleteList, onRemoveFromList, onOpenSeries, onImport
}: Props) {
  const [tab, setTab] = useState<WatchState | 'lists'>('plan');
  const [name, setName] = useState('');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const visible = useMemo(() => items.filter(({ item }) => item.state === tab), [items, tab]);

  const create = () => {
    const value = name.trim().slice(0, 42);
    if (!value) return;
    onCreateList(value);
    setName('');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.watchlist || !data.lists) throw new Error('Geçersiz format');
        onImport?.({ watchlist: data.watchlist, lists: data.lists });
      } catch {
        setImportError('Dosya okunamadı. Geçerli bir SÉRA arşiv dosyası seçin.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const totalCount = items.length;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="sera-dialog-overlay drawer-overlay" />
        <Dialog.Content className="watchlist-drawer" aria-describedby="watchlist-description">
          {/* ── Header ── */}
          <header className="drawer-header">
            <div className="drawer-header-copy">
              <p className="drawer-kicker"><ListVideo size={13} /> YEREL ARŞİV</p>
              <Dialog.Title className="drawer-title">Hikâyelerin</Dialog.Title>
              <p id="watchlist-description" className="drawer-subtitle">
                {totalCount > 0 ? `${totalCount} yapım kaydedildi` : 'İzleme durumları bu tarayıcıda saklanır.'}
              </p>
            </div>
            <div className="drawer-header-actions">
              <button
                type="button"
                className="drawer-export-btn"
                title="Arşivi dışa aktar (.json)"
                onClick={() => exportArchive(items, lists)}
              >
                <Download size={15} />
              </button>
              <button
                type="button"
                className="drawer-export-btn"
                title="Arşivi içe aktar"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={15} />
              </button>
              <input ref={fileInputRef} type="file" accept=".json" className="sr-only" onChange={handleImport} />
              <Dialog.Close className="drawer-close" aria-label="Arşivi kapat"><X size={18} /></Dialog.Close>
            </div>
          </header>

          {importError && (
            <p className="drawer-import-error">{importError}</p>
          )}

          {/* ── Tab Bar ── */}
          <div className="watch-tabs" role="tablist" aria-label="Yerel arşiv bölümleri">
            {(['plan', 'watching', 'completed'] as WatchState[]).map(state => (
              <button
                key={state}
                role="tab"
                aria-selected={tab === state}
                className={tab === state ? 'active' : ''}
                onClick={() => setTab(state)}
              >
                {state === 'plan' ? <Bookmark size={14} /> : state === 'watching' ? <PlayCircle size={14} /> : <CheckCircle2 size={14} />}
                {labels[state]}
                <b>{items.filter(({ item }) => item.state === state).length}</b>
              </button>
            ))}
            <button
              role="tab"
              aria-selected={tab === 'lists'}
              className={tab === 'lists' ? 'active' : ''}
              onClick={() => setTab('lists')}
            >
              <FolderPlus size={14} /> Listeler <b>{lists.length}</b>
            </button>
          </div>

          {/* ── Content ── */}
          {tab === 'lists' ? (
            <div className="custom-lists">
              <form className="custom-list-create" onSubmit={e => { e.preventDefault(); create(); }}>
                <input
                  value={name}
                  maxLength={42}
                  onChange={e => setName(e.target.value)}
                  placeholder="Örn. Yağmurlu pazar"
                  aria-label="Yeni liste adı"
                />
                <button type="submit"><Plus size={15} /> Oluştur</button>
              </form>
              {lists.length ? lists.map(list => {
                const shows = list.items || [];
                return (
                  <section key={list.id} className="custom-list">
                    <div className="custom-list-head">
                      <div>
                        <small>{shows.length} yapım</small>
                        <h3>{list.name}</h3>
                      </div>
                      <button onClick={() => onDeleteList(list.id)} aria-label={`${list.name} listesini sil`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {shows.length ? (
                      <div className="custom-list-shows">
                        {shows.map(show => (
                          <article key={show.id}>
                            <button onClick={() => onOpenSeries(show)}>
                              <img src={show.posterUrl} alt="" loading="lazy" />
                              <span>{show.title}</span>
                            </button>
                            <button onClick={() => onRemoveFromList(list.id, show.id)} aria-label={`${show.title} listesinden çıkar`}>
                              <X size={12} />
                            </button>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="custom-list-empty">Bir yapım dosyasından bu listeye içerik ekleyebilirsin.</p>
                    )}
                  </section>
                );
              }) : (
                <div className="watch-empty">
                  <FolderPlus size={26} />
                  <b>Henüz özel listen yok</b>
                  <p>Örneğin "hafta sonu", "karanlık dramlar" veya arkadaşına göndereceğin bir liste oluştur.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="watchlist-items">
              {visible.length ? visible.map(({ item, series }) => (
                <article key={series.id} className="watchlist-item">
                  <button className="watchlist-poster" onClick={() => onOpenSeries(series)}>
                    <img src={series.posterUrl} alt={`${series.title} posteri`} loading="lazy" />
                    <div className="watchlist-poster-overlay" />
                  </button>
                  <div className="watchlist-item-body">
                    <button className="watchlist-title" onClick={() => onOpenSeries(series)}>{series.title}</button>
                    <p className="watchlist-meta">
                      {series.seasonsCount ? `${series.seasonsCount} sezon · ` : ''}
                      <span className="watchlist-rating">IMDb {series.imdbRating?.toFixed(1)}</span>
                    </p>
                    <p className="watchlist-genres">{series.genres.slice(0, 2).join(' · ')}</p>
                    <div className="watch-item-actions">
                      <select
                        value={item.state}
                        onChange={e => onStateChange(series.id, e.target.value as WatchState)}
                        aria-label={`${series.title} izleme durumu`}
                      >
                        {(['plan', 'watching', 'completed'] as WatchState[]).map(state => (
                          <option key={state} value={state}>{labels[state]}</option>
                        ))}
                      </select>
                      <button onClick={() => onRemove(series.id)} aria-label={`${series.title} listesinden çıkar`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              )) : (
                <div className="watch-empty">
                  <Clock3 size={26} />
                  <b>{labels[tab as WatchState]} listesi boş</b>
                  <p>Bir yapımın kartındaki yer imiyle listeye ekleyebilirsin.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Footer export hint ── */}
          {totalCount > 0 && (
            <footer className="drawer-footer">
              <Download size={12} />
              <span>Arşivi başka cihaza taşımak için dışa aktar</span>
              <button type="button" onClick={() => exportArchive(items, lists)}>İndir</button>
            </footer>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
