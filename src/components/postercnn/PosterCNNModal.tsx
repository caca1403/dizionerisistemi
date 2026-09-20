import * as Dialog from '@radix-ui/react-dialog';
import { BrainCircuit, Image, LoaderCircle, Play, ScanLine, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { TVSeries } from '../../types';
import { analyzePoster, type PosterVisionResult } from '../../services/posterVision';

import { extractYouTubeKey, getYouTubeWatchUrl } from '../../lib/youtube';

export function PosterCNNModal({ series, open, onOpenChange, candidates = [], onOpenSeries }: { series: TVSeries | null; open: boolean; onOpenChange: (value: boolean) => void; candidates?: TVSeries[]; onOpenSeries?: (series: TVSeries) => void }) {
  const [analysis, setAnalysis] = useState<PosterVisionResult | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!open || !series?.posterUrl) return;
    let active = true;
    setState('loading'); setAnalysis(null); setPhase(0);
    const phaseTimer = window.setInterval(() => setPhase(value => Math.min(3, value + 1)), 650);
    analyzePoster(series.posterUrl).then(value => { if (active) { setAnalysis(value); setState('ready'); setPhase(3); } }).catch(() => { if (active) setState('failed'); });
    return () => { active = false; window.clearInterval(phaseTimer); };
  }, [open, series?.id, series?.posterUrl]);
  if (!series) return null;
  const colors = analysis?.dominantColors ?? series.posterCNN.dominantColors;
  const similar = candidates.filter(item => item.id !== series.id && (item.genres.some(genre => series.genres.includes(genre)) || item.moodTags.some(mood => series.moodTags.includes(mood)))).sort((a,b) => (b.imdbRating + b.matchScore / 20) - (a.imdbRating + a.matchScore / 20)).slice(0, 4);
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="sera-dialog-overlay"/><Dialog.Content className="poster-cnn-modal" aria-describedby="poster-cnn-description">
    <Dialog.Close className="detail-close" aria-label="Poster analizini kapat"><X size={18}/></Dialog.Close>
    <div className="cnn-poster"><img src={series.posterUrl} alt={`${series.title} posteri`} /><span><ScanLine size={19}/> Görsel profil</span></div>
    <div className="cnn-copy"><p className="detail-kicker"><BrainCircuit size={13}/> {state === 'ready' ? 'MobileNet V2 / yerel çıkarım' : 'Poster CNN analizi'}</p><Dialog.Title>{series.title} görsel atmosferi</Dialog.Title><p id="poster-cnn-description">{state === 'loading' ? 'Ön-eğitimli MobileNet V2 yükleniyor ve poster üzerinde yerel çıkarım yapılıyor.' : state === 'failed' ? 'CNN yüklenemedi; kayıtlı arşiv profili gösteriliyor.' : 'Poster renkleri ve görsel öznitelikleri cihazında çıkarıldı.'}</p>
      {state === 'loading' && <div className="cnn-runtime cnn-phases"><LoaderCircle size={16}/><ol>{['Görsel yükleniyor','Renk ve ışık çıkarılıyor','MobileNet sınıflandırması yapılıyor','Görsel profil hazır'].map((label,index)=><li className={index <= phase ? 'active' : ''} key={label}>{label}</li>)}</ol></div>}
      <div className="cnn-swatches">{colors.map(color => <span key={color}><i style={{ backgroundColor: color }}/>{color}</span>)}</div>
      <dl><div><dt>Görsel ton</dt><dd>{analysis?.visualMood ?? series.posterCNN.visualMood}</dd></div><div><dt>Işık kontrastı</dt><dd>{analysis?.lightingContrast ?? series.posterCNN.lightingContrast}</dd></div><div><dt>Duygu etiketi</dt><dd>{series.moodTags.slice(0,2).join(' · ')}</dd></div></dl>
      {analysis && <div className="cnn-runtime"><Image size={15}/><span>MobileNet V2 vektörü · norm {analysis.embeddingNorm}</span>{analysis.labels.slice(0, 2).map(label => <small key={label.label}>{label.label} %{label.confidence}</small>)}</div>}
      <section className="cnn-content-analysis"><h3>İçerik eşleşmesi</h3><p>{series.synopsis}</p><div>{series.genres.slice(0,4).map(genre => <span key={genre}>{genre}</span>)}{series.moodTags.slice(0,3).map(mood => <span key={mood}>{mood}</span>)}</div></section>
      {series.trailerUrl && <a className="cnn-trailer-link" href={getYouTubeWatchUrl(series.trailerUrl, series.title)} target="_blank" rel="noreferrer"><Play size={15} fill="currentColor"/> Resmi fragmanı aç</a>}
      {similar.length > 0 && <section className="cnn-similar"><h3>Bu profile yakın içerikler</h3><div>{similar.map(item => <button key={item.id} type="button" onClick={() => onOpenSeries?.(item)}><img src={item.posterUrl} alt=""/><span><b>{item.title}</b><small>{item.genres.slice(0,2).join(' · ')} · %{item.matchScore}</small></span></button>)}</div></section>}
      <p className="cnn-note">Poster görseli, özet, tür, duygu ve fragman sinyalleri aynı yapım dosyasında birleştirilir.</p></div>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
