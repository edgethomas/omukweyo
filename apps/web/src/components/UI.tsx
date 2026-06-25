import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type SectionProps = {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: 'left' | 'center';
  children: ReactNode;
  className?: string;
};

export function Section({ eyebrow, title, lede, align = 'center', children, className }: SectionProps) {
  return (
    <section className={cn('py-24 md:py-32', className)}>
      <div className="container-x">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className={cn('max-w-2xl mb-14 md:mb-20', align === 'center' && 'mx-auto text-center')}
        >
          {eyebrow && <div className="t-eyebrow mb-5">{eyebrow}</div>}
          <h2 className="t-display text-jumbo text-ink text-balance">
            {title}
          </h2>
          {lede && <p className="mt-5 text-ink-3 text-base md:text-lg leading-relaxed text-pretty">{lede}</p>}
        </motion.div>
        {children}
      </div>
    </section>
  );
}
