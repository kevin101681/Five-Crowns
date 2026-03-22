import { useState, useEffect } from 'react';
import { Player, Round, RoundScore } from '../types';
import { ROUNDS_DATA } from '../constants';
import { CheckCircle2 } from 'lucide-react';
import PlayerScoreEditor from './PlayerScoreEditor';
import { motion } from 'motion/react';

interface GameBoardProps {
  players: Player[];
  rounds: Round[];
  onUpdateRound: (roundNumber: number, scores: Record<string, RoundScore>) => void;
  onCompleteRound: (roundNumber: number) => void;
}

export default function GameBoard({ players, rounds, onUpdateRound, onCompleteRound }: GameBoardProps) {
  const [activeRound, setActiveRound] = useState<number>(1);

  const currentRound = rounds.find(r => r.number === activeRound)!;

  const handleSaveScore = (playerId: string, score: number, cards: string[], wentOut: boolean) => {
    const newScores = {
      ...currentRound.scores,
      [playerId]: {
        playerId,
        score,
        cards,
        wentOut
      }
    };

    onUpdateRound(activeRound, newScores);
  };

  const calculateTotal = (playerId: string) => {
    return rounds.reduce((total, round) => total + (round.scores[playerId]?.score || 0), 0);
  };

  const allScored = Object.keys(currentRound.scores).length === players.length;
  const someoneWentOut = Object.values(currentRound.scores).some(s => s.wentOut);
  const canFinish = allScored && someoneWentOut && !currentRound.isCompleted;

  const handleFinishRound = () => {
    onCompleteRound(activeRound);
    if (activeRound < 11) {
      setActiveRound(prev => prev + 1);
    }
  };

  return (
    <div className="px-4 pb-24 w-full max-w-7xl mx-auto flex flex-col items-center">
      <div className="w-full max-w-2xl grid grid-cols-6 sm:grid-cols-11 gap-2 mb-6 py-3 px-2 bg-surface-variant/50 backdrop-blur-sm rounded-2xl border border-outline/20">
        {ROUNDS_DATA.map((r) => {
          const round = rounds.find(rd => rd.number === r.number)!;
          const isActive = activeRound === r.number;
          const isDone = round.isCompleted;
          
          return (
            <button
              key={r.number}
              onClick={() => setActiveRound(r.number)}
              className={`w-full aspect-square rounded-full flex items-center justify-center font-bold transition-all text-sm sm:text-base ${
                isActive ? 'bg-primary text-white scale-110 elevation-2' : 
                isDone ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-on-surface-variant'
              }`}
            >
              {isDone ? <CheckCircle2 size={16} /> : r.number}
            </button>
          );
        })}
      </div>

      <motion.div
        key={activeRound}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-surface-variant rounded-3xl p-6 elevation-1 border border-outline/20 mb-6"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Round {activeRound}</h3>
            <div className="text-3xl font-bold text-primary">Wild: {currentRound.wildCard}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {players.map((player) => {
            const scoreData = currentRound.scores[player.id];
            const hasScore = !!scoreData;
            
            return (
              <div
                key={player.id}
                className={`w-full p-4 rounded-2xl transition-all h-fit bg-surface border-2 ${
                  hasScore ? 'border-transparent' : 'border-outline/20'
                }`}
              >
                <div className="w-full flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                      scoreData?.wentOut ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      {calculateTotal(player.id)}
                    </div>
                    <div className="text-left overflow-hidden">
                      <div className="font-bold truncate">{player.name}</div>
                      {scoreData?.wentOut && <div className="text-[10px] text-primary font-bold uppercase">Went Out</div>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {hasScore && (
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">{scoreData.score}</div>
                        <div className="text-[8px] uppercase tracking-tighter opacity-50">Points</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-outline/10">
                  <PlayerScoreEditor
                    wildCard={currentRound.wildCard}
                    scoreData={scoreData}
                    onSave={(score, cards, wentOut) => handleSaveScore(player.id, score, cards, wentOut)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {canFinish && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex justify-center"
          >
            <button
              onClick={handleFinishRound}
              className="bg-primary text-white py-4 px-12 rounded-2xl font-bold text-lg elevation-2 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              Finish Round {activeRound}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
