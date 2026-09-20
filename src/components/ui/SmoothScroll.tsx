import Lenis from 'lenis';
import { useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (reduceMotion) return;
    const lenis = new Lenis({ duration: 1.2, lerp: 0.1, smoothWheel: true, syncTouch: false });
    const setOverlayLock = (event: Event) => {
      const locked = (event as CustomEvent<boolean>).detail;
      if (locked) {
        lenis.stop();
      } else {
        lenis.start();
        if (document.body.style.overflow === 'hidden') document.body.style.overflow = '';
      }
    };
    window.addEventListener('sera-overlay-scroll-lock', setOverlayLock);

    // Fail-safe self healing: If all dialogs/overlays are closed, ensure page scrolling is 100% active
    const checkScrollSanity = () => {
      const hasOpenDialog = Boolean(document.querySelector('[role="dialog"], .series-detail-modal, .poster-cnn-modal, [data-state="open"]'));
      if (!hasOpenDialog) {
        if (document.body.style.overflow === 'hidden') {
          document.body.style.overflow = '';
        }
        if (document.documentElement.style.overscrollBehavior === 'none') {
          document.documentElement.style.overscrollBehavior = '';
        }
        lenis.start();
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTimeout(checkScrollSanity, 60);
    };
    const onPointer = () => setTimeout(checkScrollSanity, 120);

    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerup', onPointer);
    const interval = setInterval(checkScrollSanity, 600);

    let frame = 0;
    const raf = (time: number) => { lenis.raf(time); frame = requestAnimationFrame(raf); };
    frame = requestAnimationFrame(raf);
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerup', onPointer);
      window.removeEventListener('sera-overlay-scroll-lock', setOverlayLock);
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [reduceMotion]);
  return <>{children}</>;
}
