import React, { useState } from 'react';
import { Player } from '../types';
import { Plus, Trash2, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SetupScreenProps {
  onStart: (players: Player[]) => void;
}

export default function SetupScreen({ onStart }: SetupScreenProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newName, setNewName] = useState('');

  const addPlayer = () => {
    if (newName.trim()) {
      setPlayers([...players, { id: crypto.randomUUID(), name: newName.trim() }]);
      setNewName('');
    }
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPlayer();
    }
  };

  return (
    <div className="flex flex-col p-6 max-w-md mx-auto">
      <div className="space-y-8">
        <div className="flex flex-col items-center gap-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Player name"
            className="w-full px-4 py-3 rounded-xl border border-outline bg-surface-variant text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-center placeholder:text-on-surface-variant/50"
          />
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {players.map((player) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center gap-4 bg-surface-variant p-4 rounded-2xl elevation-1"
              >
                <span className="font-medium text-lg text-on-surface">{player.name}</span>
                <button
                  onClick={() => removePlayer(player.id)}
                  className="text-red-500 p-2 hover:bg-red-500/10 rounded-full transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <button
          onClick={() => onStart(players)}
          disabled={players.length < 2}
          className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 elevation-2 disabled:opacity-50 disabled:elevation-0 active:scale-95 transition-all"
        >
          <Play size={20} fill="currentColor" />
          Start Game
        </button>
      </div>
    </div>
  );
}
