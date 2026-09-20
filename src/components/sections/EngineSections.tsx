import { motion, useReducedMotion } from 'framer-motion';
import {
  BadgeCheck,
  ArrowUpRight,
  BrainCircuit,
  Clapperboard,
  Eye,
  Layers3,
  MapPin,
  MessageCircleQuestion,
  Network,
  ScanLine,
  SlidersHorizontal,
  Sparkles,
  ThumbsUp,
  UsersRound,
} from 'lucide-react';

const platforms = ['Apple TV+', 'NETFLIX', 'HBO MAX', 'prime video', 'Disney+', 'BluTV'];

const capabilities = [
  {
    icon: Network,
    eyebrow: '01 · MATCHING',
    title: 'Altı katmanlı eşleşme',
    copy: 'Başlık, özet, tür, puan, popülerlik ve seçtiğin rota sinyalleri okunabilir bir sıralamada birleşir. Kişisel geri bildirimler cihazında saklanır.',
    tone: 'indigo',
  },
  {
    icon: ScanLine,
    eyebrow: '02 · VISUAL PROFILE',
    title: 'Poster görsel profili',
    copy: 'Renk paleti, ışık kontrastı ve atmosfer etiketleri yapım dosyasında görünür; öneri açıklamasına bağlam katar.',
    tone: 'cyan',
  },
  {
    icon: Sparkles,
    eyebrow: '03 · EXPLAINABLE',
    title: '“Neden uyar?” katmanı',
    copy: 'Her önerinin arkasındaki ortak duygu ve anlatı sinyallerini spoiler vermeden, açık cümlelerle gösterir.',
    tone: 'violet',
  },
  {
    icon: MapPin,
    eyebrow: '04 · WATCH PATH',
    title: 'Nereden izlenir',
    copy: 'Mevcut platform verisi ve derin bağlantılar yapım dosyasından ulaşılabilir kalır.',
    tone: 'green',
  },
  {
    icon: UsersRound,
    eyebrow: '05 · CAST MAP',
    title: 'Kadro ve karakter haritası',
    copy: 'Oyuncu, karakter ve yapım sinyalleri aynı dosyada buluşur; kadro akışı ayrıntıyı kaybetmez.',
    tone: 'amber',
  },
  {
    icon: ThumbsUp,
    eyebrow: '06 · FEEDBACK LOOP',
    title: 'Geri bildirim döngüsü',
    copy: 'Beğeni ve izleme durumu, bu cihazdaki kişisel sıralama ağırlıklarını zamanla daha isabetli hale getirir.',
    tone: 'rose',
  },
];

const methodology = [
  ['01', 'Ruh halini tarif et', 'Doğal dil aramasıyla başlayın veya hazır duygu etiketlerinden birini seçin.'],
  ['02', 'Sinyalleri eşleştir', 'Tür, tempo, anlatı derinliği ve kayıtlı görsel profil ortak bir puanda buluşur.'],
  ['03', 'Rotayı incelt', 'Platform ve kişisel tercih sınırları sonuç kümesini gerçekten izlenebilir adaylara çeker.'],
  ['04', 'Dosyayı aç, geri bildirim ver', 'Yapım dosyasını inceleyin; beğeni ve izleme durumu sonraki sıralamayı etkilesin.'],
] as const;

const faqs = [
  ['SÉRA diğer dizi önerilerinden nasıl ayrışır?', 'SÉRA, yalnızca puan veya tür filtresine bakmak yerine duygu etiketlerini, tempo ve anlatı derinliğini aynı sıralama içinde kullanır. Sonuçların gerekçesi yapım dosyasında görünür.'],
  ['Poster CNN analizi ne yapar?', 'Poster açıldığında ön-eğitimli MobileNet V2 cihazında çalışır; baskın görsel etiketleri çıkarır. Renk ve ışık sinyalleri bunun yanında okunabilir bir özet sunar.'],
  ['“Neden uyar?” metni neye dayanır?', 'Metin; seçilmiş ruh hali, eşleşen etiketler ve yapımın duygu profili arasındaki kesişimi spoiler vermeden özetler.'],
  ['Beğeniler ve izleme durumu nerede tutulur?', 'Tercihler ile izleme listesi bu tarayıcıdaki yerel saklama alanında tutulur. İstediğiniz zaman rotanızı yeniden kurabilirsiniz.'],
] as const;

export function EngineStats() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="duygu" className="engine-stats-section" aria-labelledby="engine-stats-title">
      <div className="page-shell">
        <div className="engine-section-heading">
          <p className="engine-overline"><Layers3 size={14} /> SÉRA SİNYAL KATMANI</p>
          <h2 id="engine-stats-title">Arşivdeki veriyi, seçilebilir bir izleme rotasına dönüştürür.</h2>
        </div>
        <div className="engine-stats-grid">
          <article><BrainCircuit size={19} /><b>Mevcut arşiv</b><strong>TMDB dizi arşivi</strong><span>Yapım, tür, kadro ve özet verisi</span></article>
          <article><Network size={19} /><b>Benzerlik katmanı</b><strong>Vektör skoru</strong><span>Ortak duygu ve anlatı sinyalleri</span></article>
          <article><BadgeCheck size={19} /><b>Şeffaf eşleşme</b><strong>Neden uyar?</strong><span>Her önerinin okunabilir gerekçesi</span></article>
          <article><Eye size={19} /><b>Görsel atmosfer</b><strong>Poster profili</strong><span>Renk, ışık ve ton sinyalleri</span></article>
        </div>
      </div>
      <div className="engine-platform-marquee" aria-label="Desteklenen yayıncı platformlar">
        <motion.div
          className="engine-platform-track"
          animate={reduceMotion ? undefined : { x: ['0%', '-50%'] }}
          transition={reduceMotion ? undefined : { duration: 24, ease: 'linear', repeat: Infinity }}
        >
          {[...platforms, ...platforms].map((platform, index) => <span key={`${platform}-${index}`}>{platform}</span>)}
        </motion.div>
      </div>
    </section>
  );
}

export function CapabilityBento() {
  return (
    <section id="postercnn" className="engine-capabilities page-shell scroll-stack-card" aria-labelledby="capability-title">
      <div className="engine-section-heading engine-section-heading-split">
        <div><p className="engine-overline"><BrainCircuit size={14} /> SÉRA ENGINE</p><h2 id="capability-title">Tek bir “benzer dizi” aramasından daha fazlası.</h2></div>
        <p>Keşif ekranı; eski kelime, tür ve içerik analizlerini kaybetmeden bunları daha okunur bir karar katmanına taşır.</p>
      </div>
      <div className="engine-bento-grid">
        {capabilities.map((item, index) => {
          const Icon = item.icon;
          return <motion.article
            key={item.title}
            className={`engine-bento-card engine-bento-${item.tone}`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.18 }}
            transition={{ duration: 0.34, delay: index * 0.045 }}
          >
            <span className="engine-bento-icon"><Icon size={20} /></span>
            <p>{item.eyebrow}</p><h3>{item.title}</h3><span>{item.copy}</span>
          </motion.article>;
        })}
      </div>
    </section>
  );
}

export function EngineMethodology() {
  return (
    <section id="nasil-calisir" className="engine-methodology" aria-labelledby="methodology-title">
      <div className="page-shell">
        <header className="methodology-intro">
          <div>
            <p className="engine-overline"><SlidersHorizontal size={14} /> SÉRA / YÖNTEM</p>
            <h2 id="methodology-title">İzlenecek bir şey değil.<br /><em>Bu akşamın yönünü</em> bul.</h2>
          </div>
          <p>SÉRA, tek bir kategori filtresi gibi çalışmaz. Yazdığın his, seçtiğin referanslar ve arşivdeki sinyaller birbirini tamamlayan kısa bir keşif akışına dönüşür.</p>
        </header>
        <ol className="engine-methodology-grid">
          {methodology.map(([number, title, copy], index) => <motion.li
            key={number}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, delay: index * 0.08, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <div className="methodology-card-top"><span>{number}</span><i>ADIM {index + 1}</i></div>
            <div><h3>{title}</h3><p>{copy}</p></div>
            <div className="methodology-card-footer"><small>{index === 0 ? 'Başlangıç sinyali' : index === 3 ? 'Rota gelişir' : 'Sinyal katmanı'}</small><ArrowUpRight size={17} /></div>
          </motion.li>)}
        </ol>
        <div className="methodology-closing"><span>01—04</span><p>Her sonuç, neden seçildiğini anlatan açık bir iz bırakır.</p></div>
      </div>
    </section>
  );
}

export function EngineFAQ() {
  return (
    <section className="engine-faq page-shell" aria-labelledby="faq-title">
      <div className="engine-section-heading"><p className="engine-overline"><MessageCircleQuestion size={14} /> SORULAR</p><h2 id="faq-title">SÉRA hakkında kısa cevaplar.</h2></div>
      <div className="engine-faq-list">
        {faqs.map(([question, answer]) => <details key={question}>
          <summary><span>{question}</span><Clapperboard size={17} aria-hidden="true" /></summary>
          <p>{answer}</p>
        </details>)}
      </div>
    </section>
  );
}
