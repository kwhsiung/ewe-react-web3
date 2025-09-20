// Shared types and interfaces for wallet contexts

import type EthereumProvider from "@walletconnect/ethereum-provider";
import type { ethers } from "ethers";

export enum WalletType {
  METAMASK = "metamask",
  WALLETCONNECT = "walletconnect",
}

export interface WalletInfo {
  address: string;
  balance: string;
  chainId: number;
  chainName: string;
  isConnected: boolean;
  walletType: WalletType;
}

export interface GasPriceInfo {
  gasPrice: string;
  gasPriceGwei: string;
  lastUpdated: string;
  isLoading: boolean;
  error: string | null;
}

// Unified wallet provider interface
export interface WalletsProviderInterface {
  // State
  walletInfo: WalletInfo | null;
  isConnecting: boolean;
  error: string | null;
  provider?: ethers.providers.Web3Provider | EthereumProvider | null;

  // Actions
  connect: () => Promise<WalletInfo>;
  disconnect: () => Promise<void>;
  getWalletInfo: () => Promise<WalletInfo | null>;
  clearError: () => void;
}

export interface WalletContextType {
  // Wallet State
  walletInfo: WalletInfo | null;
  isConnecting: boolean;
  error: string | null;

  // Gas Price State
  gasPriceInfo: GasPriceInfo;

  // Actions
  connectWallet: (walletType: WalletType) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  refreshGasPrice: () => Promise<void>;
  clearError: () => void;
}

// Chain information
export const CHAIN_INFO: { [key: number]: string } = {
  1: "Ethereum Mainnet",
  42161: "Arbitrum One",
  137: "Polygon",
  10: "Optimism",
  8453: "Base",
  11155111: "Sepolia Testnet",
};

// WalletConnect configuration
export const WALLETCONNECT_PROJECT_ID =
  process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || "demo-project-id";

// Global declarations
declare global {
  interface Window {
    ethereum: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
