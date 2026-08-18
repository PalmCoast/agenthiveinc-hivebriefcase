/**
 * HiveBriefcase SDK — Full Stack Demo
 * Demonstrates: DID creation → credential storage → auth → micropayment
 * This is the "Sonnet 4.6 makes delivery free" equivalent for AgentHive
 * Run: node examples/full-demo.js
 */

const { HiveBriefcase, verifySignature } = require('../index');

console.log('\n🐝 ═══════════════════════════════════════════════════════');
console.log('   HiveBriefcase SDK v0.1.0 — Full Stack Demo');
console.log('   AgentHive Inc. | agenthiveinc.com');
console.log('═══════════════════════════════════════════════════════\n');

async function runDemo() {

  // ─── STEP 1: Create an AI Agent with portable identity ────────────────
  console.log('STEP 1 ── Creating AI Agent Identity\n');

  const agent = new HiveBriefcase({ agentName: 'Sol-CPO-Agent-v1' });
  const identity = agent.getIdentity();

  console.log(`  ✅ Agent DID:      ${identity.did}`);
  console.log(`  ✅ Public Key:     ${identity.publicKey.slice(0, 32)}...`);
  console.log(`  ✅ DID Document:   W3C compliant, Ed25519 verification`);
  console.log(`  ✅ Created:        ${identity.created}\n`);

  // ─── STEP 2: Store credentials in the encrypted vault ─────────────────
  console.log('STEP 2 ── Loading Credentials into Vault\n');

  const credId1 = agent.storeCredential({
    type: 'api_key',
    issuer: 'openai.com',
    scopes: ['gpt-4', 'embeddings'],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    value: { key: 'sk-...redacted', tier: 'tier-2' },
    metadata: { monthlyBudget: '$50' }
  });

  const credId2 = agent.storeCredential({
    type: 'service_account',
    issuer: 'agenthiveinc.com',
    scopes: ['regulator-hive:read', 'pricing-api:read', 'claude-farm:write'],
    value: { accountId: 'sa_sol_001', permissions: ['read', 'execute'] },
    metadata: { grantedBy: 'daniel@agenthiveinc.com' }
  });

  const credId3 = agent.storeCredential({
    type: 'identity_claim',
    issuer: 'agenthiveinc.com',
    scopes: ['identity:verified'],
    value: {
      role: 'CPO/CTO',
      organization: 'AgentHive Inc.',
      authorizedBy: 'Daniel Graham',
      trustLevel: 'executive'
    }
  });

  const vaultStatus = agent.vaultStatus();
  console.log(`  ✅ Credentials stored: ${vaultStatus.totalCredentials}`);
  console.log(`  ✅ By type: ${JSON.stringify(vaultStatus.byType)}`);
  console.log(`  ✅ Vault encrypted: AES-256-GCM\n`);

  // ─── STEP 3: Retrieve and present credentials ──────────────────────────
  console.log('STEP 3 ── Selective Credential Presentation\n');

  const scopedCreds = agent.getCredentialsForScope('regulator-hive:read');
  console.log(`  ✅ Credentials with 'regulator-hive:read' scope: ${scopedCreds.length}`);

  // Selective disclosure — only reveal role and org, not full value
  const presentation = agent.presentCredential(credId3, ['role', 'organization', 'trustLevel']);
  console.log(`  ✅ Selective disclosure to RegulatorHive:`);
  console.log(`     Disclosed: ${JSON.stringify(presentation.disclosed)}`);
  console.log(`     NOT disclosed: authorizedBy, accountId, raw keys\n`);

  // ─── STEP 4: Authenticate to a service ────────────────────────────────
  console.log('STEP 4 ── Agent Authentication\n');

  const authProof = agent.authenticate('https://api.regulatorhive.com', ['regulatory:read', 'briefs:receive']);
  console.log(`  ✅ Auth proof created for: https://api.regulatorhive.com`);
  console.log(`  ✅ Scopes requested: ${authProof.payload.scope.join(', ')}`);
  console.log(`  ✅ Expires in: 5 minutes (nonce: ${authProof.payload.nonce.slice(0, 8)}...)`);

  // Service-side verification
  const isValid = agent.verify(authProof, identity.publicKey);
  console.log(`  ✅ Service verified signature: ${isValid ? 'VALID ✓' : 'INVALID ✗'}\n`);

  // ─── STEP 5: Open a payment channel + micropayments ───────────────────
  console.log('STEP 5 ── Payment Channel: $1.00 USDC deposit\n');

  const { channelId } = agent.openChannel('https://api.regulatorhive.com', 1.00);
  console.log(`  ✅ Channel opened: ${channelId}`);
  console.log(`  ✅ Deposit: $1.00 USDC on Base L2 (one on-chain tx)`);
  console.log(`  ✅ All payments below are off-chain — zero gas\n`);

  // Simulate 5 API calls at $0.001 each (realistically $0.0001-$0.01)
  const tasks = [
    [0.001, 'Fetch EPA regulatory brief — Q1 2026'],
    [0.001, 'Fetch OSHA compliance update — Feb 2026'],
    [0.002, 'Fetch SEC filing requirements — AI disclosure'],
    [0.001, 'Fetch state-level AI regulations — FL'],
    [0.001, 'Fetch industry standard update — ISO 42001'],
  ];

  console.log('  Micropayments (off-chain, instant, ~$0 gas each):\n');
  for (const [amount, desc] of tasks) {
    const { receipt } = agent.pay(channelId, amount, desc);
    console.log(`  ⚡ Paid ${receipt.amountUSD.padEnd(10)} │ ${receipt.description}`);
    await new Promise(r => setTimeout(r, 80));
  }

  const channelStats = agent.channelStatus(channelId);
  console.log(`\n  ✅ Total paid:     ${channelStats.totalPaid}`);
  console.log(`  ✅ Remaining:      ${channelStats.remainingBalance}`);
  console.log(`  ✅ Cost per call:  ${channelStats.costPerPayment}`);
  console.log(`  ✅ Total payments: ${channelStats.totalPayments} (0 gas fees)\n`);

  // ─── STEP 6: Close channel + settlement ───────────────────────────────
  console.log('STEP 6 ── Close Channel + On-Chain Settlement\n');

  const settlement = agent.closeChannel(channelId);
  console.log(`  ✅ Agent refund:       ${settlement.settlement.agentRefundUSD} USDC`);
  console.log(`  ✅ Service received:   ${settlement.settlement.servicePaymentUSD} USDC`);
  console.log(`  ✅ Settlement gas:     ${settlement.settlement.estimatedGas}`);
  console.log(`  ✅ Payments settled:   ${settlement.settlement.totalPayments} micropayments in 1 tx\n`);

  // ─── FINAL SUMMARY ────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log('🐝 HiveBriefcase Demo Complete\n');
  const final = agent.status();
  console.log(`  Agent:          ${final.agent}`);
  console.log(`  DID:            ${final.did.slice(0, 50)}...`);
  console.log(`  Credentials:    ${final.vault.totalCredentials} stored, encrypted, scoped`);
  console.log(`  Channels:       ${final.channels.total} total, ${final.channels.closed} settled`);
  console.log(`\n  This agent can now:`);
  console.log(`  → Prove identity to any platform via W3C DID`);
  console.log(`  → Carry encrypted credentials across sessions`);
  console.log(`  → Pay for services at $0.001/call with no per-tx gas`);
  console.log(`  → Present selective disclosures without exposing secrets`);
  console.log('\n  That is HiveBriefcase. Infrastructure for the agent economy.');
  console.log('═══════════════════════════════════════════════════════\n');
}

runDemo().catch(console.error);
