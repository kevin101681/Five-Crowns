export interface Player {
  id: string;
  name: string;
}

export interface RoundScore {
  playerId: string;
  score: number;
  wentOut: boolean;
  cards: string[]; // List of card values selected
}

export interface Round {
  number: number; // 1 to 11
  wildCard: string; // '3', '4', ..., '10', 'J', 'Q', 'K'
  cardsDealt: number; // 3 to 13
  scores: Record<string, RoundScore>; // playerId -> RoundScore
  isCompleted: boolean;
}

export type GameStatus = 'setup' | 'playing' | 'finished';
