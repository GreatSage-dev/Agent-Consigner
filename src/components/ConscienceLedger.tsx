import React, { useEffect, useState } from 'react';
import { 
  Database, 
  AlertTriangle, 
  HelpCircle,
  TrendingUp
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
      <div className="ledger-header" style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
        <div className="flex items-center gap-2">
          <Database className={`w-4 h-4 ${hashVerification.status === 'verified' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span className="ledger-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.8rem', color: '#ffffff', letterSpacing: '0.05em' }}>Conscience Ledger</span>
        </div>
        <span className="ledger-summary-label" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{getLedgerSubTitle()}</span>
      </div>

      {/* States: FETCHING, FAILED, EMPTY, LOADED */}
      {ledger.status === 'fetching' && (
        <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono mt-2">Syncing ledger records from L2 nodes...</p>
        </div>
      )}

      {ledger.status === 'failed' && (
        <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
          <AlertTriangle className="w-10 h-10 text-red-400 animate-pulse" style={{ color: 'var(--color-failed)' }} />
          <div>
            <p className="text-sm font-semibold text-white">Database Connection Failure</p>
            <p className="text-xs text-slate-400 mt-1">Failed to establish stable web socket sync</p>
          </div>
          {onRetryFetch && (
            <button 
              onClick={onRetryFetch}
              className="control-btn"
              style={{ marginTop: '0.5rem', width: 'auto', padding: '0.4rem 1rem' }}
            >
              Retry Handshake
            </button>
          )}
        </div>
      )}

      {ledger.status === 'empty' && (
        <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
          <HelpCircle className="w-10 h-10 text-cyan-400 opacity-60" style={{ color: 'var(--color-unrated)' }} />
          <div>
            <p className="text-sm font-semibold text-white">Genesis Environment</p>
            <p className="text-xs text-slate-400 mt-1">First-time registration. No records in ledger.</p>
          </div>
        </div>
      )}

      {ledger.status === 'loaded' && ledger.records.length > 0 && (
        <div className="timeline-container">
          {/* Laser central vertical line */}
          <div className="timeline-line" />
          <div className="timeline-line-pulse" />

          {/* Timeline Nodes */}
          {ledger.records.map((record, index) => {
            const status = getBlockStatus(index);
            const isSelected = selectedBlock === index;

            return (
              <div key={record.decisionId} className="flex flex-col">
                <button
                  onClick={() => setSelectedBlock(index)}
                  className={`timeline-node-item status-${status} ${isSelected ? 'selected' : ''}`}
                  style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', padding: '0.6rem 0.8rem', color: 'inherit', fontFamily: 'inherit', outline: 'none' }}
                >
                  {/* Glowing Node Marker */}
                  <div className="timeline-node-dot" />

                  {/* Node Content */}
                  <div className="timeline-node-content">
                    <div className="timeline-node-header">
                      <span className="timeline-node-title flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-mono">#{String(index + 1).padStart(2, '0')}</span>
                        {record.decisionId}
                      </span>
                      <span className="timeline-node-time">
                        {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    {/* Hashes Row */}
                    <div className="timeline-node-hashes">
                      <div className="timeline-hash-block">
                        <span className="timeline-hash-label">Prev Hash</span>
                        <span className="timeline-hash-value" title={record.prevHash}>
                          {record.prevHash.substring(0, 14)}...
                        </span>
                      </div>
                      <div className="timeline-hash-block">
                        <span className="timeline-hash-label">Block Hash</span>
                        <span className={`timeline-hash-value current-hash`} title={record.hash}>
                          {record.hash.substring(0, 14)}...
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Inline Tamper Warning */}
                {isSelected && status === 'broken' && (
                  <div className="ml-3 mt-1 mr-1 p-2.5 bg-red-950/20 border border-red-500/20 text-red-300 rounded text-[10px] leading-relaxed">
                    <strong>Integrity Mismatch:</strong> The cryptographic link from block #{index + 1} to block #{index} has been broken. Local audit failed.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConscienceLedger;
