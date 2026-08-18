/**
 * HiveBriefcase SDK
 * Portable identity, credentials, and micropayments for AI agents
 * AgentHive Inc. | agenthiveinc.com | v0.1.0
 *
 * Usage:
 *   const { HiveBriefcase } = require('hivebriefcase-sdk');
 *   const briefcase = new HiveBriefcase({ agentName: 'my-agent' });
 */

const { createAgentDID, signPayload, verifySignature, resolveDID, createAuthProof } = require('./src/did');
const { CredentialVault, generateVaultKey } = require('./src/vault');
const { PaymentChannel, CONTRACT_ABI, DEPLOYED_CONTRACTS } = require('./src/payments');

class HiveBriefcase {
  constructor({ agentName, domain = 'agenthiveinc.com', vaultKey = null }) {
    this.agentName = agentName;
    const identity = createAgentDID(agentName, domain);
    this.did = identity.did;
    this.privateKey = identity.privateKey;
    this.publicKey = identity.publicKey;
    this.didDocument = identity.didDocument;
    this.vault = new CredentialVault(this.did, vaultKey);
    this.channels = {};
    this.created = identity.created;
  }

  // ── Identity ──────────────────────────────────────────────

  /** Get this agent's DID */
  getIdentity() {
    return {
      did: this.did,
      agentName: this.agentName,
      publicKey: this.publicKey,
      didDocument: this.didDocument,
      created: this.created
    };
  }

  /** Create an auth proof to present to a service */
  authenticate(serviceEndpoint, scopes = []) {
    return createAuthProof(this.did, this.privateKey, scopes, serviceEndpoint);
  }

  /** Sign any payload with agent's key */
  sign(payload) {
    return signPayload(payload, this.privateKey);
  }

  /** Verify a signed payload from another agent */
  verify(signedPayload, publicKey) {
    return verifySignature(signedPayload, publicKey);
  }

  /** Resolve a DID document */
  async resolve(did, registry = null) {
    return resolveDID(did, registry);
  }

  // ── Credentials ───────────────────────────────────────────

  /** Store a credential in the encrypted vault */
  storeCredential(credential) {
    return this.vault.store(credential);
  }

  /** Get a credential by ID */
  getCredential(id) {
    return this.vault.get(id);
  }

  /** Get credentials for a specific scope */
  getCredentialsForScope(scope) {
    return this.vault.getForScope(scope);
  }

  /** Present credential with selective disclosure */
  presentCredential(credentialId, fieldsToReveal = []) {
    return this.vault.present(credentialId, fieldsToReveal);
  }

  /** Vault summary */
  vaultStatus() {
    return this.vault.summary();
  }

  // ── Payments ──────────────────────────────────────────────

  /** Open a payment channel with a service */
  openChannel(serviceEndpoint, depositUSDC) {
    const depositUnits = Math.floor(depositUSDC * 1_000_000); // USDC has 6 decimals
    const channel = new PaymentChannel({
      agentDID: this.did,
      serviceEndpoint,
      depositAmount: depositUnits
    });
    this.channels[channel.channelId] = channel;
    return {
      channelId: channel.channelId,
      deposit: `$${depositUSDC} USDC`,
      serviceEndpoint,
      status: 'open',
      message: `Channel open. ${depositUnits / 1_000_000} USDC deposited for micropayments.`
    };
  }

  /** Send a micropayment through an open channel */
  pay(channelId, amountUSDC, description = '') {
    const channel = this.channels[channelId];
    if (!channel) throw new Error(`No channel found: ${channelId}`);
    const amountUnits = Math.floor(amountUSDC * 1_000_000);
    return channel.pay(amountUnits, description);
  }

  /** Close a channel and get settlement details */
  closeChannel(channelId) {
    const channel = this.channels[channelId];
    if (!channel) throw new Error(`No channel found: ${channelId}`);
    return channel.close();
  }

  /** Get channel status */
  channelStatus(channelId) {
    const channel = this.channels[channelId];
    if (!channel) return null;
    return channel.summary();
  }

  // ── Briefcase Summary ─────────────────────────────────────

  status() {
    return {
      agent: this.agentName,
      did: this.did,
      vault: this.vault.summary(),
      channels: {
        total: Object.keys(this.channels).length,
        open: Object.values(this.channels).filter(c => c.state === 'open').length,
        closed: Object.values(this.channels).filter(c => c.state === 'closed').length
      },
      created: this.created
    };
  }
}

module.exports = {
  HiveBriefcase,
  // Also export primitives for advanced use
  createAgentDID,
  signPayload,
  verifySignature,
  resolveDID,
  createAuthProof,
  CredentialVault,
  generateVaultKey,
  PaymentChannel,
  CONTRACT_ABI,
  DEPLOYED_CONTRACTS
};
