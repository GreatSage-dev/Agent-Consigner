import React from 'react';
import { 
  CheckCircle2, 
  AlertOctagon, 
  AlertTriangle, 
  HelpCircle, 
  User, 
  ShieldAlert, 
  RotateCw
} from 'lucide-react';

export type NodeStatus = 'dim' | 'active' | 'verified' | 'declined' | 'failed' | 'unrated' | 'invalid';

interface ProtocolNodeProps {
  status: NodeStatus;
  label: string;
  value?: string;
  onRetry?: () => void;
  ambient?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const ProtocolNode: React.FC<ProtocolNodeProps> = ({
  status,
  label,
  value,
  onRetry,
  ambient = false,
  className = '',
  children,
}) => {
  const getIcon = () => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" style={{ color: 'var(--color-verified)' }} />;
      case 'declined':
        return <AlertOctagon className="w-4 h-4 text-amber-500" style={{ color: 'var(--color-declined)' }} />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-slate-400" style={{ color: 'var(--color-failed)' }} />;
      case 'unrated':
        return <HelpCircle className="w-4 h-4 text-teal-400" style={{ color: 'var(--color-unrated)' }} />;
      case 'invalid':
        return <ShieldAlert className="w-4 h-4 text-red-500" style={{ color: 'var(--color-invalid)' }} />;
      case 'active':
        return <RotateCw className="w-4 h-4 text-cyan-400 animate-spin" style={{ color: 'var(--color-active)' }} />;
      case 'dim':
      default:
        return <User className="w-4 h-4 opacity-30" style={{ color: 'var(--color-dim)' }} />;
    }
  };

  return (
    <div className={`protocol-node status-${status} ${className}`}>
      {ambient && <div className="protocol-node-ambient-glow" />}
      
      <div className="flex items-center gap-2 mb-1">
        <span className="protocol-node-label">{label}</span>
        {getIcon()}
      </div>

      {value && (
        <span className="protocol-node-value text-ellipsis overflow-hidden max-w-[150px] whitespace-nowrap">
          {value}
        </span>
      )}

      {status === 'failed' && onRetry && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onRetry();
          }}
          className="protocol-node-retry flex items-center gap-1"
        >
          <RotateCw className="w-3 h-3" />
          Retry
        </button>
      )}

      {children}
    </div>
  );
};

export default ProtocolNode;
