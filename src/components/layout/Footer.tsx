import { Heart, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand"><span className="footer-mark"><Sparkles size={16}/></span><b>SÉRA</b></div>
          <p>İzleme zevkini açıklanabilir sinyallerle bir sonraki hikâyeye bağlayan yerel keşif aracı.</p>
        </div>
        <div><h3>Keşfet</h3><a href="#recommendation-engine">Öneri motoru</a><a href="#trendler">Canlı trendler</a><a href="#paths">Benzerlik rotaları</a></div>
        <div><h3>Duygu kümeleri</h3><a href="#duygu">Zihin yakan</a><a href="#duygu">Kasvetli polisiye</a><a href="#duygu">İyi hissettiren</a></div>
        <div><h3>Veri kaynakları</h3><p>TMDB dizi arşivi ve canlı TMDB araması. Tercihler yalnızca bu cihazda saklanır.</p></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} SÉRA Engine</span><span><Heart size={13} fill="currentColor"/> Veri bilimi, sinema ve yerel arşivlerle tasarlandı</span></div>
    </footer>
  );
}
