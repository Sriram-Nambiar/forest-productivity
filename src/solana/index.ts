// ─── Config ───
export {
  DEFAULT_CLUSTER,
  DEVNET_RPC_URL,
  EXPLORER_BASE,
  getExplorerUrl,
  REVIVE_COST_SOL,
  REWARD_AMOUNT_SOL,
  REWARD_COOLDOWN_MS,
  RPC_ENDPOINTS,
  TREASURY_WALLET,
} from "./config";
export type { SolanaCluster } from "./config";

// ─── Connection ───
export { getConnection, resetConnection } from "./connection";

// ─── Transactions ───
export {
  buildRewardTransaction,
  buildReviveTreeTransaction,
  buildSendSOLTransaction,
  confirmTransaction,
} from "./transactions";
export type { TransactionResult } from "./transactions";

// ─── NFT ───
export { buildMintTreeNftTransaction, mintTreeNFT } from "./nft";

// ─── Mobile Wallet ───
export {
  APP_IDENTITY,
  authorizeWalletSession,
  clusterToChain,
  decodeWalletAddress,
  extractSignature,
  isLikelyInsufficientFunds,
  isLikelyRpcFailure,
  isLikelyUserRejection,
  isLikelyWalletMissing,
  normalizeErrorMessage,
} from "./mobileWallet";
export type { WalletAuthorizationState } from "./mobileWallet";
