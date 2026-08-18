/**
 * HiveBriefcase SDK — Credential Vault
 * Encrypted local storage for agent credentials
 * Granular scope control — agents carry only what they need
 * AgentHive Inc. | agenthiveinc.com
 */

const crypto = require('crypto');
const { encodeBase64, decodeBase64 } = require('tweetnacl-util');

const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt a credential for vault storage
 */
function encryptCredential(credential, vaultKey) {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(vaultKey, 'hex').slice(0, 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const data = JSON.stringify(credential);
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    data: encrypted.toString('hex')
  };
}

/**
 * Decrypt a credential from vault storage
 */
function decryptCredential(encryptedCredential, vaultKey) {
  const key = Buffer.from(vaultKey, 'hex').slice(0, 32);
  const iv = Buffer.from(encryptedCredential.iv, 'hex');
  const authTag = Buffer.from(encryptedCredential.authTag, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const data = Buffer.from(encryptedCredential.data, 'hex');
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

/**
 * Generate a vault encryption key
 * In production: derived from agent's master secret or HSM
 */
function generateVaultKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * HiveBriefcase Credential Vault
 * In-memory for SDK demo — replace with encrypted file/DB in production
 */
class CredentialVault {
  constructor(agentDID, vaultKey = null) {
    this.agentDID = agentDID;
    this.vaultKey = vaultKey || generateVaultKey();
    this._store = {}; // credentialId → encrypted credential
    this._index = {}; // type → [credentialId] for fast lookup
    this.created = new Date().toISOString();
  }

  /**
   * Store a credential in the vault
   * Credential types: 'api_key', 'oauth_token', 'service_account',
   *                   'identity_claim', 'capability_cert', 'payment_auth'
   */
  store(credential) {
    const id = credential.id || `cred_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const entry = {
      id,
      type: credential.type,
      issuer: credential.issuer,
      subject: this.agentDID,
      issuedAt: new Date().toISOString(),
      expiresAt: credential.expiresAt || null,
      scopes: credential.scopes || [],
      metadata: credential.metadata || {},
      value: credential.value // the actual secret/token
    };
    this._store[id] = encryptCredential(entry, this.vaultKey);
    if (!this._index[credential.type]) this._index[credential.type] = [];
    this._index[credential.type].push(id);
    return id;
  }

  /**
   * Retrieve a credential by ID (decrypted)
   */
  get(credentialId) {
    if (!this._store[credentialId]) return null;
    const cred = decryptCredential(this._store[credentialId], this.vaultKey);
    // Check expiry
    if (cred.expiresAt && new Date(cred.expiresAt) < new Date()) {
      this.revoke(credentialId);
      return null; // expired
    }
    return cred;
  }

  /**
   * Get all credentials of a given type
   */
  getByType(type) {
    const ids = this._index[type] || [];
    return ids.map(id => this.get(id)).filter(Boolean);
  }

  /**
   * Get credentials matching a scope
   * Agents request only what they need for a specific task
   */
  getForScope(scope) {
    return Object.keys(this._store)
      .map(id => this.get(id))
      .filter(cred => cred && cred.scopes.includes(scope));
  }

  /**
   * Create a selective disclosure presentation
   * Share only the fields needed — not the full credential
   */
  present(credentialId, fieldsToReveal = []) {
    const cred = this.get(credentialId);
    if (!cred) return null;
    const presentation = {
      presentedBy: this.agentDID,
      credentialId,
      type: cred.type,
      issuer: cred.issuer,
      issuedAt: cred.issuedAt,
      expiresAt: cred.expiresAt,
      scopes: cred.scopes,
      timestamp: new Date().toISOString()
    };
    // Only include requested fields from value
    if (fieldsToReveal.length > 0 && typeof cred.value === 'object') {
      presentation.disclosed = {};
      fieldsToReveal.forEach(f => {
        if (cred.value[f] !== undefined) presentation.disclosed[f] = cred.value[f];
      });
    } else if (fieldsToReveal.length === 0) {
      // Full value for same-party use
      presentation.value = cred.value;
    }
    return presentation;
  }

  /**
   * Revoke / delete a credential
   */
  revoke(credentialId) {
    const cred = this.get(credentialId);
    if (!cred) return false;
    delete this._store[credentialId];
    this._index[cred.type] = (this._index[cred.type] || []).filter(id => id !== credentialId);
    return true;
  }

  /**
   * Vault summary — safe to log, no secrets
   */
  summary() {
    return {
      agentDID: this.agentDID,
      totalCredentials: Object.keys(this._store).length,
      byType: Object.fromEntries(
        Object.entries(this._index).map(([type, ids]) => [type, ids.length])
      ),
      created: this.created
    };
  }
}

module.exports = { CredentialVault, generateVaultKey, encryptCredential, decryptCredential };
