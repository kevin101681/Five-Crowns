import { Player, Round } from '../types';
import { Trophy } from 'lucide-react';

interface ScoreboardProps {
  players: Player[];
  rounds: Round[];
}

export default function Scoreboard({ players, rounds }: ScoreboardProps) {
  const calculateTotal = (playerId: string) => {
    return rounds.reduce((total, round) => {
      return total + (round.scores[playerId]?.score || 0);
    }, 0);
  };

  const sortedPlayers = [...players].sort((a, b) => calculateTotal(a.id) - calculateTotal(b.id));
  const leadingScore = calculateTotal(sortedPlayers[0].id);

  return (
    <div className="sticky top-0 z-20 bg-primary text-white p-4 elevation-2 rounded-b-3xl mb-4">
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1.5 rounded-full font-medium">
          <Trophy size={14} />
          <span>Leader: {sortedPlayers[0].name}</span>
        </div>
      </div>
      
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
        {sortedPlayers.map((player) => {
          const total = calculateTotal(player.id);
          const isLeading = total === leadingScore;
          
          return (
            <div key={player.id} className="flex flex-col items-center min-w-[100px]">
              <span className={`text-lg truncate w-full text-center ${isLeading ? 'font-bold' : 'opacity-80'}`}>
                {player.name}
              </span>
              <span className={`text-4xl font-bold ${isLeading && total !== 0 ? 'text-yellow-300' : 'text-white'}`}>
                {total}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
