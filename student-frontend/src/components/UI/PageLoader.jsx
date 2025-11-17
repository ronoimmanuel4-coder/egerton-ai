import { AnimatePresence, motion } from 'framer-motion';

export default function PageLoader({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-white/20 border-t-[#00a651] rounded-full animate-spin" />
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40">
              Loading
            </p>
            <p className="text-sm text-white/70 font-black tracking-tight">
              Egerton<span className="text-[#00a651]">.</span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
