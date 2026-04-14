import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const SPRING_BTN = { type: 'spring', stiffness: 500, damping: 30 } as const;

interface AIInsightsPillProps {
  primary: string;
  onClick: () => void;
}

export function AIInsightsPill({ primary, onClick }: AIInsightsPillProps) {
  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 h-7 rounded-full font-sans text-xs font-semibold whitespace-nowrap flex-shrink-0"
      style={{ backgroundColor: `${primary}26`, color: primary }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.94 }}
      transition={SPRING_BTN}
    >
      <Sparkles size={11} />
      AI Insights
    </motion.button>
  );
}
