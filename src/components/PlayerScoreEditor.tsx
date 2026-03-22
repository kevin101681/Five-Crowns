import React from 'react';
import { CARD_VALUES, getCardPoints } from '../constants';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RoundScore } from '../types';

interface PlayerScoreEditorProps {
  wildCard: string;
  scoreData?: RoundScore;
  onSave: (score: number, cards: string[], wentOut: boolean) => void;
}

export default function PlayerScoreEditor({
  wildCard,
  scoreData,
  onSave,
}: PlayerScoreEditorProps) {
  const [selectedCards, setSelectedCards] = React.useState<string[]>(scoreData?.cards || []);
  const [wentOut, setWentOut] = React.useState(scoreData?.wentOut || false);

  const toggleCard = (card: string) => {
    if (wentOut) return;
    const newCards = [...selectedCards, card];
    setSelectedCards(newCards);
    const score = newCards.reduce((sum, c) => sum + getCardPoints(c, wildCard), 0);
    onSave(score, newCards, false);
  };

  const removeCard = (index: number) => {
    const newCards = [...selectedCards];
    newCards.splice(index, 1);
    setSelectedCards(newCards);
    const score = newCards.reduce((sum, c) => sum + getCardPoints(c, wildCard), 0);
    onSave(score, newCards, false);
  };

  const handleWentOut = () => {
    setWentOut(true);
    setSelectedCards([]);
    onSave(0, [], true);
  };

  const currentScore = wentOut ? 0 : selectedCards.reduce((sum, card) => sum + getCardPoints(card, wildCard), 0);

  return (
    <div className="mt-2 p-2 bg-surface rounded-xl border border-outline/10 space-y-2">
      <button
        onClick={handleWentOut}
        className={`w-full py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 text-sm ${
          wentOut 
            ? 'bg-primary text-white' 
            : 'bg-surface-variant text-on-surface hover:bg-primary/10'
        }`}
      >
        {wentOut && <Check size={14} />}
        Went Out
      </button>

      {!wentOut && (
        <>
          <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase text-on-surface-variant tracking-widest">Cards in Hand</p>
            <div className="flex flex-wrap gap-1 min-h-[32px] p-1.5 bg-surface-variant/50 rounded-lg">
              <AnimatePresence mode="popLayout">
                {selectedCards.map((card, idx) => (
                  <motion.button
                    key={`${card}-${idx}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    onClick={() => removeCard(idx)}
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold elevation-1 flex items-center gap-1 ${
                      card === 'Joker' || card === wildCard ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-surface text-on-surface'
                    }`}
                  >
                    {card}
                    <X size={8} />
                  </motion.button>
                ))}
              </AnimatePresence>
              {selectedCards.length === 0 && (
                <span className="text-[10px] text-on-surface-variant/40 italic py-0.5">None</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {CARD_VALUES.map((card) => (
              <button
                key={card}
                onClick={() => toggleCard(card)}
                className={`py-1.5 rounded-md font-bold text-xs transition-all active:scale-90 elevation-1 ${
                  card === 'Joker' || card === wildCard ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-surface text-on-surface'
                }`}
              >
                {card}
              </button>
            ))}
          </div>
        </>
      )}

    </div>
  );
}
