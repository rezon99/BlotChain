import React from 'react';
import { Node } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, X } from 'lucide-react';

interface ComparisonPanelProps {
  selectedNodes: Node[];
  onClear: () => void;
}

export const ComparisonPanel: React.FC<ComparisonPanelProps> = ({ selectedNodes, onClear }) => {
  if (selectedNodes.length < 2) return null;

  const [node1, node2] = selectedNodes;

  const formatCurrency = (value: number, minimumFractionDigits = 0) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString(undefined, { minimumFractionDigits, maximumFractionDigits: value < 1 ? 6 : 2 })}`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const ComparisonRow = ({
    label,
    val1,
    val2,
    icon: Icon,
    isCurrency = false,
    isPercentage = false
  }: {
    label: string,
    val1: number,
    val2: number,
    icon: React.ElementType,
    isCurrency?: boolean,
    isPercentage?: boolean
  }) => {
    const diff = val1 - val2;
    const percentDiff = val2 !== 0 ? (diff / Math.abs(val2)) * 100 : 0;

    return (
      <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-3 text-gray-400 text-xs uppercase tracking-wider font-bold">
          <Icon size={14} className="text-blue-400" />
          {label}
        </div>
        <div className="grid grid-cols-2 gap-8 relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-700/50 -translate-x-1/2" />

          <div className="text-center">
            <div className={`text-lg font-bold text-white ${isPercentage ? getChangeColor(val1) : ''}`}>
              {isCurrency ? formatCurrency(val1) : isPercentage ? `${val1.toFixed(2)}%` : val1.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-500 mt-1">{node1.name}</div>
          </div>

          <div className="text-center">
            <div className={`text-lg font-bold text-white ${isPercentage ? getChangeColor(val2) : ''}`}>
              {isCurrency ? formatCurrency(val2) : isPercentage ? `${val2.toFixed(2)}%` : val2.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-500 mt-1">{node2.name}</div>
          </div>
        </div>

        <div className="mt-3 text-center">
          <span className={`text-xs font-medium ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {diff > 0 ? '+' : ''}{isCurrency ? formatCurrency(diff) : isPercentage ? `${diff.toFixed(2)}%` : diff.toLocaleString()}
            <span className="opacity-70 ml-1">
              ({diff > 0 ? '+' : ''}{percentDiff.toFixed(1)}%)
            </span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute bottom-6 right-6 w-96 bg-gray-900 bg-opacity-95 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-20">
      <div className="bg-blue-600/20 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Activity size={18} className="text-blue-400" />
          Asset Comparison
        </h3>
        <button
          onClick={onClear}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
        <div className="flex justify-between items-center px-2 mb-2">
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center bg-slate-800 text-xs font-bold text-white">
              {node1.name.charAt(0)}
            </div>
            <span className="text-xs text-gray-300 font-medium truncate max-w-[80px]">{node1.name}</span>
          </div>
          <div className="text-gray-600 font-black italic">VS</div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center bg-slate-800 text-xs font-bold text-white">
              {node2.name.charAt(0)}
            </div>
            <span className="text-xs text-gray-300 font-medium truncate max-w-[80px]">{node2.name}</span>
          </div>
        </div>

        <ComparisonRow
          label="Current Price"
          val1={node1.price}
          val2={node2.price}
          icon={DollarSign}
          isCurrency={true}
        />

        <ComparisonRow
          label="Market Capitalization"
          val1={node1.liquidity}
          val2={node2.liquidity}
          icon={BarChart3}
          isCurrency={true}
        />

        <ComparisonRow
          label="24h Price Change"
          val1={node1.change24h}
          val2={node2.change24h}
          icon={node1.change24h > 0 ? TrendingUp : TrendingDown}
          isPercentage={true}
        />

        <ComparisonRow
          label="7d Price Change"
          val1={node1.change7d}
          val2={node2.change7d}
          icon={TrendingUp}
          isPercentage={true}
        />
      </div>

      <div className="p-3 bg-slate-800/50 text-center">
        <button
          onClick={onClear}
          className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
        >
          RESET COMPARISON
        </button>
      </div>
    </div>
  );
};
