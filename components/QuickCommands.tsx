import React from 'react';

interface QuickCommandsProps {
  onSelect: (cmd: string) => void;
  onClose: () => void;
}

const QuickCommands: React.FC<QuickCommandsProps> = ({ onSelect, onClose }) => {
  const commands = [
    { icon: 'fa-cloud-sun', label: "Check Weather", text: "How is the weather today?", color: 'text-amber-500' },
    { icon: 'fa-clock', label: "Current Time", text: "What time is it now?", color: 'text-blue-500' },
    { icon: 'fa-music', label: "Play Music", text: "Play some music for me", color: 'text-purple-500' },
    { icon: 'fa-receipt', label: "Log Expense", text: "Help me record an expense", color: 'text-emerald-500' },
    { icon: 'fa-list-check', label: "Daily Summary", text: "Give me a summary of my day", color: 'text-indigo-500' },
  ];

  return (
    <div className="w-64 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-slideUp">
      <div className="flex justify-between items-center px-4 py-3 border-b border-slate-50 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Shortcuts</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <i className="fa-solid fa-xmark text-sm"></i>
          </button>
      </div>
      <div className="p-1">
          {commands.map((cmd, idx) => (
              <button
                  key={idx}
                  onClick={() => {
                      onSelect(cmd.text);
                      onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group text-left"
              >
                  <div className={`w-6 h-6 rounded flex items-center justify-center bg-slate-50 group-hover:bg-white border border-transparent group-hover:border-slate-100 ${cmd.color}`}>
                      <i className={`fa-solid ${cmd.icon} text-xs`}></i>
                  </div>
                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{cmd.label}</span>
              </button>
          ))}
      </div>
    </div>
  );
};

export default QuickCommands;