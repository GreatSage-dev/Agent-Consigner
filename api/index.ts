import express from 'express';
import cors from 'cors';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';

// --- Types Replicated from src/types/index.ts ---
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

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
};

const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.databaseURL;
let db: any = null;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log('Firebase Database initialized on backend.');
  } catch (error) {
    console.error('Failed to initialize Firebase on backend:', error);
  }
} else {
  console.log('Firebase environment variables not set. Syncing disabled.');
}

// Helper to write to database
async function updateDb(requestId: string, data: Partial<CosignRequest>) {
  if (!db) return;
  try {
    const requestRef = ref(db, `cosignRequests/${requestId}`);
    const snapshot = await get(requestRef);
    const current = snapshot.exists() ? snapshot.val() : {};
    const merged = {
      ...current,
      ...data,
      updatedAt: Date.now(),
    };
    await set(requestRef, merged);
  } catch (error) {
    console.error(`Firebase update failed for ${requestId}:`, error);
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const app = express();

app.use(cors());
app.use(express.json());

// --- Health Check / Ping Endpoint ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    name: 'Agent Consigner',
    version: '1.0.0',
    timestamp: Date.now(),
    firebase: isFirebaseConfigured ? 'connected' : 'offline',
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    name: 'Agent Consigner',
    version: '1.0.0',
  });
});

// --- Audit & Risk Logic ---
function auditLedgerChain(records: LedgerRecord[]): HashVerificationState {
  if (!records || records.length === 0) {
    return { status: 'verified', verifiedUpTo: 0, brokenAt: null };
  }

  // Chain continuity check
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    if (i > 0 && record.prevHash !== records[i - 1].hash) {
      return {
        status: 'broken',
        verifiedUpTo: i - 1,
        brokenAt: i,
      };
    }
  }

  return {
    status: 'verified',
    verifiedUpTo: records.length,
    brokenAt: null,
  };
}

function computeRisk(audit: HashVerificationState): RiskState {
  if (audit.status === 'broken') {
    return {
      status: 'declined',
      tier: 'high',
      score: 45,
      reason: 'chain_integrity',
    };
  }
  return {
    status: 'approved',
    tier: 'low',
    score: 92,
    reason: null,
  };
}

// --- Co-Signing Request Endpoint ---
app.post('/api/cosign', async (req, res) => {
  try {
    const {
      requestId: customRequestId,
      address = '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
      chainId = 1952,
      ledger = { records: [] },
      stake = { amount: 0.01 },
    } = req.body;

    const requestId = customRequestId || 'req-' + Math.floor(1000 + Math.random() * 9000);
    const records: LedgerRecord[] = ledger.records || [];

    // Initialize state
    const currentRequest: CosignRequest = {
      state: 'IDLE',
      address,
      chainId,
      ledger: {
        status: records.length > 0 ? 'loaded' : 'empty',
        records,
        recordCount: records.length,
        chainSpanDays: records.length > 0 ? 120 : 0,
      },
      hashVerification: {
        status: 'running',
        verifiedUpTo: 0,
        brokenAt: null,
      },
      risk: {
        status: 'computing',
        tier: 'unrated',
        score: 0,
        reason: null,
      },
      stake: {
        status: 'requested',
        amount: stake.amount || 0.01,
        feePercent: records.length === 0 ? 2.5 : 1.0,
        txHash: null,
        error: null,
      },
      resolution: {
        status: 'pending',
        resolvedAt: null,
        redirectedTo: null,
      },
      updatedAt: Date.now(),
    };

    // Perform audit and risk scoring
    const auditResult = auditLedgerChain(records);
    const riskResult = computeRisk(auditResult);
    const isApproved = riskResult.status === 'approved';

    // Synchronously execute state transitions for Firebase to animate on UI
    const stepDelay = 200; // Fast transitions for Vercel timeout safety

    // Start flow
    await updateDb(requestId, { ...currentRequest, state: 'WALLET_CONNECTED' });
    await delay(stepDelay);

    await updateDb(requestId, { state: 'SIGNATURE_VERIFIED' });
    await delay(stepDelay);

    await updateDb(requestId, { state: 'LEDGER_FETCHING' });
    await delay(stepDelay);

    await updateDb(requestId, { state: 'HASH_VERIFICATION_RUNNING' });
    await delay(stepDelay);

    // Apply audit verification results
    currentRequest.hashVerification = auditResult;
    await updateDb(requestId, {
      state: auditResult.status === 'broken' ? 'HASH_CHAIN_BROKEN' : 'HASH_CHAIN_VERIFIED',
      hashVerification: auditResult,
    });
    await delay(stepDelay);

    await updateDb(requestId, { state: 'RISK_COMPUTING' });
    await delay(stepDelay);

    // Apply risk results
    currentRequest.risk = riskResult;
    await updateDb(requestId, {
      state: isApproved ? 'RISK_LOW_APPROVED' : 'RISK_HIGH_DECLINE',
      risk: riskResult,
    });
    await delay(stepDelay);

    if (isApproved) {
      // Simulate Staking & Cosigning
      currentRequest.stake.status = 'pending';
      currentRequest.stake.txHash = '0x' + Math.random().toString(16).substring(2, 66);
      await updateDb(requestId, {
        state: 'STAKE_SIGNATURE_REQUESTED',
        stake: currentRequest.stake,
      });
      await delay(stepDelay);

      await updateDb(requestId, { state: 'STAKE_TX_PENDING' });
      await delay(stepDelay);

      currentRequest.stake.status = 'confirmed';
      await updateDb(requestId, {
        state: 'STAKE_TX_CONFIRMED',
        stake: currentRequest.stake,
      });
      await delay(stepDelay);

      await updateDb(requestId, { state: 'COSIGNED' });
      await delay(stepDelay);

      await updateDb(requestId, { state: 'RESOLUTION_PENDING' });
      await delay(stepDelay);

      currentRequest.resolution.status = 'released';
      currentRequest.resolution.resolvedAt = Date.now();
      await updateDb(requestId, {
        state: 'RESOLVED_RELEASED',
        resolution: currentRequest.resolution,
      });
    } else {
      // If declined, update to failed stake status
      currentRequest.stake.status = 'failed';
      currentRequest.stake.error = 'High risk tier security block';
      await updateDb(requestId, {
        state: 'STAKE_TX_FAILED',
        stake: currentRequest.stake,
      });
    }

    res.json({
      requestId,
      approved: isApproved,
      audit: auditResult,
      risk: riskResult,
      stake: currentRequest.stake,
    });
  } catch (error: any) {
    console.error('Co-signing execution failed:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// For local testing
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Agent Consigner backend running on http://localhost:${PORT}`);
  });
}

export default app;
