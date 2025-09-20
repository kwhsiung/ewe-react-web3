import type EthereumProvider from "@walletconnect/ethereum-provider";
import { ethers } from "ethers";
import type React from "react";
import { createContext, useCallback, useContext, useMemo } from "react";
import { useGasPrice } from "./hooks/useGasPrice";
import type { WalletContextType, WalletInfo, WalletsProviderInterface } from "./types";
import { WalletType } from "./types";
import { MetaMaskProvider, useMetaMask } from "./wallets/MetaMaskProvider";
import { useWalletConnect, WalletConnectProvider } from "./wallets/WalletConnectProvider";

// Main Wallet Context
const WalletContext = createContext<WalletContextType | null>(null);

// Provider Component
interface WalletsProviderProps {
  children: React.ReactNode;
}

// Inner component that uses the specialized providers
function WalletsProviderContent({ children }: { children: React.ReactNode }) {
  // Get specialized provider hooks
  const metaMask = useMetaMask();
  const walletConnect = useWalletConnect();

  // Get the active wallet provider (whichever one is connected)
  const activeProvider = useMemo((): WalletsProviderInterface | null => {
    if (metaMask.walletInfo) {
      return metaMask;
    }
    if (walletConnect.walletInfo) {
      return walletConnect;
    }
    return null;
  }, [metaMask, walletConnect]);

  // Get current wallet info from active provider
  const walletInfo = useMemo((): WalletInfo | null => {
    return activeProvider?.walletInfo || null;
  }, [activeProvider]);

  // Get current connection state
  const connectionState = useMemo(() => {
    return {
      isConnecting: activeProvider?.isConnecting || false,
      error: activeProvider?.error || null,
    };
  }, [activeProvider]);

  // Get provider for gas price fetching
  const provider = useMemo((): ethers.providers.Web3Provider | null | EthereumProvider => {
    try {
      // Try to use current wallet provider
      if (walletInfo?.walletType === WalletType.WALLETCONNECT) {
        return walletConnect.provider;
      } else if (walletInfo?.walletType === WalletType.METAMASK && metaMask.provider) {
        return metaMask.provider;
      } else if (window.ethereum) {
        // Fallback to MetaMask if available
        return new ethers.providers.Web3Provider(window.ethereum);
      }

      return null;
    } catch (error) {
      console.error("Error getting provider for gas price:", error);
      return null;
    }
  }, [walletInfo?.walletType, walletConnect.provider, metaMask.provider]);

  // Connect wallet function
  const connectWallet = useCallback(
    async (walletType: WalletType) => {
      try {
        if (walletType === WalletType.METAMASK) {
          await metaMask.connect();
        } else {
          await walletConnect.connect();
        }
        console.log(`${walletType} connected successfully`);
      } catch (error) {
        console.error(`Failed to connect ${walletType}:`, error);
        throw error;
      }
    },
    [metaMask, walletConnect]
  );

  // Disconnect wallet function
  const disconnectWallet = useCallback(async () => {
    try {
      if (activeProvider) {
        await activeProvider.disconnect();
      }
      console.log("Wallet disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      throw error;
    }
  }, [activeProvider]);

  // Clear error function
  const clearError = useCallback(() => {
    metaMask.clearError();
    walletConnect.clearError();
  }, [metaMask, walletConnect]);

  // Use the gas price hook
  const { gasPriceInfo, refreshGasPrice } = useGasPrice({
    provider,
    isWalletConnected: walletInfo?.isConnected || false,
  });

  const contextValue: WalletContextType = {
    walletInfo,
    isConnecting:
      connectionState.isConnecting || metaMask.isConnecting || walletConnect.isConnecting,
    error: connectionState.error,
    gasPriceInfo,
    connectWallet,
    disconnectWallet,
    refreshGasPrice,
    clearError,
  };

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>;
}

// Main WalletsProvider that wraps all wallet providers and provides the unified context
export default function WalletsProvider({ children }: WalletsProviderProps) {
  return (
    <MetaMaskProvider>
      <WalletConnectProvider>
        <WalletsProviderContent>{children}</WalletsProviderContent>
      </WalletConnectProvider>
    </MetaMaskProvider>
  );
}

// Custom Hook
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletsProvider");
  }
  return context;
};
