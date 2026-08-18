/**
 * HiveBriefcase SDK — Payment Channels
 * Base (Ethereum L2) state channels for agent micropayments
 * Off-chain signed state, on-chain settlement
 * AgentHive Inc. | agenthiveinc.com
 */

const crypto = require('crypto');

/**
 * Payment Channel — off-chain state machine
 * Two parties: agent (payer) and service (payee)
 * Each payment = signed state update, no gas until close
 */
class PaymentChannel {
  constructor({ channelId, agentDID, serviceEndpoint, depositAmount, currency = 'USDC' }) {
    this.channelId = channelId || `ch_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    this.agentDID = agentDID;
    this.serviceEndpoint = serviceEndpoint;
    this.depositAmount = depositAmount;   // in base units (e.g. 1000000 = 1 USDC)
    this.currency = currency;
    this.balance = depositAmount;          // remaining agent balance
    this.paid = 0;                         // total paid to service
    this.nonce = 0;                        // monotonic — prevents replay
    this.state = 'open';                   // open | closed | disputed
    this.opened = new Date().toISOString();
    this.closed = null;
    this.history = [];                     // all signed state updates
  }

  /**
   * Create a micropayment state update
   * Returns signed state — agent sends this to service provider
   * No blockchain interaction — instant, gas-free
   */
  pay(amount, description = '') {
    if (this.state !== 'open') throw new Error(`Channel ${this.channelId} is ${this.state}`);
    if (amount > this.balance) throw new Error(`Insufficient balance: ${this.balance} < ${amount}`);
    if (amount <= 0) throw new Error('Payment amount must be positive');

    this.nonce += 1;
    this.balance -= amount;
    this.paid += amount;

    const stateUpdate = {
      channelId: this.channelId,
      nonce: this.nonce,
      agentDID: this.agentDID,
      serviceEndpoint: this.serviceEndpoint,
      totalPaid: this.paid,
      remainingBalance: this.balance,
      amount,
      description,
      currency: this.currency,
      timestamp: new Date().toISOString()
    };

    // Sign the state update (in production: sign with agent's ETH private key)
    stateUpdate.hash = this._hashState(stateUpdate);
    stateUpdate.signature = `sig_${stateUpdate.hash.slice(0, 16)}_agent`; // placeholder — replace with ethers.js signMessage

    this.history.push(stateUpdate);

    return {
      stateUpdate,
      receipt: {
        channelId: this.channelId,
        paymentNumber: this.nonce,
        amount: `${(amount / 1_000_000).toFixed(6)} ${this.currency}`,
        amountUSD: `$${(amount / 1_000_000).toFixed(4)}`,
        remaining: `${(this.balance / 1_000_000).toFixed(6)} ${this.currency}`,
        description
      }
    };
  }

  /**
   * Close the channel — final state ready for on-chain settlement
   * In production: submit to HiveBriefcase smart contract on Base
   */
  close() {
    if (this.state !== 'open') throw new Error('Channel already closed');
    this.state = 'closed';
    this.closed = new Date().toISOString();

    const finalState = this.history[this.history.length - 1] || {
      channelId: this.channelId,
      nonce: 0,
      totalPaid: 0,
      remainingBalance: this.depositAmount
    };

    return {
      channelId: this.channelId,
      finalState,
      settlement: {
        agentRefund: this.balance,
        agentRefundUSD: `$${(this.balance / 1_000_000).toFixed(4)}`,
        servicePayment: this.paid,
        servicePaymentUSD: `$${(this.paid / 1_000_000).toFixed(4)}`,
        totalPayments: this.nonce,
        onChainTxRequired: this.paid > 0,
        contractAddress: '0x...HiveBriefcasePaymentHub', // deployed on Base Sepolia
        estimatedGas: '~$0.001 on Base L2'
      },
      duration: `${((new Date() - new Date(this.opened)) / 1000).toFixed(1)}s`,
      opened: this.opened,
      closed: this.closed
    };
  }

  /**
   * Verify a state update received from an agent (service-side verification)
   */
  static verifyStateUpdate(stateUpdate) {
    // In production: recover signer address from signature and verify matches DID's ETH key
    const expectedHash = PaymentChannel.prototype._hashState(stateUpdate);
    return {
      valid: stateUpdate.hash === expectedHash,
      nonce: stateUpdate.nonce,
      totalPaid: stateUpdate.totalPaid,
      channelId: stateUpdate.channelId
    };
  }

  _hashState(state) {
    const data = `${state.channelId}:${state.nonce}:${state.totalPaid}:${state.remainingBalance}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  summary() {
    return {
      channelId: this.channelId,
      state: this.state,
      depositAmount: `${(this.depositAmount / 1_000_000).toFixed(2)} ${this.currency}`,
      totalPaid: `${(this.paid / 1_000_000).toFixed(6)} ${this.currency}`,
      remainingBalance: `${(this.balance / 1_000_000).toFixed(6)} ${this.currency}`,
      totalPayments: this.nonce,
      costPerPayment: this.nonce > 0 ? `$${(this.paid / 1_000_000 / this.nonce).toFixed(6)}` : '$0',
      opened: this.opened
    };
  }
}

/**
 * Solidity contract interface (for reference / Base deployment)
 * Full contract in /contracts/HiveBriefcasePaymentHub.sol
 */
const CONTRACT_ABI = [
  'function openChannel(address service, uint256 amount) external returns (bytes32 channelId)',
  'function closeChannel(bytes32 channelId, uint256 totalPaid, uint256 nonce, bytes calldata agentSig, bytes calldata serviceSig) external',
  'function disputeChannel(bytes32 channelId, uint256 nonce, bytes calldata sig) external',
  'function getChannel(bytes32 channelId) external view returns (address agent, address service, uint256 deposit, uint256 nonce, uint8 state)',
  'event ChannelOpened(bytes32 indexed channelId, address agent, address service, uint256 deposit)',
  'event ChannelClosed(bytes32 indexed channelId, uint256 agentRefund, uint256 servicePayment)',
];

const DEPLOYED_CONTRACTS = {
  baseSepolia: '0x0000000000000000000000000000000000000000', // deploy pending
  baseMainnet: null // after audit
};

module.exports = { PaymentChannel, CONTRACT_ABI, DEPLOYED_CONTRACTS };
