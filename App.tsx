
import React, { useState, useEffect, useCallback, useRef } from 'react';
import RageButton from './components/RageButton';
import TrashTalkPanel from './components/TrashTalkPanel';
import { GameState, TrashTalkMessage } from './types';
import { generateTrashTalk } from './services/geminiService';
import { Trophy, Activity, Ghost, Zap, MousePointer2, Target, XCircle } from 'lucide-react';

const INITIAL_STATE: GameState = {
  score: 0,
  level: 1,
  clicks: 0,
  misses: 0,
  combo: 0,
  maxCombo: 0,
  patience: 100,
  isGameOver: false,
  gameStarted: false,
};

interface FloatingFeedback {
  id: number;
  x: number;
  y: number;
  text: string;
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [messages, setMessages] = useState<TrashTalkMessage[]>([]);
  const [feedbacks, setFeedbacks] = useState<FloatingFeedback[]>([]);
  const [screenShake, setScreenShake] = useState(false);
  const [customCursor, setCustomCursor] = useState({ x: 0, y: 0 });
  const announcerCooldown = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCustomCursor({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const triggerTrashTalk = async (event: string) => {
    const now = Date.now();
    if (now - announcerCooldown.current < 2000) return;
    
    announcerCooldown.current = now;
    const msg = await generateTrashTalk(
      event, 
      gameState.score, 
      gameState.level, 
      gameState.combo
    );
    
    setMessages(prev => [...prev, {
      text: msg,
      type: event.includes('miss') ? 'insult' : 'praise',
      timestamp: now
    }]);
  };

  const addFeedback = (x: number, y: number, text: string) => {
    const id = Date.now();
    setFeedbacks(prev => [...prev, { id, x, y, text }]);
    setTimeout(() => {
      setFeedbacks(prev => prev.filter(f => f.id !== id));
    }, 800);
  };

  const handleHit = useCallback((x: number, y: number) => {
    addFeedback(x, y, "OK!");
    
    setGameState(prev => {
      const scoreGain = 10 * prev.level * (prev.combo + 1);
      const newScore = prev.score + scoreGain;
      const newCombo = prev.combo + 1;
      const nextLevelScore = prev.level * 300;
      const shouldLevelUp = newScore >= nextLevelScore;
      
      return {
        ...prev,
        score: newScore,
        clicks: prev.clicks + 1,
        combo: newCombo,
        maxCombo: Math.max(prev.maxCombo, newCombo),
        level: shouldLevelUp ? prev.level + 1 : prev.level,
        patience: Math.min(100, prev.patience + 5)
      };
    });

    if (gameState.combo > 0 && gameState.combo % 5 === 0) {
      triggerTrashTalk("user hit a combo");
    }
  }, [gameState.score, gameState.level, gameState.combo]);

  const handleMiss = useCallback((e?: React.MouseEvent) => {
    // Only process miss if game is active
    if (!gameState.gameStarted || gameState.isGameOver) return;
    
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 150);

    if (e) addFeedback(e.clientX, e.clientY, "MISS!");

    setGameState(prev => {
      const newPatience = prev.patience - 10;
      const gameOver = newPatience <= 0;
      
      return {
        ...prev,
        misses: prev.misses + 1,
        combo: 0,
        patience: newPatience,
        isGameOver: gameOver
      };
    });

    triggerTrashTalk("user missed the button");
  }, [gameState.gameStarted, gameState.isGameOver]);

  const startGame = () => {
    setGameState({ ...INITIAL_STATE, gameStarted: true });
    setMessages([{
      text: "Go on then. Catch it if you can.",
      type: 'taunt',
      timestamp: Date.now()
    }]);
  };

  return (
    <div 
      className={`relative h-screen w-screen bg-rage overflow-hidden select-none cursor-none ${screenShake ? 'shake' : ''}`}
      onClick={() => handleMiss()}
    >
      {/* Custom Cursor */}
      <div 
        className="fixed w-8 h-8 pointer-events-none z-[100] transition-transform duration-75"
        style={{ left: customCursor.x - 16, top: customCursor.y - 16 }}
      >
        <MousePointer2 className="text-white fill-white shadow-xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] rotate-[-15deg]" size={32} />
      </div>

      {/* Floating Feedbacks */}
      {feedbacks.map(f => (
        <div 
          key={f.id}
          className="fixed pointer-events-none z-50 retro-font text-xl animate-bounce-up"
          style={{ 
            left: f.x, 
            top: f.y, 
            color: f.text === 'OK!' ? '#4ade80' : '#ef4444',
            transform: 'translate(-50%, -100%)'
          }}
        >
          {f.text}
        </div>
      ))}

      {/* Header UI */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-40 pointer-events-none">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 bg-black/60 px-5 py-2 rounded-full border border-white/10 backdrop-blur-lg">
            <Trophy className="text-yellow-400" size={24} />
            <span className="retro-font text-2xl text-white">{gameState.score.toLocaleString()}</span>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-green-900/40 px-3 py-1 rounded-full border border-green-500/20 backdrop-blur-sm">
              <Target size={14} className="text-green-400" />
              <span className="text-xs font-bold uppercase text-green-400">Hits: {gameState.clicks}</span>
            </div>
            <div className="flex items-center gap-2 bg-red-900/40 px-3 py-1 rounded-full border border-red-500/20 backdrop-blur-sm">
              <XCircle size={14} className="text-red-400" />
              <span className="text-xs font-bold uppercase text-red-400">Misses: {gameState.misses}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="text-blue-400" size={16} />
            <span className="font-bold text-sm tracking-widest text-blue-300">LEVEL {gameState.level}</span>
          </div>
          <div className="w-64 h-3 bg-gray-900 rounded-full overflow-hidden border border-white/10 shadow-inner">
            <div 
              className={`h-full transition-all duration-300 ${gameState.patience > 30 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}
              style={{ width: `${gameState.patience}%` }}
            ></div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Stability Meter</p>
        </div>
      </div>

      {/* Combo Multiplier */}
      {gameState.combo > 1 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-10 text-center animate-pulse">
          <p className="retro-font text-7xl text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,1)]">
            {gameState.combo}x
          </p>
          <p className="font-black text-white text-2xl uppercase italic tracking-widest">COMBO FIRE!!</p>
        </div>
      )}

      {/* The Button */}
      {gameState.gameStarted && !gameState.isGameOver && (
        <RageButton 
          level={gameState.level} 
          onClick={handleHit} 
          onMiss={() => handleMiss()} 
        />
      )}

      {/* Overlays */}
      {!gameState.gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50">
          <div className="text-center p-12 bg-slate-900 border-b-8 border-red-600 rounded-3xl shadow-2xl max-w-lg transform hover:scale-[1.02] transition-transform">
            <h1 className="retro-font text-5xl mb-6 text-red-500 drop-shadow-lg">RAGE CLICKER</h1>
            <p className="text-gray-300 mb-8 text-lg leading-relaxed font-medium">
              Click the button. Don't click the background.
              The button moves randomly and hates you.
              Lose your patience, lose the game.
            </p>
            <button 
              onClick={(e) => { e.stopPropagation(); startGame(); }}
              className="retro-font bg-red-600 hover:bg-red-500 text-white px-10 py-5 text-xl rounded-2xl shadow-[0_10px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none transition-all"
            >
              START THE PAIN
            </button>
          </div>
        </div>
      )}

      {gameState.isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-950/90 backdrop-blur-xl z-50">
          <div className="text-center p-12 bg-black border-4 border-yellow-500 rounded-3xl shadow-2xl max-w-xl animate-in fade-in zoom-in duration-300">
            <h2 className="retro-font text-6xl mb-4 text-white italic">RAGE QUIT?</h2>
            <div className="h-1 w-full bg-yellow-500/30 mb-8"></div>
            
            <div className="grid grid-cols-2 gap-4 mb-8 text-left">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Score</p>
                <p className="retro-font text-2xl text-white">{gameState.score.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Max Combo</p>
                <p className="retro-font text-2xl text-yellow-400">{gameState.maxCombo}</p>
              </div>
              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-2xl">
                <p className="text-green-500/50 text-[10px] font-bold uppercase tracking-widest mb-1">Total Hits</p>
                <p className="retro-font text-2xl text-green-400">{gameState.clicks}</p>
              </div>
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl">
                <p className="text-red-500/50 text-[10px] font-bold uppercase tracking-widest mb-1">Total Misses</p>
                <p className="retro-font text-2xl text-red-400">{gameState.misses}</p>
              </div>
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); startGame(); }}
              className="retro-font bg-yellow-500 hover:bg-yellow-400 text-black px-12 py-6 text-2xl rounded-2xl shadow-[0_10px_0_rgb(161,98,7)] active:translate-y-1 active:shadow-none transition-all"
            >
              RETRY
            </button>
          </div>
        </div>
      )}

      <TrashTalkPanel messages={messages} />

      {/* Decorative BG elements */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute top-20 right-20 animate-pulse"><Ghost size={200} /></div>
        <div className="absolute bottom-40 left-40 animate-bounce"><Zap size={150} /></div>
      </div>

      <style>{`
        @keyframes bounce-up {
          0% { transform: translate(-50%, -100%) scale(0.5); opacity: 0; }
          20% { transform: translate(-50%, -150%) scale(1.2); opacity: 1; }
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
