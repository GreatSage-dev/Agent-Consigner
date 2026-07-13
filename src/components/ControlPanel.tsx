import React, { useState } from 'react';
import { Play, RotateCcw, ChevronUp, ChevronDown, Radio, Flame, Sparkles } from 'lucide-react';
import { CosignState } from '../types';
import { simulator } from '../services/simulator';

interface ControlPanelProps {
  currentRequestId: string;
  onRequestIdChange: (id: string) => void;
  currentState: CosignState;
  onForceState: (state: CosignState) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  currentRequestId,
  onRequestIdChange,
  currentState,
  onForceState,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleStartSim = () => {
    simulator.runFlow(currentRequestId);
  };

  const handleReset = () => {
    simulator.resetDemo(currentRequestId);
  };

  return (
    <div className={`control-panel ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div 
        className="control-header" 
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-1.5">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h3>Demo Controller</h3>
        </div>
        {isCollapsed ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </div>

      {/* Body */}
      <div className="control-body">
        {/* Scenario Selection */}
        <div className="control-group">
          <div className="control-group-title">Select Scenario</div>
          <div className="control-buttons-grid">
            <button
              onClick={() => onRequestIdChange('demo-established')}
              className={`control-btn flex items-center justify-center gap-1 ${currentRequestId === 'demo-established' ? 'active' : ''}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Established Agent
            </button>
            <button
              onClick={() => onRequestIdChange('demo-new')}
              className={`control-btn flex items-center justify-center gap-1 ${currentRequestId === 'demo-new' ? 'active' : ''}`}
            >
              <Flame className="w-3.5 h-3.5" />
              New Agent
            </button>
          </div>
        </div>

        {/* Global Controls */}
        <div className="control-group">
          <div className="control-group-title">Global Controls</div>
          <div className="control-buttons-grid">
            <button
              onClick={handleStartSim}
              className="control-btn bg-cyan-950/40 border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/60 flex items-center justify-center gap-1"
            >
              <Play className="w-3.5 h-3.5" />
              Run Auto Flow
            </button>
            <button
              onClick={handleReset}
              className="control-btn hover:text-white flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset State
            </button>
          </div>
        </div>

        {/* State Injection */}
        <div className="control-group">
          <div className="control-group-title">State Injection (Interactive)</div>
          <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1">
            {/* Identity */}
            <div className="text-[10px] text-slate-500 font-semibold mt-1 uppercase">Identity & Sign</div>
            <div className="grid grid-cols-2 gap-1">
              <button 
                onClick={() => onForceState('SIGNATURE_REQUESTED')}
                className={`control-btn text-[10px] py-1 ${currentState === 'SIGNATURE_REQUESTED' ? 'active' : ''}`}
              >
                Sign Requested
              </button>
              <button 
                onClick={() => onForceState('SIGNATURE_REJECTED')}
                className={`control-btn text-[10px] py-1 text-amber-500 ${currentState === 'SIGNATURE_REJECTED' ? 'active' : ''}`}
              >
                Reject Sign
              </button>
              <button 
                onClick={() => onForceState('SIGNATURE_INVALID')}
                className={`control-btn text-[10px] py-1 text-red-400 ${currentState === 'SIGNATURE_INVALID' ? 'active' : ''}`}
              >
                Invalid Sign
              </button>
              <button 
                onClick={() => onForceState('SIGNATURE_VERIFIED')}
                className={`control-btn text-[10px] py-1 ${currentState === 'SIGNATURE_VERIFIED' ? 'active' : ''}`}
              >
                Verify Sign
              </button>
            </div>

            {/* History */}
            <div className="text-[10px] text-slate-500 font-semibold mt-1.5 uppercase">Conscience Ledger</div>
            <div className="grid grid-cols-2 gap-1">
              <button 
                onClick={() => onForceState('LEDGER_FETCHING')}
                className={`control-btn text-[10px] py-1 ${currentState === 'LEDGER_FETCHING' ? 'active' : ''}`}
              >
                Ledger Fetching
              </button>
              <button 
                onClick={() => onForceState('LEDGER_FETCH_FAILED')}
                className={`control-btn text-[10px] py-1 text-slate-400 ${currentState === 'LEDGER_FETCH_FAILED' ? 'active' : ''}`}
              >
                Ledger Failed
              </button>
              <button 
                onClick={() => onForceState('HASH_VERIFICATION_RUNNING')}
                className={`control-btn text-[10px] py-1 ${currentState === 'HASH_VERIFICATION_RUNNING' ? 'active' : ''}`}
              >
                Checking Hashes
              </button>
              <button 
                onClick={() => onForceState('HASH_CHAIN_BROKEN')}
                className={`control-btn text-[10px] py-1 text-red-400 ${currentState === 'HASH_CHAIN_BROKEN' ? 'active' : ''}`}
              >
                Fracture Ledger
              </button>
            </div>

            {/* Risk */}
            <div className="text-[10px] text-slate-500 font-semibold mt-1.5 uppercase">Risk Engine</div>
            <div className="grid grid-cols-2 gap-1">
              <button 
                onClick={() => onForceState('RISK_COMPUTING')}
                className={`control-btn text-[10px] py-1 ${currentState === 'RISK_COMPUTING' ? 'active' : ''}`}
              >
                Computing Risk
              </button>
              <button 
                onClick={() => onForceState('RISK_HIGH_DECLINE')}
                className={`control-btn text-[10px] py-1 text-amber-500 ${currentState === 'RISK_HIGH_DECLINE' ? 'active' : ''}`}
              >
                Decline Risk
              </button>
            </div>

            {/* Collateral & Resolution */}
            <div className="text-[10px] text-slate-500 font-semibold mt-1.5 uppercase">Collateral & Resolution</div>
            <div className="grid grid-cols-2 gap-1">
              <button 
                onClick={() => onForceState('STAKE_TX_PENDING')}
                className={`control-btn text-[10px] py-1 ${currentState === 'STAKE_TX_PENDING' ? 'active' : ''}`}
              >
                Stake Pending
              </button>
              <button 
                onClick={() => onForceState('STAKE_TX_FAILED')}
                className={`control-btn text-[10px] py-1 text-slate-400 ${currentState === 'STAKE_TX_FAILED' ? 'active' : ''}`}
              >
                Stake Failed
              </button>
              <button 
                onClick={() => onForceState('COSIGNED')}
                className={`control-btn text-[10px] py-1 ${currentState === 'COSIGNED' ? 'active' : ''}`}
              >
                Cosigned Active
              </button>
              <button 
                onClick={() => onForceState('RESOLVED_RELEASED')}
                className={`control-btn text-[10px] py-1 text-emerald-400 ${currentState === 'RESOLVED_RELEASED' ? 'active' : ''}`}
              >
                Release Shield
              </button>
              <button 
                onClick={() => onForceState('RESOLVED_SLASHED')}
                className={`control-btn text-[10px] py-1 text-red-500 ${currentState === 'RESOLVED_SLASHED' ? 'active' : ''}`}
              >
                Slash Shield
              </button>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-center text-slate-500 border-t border-[rgba(255,255,255,0.05)] pt-2 mt-2">
          Current State: <span className="font-mono text-cyan-400 font-bold">{currentState}</span>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
