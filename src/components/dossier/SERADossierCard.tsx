import { ArrowUpRight, BookmarkPlus, Play, Sparkles, Star } from 'lucide-react';
import type { TVSeries } from '../../types';
import { CastSlider } from '../cast/CastSlider';

export function SERADossierCard({ series, onOpen }: { series: TVSeries; onOpen: (series: TVSeries) => void }) {
  return <section id="yapim-dosyasi" className="dossier-showcase scroll-stack-card">
    <div className="dossier-showcase-copy"><p className="eyebrow"><Sparkles size={13}/> İmza bileşeni</p><h2>Geleneksel dizi sayfalarını unutun:<br/><span>SÉRA Yapım Dosyası.</span></h2><p>Tek ekranda hikâyenin tonunu, kadroyu, platformu ve sana neden uyduğunu gösteren sinematik inceleme katmanı.</p><ul><li>Akıllı künye ve spoiler’sız özet</li><li>Yatay oyuncu & karakter akışı</li><li>Geri bildirimle değişen kişisel sıralama</li></ul><button onClick={() => onOpen(series)}>Yapım dosyasını aç <ArrowUpRight size={17}/></button></div>
    <article className="dossier-preview">
      <div className="dossier-preview-backdrop" style={{ backgroundImage: `url(${series.backdropUrl})` }}/><div className="dossier-preview-vignette"/>
      <div className="dossier-preview-content"><p><Sparkles size={12}/> SÉRA YAPIM DOSYASI</p><div className="dossier-title-line"><h3>{series.title}</h3><span>%{series.matchScore} uyum</span></div><div className="dossier-meta"><i>{series.releaseYear}</i><i><Star size={12} fill="currentColor"/>{series.imdbRating}/10</i><i>{series.genres.slice(0,2).join(' · ')}</i><i>{series.seasonsCount} sezon · {series.totalEpisodes} bölüm</i></div><a href={series.deepLinkUrl} target="_blank" rel="noreferrer" className="dossier-platform">{series.platforms[0]} <b>Hemen izle</b> →</a><p className="dossier-summary">{series.synopsis}</p><div className="dossier-why"><Sparkles size={16}/><span><b>Neden senin için uygun?</b>{series.aiRecommendationReason}</span></div><CastSlider cast={series.cast.slice(0, 6)} compact/><div className="dossier-toolbar"><button onClick={() => onOpen(series)} className="dossier-trailer"><Play size={15} fill="currentColor"/> Fragman</button><button onClick={() => onOpen(series)}><BookmarkPlus size={15}/> Listeye ekle</button></div></div>
    </article>
  </section>;
}
