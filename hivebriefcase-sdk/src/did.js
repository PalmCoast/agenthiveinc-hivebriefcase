/**
 * HiveBriefcase SDK — DID Layer
 * W3C DID spec compliant, did:web method
 * AgentHive Inc. | agenthiveinc.com
 */

const { v4: uuidv4 } = require('uuid');
const nacl = require('tweetnacl');
const { encodeBase64, decodeBase64, encodeUTF8 } = require('tweetnacl-util');
const crypto = require('crypto');

/**
 * Generate a new DID for an AI agent
 * Format: did:web:agenthiveinc.com:agents:<uuid>
 */
function createAgentDID(agentName, domain = 'agenthiveinc.com') {
  const id = uuidv4();
  const keypair = nacl.sign.keyPair();
  const did = `did:web:${domain}:agents:${id}`;

  const didDocument = {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1'
    ],
    id: did,
    created: new Date().toISOString(),
    verificationMethod: [{
      id: `${did}#key-1`,
      type: 'Ed25519VerificationKey2020',
      controller: did,
      publicKeyBase64: encodeBase64(keypair.publicKey)
    }],
    authentication: [`${did}#key-1`],
    assertionMethod: [`${did}#key-1`],
    service: [{
      id: `${did}#hivebriefcase`,
      type: 'HiveBriefcaseEndpoint',
      serviceEndpoint: `https://${domain}/agents/${id}`
    }]
  };

  return {
    did,
    agentName,
    didDocument,
    // Store raw keys for signing; base64 for serialization/export
    _rawKeypair: keypair,
    privateKey: encodeBase64(keypair.secretKey),
    publicKey: encodeBase64(keypair.publicKey),
    created: new Date().toISOString()
  };
}

/**
 * Sign a payload with agent's private key
 * Used for authentication and credential presentation
 */
function signPayload(payload, privateKeyBase64) {
  const privateKey = typeof privateKeyBase64 === 'string'
    ? decodeBase64(privateKeyBase64)
    : privateKeyBase64;
  const message = Buffer.from(JSON.stringify(payload));
  const signature = nacl.sign.detached(message, privateKey);
  return {
    payload,
    signature: encodeBase64(signature),
    timestamp: new Date().toISOString()
  };
}

/**
 * Verify a signed payload against a DID's public key
 */
function verifySignature(signedPayload, publicKeyBase64) {
  try {
    const publicKey = decodeBase64(publicKeyBase64);
    const message = Buffer.from(JSON.stringify(signedPayload.payload));
    const signature = decodeBase64(signedPayload.signature);
    return nacl.sign.detached.verify(message, signature, publicKey);
  } catch {
    return false;
  }
}

/**
 * Resolve a DID document (did:web)
 * In production: fetches from HTTPS endpoint
 * In SDK: resolves from local registry or cache
 */
async function resolveDID(did, registry = null) {
  if (registry && registry[did]) {
    return { found: true, didDocument: registry[did] };
  }
  // did:web resolution: did:web:example.com:agents:123
  // → https://example.com/agents/123/did.json
  const parts = did.replace('did:web:', '').split(':');
  const domain = parts[0];
  const path = parts.slice(1).join('/');
  const url = `https://${domain}/${path}/did.json`;
  return { found: false, resolveUrl: url, message: 'Remote resolution — provide registry for local testing' };
}

/**
 * Create a verifiable authentication proof
 * Agents present this to services to prove identity
 */
function createAuthProof(agentDID, privateKeyBase64, scope = [], audience = null) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = {
    iss: agentDID,        // issuer — the agent
    aud: audience,        // audience — the service
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300, // 5 min TTL
    nonce,
    scope,
    type: 'HiveBriefcaseAuthProof'
  };
  return signPayload(payload, privateKeyBase64);
}

module.exports = { createAgentDID, signPayload, verifySignature, resolveDID, createAuthProof };
