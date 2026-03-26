import React, { useState, useEffect, useRef } from "react";
import { Player, Round } from "../types";
import { PlayerStats, getPlayerStats, deletePlayerStats } from "../stats";
import {
  Plus, Play, User, Camera, X, Check, RotateCcw,
  Trash2, Info, Trophy, Target, TrendingUp, PlayCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ActiveSession {
  id: string;
  players: Player[];
  rounds: Round[];
}

interface SetupScreenProps {
  onStart: (players: Player[]) => Promise<void> | void;
  activeSession?: ActiveSession | null;
  onResume?: (session: ActiveSession) => void;
}

export default function SetupScreen({ onStart, activeSession, onResume }: SetupScreenProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState<string | undefined>(undefined);
  const [dbConfigured, setDbConfigured] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [dealerId, setDealerId] = useState<string | null>(null);
  const [isAssigningDealer, setIsAssigningDealer] = useState(false);
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<string | null>(null);
  const [profilePlayer, setProfilePlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState<string | undefined>(undefined);
  const [statsMap, setStatsMap] = useState<Record<string, PlayerStats>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const loadStats = (playerList: Player[]) => {
    const map: Record<string, PlayerStats> = {};
    playerList.forEach((p) => { map[p.id] = getPlayerStats(p.id); });
    setStatsMap(map);
  };

  useEffect(() => {
    const checkDbStatus = async () => {
      try {
        const response = await fetch("/api/db-status");
        if (response.ok) {
          const data = await response.json();
          setDbConfigured(data.configured);
        }
      } catch (err) {
        console.error("Failed to check DB status:", err);
      }
    };
    checkDbStatus();

    const fetchPlayers = async () => {
      try {
        const response = await fetch("/api/players");
        if (response.ok) {
          const data = await response.json();
          setPlayers(data);
          setSelectedPlayerIds(new Set());
          // Prefer stats from DB; fall back to localStorage for each player
          const map: Record<string, PlayerStats> = {};
          data.forEach((p: Player & { stats?: PlayerStats }) => {
            const dbStats = p.stats;
            const localStats = getPlayerStats(p.id);
            map[p.id] = dbStats && dbStats.gamesPlayed > 0 ? dbStats : localStats;
          });
          setStatsMap(map);
        }
      } catch (err) {
        console.error("Failed to fetch players:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlayers();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { alert("Image size must be less than 1MB"); return; }
      const reader = new FileReader();
      reader.onloadend = () => setNewAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { alert("Image size must be less than 1MB"); return; }
      const reader = new FileReader();
      reader.onloadend = () => setEditAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addPlayer = async () => {
    if (!newName.trim()) return;
    const newPlayer: Player = { id: crypto.randomUUID(), name: newName.trim(), avatarUrl: newAvatar };
    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlayer),
      });
      if (response.ok) {
        const updated = [...players, newPlayer];
        setPlayers(updated);
        loadStats(updated);
        setNewName("");
        setNewAvatar(undefined);
        setDealerId(null);
      }
    } catch (err) {
      console.error("Failed to save player:", err);
    }
  };

  const removePlayer = async (id: string) => {
    try {
      const response = await fetch(`/api/players/${id}`, { method: "DELETE" });
      if (response.ok) {
        deletePlayerStats(id);
        const updated = players.filter((p) => p.id !== id);
        setPlayers(updated);
        loadStats(updated);
        setSelectedPlayerIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
        if (dealerId === id) setDealerId(null);
        setProfilePlayer(null);
      }
    } catch (err) {
      console.error("Failed to delete player:", err);
    }
  };

  const savePlayerEdit = async () => {
    if (!profilePlayer || !editName.trim()) return;
    const updated: Player = { ...profilePlayer, name: editName.trim(), avatarUrl: editAvatar };
    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (response.ok) {
        const updatedList = players.map((p) => (p.id === updated.id ? updated : p));
        setPlayers(updatedList);
        loadStats(updatedList);
        setProfilePlayer(null);
      }
    } catch (err) {
      console.error("Failed to update player:", err);
    }
  };

  const togglePlayerSelection = (id: string) => {
    if (isAssigningDealer) return;
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); if (dealerId === id) setDealerId(null); }
      else { next.add(id); }
      return next;
    });
  };

  const assignDealer = () => {
    const activePlayers = players.filter((p) => selectedPlayerIds.has(p.id));
    if (activePlayers.length < 2) return;
    setIsAssigningDealer(true);
    setDealerId(null);
    let count = 0;
    const interval = setInterval(() => {
      setHighlightedPlayerId(activePlayers[Math.floor(Math.random() * activePlayers.length)].id);
      count++;
      if (count >= 20) {
        clearInterval(interval);
        setDealerId(activePlayers[Math.floor(Math.random() * activePlayers.length)].id);
        setHighlightedPlayerId(null);
        setIsAssigningDealer(false);
      }
    }, 100);
  };

  const openProfile = (player: Player) => {
    setProfilePlayer(player);
    setEditName(player.name);
    setEditAvatar(player.avatarUrl);
  };

  const selectedPlayers = players.filter((p) => selectedPlayerIds.has(p.id));
  const winRate = (stats: PlayerStats) => stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : null;
  const avgScore = (stats: PlayerStats) => stats.gamesPlayed > 0 ? Math.round(stats.totalScore / stats.gamesPlayed) : null;

  return (
    <div className="flex flex-col p-4 max-w-md mx-auto relative min-h-[calc(100vh-96px)] md:max-w-5xl md:h-[calc(100vh-96px)] md:min-h-0">
      {!dbConfigured && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl text-amber-500 text-xs mb-3">
          <p className="font-bold mb-0.5 uppercase tracking-wider">Database Not Configured</p>
          <p className="opacity-80">Players will not be saved between sessions. Set <code className="bg-amber-500/20 px-1 rounded">DATABASE_URL</code> in Settings.</p>
        </div>
      )}

      {/* Resume in-progress game banner */}
      {activeSession && onResume && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-2xl p-4"
        >
          <PlayCircle size={22} className="text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-primary">Game in progress</p>
            <p className="text-xs text-on-surface-variant truncate">
              {activeSession.players.map((p) => p.name).join(", ")} &mdash; Round {activeSession.rounds.filter((r) => r.isCompleted).length + 1} of 11
            </p>
          </div>
          <button
            onClick={() => onResume(activeSession)}
            className="shrink-0 bg-primary text-white px-4 py-2 rounded-xl font-black text-sm active:scale-95 transition-all"
          >
            Resume
          </button>
        </motion.div>
      )}

      {/* Player cards + action button */}
      <div className="flex flex-col items-center pt-4 pb-4 w-full">
        <AnimatePresence mode="popLayout">
          {isLoading ? null : players.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full text-center py-16 border-2 border-dashed border-outline/10 rounded-3xl">
              <User size={48} className="mx-auto text-outline/20 mb-3" />
              <p className="text-on-surface-variant/50 text-sm">Add at least 2 players to start</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 w-full">
              {players.map((player) => {
                const isDealer = dealerId === player.id;
                const isHighlighted = highlightedPlayerId === player.id;
                const isSelected = selectedPlayerIds.has(player.id);
                const stats = statsMap[player.id] ?? { gamesPlayed: 0, gamesWon: 0, totalScore: 0, bestScore: null };
                return (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: isSelected ? 1 : 0.55, scale: isHighlighted ? 1.04 : 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => togglePlayerSelection(player.id)}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border cursor-pointer transition-colors select-none ${
                      isDealer ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                      : isSelected ? "border-primary/30 bg-surface-variant"
                      : "border-outline/10 bg-surface-variant/50"
                    }`}
                  >
                    {isSelected && !isDealer && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow">
                        <Check size={11} className="text-white" />
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); openProfile(player); }}
                      className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full bg-surface/80 flex items-center justify-center text-on-surface-variant/50 hover:text-primary transition-colors"
                    >
                      <Info size={13} />
                    </button>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-2 mt-2 ${
                      isDealer ? "border-primary" : isSelected ? "border-primary/40" : "border-outline/20"
                    } ${!player.avatarUrl ? "bg-primary/10" : ""}`}>
                      {player.avatarUrl ? (
                        <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={26} className={isDealer ? "text-primary" : "text-primary/60"} />
                      )}
                    </div>
                    <span className={`font-bold text-sm text-center truncate max-w-full px-1 ${isDealer ? "text-primary" : "text-on-surface"}`}>
                      {player.name}
                    </span>
                    {isDealer && <span className="text-[9px] font-black uppercase text-primary tracking-widest -mt-1">Dealer</span>}
                    <div className="text-[11px] text-on-surface-variant/70 font-medium">
                      {stats.gamesPlayed > 0 ? `${stats.gamesWon}W - ${stats.gamesPlayed - stats.gamesWon}L` : "No games yet"}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {selectedPlayers.length >= 2 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={dealerId ? () => onStart(selectedPlayers) : assignDealer}
            disabled={isAssigningDealer}
            className="mt-4 w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 elevation-2 active:scale-95 transition-all bg-primary text-white shadow-lg shadow-primary/30 disabled:opacity-50"
          >
            {isAssigningDealer ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <RotateCcw size={20} />
              </motion.div>
            ) : dealerId ? <Play size={20} fill="currentColor" /> : <Check size={20} />}
            {isAssigningDealer ? "Assigning..." : dealerId ? "Start Game" : "Assign Dealer"}
          </motion.button>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddPlayerOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="fixed inset-x-4 bottom-8 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-surface p-6 rounded-3xl shadow-2xl z-50 border border-outline/10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-primary uppercase tracking-tight">Add New Player</h3>
                <button onClick={() => setIsAddPlayerOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
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
                      <img src={newAvatar} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={32} className="text-on-surface-variant/50" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={20} className="text-white" />
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
                <div className="w-full space-y-4">
                  <input
                    type="text" autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { addPlayer(); setIsAddPlayerOpen(false); } }}
                    placeholder="Enter player name"
                    className="w-full px-4 py-4 rounded-2xl border border-outline bg-surface-variant text-on-surface focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-on-surface-variant/50 font-bold"
                  />
                  <button
                    onClick={() => { addPlayer(); setIsAddPlayerOpen(false); }}
                    disabled={!newName.trim()}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 elevation-2 disabled:opacity-50 active:scale-95 transition-all"
                  >
                    <Plus size={20} /> Add Player
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {profilePlayer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setProfilePlayer(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-sm bg-surface rounded-3xl shadow-2xl z-50 border border-outline/10 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h3 className="text-lg font-black text-primary uppercase tracking-tight">Player Profile</h3>
                <button onClick={() => setProfilePlayer(null)} className="p-1.5 hover:bg-surface-variant rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="px-5 pb-5 space-y-5">
                {/* Avatar — always clickable */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group cursor-pointer" onClick={() => editFileInputRef.current?.click()}>
                    <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center overflow-hidden">
                      {editAvatar ? (
                        <img src={editAvatar} alt={profilePlayer.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={30} className="text-primary/60" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                      <Camera size={18} className="text-white" />
                    </div>
                    <input type="file" ref={editFileInputRef} onChange={handleEditFileChange} accept="image/*" className="hidden" />
                  </div>

                  {/* Name — always an input */}
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-center font-black text-xl w-full px-3 py-2 rounded-xl border border-outline/20 bg-transparent text-on-surface focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-surface-variant outline-none transition-all"
                  />
                </div>

                {/* Stats grid */}
                {(() => {
                  const stats = statsMap[profilePlayer.id] ?? { gamesPlayed: 0, gamesWon: 0, totalScore: 0, bestScore: null };
                  const wr = winRate(stats);
                  const avg = avgScore(stats);
                  return (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-surface-variant rounded-2xl p-3 border border-outline/10">
                        <div className="flex items-center gap-1.5 text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider mb-1"><Target size={10} /> Games</div>
                        <div className="text-2xl font-black text-on-surface">{stats.gamesPlayed}</div>
                      </div>
                      <div className="bg-surface-variant rounded-2xl p-3 border border-outline/10">
                        <div className="flex items-center gap-1.5 text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider mb-1"><Trophy size={10} /> Wins</div>
                        <div className="text-2xl font-black text-primary">{stats.gamesWon}</div>
                      </div>
                      <div className="bg-surface-variant rounded-2xl p-3 border border-outline/10">
                        <div className="flex items-center gap-1.5 text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider mb-1"><TrendingUp size={10} /> Win Rate</div>
                        <div className="text-2xl font-black text-on-surface">{wr !== null ? `${wr}%` : "—"}</div>
                      </div>
                      <div className="bg-surface-variant rounded-2xl p-3 border border-outline/10">
                        <div className="flex items-center gap-1.5 text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider mb-1"><TrendingUp size={10} /> Avg Score</div>
                        <div className="text-2xl font-black text-on-surface">{avg !== null ? avg : "—"}</div>
                      </div>
                      {stats.bestScore !== null && (
                        <div className="col-span-2 bg-primary/10 rounded-2xl p-3 border border-primary/20">
                          <div className="flex items-center gap-1.5 text-primary/70 text-[10px] font-bold uppercase tracking-wider mb-1"><Trophy size={10} /> Best Score (Lowest)</div>
                          <div className="text-2xl font-black text-primary">{stats.bestScore}</div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Save + Delete */}
                <div className="flex gap-2">
                  <button
                    onClick={savePlayerEdit}
                    disabled={!editName.trim()}
                    className="flex-1 py-3 rounded-2xl bg-primary text-white font-black transition-all active:scale-95 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { if (confirm(`Remove ${profilePlayer.name}? Their stats will also be deleted.`)) removePlayer(profilePlayer.id); }}
                    className="flex-1 py-3 rounded-2xl border border-red-500/20 font-bold text-red-500 flex items-center justify-center gap-2 hover:bg-red-500/10 transition-all active:scale-95"
                  >
                    <Trash2 size={15} /> Delete
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
