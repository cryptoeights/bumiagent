# S01: Smart Contracts Foundation

**Goal:** All 3 CeloSpawn contracts (SpawnRegistry, AgentCommerce, EarthPool) compile, pass comprehensive Foundry tests, and deploy to local Anvil via Deploy.s.sol.
**Demo:** `forge test` passes all tests; `forge script` deploys to Anvil; contracts interact correctly (register agent → subscribe premium → create/fund/complete job → EarthPool receives funds).

## Must-Haves

- SpawnRegistry.sol — ERC-721 + ERC-8004 agent identity, subscription management, badge system, rate limiting
- AgentCommerce.sol — ERC-8183 job escrow with full state machine (Open→Funded→Submitted→Completed/Rejected/Expired)
- EarthPool.sol — 15% premium revenue collector, campaign tracking, $500 threshold
- Deploy.s.sol — deploys all 3 contracts in correct order with cross-references
- Comprehensive Foundry tests for all contracts covering happy paths and reverts
- Interfaces: IERC8004.sol, IERC8183.sol, IEarthPool.sol

## Proof Level

- This slice proves: contract correctness via Foundry tests + local Anvil deployment
- Real runtime required: no (Anvil is sufficient; Celo mainnet deployment deferred)
- Human/UAT required: no

## Verification

- `cd contracts && forge build` — compiles without errors
- `cd contracts && forge test -vvv` — all tests pass
- `cd contracts && forge script script/Deploy.s.sol --fork-url http://localhost:8545 --broadcast` — deploys successfully to Anvil

## Tasks

- [x] **T01: Foundry project setup + interfaces** `est:20m`
  - Why: Foundation for all contract work — project structure, dependencies, interfaces
  - Files: `contracts/foundry.toml`, `contracts/remappings.txt`, `contracts/src/interfaces/IERC8004.sol`, `contracts/src/interfaces/IERC8183.sol`, `contracts/src/interfaces/IEarthPool.sol`
  - Do: Init Foundry project, install OpenZeppelin, define all 3 interfaces matching PRD spec
  - Verify: `forge build` compiles interfaces
  - Done when: Foundry project builds clean with OZ dependency and all interfaces

- [x] **T02: EarthPool.sol + tests** `est:30m`
  - Why: Simplest contract, no external dependencies — good starting point to validate Foundry setup
  - Files: `contracts/src/EarthPool.sol`, `contracts/test/EarthPool.t.sol`
  - Do: Implement deposit, executeCampaign, addCampaignProof, withdraw. Test deposit flow, campaign threshold event, campaign execution, proof addition, access control reverts
  - Verify: `forge test --match-contract EarthPoolTest -vvv`
  - Done when: All EarthPool tests pass including threshold emission and access control

- [x] **T03: SpawnRegistry.sol + tests** `est:45m`
  - Why: Core contract — agent registration, subscriptions, badges, rate limiting. Most complex.
  - Files: `contracts/src/SpawnRegistry.sol`, `contracts/test/SpawnRegistry.t.sol`
  - Do: Implement ERC-721 + all functions from PRD (registerAgent, subscribePremium, renewPremium, setVerified, recordCall, canAcceptCall, getBadge). Test all happy paths, revert conditions, premium payment split to treasury/EarthPool, badge logic
  - Verify: `forge test --match-contract SpawnRegistryTest -vvv`
  - Done when: All SpawnRegistry tests pass including premium split verification and badge state transitions

- [x] **T04: AgentCommerce.sol + tests** `est:45m`
  - Why: ERC-8183 job escrow — full state machine with escrow, fees, refunds
  - Files: `contracts/src/AgentCommerce.sol`, `contracts/test/AgentCommerce.t.sol`
  - Do: Implement full job lifecycle (createJob, fundJob, submitJob, completeJob, rejectJob, claimRefund). Test every state transition, platform fee calculation, refund on expiry, access control, cross-contract interaction with SpawnRegistry
  - Verify: `forge test --match-contract AgentCommerceTest -vvv`
  - Done when: All state transitions tested (valid + invalid), fees calculated correctly, refunds work

- [x] **T05: Deploy script + integration smoke test** `est:20m`
  - Why: Proves all contracts deploy correctly and work together
  - Files: `contracts/script/Deploy.s.sol`, `contracts/test/Integration.t.sol`
  - Do: Write Deploy.s.sol deploying EarthPool → SpawnRegistry → AgentCommerce in order. Write integration test that exercises: register agent → subscribe premium (verify split) → create job → fund → submit → complete (verify fee). Test against Anvil.
  - Verify: `forge test --match-contract IntegrationTest -vvv` and `anvil & forge script script/Deploy.s.sol --fork-url http://localhost:8545 --broadcast`
  - Done when: Integration test passes end-to-end; deploy script succeeds on Anvil

## Files Likely Touched

- `contracts/foundry.toml`
- `contracts/remappings.txt`
- `contracts/src/interfaces/IERC8004.sol`
- `contracts/src/interfaces/IERC8183.sol`
- `contracts/src/interfaces/IEarthPool.sol`
- `contracts/src/EarthPool.sol`
- `contracts/src/SpawnRegistry.sol`
- `contracts/src/AgentCommerce.sol`
- `contracts/script/Deploy.s.sol`
- `contracts/test/EarthPool.t.sol`
- `contracts/test/SpawnRegistry.t.sol`
- `contracts/test/AgentCommerce.t.sol`
- `contracts/test/Integration.t.sol`
