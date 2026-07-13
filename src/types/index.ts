export type CosignState =
  | 'IDLE'
  | 'WALLET_CONNECTING'
  | 'WALLET_CONNECTED'
  | 'SIGNATURE_REQUESTED'
  | 'SIGNATURE_REJECTED'
  | 'SIGNATURE_INVALID'
  | 'SIGNATURE_VERIFIED'
  | 'LEDGER_FETCHING'
  | 'LEDGER_FETCH_FAILED'
  | 'LEDGER_EMPTY'
  | 'LEDGER_LOADED'
  | 'HASH_VERIFICATION_RUNNING'
  | 'HASH_CHAIN_BROKEN'
  | 'HASH_CHAIN_VERIFIED'
  | 'RISK_COMPUTING'
  | 'RISK_UNRATED'
  | 'RISK_HIGH_DECLINE'
  | 'RISK_MEDIUM_APPROVED'
  | 'RISK_LOW_APPROVED'
  | 'STAKE_SIGNATURE_REQUESTED'
  | 'STAKE_SIGNATURE_REJECTED'
  | 'STAKE_TX_PENDING'
  | 'STAKE_TX_FAILED'
  | 'STAKE_TX_CONFIRMED'
  | 'COSIGNED'
  | 'RESOLUTION_PENDING'
  | 'RESOLVED_RELEASED'
  | 'RESOLVED_SLASHED';

export interface LedgerRecord {
  decisionId: string;
  timestamp: number;
  hash: string;
  prevHash: string;
}

export interface LedgerState {
  status: 'fetching' | 'failed' | 'empty' | 'loaded';
  records: LedgerRecord[];
  recordCount: number;
  chainSpanDays: number;
}

export interface HashVerificationState {
  status: 'running' | 'broken' | 'verified';
  verifiedUpTo: number;
  brokenAt: number | null;
}

export interface RiskState {
  status: 'computing' | 'unrated' | 'declined' | 'approved';
  tier: 'unrated' | 'high' | 'medium' | 'low';
  score: number;
  reason: 'score_threshold' | 'chain_integrity' | null;
}

export interface StakeState {
  status: 'requested' | 'rejected' | 'pending' | 'failed' | 'confirmed';
  amount: number;
  feePercent: number;
  txHash: string | null;
  error: string | null;
}

export interface ResolutionState {
  status: 'pending' | 'released' | 'slashed';
  resolvedAt: number | null;
  redirectedTo: string | null;
}

export interface CosignRequest {
  state: CosignState;
  address: string;
  chainId: number;
  ledger: LedgerState;
  hashVerification: HashVerificationState;
  risk: RiskState;
  stake: StakeState;
  resolution: ResolutionState;
  updatedAt: number;
}
