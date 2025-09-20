import { ethers } from "ethers";
import type React from "react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { WalletInfo, WalletsProviderInterface } from "../types";
import { CHAIN_INFO, WalletType } from "../types";

// MetaMask Context Types
interface MetaMaskContextType extends WalletsProviderInterface {
  // MetaMask-specific state
  isInstalled: boolean;

  // Event handlers
  onAccountsChanged: (callback: (accounts: string[]) => void) => void;
  onChainChanged: (callback: (chainId: string) => void) => void;
}

const MetaMaskContext = createContext<MetaMaskContextType | null>(null);

// Provider Component
interface MetaMaskProviderProps {
  children: React.ReactNode;
}

export const MetaMaskProvider: React.FC<MetaMaskProviderProps> = ({ children }) => {
  // State
  const [isInstalled, setIsInstalled] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);

  // Provider ref to store the ethers provider instance
  const providerRef = useRef<ethers.providers.Web3Provider | null>(null);

  // Event handler refs
  const accountsChangedCallback = useRef<((accounts: string[]) => void) | null>(null);
  const chainChangedCallback = useRef<((chainId: string) => void) | null>(null);

  // Check if MetaMask is installed
  const checkMetaMaskInstallation = useCallback(() => {
    const installed = typeof window !== "undefined" && typeof window.ethereum !== "undefined";
    setIsInstalled(installed);
    return installed;
  }, []);

  // Get wallet info from MetaMask
  const getWalletInfo = useCallback(async (): Promise<WalletInfo | null> => {
    if (!isInstalled || !window.ethereum) {
      return null;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      // Store the provider in the ref
      providerRef.current = provider;

      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);
      const network = await provider.getNetwork();

      return {
        address,
        balance: ethers.utils.formatEther(balance),
        chainId: network.chainId,
        chainName: CHAIN_INFO[network.chainId] || `Chain ${network.chainId}`,
        isConnected: true,
        walletType: WalletType.METAMASK,
      };
    } catch (error) {
      console.error("Error getting MetaMask wallet info:", error);
      return null;
    }
  }, [isInstalled]);

  // Connect to MetaMask
  const connect = useCallback(async (): Promise<WalletInfo> => {
    if (!isInstalled) {
      throw new Error("MetaMask is not installed");
    }

    if (isConnecting) {
      throw new Error("MetaMask connection already in progress");
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" });

      // Get wallet info
      const walletInfo = await getWalletInfo();
      if (!walletInfo) {
        throw new Error("Failed to get wallet information");
      }

      setWalletInfo(walletInfo);
      console.log("MetaMask connected successfully:", walletInfo.address);
      return walletInfo;
    } catch (error) {
      const errorMessage = (error as Error).message || "Failed to connect to MetaMask";
      console.error("MetaMask connection error:", error);
      setError(errorMessage);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [isInstalled, isConnecting, getWalletInfo]);

  // Disconnect from MetaMask
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      // For MetaMask, we can try to revoke permissions (if supported)
      if (window.ethereum) {
        try {
          await window.ethereum.request({
            method: "wallet_revokePermissions",
            params: [{ eth_accounts: {} }],
          });
        } catch (e) {
          console.log("MetaMask permission revocation not supported or failed:", e);
        }
      }

      setWalletInfo(null);
      // Clear the provider ref
      providerRef.current = null;
      console.log("MetaMask disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting MetaMask:", error);
      throw error;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Event handler registration functions
  const onAccountsChanged = useCallback((callback: (accounts: string[]) => void) => {
    accountsChangedCallback.current = callback;
  }, []);

  const onChainChanged = useCallback((callback: (chainId: string) => void) => {
    chainChangedCallback.current = callback;
  }, []);

  // Check for existing connection on mount
  const checkExistingConnection = useCallback(async () => {
    if (!isInstalled) return;

    try {
      const existingWalletInfo = await getWalletInfo();
      if (existingWalletInfo) {
        setWalletInfo(existingWalletInfo);
        console.log("Restored MetaMask connection");
      }
    } catch (error) {
      console.log("No existing MetaMask connection:", error);
    }
  }, [isInstalled, getWalletInfo]);

  // Check installation on mount
  useEffect(() => {
    checkMetaMaskInstallation();
  }, [checkMetaMaskInstallation]);

  // Check for existing connection when MetaMask becomes available
  useEffect(() => {
    if (isInstalled) {
      checkExistingConnection();
    }
  }, [isInstalled, checkExistingConnection]);

  // Setup event listeners
  useEffect(() => {
    if (!isInstalled || !window.ethereum) return;

    const handleAccountsChanged = async (...args: unknown[]) => {
      const accounts = args[0] as string[];
      console.log("MetaMask accounts changed:", accounts);

      if (accounts.length === 0) {
        setWalletInfo(null);
      } else {
        // Update wallet info when accounts change
        const newWalletInfo = await getWalletInfo();
        if (newWalletInfo) {
          setWalletInfo(newWalletInfo);
        }
      }

      if (accountsChangedCallback.current) {
        accountsChangedCallback.current(accounts);
      }
    };

    const handleChainChanged = async (...args: unknown[]) => {
      const chainId = args[0] as string;
      console.log("MetaMask chain changed:", chainId);

      // Update wallet info when chain changes
      if (walletInfo) {
        const newWalletInfo = await getWalletInfo();
        if (newWalletInfo) {
          setWalletInfo(newWalletInfo);
        }
      }

      if (chainChangedCallback.current) {
        chainChangedCallback.current(chainId);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [isInstalled, getWalletInfo, walletInfo]);

  const contextValue: MetaMaskContextType = {
    isInstalled,
    isConnecting,
    error,
    walletInfo,
    provider: providerRef.current,
    connect,
    disconnect,
    getWalletInfo,
    clearError,
    onAccountsChanged,
    onChainChanged,
  };

  return <MetaMaskContext.Provider value={contextValue}>{children}</MetaMaskContext.Provider>;
};

// Custom Hook
export const useMetaMask = (): MetaMaskContextType => {
  const context = useContext(MetaMaskContext);
  if (!context) {
    throw new Error("useMetaMask must be used within a MetaMaskProvider");
  }
  return context;
};
