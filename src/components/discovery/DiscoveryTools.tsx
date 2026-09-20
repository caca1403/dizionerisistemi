import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Dices, Film, Search, Sparkles, WandSparkles, X } from 'lucide-react';
import type { TVSeries } from '../../types';
import { searchLiveTMDB } from '../../services/tmdbLive';
import { LabExpandedPanel } from './LabExpandedPanel';

const randomRoutes = [
  'zamanda kırılan aile hikâyeleri', 'hafif ama zeki iş yeri komedileri', 'politik entrika ve güç savaşları',
  'uzay keşfi ve bilinmeyen dünyalar', 'romantik dönem hikâyeleri', 'fantastik macera ve dostluk',
  'sakin kasaba sırları', 'yüksek tempolu hayatta kalma', 'tarihi dram ve hanedanlar',
  'aileyle izlenebilecek sıcak hikâyeler', 'kara mizah ve toplumsal hiciv', 'bilim kurgu ve insanlık soruları',
];

type Props = {
  items: TVSeries[];
  onQuery: (query: string, referenceSignals?: string[], stream?: 'route' | 'word', referenceSeries?: TVSeries[]) => void;
  onToast: (message: string) => void;
  onOpen: (series: TVSeries) => void;
  onToggle: (series: TVSeries) => void;
  savedIds: Set<string>;
  routeItems: TVSeries[];
  routeLoading: boolean;
  routeTotal: number;
  routePage: number;
  onRoutePage: (page: number) => void;
  wordItems: TVSeries[];
  wordLoading: boolean;
  wordTotal: number;
  wordPage: number;
  onWordPage: (page: number) => void;
};

function uniqueSeries(items: TVSeries[]) {
  return [...new Map(items.map(item => [item.id, item])).values()];
}

export function DiscoveryTools({
  items,
  onQuery,
  onToast,
  onOpen,
  onToggle,
  savedIds,
  routeItems,
  routeLoading,
  routeTotal,
  routePage,
  onRoutePage,
  wordItems,
  wordLoading,
  wordTotal,
  wordPage,
  onWordPage,
}: Props) {
  const [seriesQuery, setSeriesQuery] = useState('');
  const deferredSeriesQuery = useDeferredValue(seriesQuery.trim());
  const [remoteSuggestions, setRemoteSuggestions] = useState<TVSeries[]>([]);
  const [selected, setSelected] = useState<TVSeries[]>([]);
  const [wordQuery, setWordQuery] = useState('');
  const [activeWordQuery, setActiveWordQuery] = useState('');
  const [routeOpen, setRouteOpen] = useState(false);
  const [wordOpen, setWordOpen] = useState(false);

  const selectedIds = useMemo(() => new Set(selected.map(item => item.id)), [selected]);

  useEffect(() => {
    if (deferredSeriesQuery.length < 2) { setRemoteSuggestions([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      searchLiveTMDB(deferredSeriesQuery, controller.signal).then(setRemoteSuggestions).catch(() => undefined);
    }, 240);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [deferredSeriesQuery]);

  const localSuggestions = useMemo(() => {
    if (deferredSeriesQuery.length < 2) return [];
    const query = deferredSeriesQuery.toLocaleLowerCase('tr-TR');
    return items.filter(item => item.title.toLocaleLowerCase('tr-TR').includes(query)).slice(0, 8);
  }, [deferredSeriesQuery, items]);

  const suggestions = useMemo(() => uniqueSeries([...localSuggestions, ...remoteSuggestions])
    .filter(item => !selected.some(chosen => chosen.id === item.id)).slice(0, 8), [localSuggestions, remoteSuggestions, selected]);

  const addSeries = (item: TVSeries) => {
    setSelected(current => current.some(value => value.id === item.id) || current.length >= 10 ? current : [...current, item]);
    setSeriesQuery('');
    setRemoteSuggestions([]);
  };

  const removeSeries = (id: string) => setSelected(current => current.filter(item => item.id !== id));

  const submitReferences = () => {
    if (!selected.length) return;
    const commonSignals = [...new Set(selected.flatMap(item => [...item.genres, ...item.moodTags]))];
    const titlesQuery = selected.map(item => item.title).join(' ');
    onQuery(titlesQuery, commonSignals, 'route', selected);
    onToast(`${selected.length} yapımın (${selected.map(s => s.title).slice(0, 2).join(', ')}${selected.length > 2 ? '…' : ''}) ortak rotası hesaplandı.`);
    setRouteOpen(true);
    window.setTimeout(() => {
      document.getElementById('route-expanded-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
  };

  const submitWords = (directValue?: string) => {
    const value = (directValue || wordQuery).trim();
    if (value.length < 2) return;
    setActiveWordQuery(value);
    onQuery(value, undefined, 'word');
    onToast('Yazdığın ifade çok dilli metin modeliyle sıralanıyor.');
    setWordOpen(true);
    window.setTimeout(() => {
      document.getElementById('word-expanded-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
  };

  const submitRandom = () => {
    const route = randomRoutes[Math.floor(Math.random() * randomRoutes.length)];
    setWordQuery(route);
    submitWords(route);
    onToast(`Sürpriz rota: ${route}`);
  };

  return <section className="discovery-tools" aria-labelledby="discovery-tools-title">
    <header className="discovery-tools-head">
      <p className="eyebrow"><Sparkles size={14}/> ÜÇ AYRI KEŞİF MOTORU</p>
      <h2 id="discovery-tools-title">Nasıl aramak istediğini seç.</h2>
      <p>Dizi referansı, serbest anlatım ve sürpriz rota ile yapımları doğrudan aracın altında açılan pencerelerden anında incele.</p>
    </header>

    <div className="discovery-labs-container">
      {/* LAB 01: DİZİLERDEN İÇERİK BUL */}
      <div className="lab-section-group">
        <section className="discovery-lab reference-lab">
          <div className="lab-index">01</div>
          <div className="lab-copy">
            <Film size={21}/>
            <small>DİZİLERDEN İÇERİK BUL</small>
            <h3>Sevdiğin yapımların ortak damarını çıkar.</h3>
            <p>En fazla 10 dizi seç. Ortak türlere kilitlenmek yerine özet ve anlatı vektörleri birlikte karşılaştırılır.</p>
          </div>
          <form className="lab-workspace" onSubmit={event => { event.preventDefault(); submitReferences(); }}>
            <label className="lab-search">
              <Search size={16}/>
              <input value={seriesQuery} onChange={event => setSeriesQuery(event.target.value)} placeholder="Dizi adı yaz: Dark, The Bear, Sherlock…"/>
              <span>{selected.length}/10</span>
            </label>
            {suggestions.length ? (
              <div className="series-suggestions">
                {suggestions.map(item => (
                  <button type="button" key={item.id} onClick={() => addSeries(item)}>
                    <img src={item.posterUrl} alt="" loading="lazy"/>
                    <span><b>{item.title}</b><small>{item.releaseYear} · {item.genres.slice(0, 2).join(' · ')}</small></span>
                    <ArrowRight size={14}/>
                  </button>
                ))}
              </div>
            ) : null}
            {selected.length ? (
              <div className="reference-poster-strip" aria-label="Seçilen diziler">
                {selected.map(item => (
                  <article key={item.id}>
                    <img src={item.posterUrl} alt="" loading="lazy"/>
                    <span>{item.title}</span>
                    <button type="button" aria-label={`${item.title} seçimini kaldır`} onClick={() => removeSeries(item.id)}>
                      <X size={12}/>
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="lab-empty">Arama yaptığında posterli adaylar burada görünür. Birden fazla dizi seçip ortak damarı bulabilirsin.</div>
            )}
            <div className="lab-actions-row">
              <button className="lab-submit" type="submit" disabled={!selected.length}>
                Ortak rotayı hesapla <ArrowRight size={15}/>
              </button>
              {routeItems.length > 0 && (
                <button
                  type="button"
                  className="lab-toggle-btn"
                  onClick={() => setRouteOpen(open => !open)}
                >
                  {routeOpen ? 'Önerileri Gizle' : `Önerileri Göster (${routeItems.length})`}
                </button>
              )}
            </div>
          </form>
        </section>

        {/* GENİŞLEYEN BENZER DİZİLER PENCERESİ */}
        <LabExpandedPanel
          id="route-expanded-panel"
          isOpen={routeOpen}
          onToggleOpen={() => setRouteOpen(false)}
          title="Seçtiğin Yapımlara Göre Benzer Dizi Önerileri"
          subtitle={selected.length ? `"${selected.map(s => s.title).join(', ')}" yapımlarının ortak ton ve anlatı damarı incelendi.` : 'Eklediğin dizilerin ortak temalarıyla eşleşen öneriler.'}
          badgeLabel="Ortak Rota & Damar"
          icon={<Film size={18} />}
          items={routeItems}
          loading={routeLoading}
          total={routeTotal}
          page={routePage}
          onPage={onRoutePage}
          onOpen={onOpen}
          onToggle={onToggle}
          savedIds={savedIds}
          onAddAsReference={addSeries}
          referenceIds={selectedIds}
        />
      </div>

      {/* LAB 02: KELİMEDEN VE SAHNEDEN KEŞİF */}
      <div className="lab-section-group">
        <section className="discovery-lab semantic-lab">
          <div className="lab-index">02</div>
          <div className="lab-copy">
            <WandSparkles size={21}/>
            <small>KELİMEDEN VE SAHNEDEN KEŞİF</small>
            <h3>Aklındaki hissi normal cümleyle anlat.</h3>
            <p>Başlık eşleşmesiyle sınırlı kalmaz. Çok dilli MiniLM modeli, cümlenle özetler arasındaki anlamsal yakınlığı ölçer.</p>
          </div>
          <form className="lab-workspace semantic-workspace" onSubmit={event => { event.preventDefault(); submitWords(); }}>
            <textarea value={wordQuery} onChange={event => setWordQuery(event.target.value)} maxLength={260} placeholder="Örn. Yağmurlu bir şehirde geçen, yavaş açılan ama sonunda zihni ters yüz eden bir hikâye…"/>
            <div className="semantic-samples">
              {['sıcacık arkadaşlık', 'politik güç savaşı', 'uzayda yalnızlık', 'zeki kara mizah', 'karanlık seri katil'].map(sample => (
                <button type="button" key={sample} onClick={() => { setWordQuery(sample); submitWords(sample); }}>
                  {sample}
                </button>
              ))}
            </div>
            <div className="lab-actions-row">
              <button className="lab-submit" type="submit" disabled={wordQuery.trim().length < 2}>
                Anlam vektörünü çalıştır <ArrowRight size={15}/>
              </button>
              {wordItems.length > 0 && (
                <button
                  type="button"
                  className="lab-toggle-btn"
                  onClick={() => setWordOpen(open => !open)}
                >
                  {wordOpen ? 'Eşleşmeleri Gizle' : `Eşleşmeleri Göster (${wordItems.length})`}
                </button>
              )}
            </div>
          </form>
        </section>

        {/* GENİŞLEYEN KELİME EŞLEŞMELERİ PENCERESİ */}
        <LabExpandedPanel
          id="word-expanded-panel"
          isOpen={wordOpen}
          onToggleOpen={() => setWordOpen(false)}
          title={`“${activeWordQuery || wordQuery}” İfadesiyle Eşleşen Diziler`}
          subtitle="MiniLM çok dilli anlamsal model ve özet vektörleri ile eşleştirildi."
          badgeLabel="Anlamsal Model"
          icon={<WandSparkles size={18} />}
          items={wordItems}
          loading={wordLoading}
          total={wordTotal}
          page={wordPage}
          onPage={onWordPage}
          onOpen={onOpen}
          onToggle={onToggle}
          savedIds={savedIds}
        />
      </div>

      {/* LAB 03: SÜRPRİZ ROTA */}
      <div className="lab-section-group">
        <section className="discovery-lab surprise-lab">
          <div className="lab-index">03</div>
          <div className="lab-copy">
            <Dices size={21}/>
            <small>SÜRPRİZ ROTA</small>
            <h3>Alışkanlığının dışına kontrollü çık.</h3>
            <p>Tek bir suç teması seçmez; komedi, romantizm, tarih, bilim kurgu, aile ve macera rotaları arasında dolaşır.</p>
          </div>
          <div className="lab-workspace surprise-workspace">
            <div className="surprise-orbit" aria-hidden="true"><span/><span/><span/></div>
            <p className="surprise-hint">Beklenmedik bir temayı anında dene:</p>
            <button className="lab-submit" type="button" onClick={submitRandom}>
              <Dices size={16}/> Sürpriz Rota Üret ve Çalıştır
            </button>
          </div>
        </section>
      </div>
    </div>
  </section>;
}
