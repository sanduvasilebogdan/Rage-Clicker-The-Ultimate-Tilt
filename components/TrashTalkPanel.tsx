
import React from 'react';
import { TrashTalkMessage } from '../types';

interface TrashTalkPanelProps {
  messages: TrashTalkMessage[];
}

const TrashTalkPanel: React.FC<TrashTalkPanelProps> = ({ messages }) => {
  return (
    <div className="fixed bottom-10 left-10 max-w-sm z-40 pointer-events-none">
      <div className="space-y-4">
        {messages.slice(-3).map((msg) => (
          <div 
            key={msg.timestamp}
            className={`
              p-4 rounded-lg border-l-4 bg-slate-900/80 backdrop-blur-md shadow-xl
              transform transition-all duration-300 translate-y-0
              ${msg.type === 'insult' ? 'border-red-500' : 'border-blue-500'}
            `}
          >
            <p className="text-sm font-bold opacity-50 uppercase tracking-widest mb-1">
              Announcer:
            </p>
            <p className="text-lg font-medium leading-tight">
              {msg.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrashTalkPanel;
