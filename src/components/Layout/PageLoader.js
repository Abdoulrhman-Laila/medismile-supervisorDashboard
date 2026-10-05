'use client';

import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export default function PageLoader({ loading, hasSidebar = false }) {
  const reduceMotion = useReducedMotion();
  const loadingLabel = 'جارٍ التحضير...';
  const sidebarOffsetClass = hasSidebar ? 'lg:right-64' : '';

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="loader"
          dir="rtl"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label={loadingLabel}
          className={`fixed inset-y-0 left-0 right-0 z-[9999] flex items-center justify-center bg-background ${sidebarOffsetClass}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
        >
          <div className="flex w-full max-w-[280px] flex-col items-center px-6 sm:max-w-[320px]">
            <motion.div
              className="mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface shadow-sm sm:mb-6 sm:h-20 sm:w-20"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.35, ease: 'easeOut' }}
            >
              <Image
                src="/Screenshot_٢٠٢٥٠٩٠٨-١٢٣٢٥٥.jpg"
                alt="شعار MediSmile"
                width={80}
                height={80}
                className="h-full w-full object-cover"
                priority
              />
            </motion.div>

            <motion.p
              className="mb-1 font-sans text-h3 text-text"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : 0.05, ease: 'easeOut' }}
            >
              MediSmile
            </motion.p>

            <motion.p
              className="mb-6 font-sans text-body-sm text-text-secondary"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : 0.1, ease: 'easeOut' }}
            >
              {loadingLabel}
            </motion.p>

            <motion.div
              className="flex items-center gap-1.5"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.25, delay: reduceMotion ? 0 : 0.15 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                  animate={
                    reduceMotion
                      ? { opacity: 1, scale: 1 }
                      : { opacity: [0.35, 1, 0.35], scale: [0.9, 1, 0.9] }
                  }
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : {
                          duration: 1.1,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: i * 0.18,
                        }
                  }
                />
              ))}
            </motion.div>

            <span className="sr-only">{loadingLabel}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
