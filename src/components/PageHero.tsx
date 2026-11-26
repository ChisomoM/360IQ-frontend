import { motion, useReducedMotion } from 'framer-motion';
import { HeroArcs } from '@/components/brand/HeroArcs';

interface PageHeroProps {
  title: string;
  highlightText?: string;
  description?: string;
  backgroundImage?: string;
  className?: string;
}

function PageHero({
  title,
  highlightText,
  description,
  className = ''
}: PageHeroProps) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <section
      data-theme="ink"
      className={`relative overflow-hidden py-20 sm:py-24 lg:py-32 ${className}`}
      style={{ background: 'var(--gradient-hero-ink)' }}
    >
      <HeroArcs />

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-5xl mx-auto px-6 lg:px-8 z-10"
      >
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.025em] text-text-primary leading-tight">
            {title}{highlightText && <> <span className="iq-grad-text">{highlightText}</span></>}
          </h1>
          {description && (
            <p className="text-base md:text-lg text-text-secondary max-w-3xl mx-auto leading-relaxed mt-4">
              {description}
            </p>
          )}
        </div>
      </motion.div>
    </section>
  );
}

export default PageHero;
