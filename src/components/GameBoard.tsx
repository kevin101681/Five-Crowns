import { useState } from "react";
import { Player, Round, RoundScore } from "../types";
import { ROUNDS_DATA } from "../constants";
import { CheckCircle2 } from "lucide-react";
import PlayerScoreEditor from "./PlayerScoreEditor";
import { motion, AnimatePresence } from "motion/react";

interface GameBoardProps {
  players: Player[];
  rounds: Round[];
  onUpdateRound: (roundNumber: number, scores: Record<string, RoundScore>) => void;
  onCompleteRound: (roundNumber: number) => void;
}

export default function GameBoard({ players, rounds, onUpdateRound, onCompleteRound }: GameBoardProps) {
  const [activeRound, setActiveRound] = useState<number>(1);

  const currentRound = rounds.find((r) => r.number === activeRound)!;

  const handleSaveScore = (playerId: string, score: number, cards: string[], wentOut: boolean) => {
    onUpdateRound(activeRound, {
      ...currentRound.scores,
      [playerId]: { playerId, score, cards, wentOut },
    });
  };

  const calculateTotal = (playerId: string) =>
    rounds.reduce((total, round) => total + (round.scores[playerId]?.score || 0), 0);

  const allScored = Object.keys(currentRound.scores).length === players.length;
  const someoneWentOut = Object.values(currentRound.scores).some((s) => s.wentOut);
  const canFinish = allScored && someoneWentOut && !currentRound.isCompleted;

  const handleFinishRound = () => {
    onCompleteRound(activeRound);
    if (activeRound < 11) setActiveRound((prev) => prev + 1);
  };

  return (
    <div className="px-2 pb-6 w-full max-w-full mx-auto flex flex-col items-center">
      {/* Round selector */}
      <div className="w-full max-w-2xl grid grid-cols-6 sm:grid-cols-11 gap-1.5 mb-4 py-2 px-2 bg-surface-variant/50 backdrop-blur-sm rounded-2xl border border-outline/20">
        {ROUNDS_DATA.map((r) => {
          const round = rounds.find((rd) => rd.number === r.number)!;
          const isActive = activeRound === r.number;
          const isDone = round.isCompleted;
          return (
            <button
              key={r.number}
              onClick={() => setActiveRound(r.number)}
              className={`w-full aspect-square rounded-full flex items-center justify-center font-bold transition-all text-sm sm:text-base ${
                isActive
                  ? "bg-primary text-white scale-110 elevation-2"
                  : isDone
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-variant text-on-surface-variant"
              }`}
            >
              {isDone ? <CheckCircle2 size={16} /> : r.number}
            </button>
          );
        })}
      </div>

      {/* Score cards */}
      <motion.div
        key={activeRound}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-surface-variant rounded-2xl p-4 elevation-1 border border-outline/20 mb-4"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Round {activeRound}
            </h3>
            <div className="text-2xl font-bold text-primary">Wild: {currentRound.wildCard}</div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 w-full">
          {players.map((player) => {
            const scoreData = currentRound.scores[player.id];
            const hasScore = !!scoreData;
            return (
              <div
                key={player.id}
                className={`flex-1 min-w-[300px] max-w-[500px] p-4 rounded-2xl transition-all h-fit bg-surface border ${
                  hasScore ? "border-transparent" : "border-outline/10"
                }`}
              >
                <div className="w-full flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-outline/10 shrink-0">
                      {player.avatarUrl ? (
                        <img
                          src={player.avatarUrl}
                          alt={player.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-primary">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="text-left overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base truncate">{player.name}</span>
                        <span className="text-xs font-bold text-primary bg-primary/15 px-2.5 py-0.5 rounded-full border border-primary/30 shadow-sm">
                          {calculateTotal(player.id)}
                        </span>
                      </div>
                      {scoreData?.wentOut && (
                        <div className="text-[10px] text-primary font-bold uppercase tracking-wider">
                          Went Out
                        </div>
                      )}
                    </div>
                  </div>
                  {hasScore && (
                    <div className="text-2xl font-black text-primary drop-shadow-sm shrink-0">
                      {scoreData.score}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-outline/5">
                  <PlayerScoreEditor
                    wildCard={currentRound.wildCard}
                    scoreData={scoreData}
                    onSave={(score, cards, wentOut) =>
                      handleSaveScore(player.id, score, cards, wentOut)
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Fixed Finish Round button — always visible when scores are ready */}
      <AnimatePresence>
        {canFinish && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30"
          >
            <button
              onClick={handleFinishRound}
              className="bg-primary text-white py-4 px-14 rounded-2xl font-bold text-lg elevation-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30 whitespace-nowrap"
            >
              Finish Round {activeRound}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
