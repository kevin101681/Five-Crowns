import { Round } from './types';

export const ROUNDS_DATA: Omit<Round, 'scores' | 'isCompleted'>[] = [
  { number: 1, wildCard: '3', cardsDealt: 3 },
  { number: 2, wildCard: '4', cardsDealt: 4 },
  { number: 3, wildCard: '5', cardsDealt: 5 },
  { number: 4, wildCard: '6', cardsDealt: 6 },
  { number: 5, wildCard: '7', cardsDealt: 7 },
  { number: 6, wildCard: '8', cardsDealt: 8 },
  { number: 7, wildCard: '9', cardsDealt: 9 },
  { number: 8, wildCard: '10', cardsDealt: 10 },
  { number: 9, wildCard: 'J', cardsDealt: 11 },
  { number: 10, wildCard: 'Q', cardsDealt: 12 },
  { number: 11, wildCard: 'K', cardsDealt: 13 },
];

export const CARD_VALUES = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'Joker'];

export const getCardPoints = (card: string, wildCard: string): number => {
  if (card === 'Joker') return 50;
  if (card === wildCard) return 20;
  
  if (['J', 'Q', 'K', '10'].includes(card)) return 10;
  
  const val = parseInt(card);
  if (!isNaN(val)) return val;
  
  return 0;
};
