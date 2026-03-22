import React, { useState, useEffect, useRef } from 'react';
import { Player } from '../types';
import { Plus, Trash2, Play, User, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SetupScreenProps {
  onStart: (players: Player[]) => void;
}

export default function SetupScreen({ onStart }: SetupScreenProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState<string | undefined>(undefined);
  const [dbConfigured, setDbConfigured] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkDbStatus = async () => {
      try {
        const response = await fetch('/api/db-status');
        if (response.ok) {
          const data = await response.json();
          setDbConfigured(data.configured);
        }
      } catch (err) {
        console.error('Failed to check DB status:', err);
      }
    };
    checkDbStatus();

    const fetchPlayers = async () => {
      try {
        const response = await fetch('/api/players');
        if (response.ok) {
          const data = await response.json();
          setPlayers(data);
        }
      } catch (err) {
        console.error('Failed to fetch players:', err);
      }
    };
    fetchPlayers();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        alert('Image size must be less than 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addPlayer = async () => {
    if (newName.trim()) {
      const newPlayer: Player = { 
        id: crypto.randomUUID(), 
        name: newName.trim(),
        avatarUrl: newAvatar
      };
      
      try {
        const response = await fetch('/api/players', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPlayer)
        });
        if (response.ok) {
          setPlayers([...players, newPlayer]);
          setNewName('');
          setNewAvatar(undefined);
        }
      } catch (err) {
        console.error('Failed to save player:', err);
      }
    }
  };

  const removePlayer = async (id: string) => {
    try {
      const response = await fetch(`/api/players/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setPlayers(players.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete player:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPlayer();
    }
  };

  return (
    <div className="flex flex-col p-6 max-w-md mx-auto">
      <div className="space-y-8">
        {!dbConfigured && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-amber-500 text-sm">
            <p className="font-bold mb-1">Database Not Configured</p>
            <p>Players will not be saved between sessions. Please set the <code className="bg-amber-500/20 px-1 rounded">DATABASE_URL</code> environment variable in Settings.</p>
          </div>
        )}
        <div className="flex flex-col items-center gap-6">
          <div className="relative group">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full bg-surface-variant border-2 border-dashed border-outline/30 flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-primary/50"
            >
              {newAvatar ? (
                <img src={newAvatar} alt="Avatar Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={32} className="text-on-surface-variant/50" />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={20} className="text-white" />
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="w-full flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Player name"
              className="flex-1 px-4 py-3 rounded-xl border border-outline bg-surface-variant text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-on-surface-variant/50"
            />
            <button
              onClick={addPlayer}
              className="bg-primary text-white p-3 rounded-xl hover:scale-105 active:scale-95 transition-all elevation-1"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {players.map((player) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between bg-surface-variant p-3 rounded-2xl elevation-1 border border-outline/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-outline/20">
                    {player.avatarUrl ? (
                      <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={18} className="text-primary" />
                    )}
                  </div>
                  <span className="font-medium text-on-surface">{player.name}</span>
                </div>
                <button
                  onClick={() => removePlayer(player.id)}
                  className="text-red-500 p-2 hover:bg-red-500/10 rounded-full transition-colors"
                >
                  <Trash2 size={18} />
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
