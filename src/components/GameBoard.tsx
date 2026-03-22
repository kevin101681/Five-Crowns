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
    <div className="px-2 pb-24 w-full max-w-full mx-auto flex flex-col items-center">
      <div className="w-full max-w-2xl grid grid-cols-6 sm:grid-cols-11 gap-1.5 mb-4 py-2 px-2 bg-surface-variant/50 backdrop-blur-sm rounded-2xl border border-outline/20">
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
        className="w-full bg-surface-variant rounded-2xl p-4 elevation-1 border border-outline/20 mb-4"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Round {activeRound}</h3>
            <div className="text-2xl font-bold text-primary">Wild: {currentRound.wildCard}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
          {players.map((player) => {
            const scoreData = currentRound.scores[player.id];
            const hasScore = !!scoreData;
            
            return (
              <div
                key={player.id}
                className={`w-full p-3 rounded-xl transition-all h-fit bg-surface border ${
                  hasScore ? 'border-transparent' : 'border-outline/10'
                }`}
              >
                <div className="w-full flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-outline/10 shrink-0">
                        {player.avatarUrl ? (
                          <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-xs font-bold ${
                            scoreData?.wentOut ? 'bg-primary text-white' : 'text-primary'
                          }`}>
                            {calculateTotal(player.id)}
                          </div>
                        )}
                      </div>
                      {player.avatarUrl && (
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border border-surface ${
                          scoreData?.wentOut ? 'bg-primary text-white' : 'bg-surface-variant text-primary'
                        }`}>
                          {calculateTotal(player.id)}
                        </div>
                      )}
                    </div>
                    <div className="text-left overflow-hidden">
                      <div className="font-bold text-sm truncate max-w-[80px]">{player.name}</div>
                      {scoreData?.wentOut && <div className="text-[8px] text-primary font-bold uppercase">Out</div>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    {hasScore && (
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">{scoreData.score}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-1.5 border-t border-outline/5">
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
