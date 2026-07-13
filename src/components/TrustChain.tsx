import React from 'react';
import { ProtocolNode, NodeStatus } from './ProtocolNode';
import { CosignState } from '../types';

interface TrustChainProps {
  state: CosignState;
  address: string;
  onRetrySignature?: () => void;
}

export const TrustChain: React.FC<TrustChainProps> = ({
  state,
  address,
  onRetrySignature,
}) => {
  // Determine user wallet node status
  const getWalletStatus = (): NodeStatus => {
    if (state === 'IDLE') return 'dim';
    if (state === 'WALLET_CONNECTING') return 'active';
    return 'verified';
  };

  // Determine agent identity node status
  const getAgentStatus = (): NodeStatus => {
    switch (state) {
      case 'IDLE':
      case 'WALLET_CONNECTING':
      case 'WALLET_CONNECTED':
        return 'dim';
      case 'SIGNATURE_REQUESTED':
        return 'active';
      case 'SIGNATURE_REJECTED':
        return 'failed';
      case 'SIGNATURE_INVALID':
        return 'invalid';
      default:
        // SIGNATURE_VERIFIED and onwards are verified
        return 'verified';
    }
  };

  // Helper to format wallet address
  const formatAddress = (addr: string) => {
    if (!addr) return 'Not Connected';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Determine label for the agent identity node
  const getAgentLabel = () => {
    switch (state) {
      case 'SIGNATURE_REQUESTED':
        return 'Verifying Sign';
      case 'SIGNATURE_REJECTED':
        return 'Sign Rejected';
      case 'SIGNATURE_INVALID':
        return 'Sign Invalid';
      case 'IDLE':
      case 'WALLET_CONNECTING':
      case 'WALLET_CONNECTED':
        return 'Agent Identity';
      default:
        return 'Identity Locked';
    }
  };

  // Determine value for the agent identity node
  const getAgentValue = () => {
    switch (state) {
      case 'SIGNATURE_REJECTED':
        return 'User Declined';
      case 'SIGNATURE_INVALID':
        return 'Address Mismatch';
      case 'IDLE':
      case 'WALLET_CONNECTING':
      case 'WALLET_CONNECTED':
        return 'Unknown Agent';
      default:
        return 'OKX-L2-Consigner-V1';
    }
  };

  // SVG link connector styling based on state
  const getLineClass = () => {
    if (state === 'SIGNATURE_REQUESTED') return 'trust-line active';
    
    const isVerifiedOrLater = ![
      'IDLE',
      'WALLET_CONNECTING',
      'WALLET_CONNECTED',
      'SIGNATURE_REQUESTED',
      'SIGNATURE_REJECTED',
      'SIGNATURE_INVALID'
    ].includes(state);

    if (isVerifiedOrLater) return 'trust-line verified';
    if (state === 'SIGNATURE_INVALID') return 'trust-line invalid';
    return 'trust-line unlit';
  };

  return (
    <div className="node-chain-layout">
      {/* Wallet Node */}
      <ProtocolNode
        status={getWalletStatus()}
        label={state === 'WALLET_CONNECTING' ? 'Connecting Wallet' : 'User Wallet'}
        value={state === 'IDLE' || state === 'WALLET_CONNECTING' ? undefined : formatAddress(address)}
        ambient={state === 'WALLET_CONNECTING'}
      />

      {/* SVG Connecting Light Thread */}
      <div className="trust-chain-connector">
        <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
          {/* Background shadow line */}
          <path
            d="M0 20C30 20 90 20 120 20"
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth="4"
          />
          {/* Animated light thread */}
          <path
            d="M0 20C30 20 90 20 120 20"
            className={getLineClass()}
          />
        </svg>
      </div>

      {/* Agent Node */}
      <ProtocolNode
        status={getAgentStatus()}
        label={getAgentLabel()}
        value={getAgentValue()}
        onRetry={state === 'SIGNATURE_REJECTED' || state === 'SIGNATURE_INVALID' ? onRetrySignature : undefined}
        ambient={state === 'SIGNATURE_REQUESTED'}
      />
    </div>
  );
};

export default TrustChain;
