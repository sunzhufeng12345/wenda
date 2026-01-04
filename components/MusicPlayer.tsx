import React, { useState, useEffect } from 'react';
import { MusicState } from '../types';

interface MusicPlayerProps {
  state: MusicState;
  onClose: () => void;
  onTogglePlay: () => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ state, onClose, onTogglePlay }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (state.isPlaying) {
      interval = setInterval(() => {
        setProgress(p => (p >= 100 ? 0 : p + 0.5));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.isPlaying]);

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 w-72 animate-slideUp overflow-hidden">
      <div className="p-4 flex gap-4 items-center border-b border-slate-100/50">
         <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-800 to-black flex items-center justify-center shadow-md relative overflow-hidden flex-shrink-0">
            <div className={`absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 opacity-60 ${state.isPlaying ? 'animate-pulse' : ''}`}></div>
            <i className="fa-solid fa-music text-white relative z-10"></i>
         </div>
         <div className="flex-1 min-w-0">
             <div className="text-sm font-bold text-slate-800 truncate">{state.title}</div>
             <div className="text-xs text-slate-500 truncate">{state.artist}</div>
         </div>
         <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors">
            <i className="fa-solid fa-xmark text-sm"></i>
         </button>
      </div>
      
      {/* Controls */}
      <div className="bg-slate-50/50 p-3 flex items-center justify-between gap-3">
         <button className="text-slate-400 hover:text-blue-500"><i className="fa-solid fa-backward-step"></i></button>
         <button 
            onClick={onTogglePlay}
            className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
         >
            <i className={`fa-solid ${state.isPlaying ? 'fa-pause' : 'fa-play'} text-xs`}></i>
         </button>
         <button className="text-slate-400 hover:text-blue-500"><i className="fa-solid fa-forward-step"></i></button>
         
         <div className="flex-1 h-1 bg-slate-200 rounded-full ml-2">
             <div className="h-full bg-blue-500 rounded-full" style={{width: `${progress}%`}}></div>
         </div>
      </div>
    </div>
  );
};

export default MusicPlayer;