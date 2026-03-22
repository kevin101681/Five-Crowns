import { useState, useEffect } from 'react';
import { Player, Round, GameStatus, RoundScore } from './types';
import { ROUNDS_DATA } from './constants';
import SetupScreen from './components/SetupScreen';
import GameBoard from './components/GameBoard';
import { Trophy, RotateCcw, Moon, Sun, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [status, setStatus] = useState<GameStatus>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Initialize rounds when game starts
  const startGame = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    const initialRounds: Round[] = ROUNDS_DATA.map(r => ({
      ...r,
      scores: {},
      isCompleted: false
    }));
    setRounds(initialRounds);
    setStatus('playing');
  };

  const updateRoundScore = (roundNumber: number, scores: Record<string, RoundScore>) => {
    setRounds(prev => prev.map(r => {
      if (r.number === roundNumber) {
        return { ...r, scores };
      }
      return r;
    }));
  };

  const completeRound = (roundNumber: number) => {
    setRounds(prev => prev.map(r => {
      if (r.number === roundNumber) {
        return { ...r, isCompleted: true };
      }
      return r;
    }));
  };

  const resetGame = () => {
    if (confirm('Are you sure you want to reset the game? All scores will be lost.')) {
      setStatus('setup');
      setPlayers([]);
      setRounds([]);
    }
  };

  // Check if game is finished
  useEffect(() => {
    if (status === 'playing' && rounds.length > 0 && rounds.every(r => r.isCompleted)) {
      setStatus('finished');
    }
  }, [rounds, status]);

  const calculateTotal = (playerId: string) => {
    return rounds.reduce((total, round) => total + (round.scores[playerId]?.score || 0), 0);
  };

  const winner = [...players].sort((a, b) => calculateTotal(a.id) - calculateTotal(b.id))[0];

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="pt-8 pb-4 flex justify-center">
        <img 
          src="/images/logo.svg" 
          alt="Five Crowns" 
          className="h-12 w-auto object-contain"
          referrerPolicy="no-referrer"
        />
      </header>
      <main className="flex-1">
        {status === 'setup' ? (
          <SetupScreen onStart={startGame} />
        ) : status === 'playing' ? (
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
              <div className="text-5xl font-black text-primary mb-2">{winner.name}</div>
              <div className="text-2xl font-bold text-on-surface-variant">
                Score: {calculateTotal(winner.id)}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Final Standings</h3>
              <div className="space-y-2">
                {[...players].sort((a, b) => calculateTotal(a.id) - calculateTotal(b.id)).map((p, idx) => (
                  <div key={p.id} className="flex justify-between items-center bg-surface-variant p-4 rounded-2xl elevation-1 border border-outline/10">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-primary">#{idx + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-outline/20">
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User size={14} className="text-primary" />
                        )}
                      </div>
                      <span className="font-medium text-on-surface">{p.name}</span>
                    </div>
                    <span className="font-bold text-on-surface">{calculateTotal(p.id)}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <footer className="p-6 flex flex-col items-center gap-4">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors py-2 px-4 rounded-full hover:bg-primary/5"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          <button
            onClick={resetGame}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors py-2 px-4 rounded-full hover:bg-primary/5"
          >
            <RotateCcw size={18} />
            <span>Reset Game</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
