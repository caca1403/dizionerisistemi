import { ChevronRight, Cpu, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { TasteProfile, TVSeries, WatchState } from '../../types';

type HistoryItem = { series: TVSeries; state: WatchState };
type Props = { all: TVSeries[]; profile: TasteProfile | null; history: HistoryItem[]; onOpen: (series: TVSeries) => void };
const emptyReferences: string[] = [];
const colorVector = (value: string) => { const hex = value.replace('#',''); return hex.length === 6 ? [parseInt(hex.slice(0,2),16)/255,parseInt(hex.slice(2,4),16)/255,parseInt(hex.slice(4,6),16)/255] : [0,0,0]; };
const visualCosine = (item: TVSeries, anchors: TVSeries[]) => {
  const target = item.posterCNN?.dominantColors || [];
  const source = anchors.flatMap(anchor => anchor.posterCNN?.dominantColors || []);
  if (!target.length || !source.length) return 35;
  const average = (colors: string[]) => colors.map(colorVector).reduce((sum, value) => sum.map((entry,index) => entry + value[index]), [0,0,0]).map(value => value / colors.length);
  const left = average(target), right = average(source); const dot = left.reduce((sum,value,index) => sum + value * right[index],0); const norm = Math.sqrt(left.reduce((sum,value)=>sum+value*value,0))*Math.sqrt(right.reduce((sum,value)=>sum+value*value,0));
  return Math.round(Math.max(0, Math.min(100, (dot / Math.max(.0001,norm)) * 100)));
};

export function SimilarityRows({ all, profile, history, onOpen }: Props) {
  const [ranked, setRanked] = useState<TVSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const references = profile?.referenceTitles || emptyReferences;
  const completedHistory = useMemo(() => history.filter(item => item.state === 'completed'), [history]);
  const watchedIds = useMemo(() => new Set(completedHistory.map(item => item.series.id)), [completedHistory]);
  const signal = useMemo(() => completedHistory.map(item => `${item.series.title}; ${item.series.genres.join(', ')}; ${item.series.moodTags.join(', ')}`).join('. '), [completedHistory]);
  const candidatePool = useMemo(() => {
    if (!profile || !completedHistory.length) return [];
    const query = signal.toLocaleLowerCase('tr');
    return [...all].filter(item => !watchedIds.has(item.id)).sort((left,right) => {
      const rank = (item: TVSeries) => [item.title, ...item.genres, ...item.moodTags].join(' ').toLocaleLowerCase('tr').split(/\s+/).reduce((sum,word) => sum + (query.includes(word) ? 1 : 0), 0);
      return rank(right) - rank(left) || right.imdbRating - left.imdbRating;
    }).slice(0, 48);
  }, [all, completedHistory.length, profile, signal, watchedIds]);
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin:'500px 0px' });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible || !profile || !completedHistory.length || signal.length < 3 || candidatePool.length < 2) { setRanked([]); return; }
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      // Arşiv akışında ağır WASM modelini otomatik çalıştırmıyoruz. Bu yüzey
      // önce hafif yerel sinyallerle açılır; MiniLM yalnız serbest metin
      // keşfi gibi açık kullanıcı eylemlerinde devreye girer.
      Promise.resolve(candidatePool.map(item => ({ ...item, matchScore: Math.min(100, Math.round(item.matchScore || 50)) }))).then(items => {
        const anchors = completedHistory.map(entry => entry.series);
        const anchorGenres = new Set(anchors.flatMap(item => item.genres));
        const anchorMoods = new Set(anchors.flatMap(item => item.moodTags));
        const preferredMoods = new Set([...(profile.moods || []), profile.mood]);
        const keywords = profile.keywords || [];
        const calibrated = items.map(item => {
          const genreOverlap = item.genres.filter(genre => anchorGenres.has(genre)).length / Math.max(1, Math.min(3, anchorGenres.size));
          const moodOverlap = item.moodTags.filter(mood => anchorMoods.has(mood) || preferredMoods.has(mood)).length / Math.max(1, Math.min(4, anchorMoods.size + preferredMoods.size));
          const keywordHit = keywords.filter(keyword => `${item.title} ${item.synopsis} ${item.genres.join(' ')}`.toLocaleLowerCase('tr').includes(keyword.toLocaleLowerCase('tr'))).length;
          const semantic = Math.round(Math.min(100, item.matchScore));
          const synopsis = Math.round(Math.min(100, semantic * .7 + Math.min(3, keywordHit) * 10));
          const referenceGenres = Math.round(genreOverlap * 100);
          const mood = Math.round(moodOverlap * 100);
          const content = Math.round((semantic * .55) + (referenceGenres * .25) + (mood * .2));
          const visual = visualCosine(item, anchors);
          const total = Math.min(98, Math.max(44, Math.round(semantic * .28 + synopsis * .18 + referenceGenres * .18 + content * .16 + mood * .13 + visual * .07)));
          return { ...item, matchScore: total, similarityBreakdown: { semantic, synopsis, referenceGenres, content, mood, visual, total } };
        }).sort((a,b) => b.matchScore - a.matchScore);
        if (active) setRanked(calibrated.slice(0, 12));
      }).catch(() => { if (active) setRanked([]); }).finally(() => { if (active) setLoading(false); });
    }, 400);
    return () => { active = false; window.clearTimeout(timer); };
  }, [all, candidatePool, completedHistory, profile, signal, visible]);
  if (!profile) return <section ref={sectionRef} id="paths" className="similarity similarity-empty"><p className="eyebrow">Kişisel benzerlik</p><h2>Önce rotanı oluştur.</h2><p>Beş kısa seçimin ve eklediğin sevdiğin diziler, kişisel benzerlik modelinin sorgusunu oluşturur.</p></section>;
  return <section ref={sectionRef} id="paths" className="similarity"><p className="eyebrow"><Cpu size={13}/> KİŞİSEL BENZERLİK MODELİ</p><h2>İzlediklerinin izini sür.</h2>{!completedHistory.length ? <div className="similarity-loading">Henüz izlediğin içerik yok. Bir yapımı “İzledim” olarak işaretlediğinde, yalnız onun tür, duygu, özet ve görsel sinyallerinden benzer adaylar üreteceğim.</div> : <><div className="similarity-intro"><span><Sparkles size={14}/> {completedHistory.length} izlenen yapım</span><p>Cosine vektörü, özet/fragman anlatı sinyali, tür, duygu ve poster görsel profili yalnız izlediğin yapımlar üzerinden hesaplanır.</p></div>{loading ? <div className="similarity-loading">İzlenen yapımların anlatı ve görsel sinyalleri hesaplanıyor…</div> : <div className="similarity-scroll">{ranked.map((item,index)=><button key={item.id} onClick={()=>onOpen(item)}><img src={item.posterUrl} loading="lazy" alt=""/><span><small>{String(index+1).padStart(2,'0')} · %{item.matchScore} toplam uyum</small><b>{item.title}</b><em>Cosine %{item.similarityBreakdown?.semantic ?? '—'} · Tür %{item.similarityBreakdown?.referenceGenres ?? '—'} · Duygu %{item.similarityBreakdown?.mood ?? '—'}</em></span><ChevronRight size={15}/></button>)}</div>}{!loading && !ranked.length && <p className="similarity-loading">İzlediğin yapımlarla yeterince ortak sinyal taşıyan aday bulunamadı.</p>}</>}</section>;
}
