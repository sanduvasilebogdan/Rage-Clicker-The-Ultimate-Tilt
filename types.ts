
export interface PlayerState {
  nickname: string;
  score: number;
  clicks: number;
  misses: number;
  combo: number;
  maxCombo: number;
  patience: number; // 0-100
}

export interface GameState {
  player: PlayerState;
  level: number;
  isGameOver: boolean;
  gameStarted: boolean;
}

export interface HighScore {
  nickname: string;
  score: number;
  level: number;
  date: string;
}

export interface TrashTalkMessage {
  text: string;
  type: 'insult' | 'taunt' | 'praise' | 'glitch';
  timestamp: number;
}
