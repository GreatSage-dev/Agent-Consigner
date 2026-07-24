import { CosignRequest, CosignState, LedgerRecord } from '../types';

type Listener = (data: CosignRequest) => void;

class SimulatorDatabase {
  private listeners: Map<string, Set<Listener>> = new Map();
  private data: Map<string, CosignRequest> = new Map();
  private intervalIds: Map<string, any> = new Map();

  constructor() {
    // Seed initial demo records
    this.resetDemo('demo-established');
    this.resetDemo('demo-new');
  }

  private getInitialState(requestId: string, overrideState: Partial<CosignRequest> = {}): CosignRequest {
    const isNew = requestId.startsWith('demo-new');
    
    // Generate valid linked records for established agent
    const records: LedgerRecord[] = [];
    if (!isNew) {
      let prevHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
      for (let i = 0; i < 15; i++) {
        const decisionId = `dec_est_${100 + i}`;
        // Create hex-like hashes that link to prevHash
        const hash = `0x${(i + 1).toString(16).padStart(2, '0')}f78a2e${1000 + i}cdbeef89b${i}239ac893d9b8e9f`;
        records.push({
          decisionId,
          timestamp: Date.now() - (15 - i) * 8 * 3600 * 1000 - 3600 * 1000, // spaced out
          hash,
          prevHash,
        });
        prevHash = hash;
      }
    }

    return {
      state: 'IDLE',
      address: isNew ? '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' : '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
      chainId: 195, // X Layer Testnet as default
      ledger: {
        status: isNew ? 'empty' : 'loaded',
        records: isNew ? [] : records,
        recordCount: isNew ? 0 : records.length,
        chainSpanDays: isNew ? 0 : 120, // 4 months
      },
      hashVerification: {
        status: 'verified',
        verifiedUpTo: isNew ? 0 : records.length,
        brokenAt: null,
      },
      risk: {
        status: isNew ? 'unrated' : 'approved',
        tier: isNew ? 'unrated' : 'low',
        score: isNew ? 45 : 92,
        reason: null,
      },
      stake: {
        status: 'requested',
        amount: 0.01, // 0.01 OKB collateral
        feePercent: isNew ? 2.5 : 1.0, // New agent has higher fee due to risk
        txHash: null,
        error: null,
      },
      resolution: {
        status: 'pending',
        resolvedAt: null,
        redirectedTo: null,
      },
      updatedAt: Date.now(),
      ...overrideState,
    };
  }

  public resetDemo(requestId: string) {
    this.stopSimulation(requestId);
    const initial = this.getInitialState(requestId);
    initial.state = 'IDLE';
    
    // Set initial values representing idle state
    initial.ledger.status = requestId.startsWith('demo-new') ? 'empty' : 'loaded';
    initial.hashVerification.status = 'verified';
    initial.risk.status = 'approved';
    initial.stake.status = 'requested';
    initial.resolution.status = 'pending';
    
    this.data.set(requestId, initial);
    this.notify(requestId);
  }

  public subscribe(requestId: string, listener: Listener): () => void {
    if (!this.listeners.has(requestId)) {
      this.listeners.set(requestId, new Set());
    }
    this.listeners.get(requestId)!.add(listener);

    // Initial emit
    let currentData = this.data.get(requestId);
    if (!currentData) {
      currentData = this.getInitialState(requestId);
      this.data.set(requestId, currentData);
    }
    listener(currentData);

    return () => {
      const set = this.listeners.get(requestId);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.listeners.delete(requestId);
        }
      }
    };
  }

  public update(requestId: string, updates: Partial<CosignRequest>) {
    const current = this.data.get(requestId) || this.getInitialState(requestId);
    const updated = {
      ...current,
      ...updates,
      updatedAt: Date.now(),
    };
    this.data.set(requestId, updated);
    this.notify(requestId);
  }

  private notify(requestId: string) {
    const set = this.listeners.get(requestId);
    if (set) {
      const current = this.data.get(requestId)!;
      set.forEach((listener) => listener({ ...current }));
    }
  }

  public stopSimulation(requestId: string) {
    if (this.intervalIds.has(requestId)) {
      clearTimeout(this.intervalIds.get(requestId));
      this.intervalIds.delete(requestId);
    }
  }

  // Runs a complete flow automatically with customizable step times
  public runFlow(requestId: string, onStateTransition?: (state: CosignState) => void) {
    this.stopSimulation(requestId);
    const isNew = requestId.startsWith('demo-new');

    const steps: { state: CosignState; delay: number; action?: () => void }[] = [
      { state: 'IDLE', delay: 0 },
      { state: 'WALLET_CONNECTING', delay: 1000 },
      { state: 'WALLET_CONNECTED', delay: 1500 },
      { state: 'SIGNATURE_REQUESTED', delay: 1500 },
      { state: 'SIGNATURE_VERIFIED', delay: 2000 },
      { 
        state: 'LEDGER_FETCHING', 
        delay: 1500,
        action: () => {
          this.update(requestId, {
            ledger: {
              ...this.data.get(requestId)!.ledger,
              status: 'fetching'
            }
          });
        }
      },
      { 
        state: isNew ? 'LEDGER_EMPTY' : 'LEDGER_LOADED', 
        delay: 1500,
        action: () => {
          this.update(requestId, {
            ledger: {
              ...this.data.get(requestId)!.ledger,
              status: isNew ? 'empty' : 'loaded'
            }
          });
        }
      },
    ];

    if (!isNew) {
      steps.push(
        { 
          state: 'HASH_VERIFICATION_RUNNING', 
          delay: 1000,
          action: () => {
            this.update(requestId, {
              hashVerification: { status: 'running', verifiedUpTo: 0, brokenAt: null }
            });
            // Simulate verification ticking
            let step = 0;
            const tick = () => {
              const req = this.data.get(requestId);
              if (req && req.state === 'HASH_VERIFICATION_RUNNING') {
                step += 3;
                if (step <= 15) {
                  this.update(requestId, {
                    hashVerification: { status: 'running', verifiedUpTo: step, brokenAt: null }
                  });
                  setTimeout(tick, 200);
                }
              }
            };
            setTimeout(tick, 200);
          }
        },
        { 
          state: 'HASH_CHAIN_VERIFIED', 
          delay: 2000, 
          action: () => {
            this.update(requestId, {
              hashVerification: { status: 'verified', verifiedUpTo: 15, brokenAt: null }
            });
          }
        }
      );
    }

    steps.push(
      { 
        state: 'RISK_COMPUTING', 
        delay: 1000,
        action: () => {
          this.update(requestId, {
            risk: { status: 'computing', tier: 'unrated', score: 0, reason: null }
          });
        }
      },
      { 
        state: isNew ? 'RISK_UNRATED' : 'RISK_LOW_APPROVED', 
        delay: 2000,
        action: () => {
          if (isNew) {
            // Unrated risk leads to conservative terms (RISK_MEDIUM_APPROVED) automatically
            this.update(requestId, {
              risk: { status: 'unrated', tier: 'unrated', score: 45, reason: null }
            });
            setTimeout(() => {
              this.update(requestId, {
                state: 'RISK_MEDIUM_APPROVED',
                risk: { status: 'approved', tier: 'medium', score: 55, reason: null }
              });
            }, 1500);
          } else {
            this.update(requestId, {
              risk: { status: 'approved', tier: 'low', score: 92, reason: null }
            });
          }
        }
      },
      // Note: RISK_MEDIUM_APPROVED is animated. If it's RISK_MEDIUM_APPROVED (from RISK_UNRATED), it starts the stake signature.
      // In the automated flow, we pause at RISK_LOW_APPROVED/RISK_MEDIUM_APPROVED before stake signature requested.
      { 
        state: 'STAKE_SIGNATURE_REQUESTED', 
        delay: isNew ? 4000 : 2500, // Longer delay for new to accommodate transition
        action: () => {
          this.update(requestId, {
            stake: { status: 'requested', amount: isNew ? 0.02 : 0.01, feePercent: isNew ? 2.5 : 1.0, txHash: null, error: null }
          });
        }
      },
      { 
        state: 'STAKE_TX_PENDING', 
        delay: 2000,
        action: () => {
          this.update(requestId, {
            stake: { ...this.data.get(requestId)!.stake, status: 'pending', txHash: '0x3a56cf89a...23ab' }
          });
        }
      },
      { 
        state: 'STAKE_TX_CONFIRMED', 
        delay: 2500,
        action: () => {
          this.update(requestId, {
            stake: { ...this.data.get(requestId)!.stake, status: 'confirmed' }
          });
        }
      },
      { state: 'COSIGNED', delay: 1200 },
      { 
        state: 'RESOLUTION_PENDING', 
        delay: 1500,
        action: () => {
          this.update(requestId, {
            resolution: { status: 'pending', resolvedAt: null, redirectedTo: null }
          });
        }
      },
      { 
        state: 'RESOLVED_RELEASED', 
        delay: 3500,
        action: () => {
          this.update(requestId, {
            resolution: { status: 'released', resolvedAt: Date.now(), redirectedTo: null }
          });
        }
      }
    );

    let currentIdx = 0;
    const executeStep = () => {
      if (currentIdx >= steps.length) return;
      const step = steps[currentIdx];
      
      this.update(requestId, { state: step.state });
      if (step.action) {
        step.action();
      }
      if (onStateTransition) {
        onStateTransition(step.state);
      }

      currentIdx++;
      if (currentIdx < steps.length) {
        const nextStep = steps[currentIdx];
        const timer = setTimeout(executeStep, nextStep.delay);
        this.intervalIds.set(requestId, timer);
      }
    };

    executeStep();
  }

  // Force set a specific state (for manual control panel testing)
  public forceState(requestId: string, state: CosignState) {
    this.stopSimulation(requestId);
    const req = { ...this.data.get(requestId)! };
    req.state = state;
    
    // Sync related states based on the forced main state
    switch (state) {
      case 'IDLE':
        req.ledger.status = 'fetching';
        req.hashVerification.status = 'running';
        req.risk.status = 'computing';
        req.stake.status = 'requested';
        req.resolution.status = 'pending';
        break;
      case 'WALLET_CONNECTING':
        break;
      case 'WALLET_CONNECTED':
        break;
      case 'SIGNATURE_REQUESTED':
        break;
      case 'SIGNATURE_REJECTED':
        break;
      case 'SIGNATURE_INVALID':
        break;
      case 'SIGNATURE_VERIFIED':
        break;
      case 'LEDGER_FETCHING':
        req.ledger.status = 'fetching';
        break;
      case 'LEDGER_FETCH_FAILED':
        req.ledger.status = 'failed';
        break;
      case 'LEDGER_EMPTY':
        req.ledger.status = 'empty';
        req.ledger.records = [];
        req.ledger.recordCount = 0;
        break;
      case 'LEDGER_LOADED':
        req.ledger.status = 'loaded';
        // if empty, recreate records
        if (req.ledger.records.length === 0) {
          const fresh = this.getInitialState('demo-established');
          req.ledger = fresh.ledger;
        }
        break;
      case 'HASH_VERIFICATION_RUNNING':
        req.hashVerification.status = 'running';
        req.hashVerification.verifiedUpTo = 7;
        req.hashVerification.brokenAt = null;
        break;
      case 'HASH_CHAIN_BROKEN':
        req.hashVerification.status = 'broken';
        req.hashVerification.brokenAt = 6;
        req.hashVerification.verifiedUpTo = 5;
        // Mark risk as computing -> decline
        req.risk.status = 'declined';
        req.risk.tier = 'high';
        req.risk.score = 45;
        req.risk.reason = 'chain_integrity';
        break;
      case 'HASH_CHAIN_VERIFIED':
        req.hashVerification.status = 'verified';
        req.hashVerification.verifiedUpTo = req.ledger.recordCount;
        req.hashVerification.brokenAt = null;
        break;
      case 'RISK_COMPUTING':
        req.risk.status = 'computing';
        break;
      case 'RISK_UNRATED':
        req.risk.status = 'unrated';
        req.risk.tier = 'unrated';
        req.risk.score = 45;
        break;
      case 'RISK_HIGH_DECLINE':
        req.risk.status = 'declined';
        req.risk.tier = 'high';
        req.risk.score = 28;
        req.risk.reason = 'score_threshold';
        break;
      case 'RISK_MEDIUM_APPROVED':
        req.risk.status = 'approved';
        req.risk.tier = 'medium';
        req.risk.score = 55;
        break;
      case 'RISK_LOW_APPROVED':
        req.risk.status = 'approved';
        req.risk.tier = 'low';
        req.risk.score = 92;
        break;
      case 'STAKE_SIGNATURE_REQUESTED':
        req.stake.status = 'requested';
        break;
      case 'STAKE_SIGNATURE_REJECTED':
        req.stake.status = 'rejected';
        break;
      case 'STAKE_TX_PENDING':
        req.stake.status = 'pending';
        req.stake.txHash = '0xabcde1234567890f';
        break;
      case 'STAKE_TX_FAILED':
        req.stake.status = 'failed';
        req.stake.error = 'Transaction execution reverted: Insufficient gas or fee';
        break;
      case 'STAKE_TX_CONFIRMED':
        req.stake.status = 'confirmed';
        req.stake.txHash = '0xabcde1234567890f';
        break;
      case 'COSIGNED':
        break;
      case 'RESOLUTION_PENDING':
        req.resolution.status = 'pending';
        break;
      case 'RESOLVED_RELEASED':
        req.resolution.status = 'released';
        req.resolution.resolvedAt = Date.now();
        break;
      case 'RESOLVED_SLASHED':
        req.resolution.status = 'slashed';
        req.resolution.resolvedAt = Date.now();
        req.resolution.redirectedTo = '0x000000000000000000000000000000000000dEaD';
        break;
    }

    this.data.set(requestId, req);
    this.notify(requestId);
  }
}

export const simulator = new SimulatorDatabase();
export default simulator;
