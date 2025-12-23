
import React from 'react';
import { Settings, LayoutGrid, Layout } from 'lucide-react';

interface TopBarProps {
  roomTitle: string;
  roomCode: string;
  isConnected: boolean;
  elapsedTime: string;
  isRightPanelOpen: boolean;
  toggleRightPanel: () => void;
  onOpenSettings: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  roomTitle,
  roomCode,
  isConnected,
  elapsedTime,
  isRightPanelOpen,
  toggleRightPanel,
  onOpenSettings
}) => {
  return (
    <div className="h-16 glass border-b border-white/5 flex items-center justify-between px-4 md:px-6 z-40 relative">
      <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Layout size={18} className="text-white" />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-sm tracking-tight hidden md:block truncate max-w-[150px]">{roomTitle}</h1>
            <p className="text-[10px] text-white/40 font-mono tracking-widest uppercase truncate">{roomCode}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl border border-white/5">
          <div className={`w-2 h-2 rounded-sm ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/60">
            {isConnected ? 'Online' : 'Wait'}
          </span>
        </div>
        
        <div className="hidden sm:flex items-center gap-2 text-white/40 text-xs font-mono font-bold tracking-widest bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
          {elapsedTime}
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <button 
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl hover:bg-white/5 transition-all text-white/60 hover:text-white"
          >
            <Settings size={20} />
          </button>
          <button 
            onClick={toggleRightPanel}
            className={`p-2.5 rounded-xl transition-all ${isRightPanelOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <LayoutGrid size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
