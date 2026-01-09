
import React, { useState, useEffect, useCallback, useRef } from 'react';
import RageButton from './components/RageButton';
import TrashTalkPanel from './components/TrashTalkPanel';
import { GameState, TrashTalkMessage, PlayerState } from './types';
import { generateTrashTalk } from './services/geminiService';
import { Trophy, Activity, Ghost, Zap, MousePointer2, Target, XCircle, Users, User } from 'lucide-react';

const createPlayer = (): PlayerState => ({
  score: 0,
  clicks: 0,
  misses: 0,
  combo: 0,
  maxCombo: 0,
  patience: 100,
});

const INITIAL_STATE: GameState = {
  players: [createPlayer()],
  level: 1,
  isGameOver: false,
  gameStarted: false,
  isMultiplayer: false,
};

interface FloatingFeedback {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [messages, setMessages] = useState<TrashTalkMessage[]>([]);
  const [feedbacks, setFeedbacks] = useState<FloatingFeedback[]>([]);
  const [screenShake, setScreenShake] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const announcerCooldown = useRef<number>(0);

  useEffect(() => {
    const move = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  const addFeedback = (x: number, y: number, text: string, color: string = '#ffffff') => {
    const id = Date.now() + Math.random();
    setFeedbacks(f => [...f, { id, x, y, text, color }]);
    setTimeout(() => setFeedbacks(f => f.filter(item => item.id !== id)), 800);
  };

  const triggerTrashTalk = async (event: string) => {
    const now = Date.now();
    if (now - announcerCooldown.current < 3000) return;
    announcerCooldown.current = now;
    const msg = await generateTrashTalk(event, 0, gameState.level, 0);
    setMessages(prev => [...prev, { text: msg, type: 'insult', timestamp: now }]);
  };

  const handleHit = useCallback((playerIdx: number, x: number, y: number) => {
    addFeedback(x, y, "HIT!", playerIdx === 0 ? '#ef4444' : '#3b82f6');
    setGameState(prev => {
      const newPlayers = [...prev.players];
      const p = newPlayers[playerIdx];
      const scoreGain = 10 * prev.level * (p.combo + 1);
      
      newPlayers[playerIdx] = {
        ...p,
        score: p.score + scoreGain,
        clicks: p.clicks + 1,
        combo: p.combo + 1,
        maxCombo: Math.max(p.maxCombo, p.combo + 1),
        patience: Math.min(100, p.patience + 3),
      };

      const totalScore = newPlayers.reduce((sum, p) => sum + p.score, 0);
      const shouldLevelUp = totalScore >= prev.level * 500;

      return {
        ...prev,
        players: newPlayers,
        level: shouldLevelUp ? prev.level + 1 : prev.level,
      };
    });
  }, []);

  const handleMiss = useCallback((e?: React.MouseEvent) => {
    if (!gameState.gameStarted || gameState.isGameOver) return;
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 150);

    if (e) addFeedback(e.clientX, e.clientY, "MISS!", "#ffffff");

    setGameState(prev => {
      // In multiplayer, a background miss affects everyone
      const newPlayers = prev.players.map(p => ({
        ...p,
        misses: p.misses + 1,
        combo: 0,
        patience: p.patience - 10,
      }));

      const anyDead = newPlayers.some(p => p.patience <= 0);
      return { ...prev, players: newPlayers, isGameOver: anyDead };
    });

    triggerTrashTalk("user is failing miserably");
  }, [gameState.gameStarted, gameState.isGameOver]);

  const startSolo = () => {
    setGameState({ 
      players: [createPlayer()], 
      level: 1, 
      isGameOver: false, 
      gameStarted: true, 
      isMultiplayer: false 
    });
  };

  const startMultiplayer = () => {
    setGameState({ 
      players: [createPlayer(), createPlayer()], 
      level: 1, 
      isGameOver: false, 
      gameStarted: true, 
      isMultiplayer: true 
    });
  };

  const renderStats = (p: PlayerState, idx: number) => (
    <div className={`flex flex-col gap-2 ${idx === 1 ? 'items-end text-right' : 'items-start text-left'}`}>
      <div className={`flex items-center gap-3 bg-black/60 px-4 py-2 rounded-xl border-2 backdrop-blur-md ${idx === 0 ? 'border-red-500/50' : 'border-blue-500/50'}`}>
        <Trophy className={idx === 0 ? 'text-red-400' : 'text-blue-400'} size={20} />
        <span className="retro-font text-xl">{p.score.toLocaleString()}</span>
      </div>
      <div className="flex gap-2">
        <span className="text-[10px] font-bold opacity-60 uppercase tracking-tighter">Hits: {p.clicks}</span>
        <span className="text-[10px] font-bold opacity-60 uppercase tracking-tighter">Combo: {p.combo}</span>
      </div>
      <div className="w-48 h-2 bg-gray-900 rounded-full overflow-hidden border border-white/10">
        <div 
          className={`h-full transition-all duration-300 ${idx === 0 ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${p.patience}%` }}
        />
      </div>
    </div>
  );

  return (
    <div 
      className={`relative h-screen w-screen bg-rage overflow-hidden select-none cursor-none ${screenShake ? 'shake' : ''}`}
      onClick={() => handleMiss()}
    >
      {/* Custom Cursor */}
      <div 
        className="fixed w-8 h-8 pointer-events-none z-[100] transition-transform duration-75"
        style={{ left: cursor.x - 16, top: cursor.y - 16 }}
      >
        <MousePointer2 className="text-white fill-white shadow-xl rotate-[-15deg]" size={32} />
      </div>

      {/* Floating Feedbacks */}
      {feedbacks.map(f => (
        <div key={f.id} className="fixed pointer-events-none z-50 retro-font text-xl animate-bounce-up"
             style={{ left: f.x, top: f.y, color: f.color, transform: 'translate(-50%, -100%)' }}>
          {f.text}
        </div>
      ))}

      {/* Game UI */}
      {gameState.gameStarted && (
        <>
          <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-40 pointer-events-none">
            {renderStats(gameState.players[0], 0)}
            <div className="flex flex-col items-center">
              <div className="bg-white/10 px-4 py-1 rounded-full backdrop-blur-md mb-2">
                <span className="text-xs font-black tracking-widest uppercase">Level {gameState.level}</span>
              </div>
              {gameState.isMultiplayer && <div className="retro-font text-4xl text-white/10 italic">VS</div>}
            </div>
            {gameState.isMultiplayer && renderStats(gameState.players[1], 1)}
          </div>

          {!gameState.isGameOver && (
            <>
              <RageButton level={gameState.level} color="red" onClick={(x, y) => handleHit(0, x, y)} onMiss={handleMiss} />
              {gameState.isMultiplayer && (
                <RageButton level={gameState.level} color="blue" onClick={(x, y) => handleHit(1, x, y)} onMiss={handleMiss} />
              )}
            </>
          )}
        </>
      )}

      {/* Start Overlay */}
      {!gameState.gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-lg z-50">
          <div className="text-center p-12 bg-slate-900 border-t-8 border-red-600 rounded-3xl shadow-2xl max-w-xl">
            <h1 className="retro-font text-5xl mb-4 text-red-500">RAGE CLICKER</h1>
            <p className="text-gray-400 mb-10 text-lg">Choose your level of suffering.</p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={(e) => { e.stopPropagation(); startSolo(); }}
                className="flex items-center justify-center gap-4 retro-font bg-red-600 hover:bg-red-500 text-white px-8 py-5 text-lg rounded-2xl transition-all hover:scale-105 active:scale-95"
              >
                <User size={24} /> SOLO SURVIVAL
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); startMultiplayer(); }}
                className="flex items-center justify-center gap-4 retro-font bg-blue-600 hover:bg-blue-500 text-white px-8 py-5 text-lg rounded-2xl transition-all hover:scale-105 active:scale-95"
              >
                <Users size={24} /> 1V1 BATTLE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState.isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-950/90 backdrop-blur-xl z-50">
          <div className="text-center p-12 bg-black border-4 border-yellow-500 rounded-3xl shadow-2xl max-w-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="retro-font text-5xl mb-8 text-white">
              {gameState.isMultiplayer 
                ? (gameState.players[0].score > gameState.players[1].score ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!')
                : 'GAME OVER'}
            </h2>
            
            <div className="grid grid-cols-2 gap-6 mb-10">
              <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <p className="retro-font text-red-400 text-sm mb-2">P1 SCORE</p>
                <p className="retro-font text-3xl">{gameState.players[0].score}</p>
              </div>
              {gameState.isMultiplayer && (
                <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                  <p className="retro-font text-blue-400 text-sm mb-2">P2 SCORE</p>
                  <p className="retro-font text-3xl">{gameState.players[1].score}</p>
                </div>
              )}
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); setGameState(INITIAL_STATE); }}
              className="retro-font bg-yellow-500 hover:bg-yellow-400 text-black px-12 py-6 text-2xl rounded-2xl transition-all"
            >
              MAIN MENU
            </button>
          </div>
        </div>
      )}

      <TrashTalkPanel messages={messages} />

      <style>{`
        @keyframes bounce-up {
          0% { transform: translate(-50%, -100%) scale(0.5); opacity: 0; }
          20% { transform: translate(-50%, -150%) scale(1.3); opacity: 1; }
          100% { transform: translate(-50%, -250%) scale(1); opacity: 0; }
        }
        .animate-bounce-up {
          animation: bounce-up 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
