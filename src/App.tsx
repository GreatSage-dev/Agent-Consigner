import { useState, useEffect, useRef } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import { 
  getDefaultConfig, 
  RainbowKitProvider, 
  darkTheme,
  ConnectButton,
  useConnectModal
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, http, useAccount, useSignMessage, useConnect, useDisconnect, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { mainnet, arbitrum, xLayer } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { parseEther } from 'viem';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  HelpCircle, 
  Database, 
  ShieldCheck, 
  Clock, 
  Coins, 
  ExternalLink,
  Shield,
  ShieldAlert,
  Lock,
  LockOpen,
  RefreshCw
} from 'lucide-react';

import { CosignRequest, CosignState } from './types';
import { subscribeToCosignRequest, updateCosignRequest } from './services/database';
import { simulator } from './services/simulator';
import { formatRelativeTime } from './utils/time';
import ConscienceLedger from './components/ConscienceLedger';
import ControlPanel from './components/ControlPanel';
import Logo from './components/Logo';
import LandingPage from './components/LandingPage';
import './styles/landing.css';

// --- Web3 / Wagmi / X Layer Configuration ---
const xLayerTestnet = {
  id: 1952,
  name: 'X Layer Testnet',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: {
    default: { 
      http: [
        'https://xlayertestrpc.okx.com/terigon',
        'https://testrpc.xlayer.tech/terigon',
      ] 
    },
  },
  blockExplorers: {
    default: { name: 'OKLink', url: 'https://www.oklink.com/xlayer-test' },
  },
  testnet: true,
} as const;

// --- Live Contract Configuration ---
const AGENT_COSIGNER_VAULT_ADDRESS: `0x${string}` = '0x6465fA0b07797175498f5647F558a8587b0834Db'; // Deployed on X Layer Testnet

const AGENT_COSIGNER_VAULT_ABI = [
  {
    "inputs": [{"internalType": "string", "name": "requestId", "type": "string"}],
    "name": "stake",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "requestId", "type": "string"}],
    "name": "release",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "requestId", "type": "string"},
      {"internalType": "address payable", "name": "recipient", "type": "address"}
    ],
    "name": "slash",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

const config = getDefaultConfig({
  appName: 'Agent Cosigner',
  projectId: '3fbb6b779f58355a1f35515785f39642', // Standard fallback demo projectId
  chains: [xLayerTestnet, xLayer, arbitrum, mainnet],
  transports: {
    [xLayerTestnet.id]: http('https://xlayertestrpc.okx.com/terigon'),
    [xLayer.id]: http(),
    [arbitrum.id]: http(),
    [mainnet.id]: http(),
  },
});

const queryClient = new QueryClient();

// --- Ambient Star Particle Canvas ---
const ParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Array<{ x: number; y: number; size: number; speed: number; opacity: number }> = [];
    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.15 + 0.05,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#00ff88';

      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.globalAlpha = p.opacity;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: -2 }} />;
};

// --- App Content Component ---
const AppContent = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [requestId, setRequestId] = useState<string>(() => 'demo-established-' + Math.floor(1000 + Math.random() * 9000));
  const [data, setData] = useState<CosignRequest | null>(null);
  const [activeTab, setActiveTab] = useState<'core' | 'ledger'>('core');

  const handleRequestIdChange = (id: string) => {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    setRequestId(`${id}-${suffix}`);
    setActiveTab('core');
  };

  const handleEnterConsole = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowLanding(false);
      setIsTransitioning(false);
    }, 800);
  };
  const { address, isConnected, chainId } = useAccount();
  const { data: balanceData, error: balanceError } = useBalance({
    address: address,
    chainId: xLayerTestnet.id,
    query: {
      refetchInterval: 5000,
    }
  });
  const { signMessageAsync } = useSignMessage();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const [activeTxHash, setActiveTxHash] = useState<string | null>(null);
  const { writeContractAsync, error: writeError } = useWriteContract();
  const { data: txReceipt, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({ 
    hash: activeTxHash as `0x${string}` | undefined 
  });
  const [timeTick, setTimeTick] = useState(Date.now());
  const [logs, setLogs] = useState<Array<{ text: string; type: 'system' | 'active' | 'success' | 'error' }>>([]);
  const logTerminalRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<CosignState>('IDLE');

  // Keep stateRef in sync with database/simulator state updates
  useEffect(() => {
    if (data) stateRef.current = data.state;
  }, [data?.state]);

  // Reactively track live staking transaction confirmation
  useEffect(() => {
    if (activeTxHash && isTxConfirmed && txReceipt) {
      const time = new Date().toLocaleTimeString();

      if (txReceipt.status === 'reverted') {
        setLogs(prev => [
          ...prev,
          {
            text: `[${time}] CONTRACT ERROR: Staking transaction reverted on-chain!`,
            type: 'error'
          }
        ]);
        const failFlow = async () => {
          if (!data) return;
          await updateCosignRequest(requestId, { 
            state: 'STAKE_TX_FAILED',
            stake: { ...data.stake, status: 'failed', error: 'Transaction reverted on-chain' }
          });
        };
        failFlow();
        setActiveTxHash(null);
        return;
      }

      setLogs(prev => [
        ...prev,
        {
          text: `[${time}] TX CONFIRMED: Collateral stake of 0.01 OKB successful on X Layer!`,
          type: 'success'
        }
      ]);

      const confirmFlow = async () => {
        if (!data) return;
        await updateCosignRequest(requestId, { 
          state: 'STAKE_TX_CONFIRMED',
          stake: { ...data.stake, status: 'confirmed', txHash: activeTxHash }
        });

        // 3. Cosigned after 1.5s
        setTimeout(async () => {
          await updateCosignRequest(requestId, { state: 'COSIGNED' });

          // 4. Flow to resolution monitoring after 1.5s
          setTimeout(async () => {
            await updateCosignRequest(requestId, { 
              state: 'RESOLUTION_PENDING',
              resolution: { status: 'pending', resolvedAt: null, redirectedTo: null }
            });

            // 5. Autorelease after 5s (unless slashed by controller)
            setTimeout(async () => {
              if (stateRef.current === 'RESOLUTION_PENDING') {
                await updateCosignRequest(requestId, { 
                  state: 'RESOLVED_RELEASED',
                  resolution: { status: 'released', resolvedAt: Date.now(), redirectedTo: null }
                });
              }
            }, 5000);
          }, 1500);
        }, 1500);
      };

      confirmFlow();
      setActiveTxHash(null);
    }
  }, [activeTxHash, isTxConfirmed, txReceipt]);

  // Dynamic Web3 connection and balance diagnostics logs
  useEffect(() => {
    if (!isConnected) {
      if (data && data.state !== 'IDLE' && !['RESOLVED_RELEASED', 'RESOLVED_SLASHED'].includes(data.state)) {
        updateCosignRequest(requestId, { state: 'IDLE' });
      }
      return;
    }

    const time = new Date().toLocaleTimeString();
    
    setLogs(prev => [
      ...prev,
      {
        text: `[${time}] WEB3: Wallet connected with active chain ID = ${chainId} (Expected: ${xLayerTestnet.id})`,
        type: chainId === xLayerTestnet.id ? 'success' : 'error'
      }
    ]);

    if (data && data.state === 'IDLE') {
      updateCosignRequest(requestId, { 
        state: 'WALLET_CONNECTED',
        address: address || data.address
      });
    }

    if (balanceData) {
      setLogs(prev => [
        ...prev,
        {
          text: `[${time}] WEB3: Balance loaded successfully = ${balanceData.formatted} ${balanceData.symbol}`,
          type: 'success'
        }
      ]);
    }

    if (balanceError) {
      setLogs(prev => [
        ...prev,
        {
          text: `[${time}] WEB3 ERROR: Balance query failed: ${balanceError.message.substring(0, 80)}`,
          type: 'error'
        }
      ]);
    }
  }, [isConnected, chainId, balanceData, balanceError, data?.state]);

  // Subscribe to real Firebase or local simulator data
  useEffect(() => {
    const unsubscribe = subscribeToCosignRequest(requestId, (incomingData) => {
      setData(incomingData);
    });
    return () => unsubscribe();
  }, [requestId]);

  // Keep log terminal scrolled to bottom
  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Realtime log simulation
  useEffect(() => {
    if (!data) return;
    const time = new Date().toLocaleTimeString();
    let text = '';
    let type: 'system' | 'active' | 'success' | 'error' = 'system';
    
    switch (data.state) {
      case 'IDLE':
        text = `[${time}] SYSTEM: READY - Awaiting Wallet Identity Anchor...`;
        type = 'system';
        break;
      case 'WALLET_CONNECTING':
        text = `[${time}] WALLET: Initiating connection handshake...`;
        type = 'active';
        break;
      case 'WALLET_CONNECTED':
        text = `[${time}] WALLET: Connected to ${data.address.substring(0, 10)}...`;
        type = 'success';
        break;
      case 'SIGNATURE_REQUESTED':
        text = `[${time}] ECDSA: Requesting challenge signature from wallet...`;
        type = 'active';
        break;
      case 'SIGNATURE_VERIFIED':
        text = `[${time}] ECDSA: Signature verified. Anchor locked successfully.`;
        type = 'success';
        break;
      case 'LEDGER_FETCHING':
        text = `[${time}] LEDGER: Fetching journal ledger conscience_journal.jsonl...`;
        type = 'active';
        break;
      case 'HASH_VERIFICATION_RUNNING':
        text = `[${time}] AUDIT: Initiating SHA-256 integrity hash verification audit...`;
        type = 'active';
        break;
      case 'RISK_COMPUTING':
        text = `[${time}] RISK: Conscience ledger decrypted. Running behavior risk scan...`;
        type = 'active';
        break;
      case 'RISK_LOW_APPROVED':
        text = `[${time}] RISK: Score verified (${data.risk.score}/100). Approved: Low Risk Tier.`;
        type = 'success';
        break;
      case 'RISK_MEDIUM_APPROVED':
        text = `[${time}] RISK: Score verified (${data.risk.score}/100). Approved: Medium Risk Tier.`;
        type = 'success';
        break;
      case 'RISK_HIGH_DECLINE':
        text = `[${time}] RISK: Score ALERT (${data.risk.score}/100). FAILED: High Risk Tier detected.`;
        type = 'error';
        break;
      case 'STAKE_SIGNATURE_REQUESTED':
        text = `[${time}] STAKE: Authorizing OKB staking collateral...`;
        type = 'active';
        break;
      case 'STAKE_TX_PENDING':
        text = `[${time}] CONTRACT: Staking TX broadcasted. Awaiting block confirmation...`;
        type = 'active';
        break;
      case 'STAKE_TX_CONFIRMED':
        text = `[${time}] CONTRACT: Stake confirmed! TX: ${data.stake.txHash?.substring(0, 12)}...`;
        type = 'success';
        break;
      case 'COSIGNED':
        text = `[${time}] PROTOCOL: Collateral shield active. Agent officially cosigned.`;
        type = 'success';
        break;
      case 'RESOLUTION_PENDING':
        text = `[${time}] AUDIT: Shield active. Monitoring active transactions...`;
        type = 'active';
        break;
      case 'RESOLVED_RELEASED':
        text = `[${time}] RESOLUTION: Behavior verified. Staked collateral released to pool.`;
        type = 'success';
        break;
      case 'RESOLVED_SLASHED':
        text = `[${time}] WARNING: Behavioral anomaly detected! Shield slashed. Collateral redirected.`;
        type = 'error';
        break;
    }
    
    if (text) {
      setLogs((prev) => {
        if (prev.length > 0 && prev[0].text === text) return prev;
        return [{ text, type }, ...prev.slice(0, 15)];
      });
    }
  }, [data?.state, data?.address, data?.stake.txHash]);

  // Periodic time updates for relative timestamps
  useEffect(() => {
    const interval = setInterval(() => setTimeTick(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#040507]">
        <RefreshCw className="w-8 h-8 text-[#00ff88] animate-spin mb-4" />
        <span className="font-mono text-xs text-slate-500 uppercase tracking-widest">Hydrating state machine ledger...</span>
      </div>
    );
  }

  // Action flow handlers
  // Action flow handlers
  const handleSyncLedger = async () => {
    // 1. Start fetching
    await updateCosignRequest(requestId, { 
      state: 'LEDGER_FETCHING',
      ledger: { ...data.ledger, status: 'fetching' }
    });

    // 2. Load ledger records after 1.5s
    setTimeout(async () => {
      const isNew = requestId.startsWith('demo-new');
      await updateCosignRequest(requestId, { 
        state: isNew ? 'LEDGER_EMPTY' : 'LEDGER_LOADED',
        ledger: { ...data.ledger, status: isNew ? 'empty' : 'loaded' }
      });

      if (isNew) {
        // New agent transitions automatically to RISK_COMPUTING
        setTimeout(async () => {
          await updateCosignRequest(requestId, { 
            state: 'RISK_COMPUTING',
            risk: { ...data.risk, status: 'computing' }
          });
          setTimeout(async () => {
            await updateCosignRequest(requestId, { 
              state: 'RISK_MEDIUM_APPROVED',
              risk: { status: 'approved', tier: 'medium', score: 55, reason: null }
            });
          }, 2000);
        }, 1500);
        return;
      }

      // 3. Hash verification audit for established agent
      setTimeout(async () => {
        await updateCosignRequest(requestId, { 
          state: 'HASH_VERIFICATION_RUNNING',
          hashVerification: { status: 'running', verifiedUpTo: 0, brokenAt: null }
        });

        // Verification ticks
        let step = 0;
        const interval = setInterval(async () => {
          step += 3;
          if (step <= 15) {
            await updateCosignRequest(requestId, { 
              hashVerification: { status: 'running', verifiedUpTo: step, brokenAt: null }
            });
          } else {
            clearInterval(interval);
            // 4. Hash verified
            await updateCosignRequest(requestId, { 
              state: 'HASH_CHAIN_VERIFIED',
              hashVerification: { status: 'verified', verifiedUpTo: 15, brokenAt: null }
            });

            // 5. Risk computing
            setTimeout(async () => {
              await updateCosignRequest(requestId, { 
                state: 'RISK_COMPUTING',
                risk: { ...data.risk, status: 'computing' }
              });

              // 6. Risk low approved
              setTimeout(async () => {
                await updateCosignRequest(requestId, { 
                  state: 'RISK_LOW_APPROVED',
                  risk: { status: 'approved', tier: 'low', score: 92, reason: null }
                });
              }, 2000);
            }, 1500);
          }
        }, 300);
      }, 1500);
    }, 1500);
  };

  const handleAnchorIdentity = async () => {
    try {
      if (!address) return;
      await updateCosignRequest(requestId, { state: 'SIGNATURE_REQUESTED' });
      
      const challenge = `Anchor Agent Identity for Request ID: ${requestId}\nTimestamp: ${Date.now()}`;
      await signMessageAsync({ message: challenge });
      
      await updateCosignRequest(requestId, { 
        state: 'SIGNATURE_VERIFIED',
        address: address
      });

      // Automatically switch to ledger tab and trigger sync
      setActiveTab('ledger');
      setTimeout(() => {
        handleSyncLedger();
      }, 500);
    } catch (err: any) {
      if (err.name === 'UserRejectedRequestError') {
        await updateCosignRequest(requestId, { state: 'SIGNATURE_REJECTED' });
      } else {
        await updateCosignRequest(requestId, { state: 'SIGNATURE_INVALID' });
      }
    }
  };

  const handleStakeCollateral = async () => {
    try {
      if (AGENT_COSIGNER_VAULT_ADDRESS === '0x0000000000000000000000000000000000000000') {
        // Fallback to simulation if no live contract is configured yet
        await updateCosignRequest(requestId, { state: 'STAKE_SIGNATURE_REQUESTED' });
        const challenge = `Authorize Collateral Stake of ${data.stake.amount} OKB\nProtocol: Agent Cosigner L2`;
        await signMessageAsync({ message: challenge });
        
        await updateCosignRequest(requestId, { 
          state: 'STAKE_TX_PENDING',
          stake: { ...data.stake, status: 'pending', txHash: '0x3a56cf89a58b29cd12c3de4588abefef89a0bc45' }
        });

        setTimeout(async () => {
          await updateCosignRequest(requestId, { 
            state: 'STAKE_TX_CONFIRMED',
            stake: { ...data.stake, status: 'confirmed', txHash: '0x3a56cf89a58b29cd12c3de4588abefef89a0bc45' }
          });

          setTimeout(async () => {
            await updateCosignRequest(requestId, { state: 'COSIGNED' });
            setTimeout(async () => {
              await updateCosignRequest(requestId, { 
                state: 'RESOLUTION_PENDING',
                resolution: { status: 'pending', resolvedAt: null, redirectedTo: null }
              });

              setTimeout(async () => {
                if (stateRef.current === 'RESOLUTION_PENDING') {
                  await updateCosignRequest(requestId, { 
                    state: 'RESOLVED_RELEASED',
                    resolution: { status: 'released', resolvedAt: Date.now(), redirectedTo: null }
                  });
                }
              }, 4000);
            }, 1500);
          }, 1500);
        }, 2500);
        return;
      }

      await updateCosignRequest(requestId, { state: 'STAKE_SIGNATURE_REQUESTED' });
      
      const time = new Date().toLocaleTimeString();
      setLogs(prev => [
        ...prev,
        {
          text: `[${time}] TX BROADCAST: Requesting collateral stake of 0.01 OKB in wallet...`,
          type: 'active'
        }
      ]);

      // Call the live smart contract stake function
      const txHash = await writeContractAsync({
        address: AGENT_COSIGNER_VAULT_ADDRESS,
        abi: AGENT_COSIGNER_VAULT_ABI,
        functionName: 'stake',
        args: [requestId],
        value: parseEther(data.stake.amount.toString()), // Lock specified OKB amount
      });
      
      // Update DB to pending transaction with the real txHash!
      await updateCosignRequest(requestId, { 
        state: 'STAKE_TX_PENDING',
        stake: { ...data.stake, status: 'pending', txHash: txHash }
      });

      // Track active transaction
      setActiveTxHash(txHash);

      setLogs(prev => [
        ...prev,
        {
          text: `[${time}] TX PENDING: Staking transaction broadcasted. Hash: ${txHash.substring(0, 15)}...`,
          type: 'active'
        }
      ]);
    } catch (err: any) {
      const time = new Date().toLocaleTimeString();
      setLogs(prev => [
        ...prev,
        {
          text: `[${time}] TX FAILED: Collateral stake rejected or failed: ${err.message?.substring(0, 50)}`,
          type: 'error'
        }
      ]);
      await updateCosignRequest(requestId, { state: 'STAKE_SIGNATURE_REJECTED' });
    }
  };

  const handleResetWorkspace = () => {
    setLogs([]);
    setActiveTxHash(null);
    const prefix = requestId.startsWith('demo-new') ? 'demo-new' : 'demo-established';
    const newId = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    setRequestId(newId);
    setActiveTab('core');
    simulator.resetDemo(newId);
  };

  const handleForceState = (forcedState: CosignState) => {
    simulator.forceState(requestId, forcedState);
  };

  // Determine main action button logic driven by the current state
  const renderMainActionButton = () => {
    if (!isConnected) {
      return (
        <button 
          onClick={openConnectModal} 
          className="action-button"
        >
          Connect Wallet
        </button>
      );
    }

    const isAnchorPhase = [
      'IDLE',
      'WALLET_CONNECTING',
      'WALLET_CONNECTED',
      'SIGNATURE_REQUESTED',
      'SIGNATURE_REJECTED',
      'SIGNATURE_INVALID'
    ].includes(data.state);

    const isHighRisk = !isAnchorPhase && ((data.risk.score > 0 && data.risk.score < 70) || data.risk.status === 'declined' || data.state === 'HASH_CHAIN_BROKEN');

    if (isHighRisk || data.state === 'RISK_HIGH_DECLINE') {
      return (
        <button disabled className="action-button bg-amber-600/30 border border-amber-500/20 text-amber-500 cursor-not-allowed shadow-none">
          Risk Too High - Declined
        </button>
      );
    }

    const state = data.state;

    if (state === 'WALLET_CONNECTED') {
      return (
        <button onClick={handleAnchorIdentity} className="action-button">
          Anchor Agent Identity
        </button>
      );
    }

    if (state === 'SIGNATURE_REQUESTED') {
      return (
        <button disabled className="action-button opacity-50">
          Awaiting Signature...
        </button>
      );
    }

    if (state === 'SIGNATURE_REJECTED' || state === 'SIGNATURE_INVALID') {
      return (
        <button onClick={handleAnchorIdentity} className="action-button status-failed-btn">
          Re-sign Challenge
        </button>
      );
    }

    if (state === 'SIGNATURE_VERIFIED') {
      return (
        <button onClick={handleSyncLedger} className="action-button">
          Sync Conscience Ledger
        </button>
      );
    }

    const isSyncing = [
      'LEDGER_FETCHING',
      'HASH_VERIFICATION_RUNNING',
      'RISK_COMPUTING'
    ].includes(state);

    if (isSyncing) {
      return (
        <button disabled className="action-button opacity-50">
          Syncing Cryptographic Data...
        </button>
      );
    }

    if (state === 'LEDGER_FETCH_FAILED') {
      return (
        <button onClick={handleSyncLedger} className="action-button status-failed-btn">
          Retry Ledger Sync
        </button>
      );
    }

    const isRiskApproved = [
      'RISK_LOW_APPROVED',
      'RISK_MEDIUM_APPROVED'
    ].includes(state);

    if (isRiskApproved) {
      return (
        <button onClick={handleStakeCollateral} className="action-button">
          Authorize & Stake Collateral
        </button>
      );
    }


    if (state === 'STAKE_SIGNATURE_REQUESTED') {
      return (
        <button disabled className="action-button opacity-50">
          Awaiting Stake Signature...
        </button>
      );
    }

    if (state === 'STAKE_SIGNATURE_REJECTED') {
      return (
        <button onClick={handleStakeCollateral} className="action-button status-failed-btn">
          Retry Staking Authorization
        </button>
      );
    }

    if (state === 'STAKE_TX_PENDING') {
      return (
        <button disabled className="action-button opacity-50">
          Confirming Transaction...
        </button>
      );
    }

    if (state === 'STAKE_TX_FAILED') {
      return (
        <button onClick={handleStakeCollateral} className="action-button status-failed-btn">
          Retry Stake Transaction
        </button>
      );
    }

    const isCosigned = [
      'STAKE_TX_CONFIRMED',
      'COSIGNED',
      'RESOLUTION_PENDING'
    ].includes(state);

    if (isCosigned) {
      return (
        <button disabled className="action-button bg-emerald-600/30 border border-emerald-500/20 text-emerald-400 cursor-not-allowed shadow-none" style={{ color: 'var(--color-verified)', borderColor: 'rgba(0, 255, 136, 0.2)' }}>
          Cosign Active - Shield Engaged
        </button>
      );
    }

    const isResolved = [
      'RESOLVED_RELEASED',
      'RESOLVED_SLASHED'
    ].includes(state);

    if (isResolved) {
      return (
        <button onClick={handleResetWorkspace} className="action-button">
          Clear Session & Reset
        </button>
      );
    }

    return null;
  };

  // Helper to determine Concentric Shield path styling
  const getRingClass = (ringIndex: number) => {
    const isAnchorPhase = [
      'IDLE',
      'WALLET_CONNECTING',
      'WALLET_CONNECTED',
      'SIGNATURE_REQUESTED',
      'SIGNATURE_REJECTED',
      'SIGNATURE_INVALID'
    ].includes(data.state);

    const isHighRisk = !isAnchorPhase && ((data.risk.score > 0 && data.risk.score < 70) || data.risk.status === 'declined' || data.state === 'HASH_CHAIN_BROKEN');

    if (data.resolution.status === 'slashed' || isHighRisk) return 'shield-ring-path slashed';
    if (['RISK_COMPUTING', 'HASH_VERIFICATION_RUNNING', 'STAKE_TX_PENDING'].includes(data.state)) {
      return 'shield-ring-path active';
    }
    if (data.resolution.status === 'released' || data.stake.status === 'confirmed') {
      return 'shield-ring-path active'; // Stay active/glowing green if confirmed
    }
    return 'shield-ring-path idle';
  };

  return (
    <>
      {showLanding && (
        <LandingPage 
          onEnterConsole={handleEnterConsole} 
          isTransitioning={isTransitioning} 
        />
      )}

      <div className={`console-wrapper ${!showLanding ? 'visible' : ''}`}>
        <div className="app-container">
      {/* Background canvas */}
      <ParticleCanvas />
      <div className="ambient-bg" />

      {/* Sleek Navigation Bar */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo-container">
            <Logo size={28} className="text-[#00ff88] relative z-10 mx-auto" />
            <div className="brand-logo-glow" />
          </div>
          <div>
            <h1 className="brand-title">Agent Cosigner</h1>
            <p className="brand-subtitle">OKX L2 COSIGNING SECURITY COMPANION</p>
          </div>
        </div>
        
        <div className="web3-connect-section">
          <ConnectButton 
            chainStatus="icon"
            showBalance={true}
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'address',
            }}
          />
        </div>
      </header>

      {/* Tab Selectors Navigation */}
      {isConnected && (
        <div className="dashboard-tabs">
          <button 
            onClick={() => setActiveTab('core')} 
            className={`tab-button ${activeTab === 'core' ? 'active' : ''}`}
          >
            Core Dashboard
          </button>
          
          {![
            'IDLE', 
            'WALLET_CONNECTING', 
            'WALLET_CONNECTED', 
            'SIGNATURE_REQUESTED', 
            'SIGNATURE_REJECTED', 
            'SIGNATURE_INVALID'
          ].includes(data.state) && (
            <button 
              onClick={() => setActiveTab('ledger')} 
              className={`tab-button ${activeTab === 'ledger' ? 'active' : ''}`}
            >
              Conscience Ledger
            </button>
          )}
        </div>
      )}

      {/* Grid Layout Container */}
      <div className="terminal-layout">
        
        {activeTab === 'core' ? (
          <>
            {/* Left Column: registry-section + outcome-section */}
            <div className="flex flex-col gap-4 console-slide-left">
              {/* Card 1: Consigner Registry */}
              <div className="terminal-card registry-section">
                <h4 className="terminal-card-header">Registry Profile</h4>
                
                <div className="flex flex-col gap-3">
                  <div className="detail-row">
                    <span className="detail-label">Identity Anchor</span>
                    <span className={`detail-value font-mono text-xs ${data.state !== 'IDLE' ? 'text-white' : 'text-slate-500'}`}>
                      {data.state === 'IDLE' ? 'Unanchored' : `${data.address.substring(0, 8)}...${data.address.substring(data.address.length - 8)}`}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Verification Lock</span>
                    <span className={`led-indicator ${
                      ['IDLE', 'WALLET_CONNECTING', 'WALLET_CONNECTED', 'SIGNATURE_REQUESTED', 'SIGNATURE_REJECTED', 'SIGNATURE_INVALID'].includes(data.state)
                        ? 'idle' 
                        : 'verified'
                    }`}>
                      <span className="led-dot" />
                      {['IDLE', 'WALLET_CONNECTING', 'WALLET_CONNECTED', 'SIGNATURE_REQUESTED', 'SIGNATURE_REJECTED', 'SIGNATURE_INVALID'].includes(data.state)
                        ? 'PENDING' 
                        : 'LOCKED'}
                    </span>
                  </div>
                </div>

                {/* Collateral Metrics */}
                {[
                  'RISK_LOW_APPROVED',
                  'RISK_MEDIUM_APPROVED',
                  'STAKE_SIGNATURE_REQUESTED',
                  'STAKE_SIGNATURE_REJECTED',
                  'STAKE_TX_PENDING',
                  'STAKE_TX_FAILED',
                  'STAKE_TX_CONFIRMED',
                  'COSIGNED',
                  'RESOLUTION_PENDING',
                  'RESOLVED_RELEASED',
                  'RESOLVED_SLASHED'
                ].includes(data.state) && (
                  <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] flex flex-col gap-2">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">OKB Collateral</div>
                    <div className="detail-row">
                      <span className="detail-label">Staked Size</span>
                      <span className="detail-value text-[#00ff88] font-mono">{data.stake.amount} OKB</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Protocol Fee</span>
                      <span className="detail-value text-[#00ff88] font-mono">{data.stake.feePercent.toFixed(1)}%</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Stake Status</span>
                      <span className={`led-indicator ${
                        data.stake.status === 'confirmed' ? 'verified' : 
                        data.stake.status === 'pending' ? 'active' : 
                        data.stake.status === 'failed' || data.stake.status === 'rejected' ? 'error' : 'idle'
                      }`}>
                        <span className="led-dot" />
                        {data.stake.status}
                      </span>
                    </div>
                    {data.stake.txHash && (
                      <div className="detail-row mt-1 flex justify-between items-center text-[10px]">
                        <span className="detail-label">TX Hash:</span>
                        <a 
                          href={`https://www.oklink.com/xlayer-test/tx/${data.stake.txHash}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          {data.stake.txHash.substring(0, 10)}...
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card 2: Outcome Verdict */}
              <div className="terminal-card outcome-section">
                <h4 className="terminal-card-header">Verdict Resolution</h4>
                
                <div className="flex flex-col gap-3">
                  <div className="detail-row">
                    <span className="detail-label">Shield Resolution</span>
                    <span className={`led-indicator ${
                      data.resolution.status === 'released' ? 'verified' : 
                      (data.resolution.status === 'slashed' || (![
                        'IDLE',
                        'WALLET_CONNECTING',
                        'WALLET_CONNECTED',
                        'SIGNATURE_REQUESTED',
                        'SIGNATURE_REJECTED',
                        'SIGNATURE_INVALID'
                      ].includes(data.state) && ((data.risk.score > 0 && data.risk.score < 70) || data.risk.status === 'declined' || data.state === 'HASH_CHAIN_BROKEN'))) ? 'error' : 'idle'
                    }`}>
                      <span className="led-dot" />
                      {(![
                        'IDLE',
                        'WALLET_CONNECTING',
                        'WALLET_CONNECTED',
                        'SIGNATURE_REQUESTED',
                        'SIGNATURE_REJECTED',
                        'SIGNATURE_INVALID'
                      ].includes(data.state) && ((data.risk.score > 0 && data.risk.score < 70) || data.risk.status === 'declined' || data.state === 'HASH_CHAIN_BROKEN')) ? 'DECLINED' : data.resolution.status}
                    </span>
                  </div>
                  {data.resolution.resolvedAt && (
                    <div className="detail-row">
                      <span className="detail-label">Timestamp</span>
                      <span className="detail-value font-mono text-xs">
                        {formatRelativeTime(data.resolution.resolvedAt)}
                      </span>
                    </div>
                  )}
                  {data.resolution.status === 'slashed' && data.resolution.redirectedTo && (
                    <div className="detail-row mt-2 pt-2 border-t border-[rgba(255,255,255,0.06)] text-[10px]">
                      <span className="detail-label">Redirect Pool:</span>
                      <span className="detail-value font-mono text-[9px] text-ellipsis overflow-hidden">{data.resolution.redirectedTo}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Center Column: Visual Core Centerpiece + CTA Button */}
            <div className={`terminal-card security-core-card console-slide-center ${['RISK_COMPUTING'].includes(data.state) ? 'scanning-card-glow' : ''}`}>
              <h4 className="terminal-card-header">Security Core</h4>

              {/* Inline Wallet-to-Agent trust anchor links */}
              <div className="flex justify-between items-center w-full px-4 mb-2">
                <div className="flex flex-col flex-shrink-0">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest">Client Identity</span>
                  <span className={`font-mono text-[11px] ${isConnected ? 'text-[#00ff88]' : 'text-slate-500'}`}>
                    {isConnected ? `${address?.substring(0, 6)}...${address?.substring(address.length - 4)}` : 'DISCONNECTED'}
                  </span>
                </div>
                
                <div className="flex-1 h-[1px] bg-gradient-to-r from-green-500/10 to-green-500/50 mx-4 relative">
                  <div className={`absolute top-[-2px] left-1/2 w-1.5 h-1.5 rounded-full bg-[#00ff88] ${data.state === 'SIGNATURE_REQUESTED' ? 'animate-ping' : ''}`} />
                </div>

                <div className="flex flex-col text-right flex-shrink-0">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest">L2 trust link</span>
                  <span className={`font-mono text-[11px] ${['IDLE', 'WALLET_CONNECTING', 'WALLET_CONNECTED'].includes(data.state) ? 'text-slate-500' : 'text-[#00ff88]'}`}>
                    {['IDLE', 'WALLET_CONNECTING', 'WALLET_CONNECTED'].includes(data.state) ? 'UNLINKED' : 'OKX-L2-SECURE'}
                  </span>
                </div>
              </div>

              {/* Gyroscope Concentric rings shield widget */}
              <div className="core-telemetry-widget">
                <div className={`risk-radar-sweep ${['RISK_COMPUTING', 'HASH_VERIFICATION_RUNNING'].includes(data.state) ? 'active' : ''}`} />

                <svg width="220" height="220" viewBox="0 0 220 220" className="absolute z-10">
                  <circle cx="110" cy="110" r="95" className={`${getRingClass(1)} ring-axis-1`} />
                  <circle cx="110" cy="110" r="75" className={`${getRingClass(2)} ring-axis-2`} />
                  <circle cx="110" cy="110" r="55" className={`${getRingClass(3)} ring-axis-3`} />
                </svg>

                {/* Shield status center logo lock */}
                <div className={`shield-lock-icon ${data.resolution.status === 'slashed' ? 'slashed' : 'active'}`}>
                  {data.resolution.status === 'slashed' ? (
                    <Logo size={24} className="text-red-500 filter drop-shadow-[0_0_8px_rgba(255,51,51,0.5)]" />
                  ) : data.resolution.status === 'released' || data.stake.status === 'confirmed' ? (
                    <Logo size={24} className="text-[#00ff88] filter drop-shadow-[0_0_8px_rgba(0,255,136,0.5)]" />
                  ) : (
                    <Logo size={24} className="text-slate-500 opacity-60" />
                  )}
                </div>
              </div>

              {/* Concentric index text labels */}
              <div className="core-score-display">
                <div className="core-score-value">
                  {data.state === 'RISK_COMPUTING' ? '??' : data.risk.score > 0 ? data.risk.score : '--'}
                </div>
                <div className="core-score-label">
                  {data.state === 'RISK_COMPUTING' ? 'COMPUTING COGNITIVE INDEX...' : 'CONSIGNE RISK INDEX'}
                </div>
              </div>

              {/* Action trigger button */}
              {renderMainActionButton()}
            </div>

            {/* Right Column: Live Telemetry Log stream only */}
            <div className="flex flex-col gap-4 console-slide-right">
              <div className="terminal-card log-stream-container flex-1" style={{ minHeight: '380px' }}>
                <h4 className="terminal-card-header">Live Telemetry Log</h4>
                <div ref={logTerminalRef} className="log-stream-terminal" style={{ flex: 1 }}>
                  {logs.length > 0 ? (
                    logs.map((log, idx) => (
                      <div key={idx} className={`log-entry ${log.type}`}>
                        {log.text}
                      </div>
                    ))
                  ) : (
                    <div className="text-[9px] text-slate-600 font-mono">STANDBY // SYSTEM MONITORING INACTIVE...</div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Conscience Ledger Tab with scroll reveal animation */
          <div className="scroll-reveal-container flex flex-col lg:flex-row gap-5 col-span-3 w-full">
            {/* Left Column: Live Telemetry Log */}
            <div className="flex flex-col gap-4 lg:w-1/3 console-slide-left">
              <div className="terminal-card log-stream-container flex-1" style={{ minHeight: '420px' }}>
                <h4 className="terminal-card-header">Live Telemetry Log</h4>
                <div ref={logTerminalRef} className="log-stream-terminal" style={{ flex: 1 }}>
                  {logs.length > 0 ? (
                    logs.map((log, idx) => (
                      <div key={idx} className={`log-entry ${log.type}`}>
                        {log.text}
                      </div>
                    ))
                  ) : (
                    <div className="text-[9px] text-slate-600 font-mono">STANDBY // SYSTEM MONITORING INACTIVE...</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Conscience Ledger Timeline */}
            <div className="terminal-card ledger-container lg:w-2/3 console-slide-right" style={{ minHeight: '420px' }}>
              <ConscienceLedger 
                state={data.state}
                ledger={data.ledger}
                hashVerification={data.hashVerification}
                onRetryFetch={handleSyncLedger}
              />
            </div>
          </div>
        )}

      </div>

      {/* Floating control deck for demos */}
      <ControlPanel 
        currentRequestId={requestId}
        onRequestIdChange={handleRequestIdChange}
        currentState={data.state}
        onForceState={handleForceState}
      />
        </div>
      </div>
    </>
  );
};

const CustomAvatar = ({ ensImage, size }: { address: string; ensImage?: string | null; size: number }) => {
  return ensImage ? (
    <img
      src={ensImage}
      width={size}
      height={size}
      style={{ borderRadius: 999 }}
    />
  ) : (
    <div
      style={{
        backgroundColor: '#0b0d12',
        border: '1px solid rgba(0, 255, 136, 0.3)',
        borderRadius: 999,
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#00ff88',
        boxShadow: '0 0 10px rgba(0, 255, 136, 0.2)',
      }}
    >
      <Logo size={size * 0.6} />
    </div>
  );
};

// --- App Root Wrapper with Providers ---
export function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          avatar={CustomAvatar}
          theme={darkTheme({
            accentColor: 'var(--color-active)',
            accentColorForeground: '#03060a',
            borderRadius: 'large',
            overlayBlur: 'small',
          })}
        >
          <AppContent />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
