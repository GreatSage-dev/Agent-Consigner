import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { RiskState, CosignState } from '../types';

interface RiskEngineProps {
  state: CosignState;
  risk: RiskState;
}

export const RiskEngine: React.FC<RiskEngineProps> = ({
  state,
  risk,
}) => {
  const getContainerClass = () => {
    // If state is RISK_COMPUTING
    if (state === 'RISK_COMPUTING') return 'risk-engine-container risk-computing';
    
    // Otherwise determine by tier
    const isUnrated = risk.tier === 'unrated' || state === 'RISK_UNRATED';
    if (isUnrated) return 'risk-engine-container risk-unrated';
    
    if (risk.tier === 'low') return 'risk-engine-container risk-low';
    if (risk.tier === 'medium') return 'risk-engine-container risk-medium';
    if (risk.tier === 'high' || state === 'RISK_HIGH_DECLINE') return 'risk-engine-container risk-high';
    
    return 'risk-engine-container';
  };

  const getScoreDisplay = () => {
    if (state === 'RISK_COMPUTING') return '??';
    if (risk.tier === 'unrated' || state === 'RISK_UNRATED') return '--';
    return risk.score.toString();
  };

  const getTierDisplay = () => {
    if (state === 'RISK_COMPUTING') return 'Scanners On';
    if (state === 'RISK_HIGH_DECLINE' || (risk.status === 'declined' && risk.tier === 'high')) return 'High / Decline';
    if (risk.tier === 'low') return 'Low / Approved';
    if (risk.tier === 'medium') return 'Medium / Approved';
    if (risk.tier === 'unrated') return 'Unrated / Safe';
    return 'Pending Risk';
  };

  const getIcon = () => {
    if (state === 'RISK_COMPUTING') {
      return <Shield className="w-5 h-5 mx-auto text-cyan-400 animate-pulse" />;
    }
    if (risk.tier === 'high' || state === 'RISK_HIGH_DECLINE') {
      return <ShieldAlert className="w-5 h-5 mx-auto text-amber-500" style={{ color: 'var(--color-declined)' }} />;
    }
    return <ShieldCheck className="w-5 h-5 mx-auto text-emerald-400" style={{ color: 'var(--color-verified)' }} />;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-card border border-glass rounded-24 min-h-[300px]">
      <h3 className="brand-subtitle text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-6 font-display font-semibold">
        Realtime Risk Analysis
      </h3>

      <div className={getContainerClass()}>
        {/* Concentric Rotating Rings */}
        <div className="risk-ring risk-ring-1" />
        <div className="risk-ring risk-ring-2" />
        <div className="risk-ring risk-ring-3" />
        <div className="risk-radar-sweep" />

        {/* Center Panel Score */}
        <div className="risk-center-content">
          <div className="mb-1">{getIcon()}</div>
          <div className="risk-score-value">{getScoreDisplay()}</div>
          <div className="risk-tier-label">{getTierDisplay()}</div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs max-w-[200px] text-slate-400 leading-relaxed font-sans">
        {state === 'RISK_COMPUTING' && (
          <p>Processing historical weights, cryptographic chains, and actor reputation index...</p>
        )}
        {(state === 'RISK_HIGH_DECLINE' || (risk.status === 'declined' && risk.tier === 'high')) && (
          <p className="text-amber-500" style={{ color: 'var(--color-declined)' }}>
            Cosign declined. Signature chain integrity failed or reputation score is below approval threshold.
          </p>
        )}
        {risk.tier === 'unrated' && (
          <p>New agent detected. Approving under conservative terms due to insufficient history.</p>
        )}
        {risk.tier === 'low' && (
          <p className="text-emerald-400" style={{ color: 'var(--color-verified)' }}>
            Reputation healthy. Approved for low fee (1.0%) and high collateral stakes.
          </p>
        )}
        {risk.tier === 'medium' && (
          <p>Reputation verified. Approved under standard terms (2.5% fee tier).</p>
        )}
      </div>
    </div>
  );
};

export default RiskEngine;
