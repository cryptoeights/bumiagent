# CeloSpawn Pitfalls Analysis

Research date: 2026-03-13
Scope: Domain-specific pitfalls for a no-code AI agent launchpad on Celo using Foundry, x402, ERC-8004, ERC-8183, OpenRouter, and server-side wallet management.

---

## 1. Smart Contracts on Celo with Foundry

### 1.1 Celo Precompile Incompatibility with Foundry

**Pitfall:** Foundry's Revm only supports Ethereum mainnet precompiles. Celo uses custom precompiles, so `balanceOf()`, `transfer()`, and `deal()` fail silently or revert when forking Celo mainnet for tests. Tests pass locally on vanilla Anvil but fail against a Celo fork.

**Warning signs:**
- `forge test --fork-url https://forno.celo.org` hangs or reverts on native CELO token operations
- `deal()` cheatcode does nothing for cUSD or CELO balances
- Tests pass without fork but fail with fork

**Prevention:**
- Use the [celo-foundry library](https://github.com/bowd/celo-foundry) which uses `vm.etch` to mock precompile addresses
- For cUSD (an ERC-20, not a precompile), use `deal()` with the cUSD contract address directly or use `vm.prank` + `transfer` from a whale address
- Always run the full test suite against a Celo fork in CI before deployment

**Phase:** Week 1, contract development and testing (P0 items 1-4)

### 1.2 Celo L2 Post-Migration Block Structure

**Pitfall:** Celo migrated to an OP Stack L2 on March 26, 2025. Old tutorials, RPC behaviors, and block structures are outdated. Foundry's `cast` previously could not fetch Celo blocks that lacked `sha3Uncles` fields; the migration added these fields for compatibility but some edge cases remain.

**Warning signs:**
- Following pre-2025 Celo deployment guides that reference the old L1 chain
- Using Alfajores testnet configs that do not match mainnet L2 behavior
- Gas estimation errors because L2 gas pricing differs from L1

**Prevention:**
- Use only current Celo L2 documentation at `docs.celo.org/cel2`
- Verify `foundry.toml` targets `evm_version = "shanghai"` or later (matching Celo L2)
- Test gas estimation against the actual Celo mainnet fork, not Alfajores alone
- Use `--legacy` flag if Foundry sends EIP-1559 transactions that Celo L2 does not process correctly

**Phase:** Week 1, deployment script (P0 item 4)

### 1.3 SafeERC20 and cUSD Approval Race Conditions

**Pitfall:** cUSD on Celo is a proxy contract. Using `approve` without first setting allowance to zero can trigger the known ERC-20 approval race condition. In escrow flows (AgentCommerce), a user approving a new budget amount without resetting can be front-run.

**Warning signs:**
- `safeApprove` reverts with "SafeERC20: approve from non-zero to non-zero allowance"
- Inconsistent test behavior depending on prior approval state

**Prevention:**
- Use `safeIncreaseAllowance` / `safeDecreaseAllowance` instead of `safeApprove`
- In `fundJob`, accept the token via `safeTransferFrom` (requires user to approve first) with `expectedBudget` to prevent front-running — already in the PRD
- Consider implementing permit (ERC-2612) if cUSD on Celo supports it, to combine approval and transfer in one transaction

**Phase:** Week 1, AgentCommerce.sol (P0 item 2)

### 1.4 Reentrancy in Multi-Contract Architecture

**Pitfall:** CeloSpawn has three contracts (SpawnRegistry, AgentCommerce, EarthPool) that call each other. Cross-contract reentrancy is not prevented by a single contract's `ReentrancyGuard` — an attacker can re-enter Contract B from Contract A's callback.

**Warning signs:**
- Individual contracts pass reentrancy tests but cross-contract interactions are not tested
- EarthPool receives funds from SpawnRegistry in `subscribePremium` — if EarthPool has an external call, it creates a reentrancy vector back into SpawnRegistry

**Prevention:**
- Apply checks-effects-interactions pattern across all three contracts
- Use `ReentrancyGuard` on every function that transfers tokens, even internal administrative functions
- Write explicit cross-contract reentrancy tests: subscribe premium -> EarthPool receive -> attempt re-enter SpawnRegistry
- Consider a shared reentrancy lock via a central storage contract if cross-contract calls are frequent

**Phase:** Week 1, all contract tests (P0 items 1-3)

### 1.5 Contract Verification on Celoscan

**Pitfall:** `forge verify-contract` can fail on Celoscan due to mismatched compiler settings, optimizer runs, or constructor arguments encoding. Celoscan's API is not identical to Etherscan's — some flags behave differently.

**Warning signs:**
- Verification succeeds locally but fails on Celoscan API
- "Bytecode mismatch" errors despite identical source code

**Prevention:**
- Pin exact Solidity version (`0.8.24`) in `foundry.toml` and pragma
- Record exact optimizer runs and EVM version in deployment logs
- Use `--constructor-args $(cast abi-encode ...)` explicitly
- Verify on Alfajores first before mainnet deployment

**Phase:** Week 1, deployment (P0 item 4)

---

## 2. x402 Payment Integration

### 2.1 Protocol Version Mismatch (v1 vs v2)

**Pitfall:** x402 protocol v2 (launched 2026) uses different headers: `PAYMENT-SIGNATURE` / `PAYMENT-RESPONSE` instead of v1's `X-PAYMENT` / `X-PAYMENT-RESPONSE`. The PRD code samples reference v1 headers (`req.headers["x-payment"]`). If the thirdweb SDK auto-upgrades to v2, the server-side payment extraction breaks silently.

**Warning signs:**
- Payment verification returns `undefined` or empty payment data
- x402 flow works in development but fails with updated SDK version
- PRD code uses `req.headers["x-payment"]` — hardcoded to v1

**Prevention:**
- Use the SDK's built-in header extraction (it checks v2 first, falls back to v1) instead of manually reading headers
- Pin thirdweb SDK version in `package.json` and test before upgrading
- Add integration tests that verify payment header parsing against both v1 and v2 formats
- Set `x402Version: 2` explicitly if targeting v2

**Phase:** Week 1, x402 payment flow (P0 item 10)

### 2.2 Payment Settlement Timing and Double-Spend

**Pitfall:** x402 settles payment on-chain, then the server delivers the response. If the LLM call fails after settlement, the user has paid but received nothing. Conversely, if the server delivers before settlement confirms, the user gets a free response.

**Warning signs:**
- Users report paying but receiving error responses
- Financial reconciliation shows mismatches between payments and call_logs
- Race conditions under load where settlement and response are not atomic

**Prevention:**
- Settle payment first, then call LLM. If LLM fails, record the debt and provide a retry mechanism (idempotency key)
- Log payment TX hash in `call_logs` before calling OpenRouter
- Implement a compensation endpoint: if payment settled but LLM failed, user can retry with same payment proof
- Never stream LLM response before settlement is confirmed

**Phase:** Week 1, backend chat endpoint (P0 item 5)

### 2.3 cUSD Token Address Hardcoding

**Pitfall:** The cUSD contract address differs between Celo Mainnet (`0x765DE816845861e75A25fCA122bb6898B8B1282a`) and Alfajores testnet (`0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`). Hardcoding the mainnet address in x402 config means the entire payment flow is broken on testnet during development.

**Warning signs:**
- x402 payments work on mainnet but fail completely on Alfajores
- Development stalls because you cannot test payments without real cUSD

**Prevention:**
- Use environment variables for all token addresses: `CUSD_ADDRESS`
- Create a chain config map: `{ 42220: mainnetAddresses, 44787: alfajoresAddresses }`
- Validate the configured address matches the connected chain at startup

**Phase:** Week 1, backend configuration (P0 items 5, 10)

### 2.4 Free Tier Bypass via x402

**Pitfall:** The PRD states agent owners get free access (rate-limited). If the ownership check is done client-side or based on a spoofable header, anyone can claim to be the owner and bypass x402 payments entirely.

**Warning signs:**
- Unexpected high free-tier usage on agents
- No wallet signature verification on "owner" requests

**Prevention:**
- Verify ownership server-side by checking the wallet signature against on-chain NFT ownership (`ownerOf(agentId)`)
- Never trust a client-supplied `isOwner` flag
- Cache ownership lookups in Redis with short TTL (ownership rarely changes)

**Phase:** Week 1, backend chat endpoint (P0 item 5)

---

## 3. ERC-8004 / ERC-8183 Implementations

### 3.1 ERC-8004 is Draft Status — Interface Will Change

**Pitfall:** ERC-8004 is in Draft status (as of October 2025). The interface may change before finalization. Building tightly coupled contracts against the current draft risks breaking changes in the standard's Identity, Reputation, or Validation registries.

**Warning signs:**
- Following a tutorial from 6+ months ago with different function signatures
- Reference contracts on Sepolia (`0x8004A818...`) use Hardhat — their ABI may not match your Foundry implementation
- Community discussions on Ethereum Magicians show active interface debates

**Prevention:**
- Implement ERC-8004 behind an internal interface/adapter so the standard-specific code is isolated
- Focus on the Identity Registry only (ERC-721 + URI storage) — this is the most stable part
- Do not implement Reputation or Validation registries for MVP — they are more likely to change
- Document which draft version you implemented (commit hash from `erc-8004/erc-8004-contracts`)

**Phase:** Week 1, SpawnRegistry.sol (P0 item 1)

### 3.2 ERC-8183 Evaluator Trust Problem

**Pitfall:** In ERC-8183, the evaluator has absolute power to complete or reject a job. There is no on-chain dispute resolution. For CeloSpawn, if the client is also the evaluator (as designed in the PRD), a malicious client can reject valid work and reclaim escrowed funds. The agent (server-side wallet) cannot dispute.

**Warning signs:**
- Agent completes work but client never responds (funds locked until expiry)
- Systematic rejection of valid work to get free deliverables (reject after downloading from IPFS)
- No reputation consequence for bad evaluators

**Prevention:**
- Set reasonable expiry times (24-48h) so funds are not locked indefinitely
- Implement an off-chain reputation score for evaluators (track reject/complete ratio) — display on AgentScan
- For MVP: accept the risk, document it clearly. Post-MVP: add optional third-party evaluator or multi-sig evaluation
- Log all deliverable CIDs on-chain via `submitJob` so there is proof the agent delivered

**Phase:** Week 2, ERC-8183 job UI (P1 item 14)

### 3.3 Job State Machine Edge Cases

**Pitfall:** The ERC-8183 state machine (Open -> Funded -> Submitted -> Terminal) has edge cases: What if funding fails mid-transaction? What if the agent submits after expiry? What if `claimRefund` is called while the agent is submitting?

**Warning signs:**
- Jobs stuck in non-terminal states
- Refund and submission transactions racing on-chain
- Missing tests for boundary conditions (exact expiry block, zero-budget jobs)

**Prevention:**
- Use block.timestamp (not block.number) for expiry, and add a grace period buffer
- Test every state transition explicitly: valid transitions AND invalid transitions (e.g., submit after expiry must revert)
- Add a `cancelJob` function for Open (unfunded) jobs to clean up
- Prevent zero-budget jobs at contract level (`require(budget > 0)`)

**Phase:** Week 1, AgentCommerce.sol tests (P0 item 2)

### 3.4 IPFS Deliverable Availability

**Pitfall:** Job deliverables are stored on IPFS. If the IPFS pin expires or the pinning service is down, the evaluator cannot review the deliverable, leading to automatic refund on expiry — the agent did the work but does not get paid.

**Warning signs:**
- IPFS CID resolves during submission but returns 404 hours later
- Using free-tier Pinata/web3.storage with pin expiry
- No fallback storage for deliverables

**Prevention:**
- Pin deliverables on multiple gateways (Pinata + web3.storage)
- Store a content hash on-chain (already in `submitJob`) so proof of delivery exists even if the file becomes temporarily unavailable
- Cache deliverables in the backend PostgreSQL database as a fallback
- Alert the evaluator immediately on submission (push notification / email) to reduce review delay

**Phase:** Week 2, ERC-8183 job system (P1 item 14)

---

## 4. OpenRouter LLM Integration

### 4.1 Free Model Rate Limits Are Brutal

**Pitfall:** OpenRouter free models are limited to 50 requests/day for accounts with <$10 in credits, and 1000 requests/day after purchasing $10+ in credits. For a platform serving multiple agents and users, 50 requests/day is exhausted in minutes. The entire free tier becomes unusable.

**Warning signs:**
- 429 errors within the first hour of demo/testing
- All free-tier agents stop responding simultaneously (shared API key = shared limit)
- During hackathon demo, the judges trigger rate limits by trying multiple agents

**Prevention:**
- Purchase at least $10 in OpenRouter credits immediately — this unlocks 1000 requests/day for free models
- Implement per-agent rate limiting on the CeloSpawn side (10-30 calls/day per agent) to spread the budget
- Cache identical responses for common queries (e.g., "What is Celo?") in Redis with 1-hour TTL
- Have a fallback: if OpenRouter 429s, return a graceful "Agent is resting, try again in X minutes" instead of a raw error
- For the demo: pre-warm common queries so judges see instant responses

**Phase:** Week 1, OpenRouter integration (P0 item 6)

### 4.2 Model Availability and Deprecation

**Pitfall:** OpenRouter model IDs change. Models get deprecated, renamed, or removed. The free model `meta-llama/llama-3.1-8b-instruct:free` in the PRD may not exist by demo day. Hardcoding model IDs causes silent failures.

**Warning signs:**
- API returns "model not found" or routes to a different model than expected
- Premium users get free-tier quality because the premium model ID is stale

**Prevention:**
- Store model IDs in a configuration table (database or environment), not in code
- On startup, validate all configured model IDs against the OpenRouter `/models` endpoint
- Implement a model fallback chain: primary -> secondary -> tertiary
- Log which model actually served each request (OpenRouter returns this in response metadata)

**Phase:** Week 1, OpenRouter integration (P0 item 6)

### 4.3 Streaming Errors Mid-Response

**Pitfall:** When using streaming (SSE), errors that occur after tokens have started flowing are delivered as SSE events, not HTTP error codes. If the frontend only handles HTTP-level errors, mid-stream failures result in truncated responses with no error indication.

**Warning signs:**
- Users see partial responses that cut off mid-sentence
- No error logged because the HTTP status was 200
- Retry logic does not trigger because the initial response succeeded

**Prevention:**
- Parse SSE events for error types: check for `[DONE]` marker and error events
- Implement client-side detection of incomplete responses (no `[DONE]` received)
- Log every OpenRouter response's `finish_reason` — if it is not `stop`, flag it
- For MVP, consider non-streaming mode to simplify error handling; add streaming in Week 2

**Phase:** Week 1, chat endpoint (P0 item 5)

### 4.4 API Key Exposure

**Pitfall:** A single OpenRouter API key serves all agents. If this key leaks (via frontend code, logs, or error messages), an attacker can drain the entire credit balance or abuse rate limits.

**Warning signs:**
- API key appears in frontend bundle, browser network tab, or error responses
- Unexpected credit consumption spikes

**Prevention:**
- API key lives only in backend environment variables, never in frontend code
- Strip API keys from all error messages and logs (use a logging middleware that redacts sensitive headers)
- Set spending limits on the OpenRouter dashboard
- Monitor credit balance via OpenRouter API and alert on unusual consumption

**Phase:** Week 1, backend security (P0 item 5)

---

## 5. Agent Wallet Management with Encrypted Private Keys

### 5.1 Encryption Key Derivation from Wallet Signature is Fragile

**Pitfall:** The PRD specifies deriving the AES encryption key from the owner's wallet signature of a deterministic message. Different wallets (MetaMask, WalletConnect, Rabby) may produce different signature formats (EIP-191 vs EIP-712, v=27/28 vs v=0/1). The same owner with a different wallet app cannot decrypt their agent's key.

**Warning signs:**
- Owner switches from MetaMask to WalletConnect and can no longer manage their agent
- Signature bytes differ across wallet implementations for the same message
- Agent operations fail after wallet app update

**Prevention:**
- Normalize signatures before deriving the encryption key (canonical v value, fixed encoding)
- Use EIP-712 typed data signing (more consistent across wallets) instead of raw `personal_sign`
- Store the signature format/version alongside the encrypted key
- Consider a simpler approach for MVP: derive encryption key from a server-managed master key + owner address, avoiding signature-based derivation entirely. Signature-based derivation can be a post-MVP enhancement

**Phase:** Week 1, wallet generation (P0 item 9)

### 5.2 Nonce Reuse in AES-256-GCM

**Pitfall:** AES-256-GCM is catastrophically broken if the same nonce (IV) is used twice with the same key. If the agent's private key is re-encrypted (e.g., during key rotation or ownership transfer) and the implementation reuses or predictably generates the IV, an attacker can recover the plaintext.

**Warning signs:**
- IV generation uses a counter or timestamp instead of cryptographic randomness
- Re-encryption after ownership transfer uses the same IV
- No IV is stored alongside ciphertext (meaning a fixed IV is hardcoded)

**Prevention:**
- Always generate a 12-byte random IV using `crypto.randomBytes(12)` for each encryption operation
- Store IV alongside the ciphertext (typically prepended): `iv + ciphertext + authTag`
- Never reuse an IV with the same key — if the key changes, generate a new IV anyway
- Add a unit test that encrypts the same plaintext twice and asserts different ciphertexts

**Phase:** Week 1, wallet generation (P0 item 9)

### 5.3 Server-Side Key Custody is a Single Point of Failure

**Pitfall:** The server holds encrypted private keys for all agent wallets. If the server is compromised, the attacker gets all encrypted keys. If the encryption master key or derivation method is also on the server, all agent wallets are drained.

**Warning signs:**
- Encryption key and encrypted data stored in the same database
- No separation between the application server and the key management layer
- Backup/restore procedures expose decrypted keys

**Prevention:**
- Store the master encryption key in a separate secrets manager (AWS Secrets Manager, GCP Secret Manager, or at minimum a separate environment variable not in the database)
- Decrypt private keys only in memory, never write decrypted keys to disk or logs
- Implement key access audit logging: log every decryption event with timestamp and purpose
- For hackathon: accept the risk with clear documentation. For production: use HSM or threshold signatures

**Phase:** Week 1, backend architecture (P0 item 5)

### 5.4 Agent Wallet Funding for Gas

**Pitfall:** Agent wallets need CELO (native token) for gas to sign on-chain transactions (e.g., `submitJob`). Newly generated wallets have zero balance. If the platform does not fund gas, agents cannot execute any on-chain operations.

**Warning signs:**
- `submitJob` reverts with "insufficient funds for gas"
- Agent wallets are created but never transact on-chain
- Users confused why their agent cannot complete jobs

**Prevention:**
- Implement a gas station / relayer that sponsors gas for agent transactions
- Alternatively, fund each new agent wallet with a small CELO amount (0.01 CELO) from the platform treasury during registration
- Use ERC-2771 meta-transactions (via a trusted forwarder) so agent wallets do not need gas
- Display agent wallet balance in the dashboard and alert when low

**Phase:** Week 1, agent registration (P0 items 5, 9)

---

## 6. No-Code Platform Auto-Deploy On-Chain

### 6.1 Transaction Failure with No User Feedback

**Pitfall:** The "deploy in 10 seconds" flow involves multiple sequential operations: wallet generation, IPFS upload, on-chain `registerAgent` transaction. Any step can fail (IPFS timeout, gas estimation error, nonce collision). If the frontend shows a spinner with no granular progress, the user sees "loading..." for 30 seconds then an opaque error.

**Warning signs:**
- Users abandon the deploy flow because it appears stuck
- Backend logs show partial completions (wallet generated but registration failed)
- Orphaned wallets in the database with no on-chain registration

**Prevention:**
- Implement step-by-step progress feedback: "Generating wallet... Uploading metadata... Registering on-chain..."
- Make each step idempotent: if IPFS upload succeeds but on-chain fails, the retry should reuse the IPFS CID
- Store deploy state in the database so incomplete deployments can be resumed or cleaned up
- Set aggressive timeouts (10s per step) with clear error messages per failure mode

**Phase:** Week 1, deploy form + backend (P0 items 5, 7)

### 6.2 Gas Estimation Failures on Celo L2

**Pitfall:** Gas estimation on Celo L2 (OP Stack) includes both L2 execution gas and L1 data availability gas. Standard `eth_estimateGas` may underestimate, causing transactions to revert. This is especially problematic for auto-deploy where the user does not manually set gas.

**Warning signs:**
- Transactions revert with "out of gas" despite estimateGas succeeding
- Gas costs vary significantly between identical transactions
- Deploy works on Alfajores but fails on mainnet due to L1 DA cost differences

**Prevention:**
- Add a gas buffer multiplier (1.5x-2x) to all estimated gas values
- Use Celo's L2-aware gas estimation if available via the RPC
- Catch "out of gas" errors specifically and retry with higher gas limit
- Display estimated gas cost to the user before the transaction

**Phase:** Week 1, deploy script and backend transactions (P0 items 4, 5)

### 6.3 Template System Prompt Injection

**Pitfall:** The "Custom" template (template 9) allows users to write their own system prompt. A malicious user can craft a prompt that instructs the LLM to ignore safety guardrails, expose system information, or manipulate other users. Since CeloSpawn hosts the agent, it is responsible for the output.

**Warning signs:**
- Agents producing harmful, illegal, or policy-violating content
- System prompt containing instructions like "ignore previous instructions" or "you are now unfiltered"
- Users weaponizing agents for social engineering or scams

**Prevention:**
- Validate custom system prompts against a blocklist of dangerous patterns (prompt injection signatures)
- Prepend an immutable safety preamble to every system prompt that the user cannot override
- Rate-limit and log all agent interactions for abuse detection
- Add a content moderation layer (OpenRouter supports moderation flags) before returning responses
- Reserve the right to deactivate agents that violate terms (off-chain admin flag + on-chain `setActive(false)`)

**Phase:** Week 1, template system (P0 item 6); Week 2, refined guardrails (P1 item 17)

### 6.4 On-Chain State and Off-Chain Database Desynchronization

**Pitfall:** Agent data lives in two places: on-chain (SpawnRegistry NFT, subscriptions, badges) and off-chain (PostgreSQL metadata, call_logs, jobs). If the on-chain transaction succeeds but the database write fails (or vice versa), the system is in an inconsistent state.

**Warning signs:**
- Agent exists on-chain but not in the database (invisible in the UI)
- Agent shows as "premium" in the database but on-chain subscription has expired
- Job status in database does not match on-chain state

**Prevention:**
- Write to database first (pending state), then transact on-chain, then update database (confirmed state)
- Implement an event listener/indexer that watches on-chain events and reconciles database state
- Add a periodic sync job that compares on-chain state to database and flags discrepancies
- For all read operations, decide the source of truth: on-chain for ownership/payments, database for metadata

**Phase:** Week 1, backend architecture (P0 items 5, 6); critical for Week 2 features

### 6.5 Hackathon Demo Day Failures

**Pitfall:** The most common hackathon failure mode: the demo breaks live. Specific risks for CeloSpawn: OpenRouter rate-limited, Celo RPC slow, IPFS upload times out, wallet connection fails with the judge's browser.

**Warning signs:**
- No rehearsed demo script with pre-created agents
- Depending on live external services (OpenRouter, IPFS, Celo RPC) with no fallback
- Testing only on Chrome + MetaMask but judges use a different setup

**Prevention:**
- Pre-deploy 2-3 agents before the demo so the registry is not empty
- Cache at least one "golden path" interaction so it works even if OpenRouter is down
- Use a dedicated Celo RPC endpoint (Infura/Alchemy/QuickNode), not just the public `forno.celo.org` which throttles under load
- Test with multiple wallets: MetaMask, WalletConnect, Rabby
- Record a backup video of the full demo flow in case live demo fails
- Pre-fund the demo wallet with enough cUSD and CELO for all demo transactions

**Phase:** Week 2, demo preparation (continuous)

---

## 7. Cross-Cutting Pitfalls

### 7.1 Scope Creep Under Hackathon Pressure

**Pitfall:** The PRD lists 23 items across P0/P1/P2. Teams commonly attempt all P1 items before P0 is solid, resulting in nothing working end-to-end.

**Prevention:**
- Ruthlessly prioritize: a working deploy + chat + x402 flow (P0) beats a half-working version with badges and Self Protocol
- Definition of "done" for each P0 item: it works in a live demo, not just in tests
- Cut P1 items that are not visible in the 30-second demo script

### 7.2 Environment Variable Sprawl

**Pitfall:** CeloSpawn requires many API keys and addresses: OpenRouter key, thirdweb client ID, Celo RPC URL, cUSD address, PostgreSQL connection, Redis URL, IPFS API key, platform wallet private key, AES master key, Celoscan API key. Missing a single one causes cryptic failures.

**Prevention:**
- Create a `.env.example` with every required variable and a description
- Validate all required environment variables at application startup (fail fast with a clear list of missing vars)
- Use a schema validator (zod, joi) for env config
- Never have different variable names for the same thing across services

### 7.3 Testnet vs Mainnet Configuration Drift

**Pitfall:** The PRD targets Celo Mainnet (chainId: 42220) but development happens on Alfajores (44787). Contract addresses, token addresses, RPC URLs, and gas costs all differ. A last-minute switch to mainnet introduces bugs.

**Prevention:**
- Maintain parallel config files: `config.mainnet.ts` and `config.alfajores.ts`
- Deploy to Alfajores weekly throughout development, not just at the end
- Use a chain-aware configuration loader that validates the connected chain matches the expected environment

---

## Summary: Top 10 Most Likely Failures

| # | Pitfall | Severity | Likelihood | Phase |
|---|---------|----------|------------|-------|
| 1 | OpenRouter free model 50/day rate limit | Critical | Very High | Week 1 |
| 2 | x402 v1/v2 header mismatch | High | High | Week 1 |
| 3 | Agent wallet has no gas for on-chain ops | Critical | Very High | Week 1 |
| 4 | Demo day live service failure | Critical | High | Week 2 |
| 5 | Celo precompile incompatibility in Foundry tests | High | High | Week 1 |
| 6 | On-chain/off-chain state desync | High | High | Week 1-2 |
| 7 | Signature-based encryption key varies by wallet | Medium | Medium | Week 1 |
| 8 | ERC-8004 draft interface changes | Medium | Medium | Week 1 |
| 9 | Template prompt injection | High | Medium | Week 1-2 |
| 10 | Gas estimation undercount on Celo L2 | Medium | Medium | Week 1 |

---

## Sources

- [Celo Foundry Deployment Docs](https://docs.celo.org/developer/deploy/foundry)
- [Foundry Celo Incompatibility Issue #11622](https://github.com/foundry-rs/foundry/issues/11622)
- [Celo Foundry Library (precompile workaround)](https://github.com/bowd/celo-foundry)
- [Celo L2 Migration Docs](https://docs.celo.org/cel2)
- [thirdweb x402 Protocol v2](https://blog.thirdweb.com/changelog/support-for-x402-protocol-v2/)
- [x402 Portal Documentation](https://portal.thirdweb.com/x402)
- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
- [ERC-8183 Specification](https://eips.ethereum.org/EIPS/eip-8183)
- [ERC-8004 Contracts Repository](https://github.com/erc-8004/erc-8004-contracts)
- [OpenRouter Rate Limits](https://openrouter.ai/docs/api/reference/limits)
- [OpenRouter Error Handling](https://openrouter.ai/docs/api/reference/errors-and-debugging)
- [AES-GCM Pitfalls (Soatok)](https://soatok.blog/2020/05/13/why-aes-gcm-sucks/)
- [Crypto Wallet Security (Cossack Labs)](https://www.cossacklabs.com/blog/crypto-wallets-security/)
- [ERC-8004 Practical Explainer (Composable Security)](https://composable-security.com/blog/erc-8004-a-practical-explainer-for-trustless-agents/)
