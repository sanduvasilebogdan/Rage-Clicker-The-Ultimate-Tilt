
export interface GameState {
  score: number;
  level: number;
  clicks: number;
  misses: number;
  combo: number;
  maxCombo: number;
  patience: number; // 0-100
  isGameOver: boolean;
  gameStarted: boolean;
}

export interface TrashTalkMessage {
  text: string;
  type: 'insult' | 'taunt' | 'praise' | 'glitch';
  timestamp: number;
}

export enum Difficulty {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD',
  INSANE = 'INSANE',
  RAGE = 'RAGE'
}
