import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, ExternalLink, Award } from 'lucide-react';
import { IntentThreatPayload } from '../types/mevshield';

interface MEVShieldPanelProps {
  payload: IntentThreatPayload | null;
}

export const MEVShieldPanel: React.FC<MEVShieldPanelProps> = ({ payload }) => {
  const [isMinting, setIsMinting] = useState(false);
  const [mintedTxHash, setMintedTxHash] = useState<string | null>(null);

  if (!payload) return null;

  const { riskAssessment, userAddress } = payload;
  const isProtected = riskAssessment.actionTaken === 'ROUTED_PRIVATE_RPC';
  const isHighRisk = riskAssessment.riskScore >= 0.7;

  const handleMintNft = async () => {
    setIsMinting(true);
    // Simulate web3 contract call to Polygon contract 0x9A0Fb6820096e70aB55Ed597B2596a79a85144dA
    setTimeout(() => {
      setIsMinting(false);
      setMintedTxHash('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
    }, 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isProtected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {isProtected ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white uppercase tracking-wider">MEVShield Active Protection</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isHighRisk ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'}`}>
              RISK SCORE: {(riskAssessment.riskScore * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-gray-400 text-[11px] mt-0.5">
            User: {userAddress.slice(0, 6)}...{userAddress.slice(-4)} • Action: <span className="text-indigo-300 font-mono">{riskAssessment.actionTaken}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {mintedTxHash ? (
          <a
            href={`https://polygonscan.com/tx/${mintedTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold hover:bg-emerald-600/30 transition-all text-[11px]"
          >
            <Award size={14} />
            <span>PROOF MINTED</span>
            <ExternalLink size={12} />
          </a>
        ) : (
          <button
            onClick={handleMintNft}
            disabled={isMinting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white rounded-lg font-bold transition-all shadow-lg text-[11px]"
          >
            <Award size={14} />
            <span>{isMinting ? 'MINTING ON POLYGON...' : 'MINT PROOF-OF-PROTECTION'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
