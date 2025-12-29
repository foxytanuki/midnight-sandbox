// Type definitions for Faucet API

export interface FundRequest {
  mnemonic?: string;
  shieldedAddress?: string;
  unshieldedAddress?: string;
}

export interface FundResponse {
  success: boolean;
  txHash?: string;
  shieldedAddress?: string;
  unshieldedAddress?: string;
  error?: string;
}
