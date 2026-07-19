# 🛡️ Agent Consigner

> **L2 Co-Signing Security Shield for Autonomous AI Agent Economies**  
> *Built on OKX's L2 Network (X Layer)*

---

## 💡 The Vision
As AI agents transition from read-only assistants to autonomous economic actors executing on-chain transactions, they operate in high-risk environments. If an agent is hijacked, its memory database tampered with, or its cognitive engine fractured, there are no guardrails to prevent catastrophic financial leakage or contract exploitation.

**Agent Consigner** solves this. It acts as a decentralized co-signing security companion on OKX’s L2 (X Layer). By combining cryptographic identity anchoring, visual conscience ledger audits, and real-time collateral vault staking, Agent Consigner establishes a trust boundary ensuring that no autonomous transaction is co-signed without verification.

---

## ⚡ Core Features

### 1. Cryptographic Identity Anchoring
*   **Decentralized Verification:** Binds client wallets to AI agent identities using secure ECDSA signature challenges.
*   **Dual-Sign Handshake:** Validates agent identity keys on-chain, creating a secure trust link on X Layer L2.

### 2. The Conscience Ledger (Tamper-Evident Timeline)
*   **Laser Node Thread:** An interactive, glowing chronological block timeline showing historical decisions.
*   **Integrity Audits:** Evaluates block hash linkages. If a previous hash link mismatch is detected, the visual thread fractures, and the system flags a warning state.

### 3. Collateral Staking Vault (Live L2 Actions)
*   **Native OKB Staking:** Users authorize operations by staking native OKB collateral directly to a live smart contract on X Layer Testnet.
*   **Autorelease & Slashing:** Collateral remains locked during execution and is either released automatically on successful task resolution or slashed by the protocol if security is breached.

### 4. Dynamic Risk Engine
*   **Cognitive Check:** Evaluates risk vectors dynamically, outputting a **Consigne Risk Index**.
*   **Instant Decline:** If risk score falls below `70` (e.g., from ledger fractures), the concentric security rings turn warning-red, the resolution updates to `DECLINED`, and the transaction button is locked.

---

## 🛠️ Tech Stack & Architecture

*   **L2 Blockchain:** [OKX X Layer Testnet](https://www.okx.com/xlayer)
*   **Smart Contracts:** Solidity (Staking Vault)
*   **Frontend Deck:** React, TypeScript, Vite
*   **Web3 Integration:** Wagmi v2, Viem, RainbowKit
*   **Styling System:** Custom Obsidian Theme (Glassmorphism, Neon Green highlights, keyframe animations)

---

## 📝 Smart Contract Deployments

The staking logic is deployed and verified on **X Layer Testnet**:

*   **AgentStaking Vault Contract:** [`0x6465fA0b07797175498f5647F558a8587b0834Db`](https://www.oklink.com/xlayer-test/address/0x6465fA0b07797175498f5647F558a8587b0834Db)
*   **Block Explorer:** [OKLink X Layer Testnet Explorer](https://www.oklink.com/xlayer-test)

---

## 🚀 Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   npm or yarn
*   A browser extension wallet (Rabby, MetaMask, etc.) configured for X Layer Testnet

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/GreatSage-dev/Agent-Consigner.git
cd Agent-Consigner
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
VITE_PROJECT_ID=your_reown_project_id # For Web3 Wallet Connections
```

### 3. Run Development Server
```bash
npm run dev
```
The console will be available locally at `http://localhost:5173/`.

### 4. Build for Production
```bash
npm run build
```

---

## 🎮 Demo Controller (Audit Guide)
To help judges test edge cases during evaluation, a **Demo Controller** overlay is included in the interface:
1.  **Scenario Toggles:** Switch between **Established Agent** (low risk, valid ledger history) and **New Agent** (fractured ledger audit scenario).
2.  **State Injectors:** Force transitions to simulate specific network outcomes (e.g. `Invalid Sign`, `Fracture Ledger`, `Decline Risk`, `Slash Shield`).
3.  **Real-Time Telemetry Logs:** Monitor system processes, blockchain broadcasts, and transaction confirmations live.
