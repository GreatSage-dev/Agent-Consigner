import React, { useEffect, useState } from 'react';
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  Clock, 
  Search
} from 'lucide-react';
import { LedgerState, HashVerificationState, CosignState } from '../types';
import { formatDuration } from '../utils/time';

interface ConscienceLedgerProps {
  state: CosignState;
  ledger: LedgerState;
  hashVerification: HashVerificationState;
  onRetryFetch?: () => void;
}

export const ConscienceLedger: React.FC<ConscienceLedgerProps> = ({
  state,
  ledger,
  hashVerification,
  onRetryFetch,
}) => {
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);

  // Auto-select latest block or broken block for inspect view
  useEffect(() => {
    if (hashVerification.status === 'broken' && hashVerification.brokenAt !== null) {
      setSelectedBlock(hashVerification.brokenAt);
    } else if (ledger.records.length > 0) {
      setSelectedBlock(ledger.records.length - 1);
    } else {
      setSelectedBlock(null);
    }
  }, [ledger.records, hashVerification.status, hashVerification.brokenAt]);

  const getBlockStatus = (index: number): 'dim' | 'fetching' | 'verified' | 'broken' => {
    const isFetching = state === 'LEDGER_FETCHING';
    if (isFetching) return 'fetching';

    const status = hashVerification.status;
    const verifiedUpTo = hashVerification.verifiedUpTo;
    const brokenAt = hashVerification.brokenAt;

    if (status === 'running') {
      if (index < verifiedUpTo) return 'verified';
      if (index === verifiedUpTo) return 'fetching';
      return 'dim';
    }

    if (status === 'broken' && brokenAt !== null) {
      if (index < brokenAt) return 'verified';
      if (index === brokenAt) return 'broken';
      return 'dim';
    }

    if (status === 'verified') return 'verified';

    return 'dim';
  };

  const getLedgerSubTitle = () => {
    if (ledger.status === 'fetching') return 'Syncing ledger hashes...';
    if (ledger.status === 'failed') return 'Connection interrupted';
    if (ledger.status === 'empty') return 'No historical data available';
    if (ledger.status === 'loaded') {
      if (hashVerification.status === 'running') {
        return 'Analyzing cryptographic linkages...';
      }
      if (hashVerification.status === 'broken') {
        return 'WARNING: Hash integrity check failed';
      }
      return formatDuration(ledger.chainSpanDays, ledger.recordCount);
    }
    return 'Waiting for signature...';
  };

  return (
    <div className="ledger-container">
      {/* Scanner laser overlay when running */}
      {hashVerification.status === 'running' && (
        <div className="ledger-scanner-wave" />
      )}

      <div className="ledger-header">
        <div className="flex items-center gap-2">
          <Database className={`w-4 h-4 ${hashVerification.status === 'verified' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span className="ledger-title">Conscience Ledger</span>
        </div>
        <span className="ledger-summary-label">{getLedgerSubTitle()}</span>
      </div>

      {/* States: FETCHING, FAILED, EMPTY, LOADED */}
      {ledger.status === 'fetching' && (
        <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Reaching ledger nodes...</p>
        </div>
      )}

      {ledger.status === 'failed' && (
        <div className="py-6 text-center flex flex-col items-center justify-center gap-3">
          <AlertTriangle className="w-10 h-10 text-red-400 animate-bounce" style={{ color: 'var(--color-failed)' }} />
          <div>
            <p className="text-sm font-semibold text-white">Database Outage</p>
            <p className="text-xs text-slate-400 mt-1">Firebase database did not respond in time</p>
          </div>
          {onRetryFetch && (
            <button 
              onClick={onRetryFetch}
              className="protocol-node-retry"
              style={{ marginTop: '0.25rem' }}
            >
              Retry Connection
            </button>
          )}
        </div>
      )}

      {ledger.status === 'empty' && (
        <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
          <HelpCircle className="w-10 h-10 text-teal-400 opacity-60" style={{ color: 'var(--color-unrated)' }} />
          <div>
            <p className="text-sm font-semibold text-white">Unrated History</p>
            <p className="text-xs text-slate-400 mt-1">First-time agent registration. No records in ledger.</p>
          </div>
        </div>
      )}

      {ledger.status === 'loaded' && ledger.records.length > 0 && (
        <div className="flex flex-col gap-4">
          {/* Glowing Block Chain Grid */}
          <div className="ledger-grid">
            {ledger.records.map((record, index) => {
              const status = getBlockStatus(index);
              return (
                <div
                  key={record.decisionId}
                  onClick={() => setSelectedBlock(index)}
                  className={`ledger-block status-${status} ${selectedBlock === index ? 'ring-1 ring-cyan-400 scale-[1.05]' : ''}`}
                >
                  <span>#{index + 1}</span>
                  <span className="text-[9px] opacity-40">DEC</span>
                  {index < ledger.records.length - 1 && (
                    <div className="ledger-block-link" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Block Inspector Sub-panel */}
          {selectedBlock !== null && ledger.records[selectedBlock] && (
            <div className="bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.03)] p-3 rounded-12 text-xs flex flex-col gap-2">
              <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.05)] pb-1.5 mb-1">
                <span className="font-semibold text-white flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-cyan-400" />
                  Block #{selectedBlock + 1} Metadata
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(ledger.records[selectedBlock].timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-y-1 text-slate-400">
                <span>Decision ID:</span>
                <span className="col-span-2 text-white font-mono">{ledger.records[selectedBlock].decisionId}</span>

                <span>Prev Hash:</span>
                <span className="col-span-2 text-white font-mono text-[10px] text-ellipsis overflow-hidden">
                  {ledger.records[selectedBlock].prevHash}
                </span>

                <span>Block Hash:</span>
                <span className={`col-span-2 font-mono text-[10px] text-ellipsis overflow-hidden ${
                  getBlockStatus(selectedBlock) === 'broken' ? 'text-red-400 font-semibold' : 'text-emerald-400'
                }`}>
                  {ledger.records[selectedBlock].hash}
                </span>
              </div>
              {getBlockStatus(selectedBlock) === 'broken' && (
                <div className="mt-1 p-2 bg-red-950/30 border border-red-500/20 text-red-300 rounded text-[10px] leading-relaxed">
                  <strong>Link Mismatch:</strong> The cryptographic hash link from block #{selectedBlock + 1} to block #{selectedBlock} is invalid. The chain ledger has been tampered with.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConscienceLedger;
