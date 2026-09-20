import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowDownRight, ArrowRight, Bookmark, Play, Sparkles, Stars } from 'lucide-react';
import type { MoodTag, TVSeries } from '../../types';
import { MoodChips } from './MoodChips';
import { useEffect, useMemo, useState } from 'react';

type HeroTerminalProps = {
  spotlight: TVSeries;
  searchItems: TVSeries[];
  query: string;
  setQuery: (value: string) => void;
  mood: MoodTag | 'Tümü';
  onMood: (mood: MoodTag) => void;
  onStart: () => void;
  onOpenDossier: (series: TVSeries) => void;
};

export function HeroTerminal({ spotlight, searchItems, query, setQuery, mood, onMood, onStart, onOpenDossier }: HeroTerminalProps) {
  const reduceMotion = useReducedMotion();
  const [preview, setPreview] = useState(spotlight);
  useEffect(() => setPreview(spotlight), [spotlight]);
  const candidates = useMemo(() => {
    const terms = query.toLocaleLowerCase('tr-TR').trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    const unique = [...new Map(searchItems.filter(item => item.posterUrl).map(item => [item.id, item])).values()];
    return unique.map(item => { const text = `${item.title} ${item.originalTitle} ${item.genres.join(' ')} ${item.moodTags.join(' ')}`.toLocaleLowerCase('tr-TR'); const title = item.title.toLocaleLowerCase('tr-TR'); const score = terms.reduce((total,term) => total + (title === term ? 50 : title.startsWith(term) ? 24 : text.includes(term) ? 8 : 0), 0) + item.matchScore * .08; return { item, score }; }).filter(value => value.score > 0).sort((a,b) => b.score-a.score).slice(0,5).map(value => value.item);
  }, [query, searchItems]);
  const similar = useMemo(() => searchItems.filter(item => item.id !== preview.id && item.posterUrl).map(item => ({ item, score:item.moodTags.filter(tag => preview.moodTags.includes(tag)).length * 20 + item.genres.filter(genre => preview.genres.includes(genre)).length * 12 + Math.max(0, 8 - Math.abs(item.emotionProfile.pacing-preview.emotionProfile.pacing)*.1) })).sort((a,b)=>b.score-a.score).slice(0,3).map(value=>value.item), [preview, searchItems]);
  const { scrollYProgress } = useScroll();
  const copyScale = useTransform(scrollYProgress,[0,.3],[1,.95]);
  const copyOpacity = useTransform(scrollYProgress,[0,.3],[1,0]);
  const copyY = useTransform(scrollYProgress,[0,.3],[0,-50]);
  const filmScale = useTransform(scrollYProgress,[0,.3],[1.1,1]);
  const filmBrightness = useTransform(scrollYProgress,[0,.3],[1,.4]);
  const filmFilter = useTransform(filmBrightness, value => `grayscale(1) contrast(1.1) brightness(${value})`);
  return (
    <section id="motor" className="engine-hero" aria-labelledby="engine-hero-title">
      <motion.div className="engine-hero-film" style={{ backgroundImage: `url(${preview.backdropUrl})`, scale: reduceMotion ? 1 : filmScale, filter: reduceMotion ? 'none' : filmFilter }} aria-hidden="true" />
      <div className="engine-hero-grain" aria-hidden="true" />
      <div className="engine-hero-grid page-shell">
        <motion.div className="engine-hero-copy" style={reduceMotion ? undefined : { scale: copyScale, opacity: copyOpacity, y: copyY }} initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .48, ease: 'easeOut' }}>
          <p className="engine-overline"><span className="live-dot" /> KİŞİSEL DİZİ KÜTÜPHANESİ · 2026</p>
          <h1 id="engine-hero-title">Bu akşamın<br/><span>iyi hikâyesini</span><br/>bul.</h1>
          <p className="engine-hero-lede">Bir tür listesi değil; ritmine, merakına ve moduna göre daralan, sana ait bir izleme rotası.</p>
          <div className="engine-hero-actions" aria-label="Keşif kısayolları">
            <button type="button" className="engine-primary-action" onClick={onStart}>Rotanı oluştur <ArrowDownRight size={18} /></button>
            <button type="button" className="engine-secondary-action" onClick={() => onOpenDossier(preview)}><Bookmark size={16} /> Günün dosyası</button>
          </div>
          <form className="engine-search-terminal" onSubmit={event => { event.preventDefault(); if (candidates[0]) setPreview(candidates[0]); else onStart(); }}>
            <label htmlFor="engine-hero-search">NE İZLEMEK İSTİYORSUN?</label>
            <div><input id="engine-hero-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Örn. Dark gibi gizemli, ama daha sıcak..." autoComplete="off" /><button type="submit" aria-label="Dizi araması yap"><ArrowRight size={18}/></button></div>
          </form>
          {candidates.length > 0 && <div className="hero-search-previews" aria-label="Arama önizlemeleri">{candidates.map(item => <button type="button" key={item.id} onClick={() => setPreview(item)} className={item.id===preview.id?'active':''}><img src={item.posterUrl} alt="" loading="lazy"/><span><b>{item.title}</b><small>{item.releaseYear || 'Arşiv'} · {item.moodTags.slice(0,1).join('')}</small></span><em>Önizle</em></button>)}</div>}
          <div className="engine-mood-row"><span>Hızlı rota</span><MoodChips active={mood} onPick={onMood} /></div>
        </motion.div>

        <motion.aside className="engine-terminal-stage" aria-label="Yapım önizlemesi" initial={reduceMotion ? false : { opacity: 0, y: 28, rotateY: -4 }} animate={{ opacity: 1, y: 0, rotateY: 0 }} transition={{ duration: .62, delay: .1, ease: 'easeOut' }}>
          <div className="terminal-show-art" style={{ backgroundImage: `url(${preview.backdropUrl})` }} aria-hidden="true" />
          <div className="dossier-index"><span>01</span><i/><span>GÜNÜN SEÇKİSİ</span></div>
          <div className="hero-dossier-head"><img src={preview.posterUrl} alt={`${preview.title} posteri`} loading="eager"/><div><p><Stars size={13}/> SÉRA YAPIM DOSYASI</p><h2>{preview.title}</h2><span>{preview.releaseYear} · {preview.seasonsCount} sezon · {preview.genres.slice(0, 2).join(' / ')}</span></div></div>
          <div className="hero-dossier-rule" />
          <p className="hero-dossier-summary">{preview.synopsis}</p>
          <div className="hero-dossier-bottom"><div><small>UYUM</small><b>%{preview.matchScore}</b></div><div><small>ATMOSFER</small><b>{preview.moodTags.slice(0, 2).join(' · ')}</b></div><button type="button" onClick={() => onOpenDossier(preview)}><Play size={14} fill="currentColor"/> Dosyayı aç</button></div>
          <div className="hero-similar-strip"><small>BENZERLİĞE GÖRE</small>{similar.map(item=><button type="button" key={item.id} onClick={()=>setPreview(item)}><img src={item.posterUrl} alt=""/><span>{item.title}</span></button>)}</div>
          <div className="hero-dossier-stamp"><Sparkles size={15}/> Duygu + tempo + anlatı</div>
        </motion.aside>
      </div>
    </section>
  );
}
