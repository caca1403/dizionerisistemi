import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Clapperboard, Sparkles, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type Props = { onEnter: () => void };

export function CinemaWelcome({ onEnter }: Props) {
  const reduceMotion = useReducedMotion();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [entering, setEntering] = useState(false);
  const [arrival, setArrival] = useState(0);

  useEffect(() => {
    const blockBackgroundScroll = (event: Event) => event.preventDefault();
    document.addEventListener('wheel', blockBackgroundScroll, { passive: false, capture: true });
    document.addEventListener('touchmove', blockBackgroundScroll, { passive: false, capture: true });
    const timer = window.setTimeout(() => enter(), reduceMotion ? 800 : 5400);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') enter();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('wheel', blockBackgroundScroll, true);
      document.removeEventListener('touchmove', blockBackgroundScroll, true);
    };
  }, [reduceMotion]);

  const enter = () => {
    if (entering) return;
    setEntering(true);
    window.setTimeout(onEnter, reduceMotion ? 0 : 540);
  };

  const advanceAudience = () => setArrival(current => {
    const next = Math.min(1, current + .18);
    if (next >= .98) window.setTimeout(enter, 360);
    return next;
  });

  return (
    <motion.section
      className="sera-welcome"
      aria-label="SÉRA sinema salonu karşılama ekranı"
      animate={entering ? { opacity: 0, y: '-100%', scale: 1.02 } : { opacity: 1, y: '0%', scale: 1 }}
      transition={{ duration: .5, ease: [0.21, 0.47, 0.32, 0.98] }}
      style={{
        '--welcome-x': `${tilt.x}px`,
        '--welcome-y': `${tilt.y}px`,
        '--audience-reveal': String(arrival)
      } as React.CSSProperties}
      onPointerMove={event => {
        if (reduceMotion) return;
        const box = event.currentTarget.getBoundingClientRect();
        setTilt({
          x: Math.round(((event.clientX - box.left) / box.width - .5) * 16),
          y: Math.round(((event.clientY - box.top) / box.height - .5) * 12)
        });
      }}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      onWheel={event => {
        if (event.deltaY > 0) {
          event.preventDefault();
          advanceAudience();
        }
      }}
    >
      <div className="welcome-projector" />
      <div className="welcome-aisle" />

      {/* Popcorn particles */}
      <div className="welcome-popcorn">
        {Array.from({ length: 24 }, (_, index) => (
          <i key={index} className={`welcome-pop welcome-pop-${index + 1}`} />
        ))}
      </div>

      {/* Top Bar */}
      <header className="welcome-nav">
        <div className="welcome-brand">
          <Clapperboard size={18} />
          <span>SÉRA</span>
          <small className="welcome-brand-tag">Kişisel Dizi Deneyimi</small>
        </div>
        <div className="welcome-nav-right">
          <small className="welcome-live-badge"><i /> CANLI ARŞİV · 82.990 YAPIM</small>
          <button type="button" className="welcome-skip-btn" onClick={enter} title="Doğrudan ana ekrana geç">
            Salona Atla →
          </button>
        </div>
      </header>

      {/* Main Theater Core */}
      <div className="welcome-theater-center">
        {/* Cinema Projection Screen */}
        <div className="welcome-screen">
          <div className="welcome-screen-frame">
            <span className="screen-title">SÉRA</span>
            <i className="screen-subtitle">PERSONAL SERIES ARCHIVE</i>
            <span className="screen-reflection" />
          </div>
        </div>

        {/* Cinematic Headline & Direct CTA */}
        <motion.div
          className="welcome-copy"
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .22, duration: .6 }}
        >
          <p className="welcome-eyebrow">
            <Sparkles size={13} /> PERDE AÇILMADAN ÖNCE
          </p>
          <h1>
            Bu akşam <em>hangi dünyaya</em> gireceksin?
          </h1>
          <p className="welcome-lead">
            İzlemek için seçilmemiş rastgele yapımları değil; tam olarak senin ruh hâline ve ritmine oturan hikâyeyi bul.
          </p>
          <div className="welcome-actions">
            <button type="button" className="welcome-enter-btn" onClick={enter}>
              <span>Salona Gir / Keşfet</span>
              <ArrowRight size={18} />
            </button>
            <button type="button" className="welcome-sound" onClick={enter} aria-label="Sessizce geç">
              <Volume2 size={16} /> Sessizce geç
            </button>
          </div>
        </motion.div>
      </div>

      {/* Audience Silhouette pinned to bottom */}
      <div className="welcome-audience">
        <img className="welcome-audience-render" src="/sera-assets/cinema-seated-audience.png" alt="" />
        <div className="welcome-audience-gradient" />
      </div>

      {/* Footer Auto Progress */}
      <footer className="welcome-footer">
        <div className="welcome-progress-wrap">
          <span>{arrival ? `SALON DOLUYOR · %${Math.round(arrival * 100)}` : 'HİKÂYEYE GEÇİLİYOR'}</span>
          <i className="welcome-auto-progress" />
        </div>
        <small>Tıkla, kaydır veya bekle · Perde aralanıyor.</small>
      </footer>
    </motion.section>
  );
}
