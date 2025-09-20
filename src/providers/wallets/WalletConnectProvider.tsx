import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { getSdkError } from "@walletconnect/utils";
import { ethers } from "ethers";
import type React from "react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { WalletInfo, WalletsProviderInterface } from "../types";
import { CHAIN_INFO, WALLETCONNECT_PROJECT_ID, WalletType } from "../types";

// WalletConnect Context Types
interface WalletConnectContextType extends WalletsProviderInterface {
  // WalletConnect-specific state
  isInitialized: boolean;
  provider: InstanceType<typeof EthereumProvider> | null;

  // WalletConnect-specific actions
  initialize: () => Promise<void>;
  isValidSession: () => boolean;
}

const WalletConnectContext = createContext<WalletConnectContextType | null>(null);

// Provider Component
interface WalletConnectProviderProps {
  children: React.ReactNode;
}

export const WalletConnectProvider: React.FC<WalletConnectProviderProps> = ({ children }) => {
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);

  // Provider ref
  const providerRef = useRef<InstanceType<typeof EthereumProvider> | null>(null);

  // Utility: Clear WalletConnect Storage
  const clearWalletConnectStorage = useCallback(async () => {
    try {
      const keys = Object.keys(localStorage);
      const wcKeys = keys.filter(
        (key) =>
          key.startsWith("wc@2") ||
          key.startsWith("walletconnect") ||
          key.startsWith("@walletconnect") ||
          key.includes("walletconnect") ||
          key.includes("WC_VERSION") ||
          key.includes("wc_") ||
          key.includes("relay") ||
          key.startsWith("wc:")
      );

      for (const key of wcKeys) {
        localStorage.removeItem(key);
      }

      // Clear session storage
      const sessionKeys = Object.keys(sessionStorage);
      const wcSessionKeys = sessionKeys.filter(
        (key) =>
          key.startsWith("wc@2") || key.startsWith("walletconnect") || key.includes("walletconnect")
      );
      for (const key of wcSessionKeys) {
        sessionStorage.removeItem(key);
      }

      console.log(
        `Cleared ${wcKeys.length} localStorage and ${wcSessionKeys.length} sessionStorage WalletConnect entries`
      );

      // Small delay to ensure storage is cleared
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error("Error clearing WalletConnect storage:", error);
    }
  }, []);

  // Initialize WalletConnect Provider
  const initialize = useCallback(async (): Promise<void> => {
    if (!WALLETCONNECT_PROJECT_ID || WALLETCONNECT_PROJECT_ID === "demo-project-id") {
      throw new Error("Missing REACT_APP_WALLETCONNECT_PROJECT_ID");
    }

    if (providerRef.current) {
      console.log("Reusing existing WalletConnect provider");
      setIsInitialized(true);
      return;
    }

    try {
      console.log("Initializing WalletConnect provider...");

      // Initialize new provider following official pattern
      providerRef.current = await EthereumProvider.init({
        projectId: WALLETCONNECT_PROJECT_ID,
        optionalChains: [1, 42161, 137, 10, 8453, 11155111],
        showQrModal: true,
        qrModalOptions: {
          themeMode: "light" as const,
          themeVariables: {
            "--wcm-z-index": "1000",
          },
        },
        metadata: {
          name: "EWE React Web3 DApp",
          description: "A Web3 DApp with MetaMask and WalletConnect support",
          url: window.location.origin,
          icons: ["https://avatars.githubusercontent.com/u/37784886"],
        },
      });

      // Set up event listeners
      providerRef.current.on("connect", (info: { chainId: string }) => {
        console.log("WalletConnect connected:", info);
      });

      providerRef.current.on("accountsChanged", async (accounts: string[]) => {
        console.log("WalletConnect accounts changed:", accounts);

        if (accounts.length === 0) {
          setWalletInfo(null);
        } else {
          // Update wallet info when accounts change
          const newWalletInfo = await getWalletInfo();
          if (newWalletInfo) {
            setWalletInfo(newWalletInfo);
          }
        }
      });

      providerRef.current.on("chainChanged", async (chainId: string) => {
        console.log("WalletConnect chain changed:", chainId);

        // Update wallet info when chain changes
        if (walletInfo) {
          const newWalletInfo = await getWalletInfo();
          if (newWalletInfo) {
            setWalletInfo(newWalletInfo);
          }
        }
      });

      providerRef.current.on("disconnect", (data: unknown) => {
        console.log("WalletConnect disconnected:", data);
        setError(null);
      });

      providerRef.current.on("session_delete", (data: unknown) => {
        console.log("WalletConnect session deleted:", data);
        setError(null);
      });

      providerRef.current.on("error" as never, (error: unknown) => {
        console.error("WalletConnect provider error:", error);

        const errorObj = error as { message?: string; code?: string | number };
        if (errorObj?.message?.includes("session topic doesn't exist")) {
          console.log("Session topic error: session was disconnected or doesn't exist");
          setError("Session has been disconnected. Please reconnect your wallet.");
          clearWalletConnectStorage().catch((e) => console.log("Cleanup error:", e));
        } else if (errorObj?.code === getSdkError("USER_DISCONNECTED").code) {
          setError(null);
        } else {
          console.error("Unexpected WalletConnect error:", error);
          setError(errorObj?.message || "WalletConnect connection error occurred");
        }
      });

      setIsInitialized(true);
      console.log("WalletConnect provider initialized successfully");
    } catch (error) {
      console.error("Failed to initialize WalletConnect provider:", error);
      await clearWalletConnectStorage();
      throw error;
    }
  }, [clearWalletConnectStorage]);

  // Validate session exists
  const isValidSession = useCallback((): boolean => {
    return !!(
      providerRef.current?.session &&
      providerRef.current?.connected &&
      providerRef.current?.session.topic
    );
  }, []);

  // Get wallet info from WalletConnect
  const getWalletInfo = useCallback(async (): Promise<WalletInfo | null> => {
    if (!isInitialized || !providerRef.current) {
      return null;
    }

    // Validate session before using WalletConnect provider
    if (!isValidSession()) {
      console.log("WalletConnect session invalid, cannot get wallet info");
      return null;
    }

    try {
      const provider = new ethers.providers.Web3Provider(
        providerRef.current as unknown as ethers.providers.ExternalProvider
      );
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
        walletType: WalletType.WALLETCONNECT,
      };
    } catch (error) {
      console.error("Error getting WalletConnect wallet info:", error);
      // Handle session topic errors specifically
      if (error instanceof Error && error.message.includes("session topic doesn't exist")) {
        setError("Session has been disconnected. Please reconnect your wallet.");
      }
      return null;
    }
  }, [isInitialized, isValidSession]);

  // Connect to WalletConnect
  const connect = useCallback(async (): Promise<WalletInfo> => {
    if (!isInitialized) {
      throw new Error("WalletConnect not initialized");
    }

    if (isConnecting) {
      throw new Error("WalletConnect connection already in progress");
    }

    if (!providerRef.current) {
      throw new Error("WalletConnect provider not available");
    }

    setIsConnecting(true);
    setError(null);

    try {
      await providerRef.current.connect();

      const newWalletInfo = await getWalletInfo();
      if (!newWalletInfo) {
        throw new Error("Failed to get wallet information");
      }

      setWalletInfo(newWalletInfo);
      console.log("WalletConnect connected successfully:", newWalletInfo.address);
      return newWalletInfo;
    } catch (error) {
      const errorMessage = (error as Error).message || "Failed to connect to WalletConnect";
      console.error("WalletConnect connection error:", error);
      setError(errorMessage);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [isInitialized, isConnecting, getWalletInfo, walletInfo]);

  // Disconnect from WalletConnect
  const disconnect = useCallback(async (): Promise<void> => {
    if (!providerRef.current) {
      return;
    }

    try {
      // Use session validation before attempting disconnect
      if (isValidSession()) {
        await providerRef.current.disconnect();
      } else {
        console.log("Session already invalid, skipping disconnect call");
      }
    } catch (e) {
      console.log("Error during WalletConnect disconnect:", e);
      // Clear storage only if disconnect failed due to session issues
      if (e instanceof Error && e.message.includes("session topic doesn't exist")) {
        await clearWalletConnectStorage();
      }
    }

    providerRef.current = null;
    setWalletInfo(null);
    console.log("WalletConnect disconnected successfully");
  }, [isValidSession, clearWalletConnectStorage]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check for existing connection
  const checkExistingConnection = useCallback(async () => {
    if (!isInitialized || !providerRef.current) return;

    try {
      if (providerRef.current.session && providerRef.current.accounts.length > 0) {
        const existingWalletInfo = await getWalletInfo();
        if (existingWalletInfo) {
          setWalletInfo(existingWalletInfo);
          console.log("Restored WalletConnect connection");
        }
      }
    } catch (error) {
      console.log("No existing WalletConnect connection:", error);
    }
  }, [isInitialized, getWalletInfo, walletInfo]);

  // Initialize on mount
  useEffect(() => {
    initialize().catch((error) => {
      console.log("WalletConnect initialization failed:", error);
      setError("Failed to initialize WalletConnect");
    });
  }, [initialize]);

  // Check for existing connection when initialized
  useEffect(() => {
    if (isInitialized) {
      checkExistingConnection();
    }
  }, [isInitialized, checkExistingConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (providerRef.current) {
        try {
          if (providerRef.current.session) {
            providerRef.current.disconnect();
          }
        } catch (e) {
          console.log("Cleanup error:", e);
        }
      }
    };
  }, []);

  const contextValue: WalletConnectContextType = {
    isInitialized,
    isConnecting,
    error,
    walletInfo,
    provider: providerRef.current,
    initialize,
    connect,
    disconnect,
    getWalletInfo,
    isValidSession,
    clearError,
  };

  return (
    <WalletConnectContext.Provider value={contextValue}>{children}</WalletConnectContext.Provider>
  );
};

// Custom Hook
export const useWalletConnect = (): WalletConnectContextType => {
  const context = useContext(WalletConnectContext);
  if (!context) {
    throw new Error("useWalletConnect must be used within a WalletConnectProvider");
  }
  return context;
};
