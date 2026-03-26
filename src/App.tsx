import { useState, useEffect, useRef } from "react";
import { Player, Round, GameStatus, RoundScore } from "./types";
import { ROUNDS_DATA } from "./constants";
import { recordGameResults } from "./stats";
import SetupScreen from "./components/SetupScreen";
import GameBoard from "./components/GameBoard";
import { Trophy, RotateCcw, Moon, Sun, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [status, setStatus] = useState<GameStatus>("setup");
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return false;
  });
  const statsRecordedRef = useRef(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const startGame = (newPlayers: Player[]) => {
    statsRecordedRef.current = false;
    setPlayers(newPlayers);
    const initialRounds: Round[] = ROUNDS_DATA.map((r) => ({
      ...r,
      scores: {},
      isCompleted: false,
    }));
    setRounds(initialRounds);
    setStatus("playing");
  };

  const updateRoundScore = (
    roundNumber: number,
    scores: Record<string, RoundScore>
  ) => {
    setRounds((prev) =>
      prev.map((r) => (r.number === roundNumber ? { ...r, scores } : r))
    );
  };

  const completeRound = (roundNumber: number) => {
    setRounds((prev) =>
      prev.map((r) =>
        r.number === roundNumber ? { ...r, isCompleted: true } : r
      )
    );
  };

  const resetGame = () => {
    statsRecordedRef.current = false;
    setStatus("setup");
    setPlayers([]);
    setRounds([]);
  };

  const calculateTotal = (playerId: string) =>
    rounds.reduce((total, round) => total + (round.scores[playerId]?.score || 0), 0);

  // Check if game is finished and record stats once
  useEffect(() => {
    if (status === "playing" && rounds.length > 0 && rounds.every((r) => r.isCompleted)) {
      if (!statsRecordedRef.current) {
        statsRecordedRef.current = true;
        const scores = players.map((p) => ({
          playerId: p.id,
          score: calculateTotal(p.id),
        }));
        const minScore = Math.min(...scores.map((s) => s.score));
        recordGameResults(
          scores.map((s) => ({ ...s, isWinner: s.score === minScore }))
        );
      }
      setStatus("finished");
    }
  }, [rounds, status]);

  const winner = [...players].sort(
    (a, b) => calculateTotal(a.id) - calculateTotal(b.id)
  )[0];

  return (
    <div className="min-h-screen bg-surface flex flex-col relative">
      <header className="pt-14 pb-2 flex justify-center relative">
        <img
          src="/images/logo.svg"
          alt="Five Crowns"
          className="h-20 w-auto object-contain"
          referrerPolicy="no-referrer"
        />
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="absolute top-4 right-4 p-2 rounded-xl bg-surface-variant text-on-surface-variant hover:text-primary transition-all elevation-1 border border-outline/10 active:scale-95"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>
      <main className="flex-1">
        {status === "setup" ? (
          <SetupScreen onStart={startGame} />
        ) : status === "playing" ? (
          <GameBoard
            players={players}
            rounds={rounds}
            onUpdateRound={updateRoundScore}
            onCompleteRound={completeRound}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-6 py-12 text-center max-w-md mx-auto"
          >
            <div className="bg-yellow-100 text-yellow-600 p-8 rounded-full inline-block mb-6 elevation-2">
              <Trophy size={64} />
            </div>
            <h2 className="text-4xl font-bold text-primary mb-2">Game Over!</h2>
            <p className="text-on-surface-variant mb-8">The winner is</p>

            <div className="bg-surface-variant p-8 rounded-3xl elevation-2 mb-12 border border-outline/10">
              <div className="text-5xl font-black text-primary mb-2">
                {winner.name}
              </div>
              <div className="text-2xl font-bold text-on-surface-variant">
                Score: {calculateTotal(winner.id)}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
                Final Standings
              </h3>
              <div className="space-y-2">
                {[...players]
                  .sort((a, b) => calculateTotal(a.id) - calculateTotal(b.id))
                  .map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center bg-surface-variant p-4 rounded-2xl elevation-1 border border-outline/10"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary">#{idx + 1}</span>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-outline/20">
                          {p.avatarUrl ? (
                            <img
                              src={p.avatarUrl}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <User size={14} className="text-primary" />
                          )}
                        </div>
                        <span className="font-medium text-on-surface">
                          {p.name}
                        </span>
                      </div>
                      <span className="font-bold text-on-surface">
                        {calculateTotal(p.id)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <button
              onClick={resetGame}
              className="mt-10 flex items-center gap-2 mx-auto px-6 py-3 rounded-2xl bg-surface-variant text-on-surface-variant hover:text-primary border border-outline/10 transition-all active:scale-95 font-bold"
            >
              <RotateCcw size={16} />
              Play Again
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
