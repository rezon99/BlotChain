import React from 'react';
import { LayoutGrid, Coins, Image as ImageIcon, Settings as SettingsIcon } from 'lucide-react';
import { DashboardMode } from '../types';

interface HeaderProps {
  lastUpdate: Date;
  mode: DashboardMode;
  onModeSwitch: (mode: DashboardMode) => void;
  categories: string[];
  categoryFilter: string;
  setCategoryFilter: (cat: string) => void;
  onOpenSettings: () => void;
  selectedCount: number;
  onClearSelection: () => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  lastUpdate,
  mode,
  onModeSwitch,
  categories,
  categoryFilter,
  setCategoryFilter,
  onOpenSettings,
  selectedCount,
  onClearSelection
}) => {
  return (
    <div className="relative z-10 px-3 py-3 sm:px-4 sm:py-4 md:p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 md:gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 sm:gap-3 mb-1">
            <LayoutGrid className="text-blue-500" size={22} />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              BlotChain Dashboard
            </h1>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm">
            Live from CoinGecko • Updated {lastUpdate.toLocaleTimeString()}
          </p>
        </div>

        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700 backdrop-blur-md w-full lg:w-auto overflow-x-auto">
          <button
            onClick={() => onModeSwitch('crypto')}
            className={`flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              mode === 'crypto' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Coins size={16} />
            CRYPTOCURRENCY
          </button>
          <button
            onClick={() => onModeSwitch('nft')}
            className={`flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              mode === 'nft' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <ImageIcon size={16} />
            NFT COLLECTIONS
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-wrap w-full lg:w-auto">
          <div className="flex items-center gap-1 sm:gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700 max-w-full overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs rounded-md transition-all whitespace-nowrap ${
                  categoryFilter === cat
                    ? mode === 'crypto' ? 'bg-blue-600 text-white shadow-lg' : 'bg-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

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
