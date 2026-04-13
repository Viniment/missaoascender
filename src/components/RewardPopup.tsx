import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RewardPopupProps {
  open: boolean;
  onClose: () => void;
  xp: number;
  gold: number;
  title?: string;
}

export default function RewardPopup({ open, onClose, xp, gold, title }: RewardPopupProps) {
  useEffect(() => {
    if (open) {
      const t = setTimeout(onClose, 2500);
      return () => clearTimeout(t);
    }
  }, [open, onClose]);

  const isLoss = xp < 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          <div className={`pointer-events-auto rpg-panel border-2 ${isLoss ? 'border-destructive shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'border-primary shadow-[0_0_30px_rgba(123,47,247,0.4)]'} px-8 py-6 text-center min-w-[240px]`}>
            {title && (
              <p className={`text-xs font-display uppercase tracking-wider mb-2 ${isLoss ? 'text-destructive' : 'text-primary'}`}>
                {title}
              </p>
            )}
            <div className="space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className={`text-3xl font-display ${isLoss ? 'text-destructive' : 'text-primary glow-text-purple'}`}
              >
                {xp > 0 ? '+' : ''}{xp} XP
              </motion.div>
              {gold !== 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.35, type: 'spring' }}
                  className={`text-xl font-display ${gold < 0 ? 'text-destructive' : 'text-warning'}`}
                >
                  {gold > 0 ? '+' : ''}{gold} 💰
                </motion.div>
              )}
            </div>
            {isLoss && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xs text-destructive/80 mt-3 font-display"
              >
                PROTOCOLO DE FALHA ATIVADO
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
