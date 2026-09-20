import { SlidersHorizontal } from 'lucide-react';
import { platforms } from '../../data/mockSeries';
import type { Filters, StreamingPlatform } from '../../types';

const genres = ['Tümü', 'Drama', 'Suç', 'Gizem', 'Komedi', 'Bilim Kurgu & Fantastik', 'Aksiyon & Macera', 'Animasyon', 'Belgesel', 'Savaş & Politik'] as const;
const slider = (value:number, onChange:(n:number)=>void, label:string, min=0, max=100, step=1) => <label className="slider-row"><span>{label}<b>{value}{max===10?'+':''}</b></span><input type="range" min={min} max={max} step={step} value={value} onChange={event=>onChange(+event.target.value)}/></label>;

export function FilterMatrix({ filters, setFilters }: { filters: Filters; setFilters: (filters: Filters) => void }) {
  const patch = (next: Partial<Filters>) => setFilters({ ...filters, ...next });
  const reset = () => setFilters({ mood:'Tümü', genre:'Tümü', platform:'Tümü', minRating:7, status:'Tümü', pacing:[0,100], complexity:[0,100], query:filters.query });
  return <section id="discover" className="matrix"><div className="section-heading"><div><p className="eyebrow"><SlidersHorizontal size={14}/> Keşif matrisi</p><h2>Akışı gerçekten daralt.</h2></div><button className="text-button" onClick={reset}>Sıfırla</button></div><div className="matrix-grid">
    <div className="filter-block"><h3>Tür</h3><p className="filter-description">Canlı katalog bu türe göre sorgulanır.</p><div className="chip-grid">{genres.map(genre=><button key={genre} className={`filter-chip ${filters.genre===genre?'selected':''}`} onClick={()=>patch({ genre })}>{genre}</button>)}</div></div>
    <div className="filter-block"><h3>Platform</h3><p className="filter-description">Türkiye yayın sağlayıcısı olan sonuçlar gelir.</p><div className="chip-grid">{(['Tümü',...platforms] as const).map(platform=><button key={platform} className={`filter-chip ${filters.platform===platform?'selected':''}`} onClick={()=>patch({ platform:platform as StreamingPlatform|'Tümü' })}>{platform}</button>)}</div></div>
    <div className="filter-block sliders"><h3>Hız & kurgu</h3><p className="filter-description">Kişisel sıralamanın tempo ve anlatı ağırlığı.</p>{slider(filters.pacing[0],value=>patch({ pacing:[value,filters.pacing[1]] }),'En düşük tempo')}{slider(filters.complexity[0],value=>patch({ complexity:[value,filters.complexity[1]] }),'En düşük anlatı derinliği')}</div>
    <div className="filter-block sliders"><h3>Kalite & durum</h3><p className="filter-description">Puan ve yayın durumu doğrudan TMDB sorgusuna gider.</p>{slider(filters.minRating,value=>patch({ minRating:value }),'Minimum puan',0,10,.1)}<div className="status-toggle">{(['Tümü','Ended','Continuing'] as const).map(status=><button key={status} onClick={()=>patch({ status })} className={filters.status===status?'selected':''}>{status==='Tümü'?'Hepsi':status==='Ended'?'Final yaptı':'Devam ediyor'}</button>)}</div></div>
  </div></section>;
}
