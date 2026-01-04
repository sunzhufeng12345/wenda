import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  deviceId: string;
  onOpenSettings: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, deviceId, onOpenSettings }) => {
  const tabs = [
    { id: 'chat', label: 'AI Chat', icon: 'fa-message' }, 
    { id: 'accounting', label: 'Dashboard', icon: 'fa-chart-pie' }, 
    { id: 'history', label: 'Archives', icon: 'fa-box-archive' }, 
  ];

  return (
    <div className="flex h-screen font-sans bg-[#EEF2F6] overflow-hidden text-slate-800">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-200/30 rounded-full blur-[120px] opacity-60 mix-blend-multiply animate-float"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-[120px] opacity-60 mix-blend-multiply animate-float-delayed"></div>
      </div>

      {/* LEFT SIDEBAR */}
      <aside className="w-[260px] flex-shrink-0 flex flex-col z-20 bg-white/50 backdrop-blur-xl border-r border-white/60 relative">
        
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <i className="fa-solid fa-bolt text-sm"></i>
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-800">Nova AI</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">Menu</div>
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                        activeTab === tab.id 
                        ? 'bg-white shadow-sm text-blue-600 ring-1 ring-black/5' 
                        : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                    }`}
                >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'bg-transparent text-slate-400 group-hover:text-slate-600'
                    }`}>
                        <i className={`fa-solid ${tab.icon}`}></i>
                    </div>
                    {tab.label}
                </button>
            ))}
        </nav>

        {/* User / Settings Footer */}
        <div className="p-4 border-t border-white/50">
            <div className="bg-white/60 rounded-xl p-3 flex items-center gap-3 border border-white/50 shadow-sm cursor-pointer hover:bg-white/80 transition-colors" onClick={onOpenSettings}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-500">
                    <i className="fa-solid fa-user text-xs"></i>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-700 truncate">Device {deviceId.slice(-4)}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                    </div>
                </div>
                <i className="fa-solid fa-gear text-slate-400 text-xs"></i>
            </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10 p-4">
        {/* The "Window" inside the browser */}
        <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[24px] border border-white/60 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col relative">
             {children}
        </div>
      </main>

    </div>
  );
};

export default Layout;