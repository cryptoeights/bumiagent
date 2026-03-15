// Auto-extracted contract ABIs and deployment config for Bumi Agent
// Generated from Foundry build artifacts

export const CONTRACTS = {
  // Celo Mainnet
  42220: {
    cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    // Populated after deployment:
    spawnRegistry: '',
    agentCommerce: '',
    earthPool: '',
  },
  // Alfajores testnet
  44787: {
    cUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
    spawnRegistry: '',
    agentCommerce: '',
    earthPool: '',
  },
} as const;

// Minimal ABIs for backend interaction (only functions we call)
export const SPAWN_REGISTRY_ABI = [
  'function registerAgent(string name, uint8 templateId, uint256 pricePerCall, address agentWallet, string agentURI) returns (uint256)',
  'function getAgent(uint256 agentId) view returns (tuple(address agentWallet, uint8 templateId, uint256 pricePerCall, bool isVerified, bool isPremium, uint256 premiumExpiry, uint256 totalCalls, uint256 totalRevenue, uint256 createdAt))',
  'function getBadge(uint256 agentId) view returns (uint8)',
  'function canAcceptCall(uint256 agentId) view returns (bool)',
  'function getDailyLimit(uint256 agentId) view returns (uint256)',
  'function recordCall(uint256 agentId, uint256 revenue)',
  'function setVerified(uint256 agentId, bool status)',
  'function subscribePremium(uint256 agentId)',
  'function renewPremium(uint256 agentId)',
  'function totalAgents() view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'event AgentRegistered(uint256 indexed agentId, address indexed owner, address agentWallet, uint8 templateId, uint256 pricePerCall, string agentURI)',
  'event PremiumSubscribed(uint256 indexed agentId, uint256 expiry)',
  'event AgentVerified(uint256 indexed agentId, bool status)',
  'event CallRecorded(uint256 indexed agentId, uint256 revenue)',
] as const;

export const AGENT_COMMERCE_ABI = [
  'function createJob(uint256 agentId, address evaluator, uint256 expiredAt, string description) returns (uint256)',
  'function fundJob(uint256 jobId, uint256 amount)',
  'function submitJob(uint256 jobId, bytes32 deliverable)',
  'function completeJob(uint256 jobId, bytes32 reason)',
  'function rejectJob(uint256 jobId, bytes32 reason)',
  'function claimRefund(uint256 jobId)',
  'function getJob(uint256 jobId) view returns (tuple(address client, address provider, address evaluator, string description, uint256 budget, uint256 expiredAt, uint8 status, bytes32 deliverable, uint256 agentId))',
  'function getAgentJobs(uint256 agentId) view returns (uint256[])',
  'function totalJobs() view returns (uint256)',
  'event JobCreated(uint256 indexed jobId, address indexed client, uint256 indexed agentId, address evaluator)',
  'event JobFunded(uint256 indexed jobId, uint256 amount)',
  'event JobCompleted(uint256 indexed jobId, bytes32 reason, uint256 payout, uint256 fee)',
] as const;

export const EARTH_POOL_ABI = [
  'function deposit(uint256 amount)',
  'function currentBalance() view returns (uint256)',
  'function totalReceived() view returns (uint256)',
  'function totalCampaigns() view returns (uint256)',
  'function getCampaign(uint256 campaignId) view returns (tuple(uint256 id, uint256 amount, string description, string proofURI, uint256 executedAt))',
  'event FundsReceived(uint256 amount, uint256 newBalance)',
  'event CampaignReady(uint256 balance)',
  'event CampaignExecuted(uint256 indexed campaignId, uint256 amount, string description)',
] as const;
