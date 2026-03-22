import React, { useState, useEffect, useRef } from 'react';
import { Player } from '../types';
import { Plus, Trash2, Play, User, Camera, X, Check, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SetupScreenProps {
  onStart: (players: Player[]) => void;
}

export default function SetupScreen({ onStart }: SetupScreenProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState<string | undefined>(undefined);
  const [dbConfigured, setDbConfigured] = useState<boolean>(true);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [dealerId, setDealerId] = useState<string | null>(null);
  const [isAssigningDealer, setIsAssigningDealer] = useState(false);
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<string | null>(null);
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
          // Default to unselected as requested
          setSelectedPlayerIds(new Set());
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
          // Default to unselected as requested
          setNewName('');
          setNewAvatar(undefined);
          setDealerId(null); // Reset dealer if players change
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
        setSelectedPlayerIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        if (dealerId === id) setDealerId(null);
      }
    } catch (err) {
      console.error('Failed to delete player:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPlayer();
      setIsAddPlayerOpen(false);
    }
  };

  const togglePlayerSelection = (id: string) => {
    setSelectedPlayerIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (dealerId === id) setDealerId(null);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const assignDealer = () => {
    const activePlayers = players.filter(p => selectedPlayerIds.has(p.id));
    if (activePlayers.length < 2) return;
    
    setIsAssigningDealer(true);
    setDealerId(null);
    
    let count = 0;
    const maxCount = 20; // Number of shuffles
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * activePlayers.length);
      setHighlightedPlayerId(activePlayers[randomIndex].id);
      count++;
      
      if (count >= maxCount) {
        clearInterval(interval);
        const finalDealerId = activePlayers[Math.floor(Math.random() * activePlayers.length)].id;
        setDealerId(finalDealerId);
        setHighlightedPlayerId(null);
        setIsAssigningDealer(false);
      }
    }, 100);
  };

  const selectedPlayers = players.filter(p => selectedPlayerIds.has(p.id));

  return (
    <div className="flex flex-col p-4 max-w-md mx-auto relative min-h-[calc(100vh-120px)]">
      <div className="space-y-4 flex-1">
        {!dbConfigured && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-amber-500 text-sm">
            <p className="font-bold mb-1 text-xs uppercase tracking-wider">Database Not Configured</p>
            <p className="opacity-80">Players will not be saved between sessions. Please set the <code className="bg-amber-500/20 px-1 rounded">DATABASE_URL</code> environment variable in Settings.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 justify-center">
          <AnimatePresence mode="popLayout">
            {players.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full text-center py-12 border-2 border-dashed border-outline/10 rounded-3xl"
              >
                <User size={48} className="mx-auto text-outline/20 mb-3" />
                <p className="text-on-surface-variant/50 text-sm">Add at least 2 players to start</p>
              </motion.div>
            ) : (
              players.map((player) => {
                const isDealer = dealerId === player.id;
                const isHighlighted = highlightedPlayerId === player.id;
                const isSelected = selectedPlayerIds.has(player.id);
                
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ 
                      opacity: isSelected ? 1 : 0.5, 
                      y: 0,
                      scale: isHighlighted ? 1.05 : 1,
                      backgroundColor: isHighlighted ? 'var(--color-primary-container)' : isDealer ? 'var(--color-primary)' : 'var(--color-surface-variant)'
                    }}
                    exit={{ opacity: 0, y: -10 }}
                    onClick={() => !isAssigningDealer && togglePlayerSelection(player.id)}
                    className={`flex items-center gap-3 p-2 pr-4 rounded-2xl elevation-1 border transition-all duration-200 cursor-pointer min-w-[140px] ${
                      isDealer ? 'border-primary shadow-lg shadow-primary/20' : isSelected ? 'border-primary/30' : 'border-outline/10'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border shrink-0 ${
                      isDealer ? 'border-white/30' : isSelected ? 'border-primary/30' : 'border-outline/20'
                    } ${!player.avatarUrl && (isDealer ? 'bg-white/20' : 'bg-primary/10')}`}>
                      {player.avatarUrl ? (
                        <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={18} className={isDealer ? 'text-white' : 'text-primary'} />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold truncate ${isDealer ? 'text-white' : 'text-on-surface'}`}>{player.name}</span>
                        {isSelected && !isDealer && <Check size={14} className="text-primary shrink-0" />}
                      </div>
                      {isDealer && <span className="text-[10px] font-black uppercase text-white/80 tracking-tighter">Dealer</span>}
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4">
        {selectedPlayers.length >= 2 && (
          <button
            onClick={dealerId ? () => onStart(selectedPlayers) : assignDealer}
            disabled={isAssigningDealer}
            className="w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 elevation-2 active:scale-95 transition-all bg-primary text-white shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAssigningDealer ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                <RotateCcw size={20} />
              </motion.div>
            ) : dealerId ? (
              <Play size={20} fill="currentColor" />
            ) : (
              <Check size={20} />
            )}
            {isAssigningDealer ? 'Assigning...' : dealerId ? 'Start Game' : 'Assign Dealer'}
          </button>
        )}
      </div>

      {/* Add Player FAB */}
      <button
        onClick={() => setIsAddPlayerOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-90 transition-all z-40 border border-white/10"
      >
        <Plus size={28} />
      </button>

      {/* Add Player Dialog */}
      <AnimatePresence>
        {isAddPlayerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddPlayerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="fixed inset-x-4 bottom-8 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-surface p-6 rounded-3xl shadow-2xl z-50 border border-outline/10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-primary uppercase tracking-tight">Add New Player</h3>
                <button 
                  onClick={() => setIsAddPlayerOpen(false)}
                  className="p-2 hover:bg-surface-variant rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

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

                <div className="w-full space-y-4">
                  <input
                    type="text"
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Enter player name"
                    className="w-full px-4 py-4 rounded-2xl border border-outline bg-surface-variant text-on-surface focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-on-surface-variant/50 font-bold"
                  />
                  <button
                    onClick={() => {
                      addPlayer();
                      setIsAddPlayerOpen(false);
                    }}
                    disabled={!newName.trim()}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 elevation-2 disabled:opacity-50 active:scale-95 transition-all"
                  >
                    <Plus size={20} />
                    Add Player
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
