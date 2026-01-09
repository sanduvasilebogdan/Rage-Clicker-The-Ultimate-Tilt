
import React, { useState, useEffect, useCallback, useRef } from 'react';
import RageButton from './components/RageButton';
import TrashTalkPanel from './components/TrashTalkPanel';
import { GameState, TrashTalkMessage, PlayerState, HighScore } from './types';
import { generateTrashTalk } from './services/geminiService';
import { Trophy, Activity, Ghost, Zap, MousePointer2, Target, XCircle, User, Play, ListOrdered } from 'lucide-react';

const STORAGE_KEY = 'rage_clicker_scores_v2';

const createPlayer = (nickname: string = ''): PlayerState => ({
  nickname: nickname || 'Player 1',
  score: 0,
  clicks: 0,
  misses: 0,
  combo: 0,
  maxCombo: 0,
  patience: 100,
});

const INITIAL_STATE: GameState = {
  player: createPlayer(),
  level: 1,
  isGameOver: false,
  gameStarted: false,
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
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  
  const announcerCooldown = useRef<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHighScores(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load scores");
      }
    }
  }, []);

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
    const msg = await generateTrashTalk(event, gameState.player.score, gameState.level, gameState.player.combo);
    setMessages(prev => [...prev, { text: msg, type: 'insult', timestamp: now }]);
  };

  const saveScore = (nickname: string, score: number, level: number) => {
    const newScore: HighScore = {
      nickname: nickname || 'Anonymous',
      score,
      level,
      date: new Date().toLocaleDateString()
    };
    const updated = [...highScores, newScore].sort((a, b) => b.score - a.score).slice(0, 10);
    setHighScores(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleHit = useCallback((x: number, y: number) => {
    addFeedback(x, y, "OK!", '#4ade80');
    setGameState(prev => {
      const p = prev.player;
      const scoreGain = 10 * prev.level * (p.combo + 1);
      const newScore = p.score + scoreGain;
      const shouldLevelUp = newScore >= prev.level * 400;
      
      return {
        ...prev,
        player: {
          ...p,
          score: newScore,
          clicks: p.clicks + 1,
          combo: p.combo + 1,
          maxCombo: Math.max(p.maxCombo, p.combo + 1),
          patience: Math.min(100, p.patience + 5),
        },
        level: shouldLevelUp ? prev.level + 1 : prev.level,
      };
    });

    if (gameState.player.combo > 0 && gameState.player.combo % 5 === 0) {
      triggerTrashTalk("user is actually hitting it");
    }
  }, [gameState.level, gameState.player.combo, gameState.player.score]);

  const handleMiss = useCallback((e?: React.MouseEvent) => {
    if (!gameState.gameStarted || gameState.isGameOver) return;
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 150);

    if (e) addFeedback(e.clientX, e.clientY, "MISS!", "#ef4444");

    setGameState(prev => {
      const p = prev.player;
      const newPatience = p.patience - 10;
      const isGameOver = newPatience <= 0;
      
      if (isGameOver) {
        saveScore(p.nickname, p.score, prev.level);
      }

      return {
        ...prev,
        player: {
          ...p,
          misses: p.misses + 1,
          combo: 0,
          patience: newPatience,
        },
        isGameOver,
      };
    });

    triggerTrashTalk("missed again, lol");
  }, [gameState.gameStarted, gameState.isGameOver, highScores]);

  const startSolo = () => {
    setGameState({ 
      player: createPlayer(nicknameInput), 
      level: 1, 
      isGameOver: false, 
      gameStarted: true,
    });
  };

  const renderStats = (p: PlayerState) => (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-4 bg-black/60 px-6 py-3 rounded-2xl border-2 border-red-500/30 backdrop-blur-md">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase opacity-60 tracking-wider mb-1">{p.nickname}</span>
          <div className="flex items-center gap-3">
            <Trophy className="text-yellow-400" size={24} />
            <span className="retro-font text-2xl">{p.score.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-6 mt-1">
        <div className="flex items-center gap-1">
          <Target size={14} className="text-green-400 opacity-80" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/70">Hits: {p.clicks}</span>
        </div>
        <div className="flex items-center gap-1">
          <XCircle size={14} className="text-red-400 opacity-80" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/70">Misses: {p.misses}</span>
        </div>
      </div>
      <div className="w-80 h-3 bg-gray-900 rounded-full overflow-hidden border border-white/10 mt-2 shadow-inner">
        <div 
          className={`h-full transition-all duration-300 ${p.patience > 30 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}
          style={{ width: `${p.patience}%` }}
        />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Stability Meter</p>
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
          <div className="absolute top-0 left-0 right-0 p-10 flex flex-col items-center z-40 pointer-events-none">
            <div className="bg-white/10 px-4 py-1 rounded-full backdrop-blur-md mb-4">
              <span className="text-xs font-black tracking-widest uppercase flex items-center gap-2">
                <Activity size={12} className="text-blue-400" />
                Level {gameState.level}
              </span>
            </div>
            {renderStats(gameState.player)}
          </div>

          {!gameState.isGameOver && (
            <RageButton level={gameState.level} onClick={(x, y) => handleHit(x, y)} onMiss={() => handleMiss()} />
          )}
        </>
      )}

      {/* Combo Multiplier Overlay */}
      {gameState.gameStarted && gameState.player.combo > 1 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 opacity-20">
          <p className="retro-font text-[15rem] text-white/10 italic">{gameState.player.combo}x</p>
        </div>
      )}

      {/* Menu Overlay */}
      {!gameState.gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-xl z-50">
          <div className="relative w-full max-w-lg bg-slate-900 border-2 border-red-600/30 rounded-[2.5rem] shadow-2xl p-12 overflow-hidden transform hover:scale-[1.01] transition-transform duration-500">
            {/* Background Decor */}
            <div className="absolute -bottom-10 -left-10 opacity-5 -rotate-12 pointer-events-none"><Ghost size={240} /></div>
            
            {!showScoreboard ? (
              <div className="relative z-10 flex flex-col items-center">
                <h1 className="retro-font text-5xl mb-3 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] tracking-tighter">RAGE CLICKER</h1>
                <p className="text-gray-400 mb-12 text-xs font-black uppercase tracking-[0.25em]">Victory is for the patient. You are not.</p>
                
                <div className="w-full space-y-6 mb-10">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-400/80">
                      <User size={16} />
                      <span className="font-black text-[10px] uppercase tracking-widest">Identify Yourself</span>
                    </div>
                    <input 
                      type="text" 
                      placeholder="ENTER NICKNAME..."
                      value={nicknameInput}
                      onChange={e => setNicknameInput(e.target.value)}
                      maxLength={14}
                      className="w-full bg-black/50 border-2 border-white/10 rounded-2xl px-6 py-4 retro-font text-sm focus:border-red-500 outline-none transition-all placeholder:opacity-30"
                    />
                  </div>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); startSolo(); }}
                  className="w-full flex items-center justify-center gap-4 bg-red-600 hover:bg-red-500 text-white px-8 py-6 rounded-2xl shadow-[0_8px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none transition-all"
                >
                  <Play fill="white" size={24} />
                  <span className="retro-font text-lg">START THE PAIN</span>
                </button>

                <button 
                  onClick={(e) => { e.stopPropagation(); setShowScoreboard(true); }}
                  className="mt-8 flex items-center gap-2 text-white/30 hover:text-white transition-colors uppercase font-black text-[11px] tracking-widest group"
                >
                  <ListOrdered size={16} className="group-hover:rotate-12 transition-transform" /> 
                  Hall of Shame
                </button>
              </div>
            ) : (
              <div className="relative z-10 flex flex-col h-[500px]">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="retro-font text-3xl text-yellow-400">HALL OF SHAME</h2>
                  <button 
                    onClick={() => setShowScoreboard(false)}
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all"
                  >
                    Back
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-3 space-y-3 custom-scrollbar">
                  {highScores.length > 0 ? (
                    highScores.map((s, i) => (
                      <div key={i} className="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                        <span className="retro-font text-xl text-white/20 w-12 italic">#{i + 1}</span>
                        <div className="flex-1">
                          <p className="font-black text-sm uppercase text-white tracking-wider">{s.nickname}</p>
                          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">LVL {s.level} • {s.date}</p>
                        </div>
                        <p className="retro-font text-xl text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">{s.score.toLocaleString()}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/10 font-black uppercase tracking-[0.3em] italic gap-4">
                      <XCircle size={64} />
                      No records... Cowards.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState.isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-950/95 backdrop-blur-2xl z-50">
          <div className="text-center p-14 bg-black border-4 border-yellow-500 rounded-[3rem] shadow-2xl max-w-xl animate-in fade-in zoom-in duration-500">
            <h2 className="retro-font text-6xl mb-4 text-white italic tracking-tighter">TOTAL FAILURE</h2>
            <p className="text-yellow-500 font-black text-xs uppercase tracking-[0.5em] mb-12">Patience Level: Zero</p>
            
            <div className="grid grid-cols-2 gap-6 mb-12">
              <div className="p-8 bg-white/5 border border-white/10 rounded-3xl">
                <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-white/40">Final Score</p>
                <p className="retro-font text-4xl text-white">{gameState.player.score.toLocaleString()}</p>
              </div>
              <div className="p-8 bg-white/5 border border-white/10 rounded-3xl">
                <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-white/40">Max Combo</p>
                <p className="retro-font text-4xl text-yellow-400">{gameState.player.maxCombo}</p>
              </div>
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); setGameState(INITIAL_STATE); }}
              className="retro-font bg-yellow-500 hover:bg-yellow-400 text-black px-14 py-7 text-2xl rounded-3xl transition-all shadow-[0_10px_0_rgb(161,98,7)] active:translate-y-1 active:shadow-none"
            >
              MAIN MENU
            </button>
          </div>
        </div>
      )}

      <TrashTalkPanel messages={messages} />

      {/* Decorative BG elements */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]">
        <div className="absolute top-20 right-20 animate-pulse"><Ghost size={240} /></div>
        <div className="absolute bottom-40 left-40 animate-bounce"><Zap size={180} /></div>
      </div>

      <style>{`
        @keyframes bounce-up {
          0% { transform: translate(-50%, -100%) scale(0.5); opacity: 0; }
          20% { transform: translate(-50%, -150%) scale(1.4); opacity: 1; }
          100% { transform: translate(-50%, -280%) scale(1); opacity: 0; }
        }
        .animate-bounce-up {
          animation: bounce-up 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

export default App;
