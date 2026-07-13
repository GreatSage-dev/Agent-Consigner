import React from 'react';
import { Lock, Unlock, ShieldAlert, Coins } from 'lucide-react';
import { ProtocolNode, NodeStatus } from './ProtocolNode';
import { StakeState, ResolutionState, CosignState } from '../types';

interface CollateralShieldProps {
  state: CosignState;
  stake: StakeState;
  resolution: ResolutionState;
  onRetryStake?: () => void;
}

export const CollateralShield: React.FC<CollateralShieldProps> = ({
  state,
  stake,
  resolution,
  onRetryStake,
}) => {
  // Determine node status
  const getNodeStatus = (): NodeStatus => {
    switch (state) {
      case 'STAKE_SIGNATURE_REQUESTED':
        return 'active';
      case 'STAKE_SIGNATURE_REJECTED':
        return 'dim';
      case 'STAKE_TX_PENDING':
        return 'active';
      case 'STAKE_TX_FAILED':
        return 'failed';
      case 'STAKE_TX_CONFIRMED':
      case 'COSIGNED':
      case 'RESOLUTION_PENDING':
        return 'verified';
      case 'RESOLVED_RELEASED':
        return 'verified';
      case 'RESOLVED_SLASHED':
        return 'invalid';
      default:
        // Before stake starts, if risk approved, it's dim/ready. Otherwise dim.
        if (state === 'RISK_LOW_APPROVED' || state === 'RISK_MEDIUM_APPROVED') {
          return 'dim'; // ready to stake
        }
        return 'dim';
    }
  };

  // Determine node value
  const getNodeValue = () => {
    if (state === 'RESOLVED_SLASHED') return 'Slashed to Pool';
    if (state === 'RESOLVED_RELEASED') return 'Stake Returned';
    
    const isStaked = [
      'STAKE_TX_CONFIRMED',
      'COSIGNED',
      'RESOLUTION_PENDING'
    ].includes(state);

    if (isStaked) {
      return `${stake.amount} USDC Locked`;
    }
    if (state === 'STAKE_TX_PENDING') return 'Confirming tx...';
    if (state === 'STAKE_SIGNATURE_REQUESTED') return 'Awaiting auth...';
    if (state === 'STAKE_TX_FAILED') return 'Tx Reverted';
    
    // Default show stake amount target
    return `${stake.amount} USDC Required`;
  };

  const getNodeLabel = () => {
    if (state === 'RESOLVED_SLASHED') return 'Collateral Slashed';
    if (state === 'RESOLVED_RELEASED') return 'Collateral Released';
    if (state === 'STAKE_TX_CONFIRMED' || state === 'COSIGNED' || state === 'RESOLUTION_PENDING') {
      return 'Collateral Shield';
    }
    return 'Shield Collateral';
  };

  // SVG shield path styling
  const getRingClass = (_ringIndex: number) => {
    // If slashed, all rings crack/shake
    if (resolution.status === 'slashed') return 'shield-ring-path slashed';
    if (resolution.status === 'released') return 'shield-ring-path released';

    const status = stake.status;
    if (status === 'confirmed') return 'shield-ring-path confirmed';
    if (status === 'pending') return 'shield-ring-path pending';
    if (status === 'requested') return 'shield-ring-path requesting';
    
    return 'shield-ring-path unlit';
  };

  const isConfirmed = [
    'STAKE_TX_CONFIRMED',
    'COSIGNED',
    'RESOLUTION_PENDING'
  ].includes(state);

  return (
    <div className="shield-wrapper">
      {/* Visual Collateral Shield Rings Overlay */}
      <div className="collateral-shield">
        <svg className="shield-grid-svg" viewBox="0 0 250 250">
          <defs>
            <filter id="shield-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Ring */}
          <circle
            cx="125"
            cy="125"
            r="115"
            className={getRingClass(1)}
            style={{ transformOrigin: '125px 125px' }}
          />

          {/* Middle Hexagonal/Grid Dashed Ring */}
          <circle
            cx="125"
            cy="125"
            r="95"
            className={getRingClass(2)}
            style={{ 
              transformOrigin: '125px 125px', 
              animationDirection: 'reverse',
              strokeDasharray: '15 5 2 5' 
            }}
          />

          {/* Inner Grid Circle */}
          <circle
            cx="125"
            cy="125"
            r="80"
            className={getRingClass(3)}
            style={{ transformOrigin: '125px 125px' }}
          />
        </svg>

        {/* Gathering particle streams during requested signature */}
        {stake.status === 'requested' && (
          <>
            <div className="shield-gather-particle" style={{ '--angle': '0deg' } as any} />
            <div className="shield-gather-particle" style={{ '--angle': '60deg' } as any} />
            <div className="shield-gather-particle" style={{ '--angle': '120deg' } as any} />
            <div className="shield-gather-particle" style={{ '--angle': '180deg' } as any} />
            <div className="shield-gather-particle" style={{ '--angle': '240deg' } as any} />
            <div className="shield-gather-particle" style={{ '--angle': '300deg' } as any} />
          </>
        )}

        {/* Lock / Unlock Icon Centerpiece indicator overlay */}
        {isConfirmed && resolution.status === 'pending' && (
          <div className="shield-lock-icon">
            <Lock className="w-5 h-5 text-emerald-400" />
          </div>
        )}

        {resolution.status === 'released' && (
          <div className="shield-lock-icon" style={{ borderColor: 'var(--color-verified)', boxShadow: 'var(--glow-verified)' }}>
            <Unlock className="w-5 h-5 text-emerald-400" />
          </div>
        )}

        {resolution.status === 'slashed' && (
          <div className="shield-lock-icon slashed" style={{ borderColor: 'var(--color-invalid)', boxShadow: 'var(--glow-invalid)' }}>
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
        )}
      </div>

      {/* Underlaying Node */}
      <ProtocolNode
        status={getNodeStatus()}
        label={getNodeLabel()}
        value={getNodeValue()}
        onRetry={stake.status === 'failed' ? onRetryStake : undefined}
        ambient={stake.status === 'pending'}
      >
        {!isConfirmed && resolution.status === 'pending' && (
          <Coins className="w-4 h-4 opacity-25 mt-2 text-slate-400" />
        )}
      </ProtocolNode>
    </div>
  );
};

export default CollateralShield;
