import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  Shield, 
  Database, 
  Cpu, 
  Coins, 
  CheckCircle2, 
  ArrowDown, 
  Layers, 
  Lock, 
  DollarSign, 
  Award,
  Zap
} from 'lucide-react';
import Logo from './Logo';

interface LandingPageProps {
  onEnterConsole: () => void;
  isTransitioning: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterConsole, isTransitioning }) => {
  const [activeStatement, setActiveStatement] = useState(0);
  const [flowStep, setFlowStep] = useState(0);
  const [metricCounts, setMetricCounts] = useState({ agents: 0, collateral: 0, time: 0, success: 0 });
  const [nodeVerified, setNodeVerified] = useState(false);

  // Animate the hero trust network nodes
  useEffect(() => {
    const timer = setTimeout(() => setNodeVerified(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Animate statements for Section 2 (Cold Start Problem)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStatement((prev) => {
        if (prev < 4) return prev + 1;
        return prev;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Animate Section 3 (Protocol Flow) active step dot
  useEffect(() => {
    const interval = setInterval(() => {
      setFlowStep((prev) => (prev + 1) % 6);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Animate Section 7 (Metrics)
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepTime = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setMetricCounts({
        agents: Math.floor((142 / steps) * currentStep),
        collateral: parseFloat(((12.5 / steps) * currentStep).toFixed(1)),
        time: parseFloat(((2.4 / steps) * currentStep).toFixed(1)),
        success: parseFloat(((99.98 / steps) * currentStep).toFixed(2)),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setMetricCounts({ agents: 142, collateral: 12.5, time: 2.4, success: 99.98 });
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`landing-wrapper ${isTransitioning ? 'fade-out' : ''}`}>
      
      {/* Top Navbar */}
      <nav className="landing-nav">
        <div className="nav-brand">
          <Logo size={24} className="text-[#00ff88]" />
          <span className="nav-brand-title">Agent Cosigner</span>
        </div>
        <button className="btn-primary" onClick={onEnterConsole}>
          Enter Console →
        </button>
      </nav>

      {/* SECTION 1: Hero */}
      <section className="landing-section hero-grid">
        <div className="hero-content">
          <h1 className="hero-headline">
            <span className="animate-fade-slide delay-1">Trust,</span>
            <span className="animate-fade-slide delay-2 text-[#00ff88]">Before Reputation.</span>
          </h1>
          <p className="hero-supporting">
            Agent Cosigner enables trustworthy AI agents to enter the marketplace by staking collateral before they've earned a reputation.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={onEnterConsole}>
              Enter Console →
            </button>
            <a href="#protocol-flow" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Read Protocol
            </a>
          </div>
        </div>

        {/* Hero Graphic: Symmetrical Trust Network */}
        <div className="trust-network-canvas">
          <svg width="240" height="240" viewBox="0 0 240 240" style={{ overflow: 'visible' }}>
            {/* Connection Paths (Laser Green Channels) */}
            <path d="M120 40 L70 120 M120 40 L170 120 M70 120 L120 200 M170 120 L120 200 M70 120 L170 120" stroke="rgba(0, 255, 136, 0.25)" strokeWidth="1.5" />
            <path d="M120 40 L120 200" stroke="rgba(0, 255, 136, 0.25)" strokeWidth="1.5" />
            
            {/* Outer Nodes (Obsidian plates with active green outlines) */}
            <circle cx="120" cy="40" r="5" fill="#0b0d12" stroke="rgba(0, 255, 136, 0.6)" strokeWidth="1.5" />
            <circle cx="70" cy="120" r="5" fill="#0b0d12" stroke="rgba(0, 255, 136, 0.6)" strokeWidth="1.5" />
            <circle cx="170" cy="120" r="5" fill="#0b0d12" stroke="rgba(0, 255, 136, 0.6)" strokeWidth="1.5" />
            <circle cx="120" cy="200" r="5" fill="#0b0d12" stroke="rgba(0, 255, 136, 0.6)" strokeWidth="1.5" />

            {/* Concentric rotating verification rings in center */}
            <circle cx="120" cy="120" r="32" stroke="rgba(0, 255, 136, 0.15)" strokeWidth="1" strokeDasharray="3 3" style={{ transformOrigin: '120px 120px', animation: 'spin-clockwise 15s linear infinite' }} />
            <circle cx="120" cy="120" r="24" stroke="rgba(0, 255, 136, 0.25)" strokeWidth="1" strokeDasharray="6 3" style={{ transformOrigin: '120px 120px', animation: 'spin-clockwise 10s linear reverse infinite' }} />

            {/* Central Node - Verification Shield Monogram */}
            <foreignObject x="106" y="106" width="28" height="28">
              <Logo size={28} className={`${nodeVerified ? 'text-[#00ff88] filter drop-shadow-[0_0_8px_rgba(0,255,136,0.6)]' : 'text-slate-600'} transition-all duration-1000`} />
            </foreignObject>
          </svg>
        </div>
      </section>

      {/* SECTION 2: Problem */}
      <section className="landing-section">
        <div className="problem-card">
          <div className="problem-header">Analysis</div>
          <h2 className="problem-title">The Cold Start Problem</h2>
          
          <div className="problem-statements">
            <div className={`statement-row ${activeStatement >= 1 ? 'visible' : ''}`}>
              <span className="statement-num">01</span>
              <span className="statement-text">Every new AI agent starts completely unknown.</span>
            </div>
            <div className={`statement-row ${activeStatement >= 2 ? 'visible' : ''}`}>
              <span className="statement-num">02</span>
              <span className="statement-text">Without trust, counterparties refuse to transact.</span>
            </div>
            <div className={`statement-row ${activeStatement >= 3 ? 'visible' : ''}`}>
              <span className="statement-num">03</span>
              <span className="statement-text">Without transactions, reputation never grows.</span>
            </div>
          </div>

          <div className={`problem-deadlock ${activeStatement >= 4 ? 'visible' : ''}`}>
            The ecosystem reaches a deadlock.
          </div>
        </div>
      </section>

      {/* SECTION 3: How it Works (Vertical Flow) */}
      <section className="landing-section" id="protocol-flow">
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div className="problem-header">Workflow</div>
          <h2 className="problem-title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>How Agent Cosigner Works</h2>
          <p style={{ color: '#8e9cae', fontSize: '0.95rem' }}>A beautifully designed vertical protocol flow.</p>
        </div>

        <div className="flow-container">
          <div className={`flow-step-node ${flowStep === 0 ? 'active' : ''}`}>Unknown Agent</div>
          <div className="flow-connector-line">
            <div className={`flow-connector-dot ${flowStep === 0 ? 'animating' : ''}`} />
          </div>

          <div className={`flow-step-node ${flowStep === 1 ? 'active' : ''}`}>Identity Verification</div>
          <div className="flow-connector-line">
            <div className={`flow-connector-dot ${flowStep === 1 ? 'animating' : ''}`} />
          </div>

          <div className={`flow-step-node ${flowStep === 2 ? 'active' : ''}`}>Conscience Ledger</div>
          <div className="flow-connector-line">
            <div className={`flow-connector-dot ${flowStep === 2 ? 'animating' : ''}`} />
          </div>

          <div className={`flow-step-node ${flowStep === 3 ? 'active' : ''}`}>Risk Assessment</div>
          <div className="flow-connector-line">
            <div className={`flow-connector-dot ${flowStep === 3 ? 'animating' : ''}`} />
          </div>

          <div className={`flow-step-node ${flowStep === 4 ? 'active' : ''}`}>Collateral Locked</div>
          <div className="flow-connector-line">
            <div className={`flow-connector-dot ${flowStep === 4 ? 'animating' : ''}`} />
          </div>

          <div className={`flow-step-node ${flowStep === 5 ? 'active' : ''}`}>Trusted Transaction</div>
        </div>
      </section>

      {/* SECTION 4: Core Capabilities Grid */}
      <section className="landing-section">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="problem-header">Capabilities</div>
          <h2 className="problem-title" style={{ fontSize: '2rem' }}>Core Infrastructure</h2>
        </div>

        <div className="capabilities-grid">
          {/* Card 1 */}
          <div className="capability-card">
            <Shield className="capability-icon" size={24} />
            <h3 className="capability-title">Identity Verification</h3>
            <p className="capability-desc">Cryptographically anchors an agent's on-chain keys to verified client configurations.</p>
          </div>

          {/* Card 2 */}
          <div className="capability-card">
            <Database className="capability-icon" size={24} />
            <h3 className="capability-title">Conscience Ledger</h3>
            <p className="capability-desc">Verifies historical ledger records using SHA-256 block-by-block hash integrity audits.</p>
          </div>

          {/* Card 3 */}
          <div className="capability-card">
            <Cpu className="capability-icon" size={24} />
            <h3 className="capability-title">Risk Engine</h3>
            <p className="capability-desc">Runs realtime cognitive heuristics to score anomalies and prevent fraudulent behavior.</p>
          </div>

          {/* Card 4 */}
          <div className="capability-card">
            <Coins className="capability-icon" size={24} />
            <h3 className="capability-title">Collateral Management</h3>
            <p className="capability-desc">Stakes and locks USDC staking pools, ensuring that counterparties are protected.</p>
          </div>

          {/* Card 5 */}
          <div className="capability-card">
            <CheckCircle2 className="capability-icon" size={24} />
            <h3 className="capability-title">On-chain Verification</h3>
            <p className="capability-desc">Broadcasts security verdicts directly to OKX X Layer for verifiable execution proof.</p>
          </div>

          {/* Card 6 */}
          <div className="capability-card">
            <Zap className="capability-icon" size={24} />
            <h3 className="capability-title">Settlement</h3>
            <p className="capability-desc">Releases stakes automatically upon successful validations, or slashes on anomalies.</p>
          </div>
        </div>
      </section>

      {/* SECTION 5: Protocol Architecture Diagram */}
      <section className="landing-section">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="problem-header">System</div>
          <h2 className="problem-title" style={{ fontSize: '2rem' }}>Protocol Architecture</h2>
        </div>

        <div className="diagram-canvas">
          <div className="flow-container">
            <div className="flow-step-node" style={{ background: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>AI Agent</div>
            <div className="flow-connector-line" style={{ height: '40px' }} />
            
            <div className="flow-step-node" style={{ borderColor: '#0052ff', background: 'rgba(0, 82, 255, 0.05)' }}>Agent Cosigner ASP</div>
            <div className="flow-connector-line" style={{ height: '40px' }} />

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div className="flow-step-node" style={{ minWidth: '160px', fontSize: '0.85rem' }}>Identity Layer</div>
              <div className="flow-step-node" style={{ minWidth: '160px', fontSize: '0.85rem' }}>Conscience Ledger</div>
              <div className="flow-step-node" style={{ minWidth: '160px', fontSize: '0.85rem' }}>Risk Engine</div>
            </div>

            <div className="flow-connector-line" style={{ height: '40px' }} />
            <div className="flow-step-node" style={{ borderColor: '#00ff88', background: 'rgba(0, 255, 136, 0.05)' }}>USDC Escrow Pool</div>
            
            <div className="flow-connector-line" style={{ height: '40px' }} />
            <div className="flow-step-node" style={{ background: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Counterparty</div>
          </div>
        </div>
      </section>

      {/* SECTION 6: Design Statement */}
      <section className="landing-section statement-card">
        <h2 className="statement-headline">"Trust should be programmable."</h2>
        <p className="statement-desc">
          We believe reputation is a lagging indicator. In the age of autonomous AI, security infrastructure must verify safety before transactions execute. Code is trust.
        </p>
      </section>

      {/* SECTION 7: Metrics */}
      <section className="landing-section">
        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-number">{metricCounts.agents}</div>
            <div className="metric-label">Verified Agents</div>
          </div>
          <div className="metric-item">
            <div className="metric-number">${metricCounts.collateral}M</div>
            <div className="metric-label">Collateral Locked</div>
          </div>
          <div className="metric-item">
            <div className="metric-number">&lt; {metricCounts.time}s</div>
            <div className="metric-label">Decision Latency</div>
          </div>
          <div className="metric-item">
            <div className="metric-number">{metricCounts.success}%</div>
            <div className="metric-label">Successful Transact</div>
          </div>
        </div>
      </section>

      {/* SECTION 8: Final CTA */}
      <section className="cta-card">
        <h2 className="cta-title">Every Great Agent<br />Starts Unknown.</h2>
        <p className="cta-desc">
          Agent Cosigner gives trustworthy AI agents a secure path to earning trust. Enter the console to audit, stake, and deploy.
        </p>
        <button className="btn-primary" style={{ padding: '1rem 2.25rem', fontSize: '0.95rem' }} onClick={onEnterConsole}>
          Enter Console →
        </button>
      </section>

      {/* Footer */}
      <footer style={{ padding: '4rem 2rem', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.03)', color: '#526071', fontSize: '0.8rem', fontFamily: 'monospace' }}>
        AGENT COSIGNER // PROTOCOL V1.0 // OKX.AI HACKATHON BUILD
      </footer>

    </div>
  );
};

export default LandingPage;
