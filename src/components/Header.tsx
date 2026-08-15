import React from 'react';
import { LayoutGrid, Settings as SettingsIcon, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  lastUpdate: Date;
  onOpenSettings: () => void;
  selectedCount: number;
  onClearSelection: () => void;
  viewMode?: '2d' | '3d' | 'vr';
  onViewModeSwitch?: (viewMode: '2d' | '3d' | 'vr') => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  lastUpdate,
  onOpenSettings,
  selectedCount,
  onClearSelection,
  viewMode = '2d',
  onViewModeSwitch
}) => {
  return (
    <div className="relative z-10 px-3 py-3 sm:px-4 sm:py-2 md:py-3 md:px-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 md:gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 sm:gap-3 mb-1">
            <LayoutGrid className="text-blue-500" size={22} />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              BlotChain x MEVShield
              <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> PROTECTED
              </span>
            </h1>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm">
            Visual MEV & Intent Security Suite • Updated {lastUpdate.toLocaleTimeString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full lg:w-auto">
          {/* View Mode (2D / 3D / VR) Switcher */}
          {onViewModeSwitch && (
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700 backdrop-blur-md overflow-x-auto gap-1">
              <button
                onClick={() => onViewModeSwitch('2d')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  viewMode === '2d' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="text-[10px] bg-slate-900/60 text-indigo-300 px-1 py-0.5 rounded">2D</span>
                DASHBOARD
              </button>
              <button
                onClick={() => onViewModeSwitch('3d')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  viewMode === '3d' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="text-[10px] bg-slate-900/60 text-indigo-300 px-1 py-0.5 rounded">3D</span>
                SPACE
              </button>
              <button
                onClick={() => onViewModeSwitch('vr')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  viewMode === 'vr' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="text-[10px] bg-slate-900/60 text-indigo-300 px-1 py-0.5 rounded">VR</span>
                VR SPACE
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-wrap w-auto">
          <button
            onClick={onOpenSettings}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg border border-slate-700 transition-colors"
            title="Settings"
          >
            <SettingsIcon size={20} />
          </button>

          {selectedCount > 0 && (
            <button
              onClick={onClearSelection}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-900/50 rounded-lg transition-all text-sm font-bold"
            >
              CLEAR ({selectedCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

Header.displayName = 'Header';
