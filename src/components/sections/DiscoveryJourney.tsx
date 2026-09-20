import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDownRight, Compass, Flame, Sparkles, WandSparkles } from 'lucide-react';

const stages = [
  { number:'01', icon:Compass, eyebrow:'İZLEME ROTASI', title:'Neyi hissetmek istediğini seç.', copy:'Ruh hâli, tempo ve anlatı yoğunluğu tek bir rota haline gelir.', target:'#discover', action:'Rotayı ayarla', tint:'lime' },
  { number:'02', icon:WandSparkles, eyebrow:'KELİME SİNYALİ', title:'Bir sahne ya da duygu yaz.', copy:'“Zaman döngüsü”, “tekinsiz kasaba” veya kendi ifaden; başlık ve özetlerde birlikte aranır.', target:'#kelime-analizi', action:'Kelimeyi kullan', tint:'paper' },
  { number:'03', icon:Flame, eyebrow:'CANLI ATLAS', title:'Arşivden gerçek adayları aç.', copy:'Sıralama, ilk aramada seçtiğin rota; sonra da ilgi, puan veya yenilik sinyaliyle değişir.', target:'#trendler', action:'Atlasa git', tint:'ink' },
] as const;

export function DiscoveryJourney(){
  const reduce=useReducedMotion();
  return <section className="discovery-journey" aria-labelledby="journey-title"><div className="discovery-journey-sticky"><header><p className="eyebrow"><Sparkles size={14}/> SÉRA KEŞİF ROTASI</p><h2 id="journey-title">Bir filtre ekranı değil,<br/><span>adım adım açılan bir rota.</span></h2><p>Üç karar yüzeyi de hazırdır; açmak istediğin noktaya doğrudan inersin.</p></header><div className="journey-stage-stack">{stages.map((stage,index)=>{const Icon=stage.icon; return <motion.article key={stage.number} className={'journey-plane journey-'+stage.tint} initial={reduce?false:{opacity:0,y:38,rotateX:index===1?-8:8}} whileInView={{opacity:1,y:0,rotateX:0}} viewport={{once:true,amount:.18}} transition={{duration:.52,delay:index*.1,ease:[.16,1,.3,1]}}><div className="journey-plane-number">{stage.number}<i/></div><Icon size={20}/><small>{stage.eyebrow}</small><h3>{stage.title}</h3><p>{stage.copy}</p><a href={stage.target}>{stage.action}<ArrowDownRight size={16}/></a></motion.article>})}</div></div></section>;
}
