export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  bestScore: number | null;
}

const STATS_KEY = "five-crowns-stats";

export function getAllStats(): Record<string, PlayerStats> {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function getPlayerStats(playerId: string): PlayerStats {
  return getAllStats()[playerId] ?? { gamesPlayed: 0, gamesWon: 0, totalScore: 0, bestScore: null };
}

export function recordGameResults(
  results: Array<{ playerId: string; score: number; isWinner: boolean }>
) {
  const all = getAllStats();
  for (const { playerId, score, isWinner } of results) {
    const s = all[playerId] ?? { gamesPlayed: 0, gamesWon: 0, totalScore: 0, bestScore: null };
    s.gamesPlayed++;
    if (isWinner) s.gamesWon++;
    s.totalScore += score;
    if (s.bestScore === null || score < s.bestScore) s.bestScore = score;
    all[playerId] = s;
  }
  localStorage.setItem(STATS_KEY, JSON.stringify(all));
}

export function deletePlayerStats(playerId: string) {
  const all = getAllStats();
  delete all[playerId];
  localStorage.setItem(STATS_KEY, JSON.stringify(all));
}
