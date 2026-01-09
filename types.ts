
export interface PlayerState {
  score: number;
  clicks: number;
  misses: number;
  combo: number;
  maxCombo: number;
  patience: number;
}

export interface GameState {
  players: PlayerState[];
  level: number;
  isGameOver: boolean;
  gameStarted: boolean;
  isMultiplayer: boolean;
}

export interface TrashTalkMessage {
  text: string;
  type: 'insult' | 'taunt' | 'praise' | 'glitch';
  timestamp: number;
}
