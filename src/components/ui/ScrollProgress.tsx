import { motion, useScroll, useSpring } from 'framer-motion';

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: .35 });
  return <div className="sera-scroll-rail" aria-hidden="true"><motion.i style={{ scaleY }}/></div>;
}
