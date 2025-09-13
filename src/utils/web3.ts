import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { ethers } from "ethers";

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
  walletType?: WalletType;
}

export interface GasPriceInfo {
  gasPrice: string;
  gasPriceGwei: string;
  lastUpdated: string;
  isLoading: boolean;
  error: string | null;
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

// WalletConnect provider instance
let walletConnectProvider: any | null = null;

// Store references to event listeners for proper cleanup
let accountsChangedCallback: ((accounts: string[]) => void) | null = null;
let chainChangedCallback: ((chainId: string) => void) | null = null;

// WalletConnect project configuration
const WALLETCONNECT_PROJECT_ID =
  process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || "demo-project-id";

// Check if MetaMask is installed
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
};

// Connect to MetaMask
export const connectMetaMask = async (): Promise<WalletInfo | null> => {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed");
  }

  try {
    // Request account access
    await window.ethereum.request({ method: "eth_requestAccounts" });

    const provider = new ethers.providers.Web3Provider(window.ethereum);
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
    console.error("Error connecting to MetaMask:", error);
    return null;
  }
};

// Disconnect from MetaMask
export const disconnectMetaMask = async (): Promise<void> => {
  try {
    console.log("Disconnecting from MetaMask...");

    if (!isMetaMaskInstalled()) {
      console.log("MetaMask not installed, skipping disconnect");
      return;
    }

    // Try to revoke permissions if supported
    try {
      console.log("Attempting to revoke MetaMask permissions...");
      await window.ethereum.request({
        method: "wallet_revokePermissions",
        params: [
          {
            eth_accounts: {},
          },
        ],
      });
      console.log("MetaMask permissions revoked successfully");
    } catch (error) {
      console.log("wallet_revokePermissions not supported or failed:", error);

      // Fallback: Request to disconnect accounts (some versions support this)
      try {
        console.log("Attempting alternative disconnect method...");
        await window.ethereum.request({
          method: "eth_requestAccounts",
          params: [{ eth_accounts: { requiredMethods: [] } }],
        });
      } catch (fallbackError) {
        console.log("Alternative disconnect method failed:", fallbackError);
      }
    }

    console.log("MetaMask disconnect process completed");
  } catch (error) {
    console.error("Error disconnecting from MetaMask:", error);
    throw error;
  }
};

// Clear WalletConnect localStorage data
export const clearWalletConnectStorage = () => {
  try {
    console.log("Clearing WalletConnect localStorage data...");
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

    wcKeys.forEach((key) => {
      console.log("Removing localStorage key:", key);
      localStorage.removeItem(key);
    });

    // Also clear session storage
    try {
      const sessionKeys = Object.keys(sessionStorage);
      const wcSessionKeys = sessionKeys.filter(
        (key) =>
          key.startsWith("wc@2") || key.startsWith("walletconnect") || key.includes("walletconnect")
      );

      wcSessionKeys.forEach((key) => {
        console.log("Removing sessionStorage key:", key);
        sessionStorage.removeItem(key);
      });

      console.log(
        `Cleared ${wcKeys.length} localStorage and ${wcSessionKeys.length} sessionStorage WalletConnect entries`
      );
    } catch (e) {
      console.log("Error clearing sessionStorage:", e);
    }
  } catch (error) {
    console.error("Error clearing WalletConnect storage:", error);
  }
};

// Comprehensive cleanup function for WalletConnect
export const performComprehensiveCleanup = async (): Promise<void> => {
  console.log("Performing comprehensive WalletConnect cleanup...");

  // Step 1: Disconnect and clean up existing provider if any
  if (walletConnectProvider) {
    try {
      console.log("Cleaning up existing WalletConnect provider...");

      // Remove all event listeners first to prevent race conditions
      try {
        if (accountsChangedCallback) {
          walletConnectProvider.removeListener("accountsChanged", accountsChangedCallback);
          accountsChangedCallback = null;
        }
        if (chainChangedCallback) {
          walletConnectProvider.removeListener("chainChanged", chainChangedCallback);
          chainChangedCallback = null;
        }

        // Remove all listeners to prevent stale event handlers
        const eventTypes = [
          "connect",
          "disconnect",
          "session_update",
          "session_delete",
          "display_uri",
          "session_event",
          "session_request_sent",
          "session_ping",
          "session_proposal",
          "error",
          "accountsChanged",
          "chainChanged",
        ];

        eventTypes.forEach((eventType) => {
          try {
            walletConnectProvider.removeAllListeners(eventType);
          } catch (listenerError) {
            console.log(`Could not remove ${eventType} listeners (non-critical):`, listenerError);
          }
        });
      } catch (listenerError) {
        console.log("Error removing listeners (non-critical):", listenerError);
      }

      // Try to disconnect gracefully
      if (walletConnectProvider.connected || walletConnectProvider.session) {
        console.log("Attempting to disconnect existing session...");
        try {
          await walletConnectProvider.disconnect();
        } catch (disconnectError) {
          console.log("Disconnect error (continuing cleanup):", disconnectError);
        }
      }
    } catch (e) {
      console.log("Error during provider cleanup:", e);
    } finally {
      walletConnectProvider = null;
    }
  }

  // Step 2: Clear all storage
  console.log("Clearing all WalletConnect storage...");
  clearWalletConnectStorage();

  // Step 3: Additional storage cleanup
  try {
    if (typeof window !== "undefined") {
      // Clear any IndexedDB WalletConnect data if accessible
      try {
        if ("indexedDB" in window && window.indexedDB) {
          // Try to delete common WalletConnect IndexedDB names
          const dbNames = ["walletconnect", "wc@2", "@walletconnect"];
          dbNames.forEach((dbName) => {
            try {
              window.indexedDB.deleteDatabase(dbName);
            } catch (idbError) {
              console.log(`Could not delete IndexedDB ${dbName} (non-critical):`, idbError);
            }
          });
        }
      } catch (idbError) {
        console.log("IndexedDB cleanup error (non-critical):", idbError);
      }
    }
  } catch (storageError) {
    console.log("Additional storage cleanup error (non-critical):", storageError);
  }

  // Step 4: Wait for cleanup to complete
  console.log("Waiting for cleanup to complete...");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Step 5: Final storage clear
  clearWalletConnectStorage();

  console.log("Comprehensive cleanup completed");
};

// Connect to WalletConnect
export const connectWalletConnect = async (): Promise<WalletInfo | null> => {
  try {
    console.log("Starting WalletConnect connection...");

    // Comprehensive cleanup before connection
    await performComprehensiveCleanup();

    // Create new WalletConnect provider
    console.log("Creating new WalletConnect provider...");
    walletConnectProvider = await EthereumProvider.init({
      projectId: WALLETCONNECT_PROJECT_ID,
      chains: [1], // Ethereum Mainnet
      optionalChains: [42161, 137, 10, 8453, 11155111], // Additional chains
      showQrModal: true,
      qrModalOptions: {
        themeMode: "light",
        themeVariables: {
          "--wcm-z-index": "1000",
        },
      },
      metadata: {
        name: "EWE React Web3 DApp",
        description: "A Web3 DApp with MetaMask and WalletConnect support",
        url: window.location.origin, // Use actual origin
        icons: ["https://avatars.githubusercontent.com/u/37784886"],
      },
    });

    // Add event listeners with error handling for stale sessions
    walletConnectProvider.on("display_uri", (uri: string) => {
      console.log("WalletConnect URI generated:", uri);
    });

    walletConnectProvider.on("connect", (data: any) => {
      console.log("WalletConnect connected:", data);
    });

    walletConnectProvider.on("disconnect", (data: any) => {
      console.log("WalletConnect disconnected:", data);
    });

    walletConnectProvider.on("session_update", (data: any) => {
      console.log("WalletConnect session updated:", data);
    });

    walletConnectProvider.on("session_delete", (data: any) => {
      console.log("WalletConnect session deleted:", data);
    });

    // Add error event handlers for session issues
    walletConnectProvider.on("session_event", (data: any) => {
      console.log("WalletConnect session event:", data);
    });

    // Handle WalletConnect errors gracefully
    walletConnectProvider.on("error", (error: any) => {
      console.error("WalletConnect provider error:", error);
      if (error?.message?.includes("session topic doesn't exist")) {
        console.log("Stale session detected, performing cleanup...");
        performComprehensiveCleanup().catch((cleanupError) => {
          console.error("Error during cleanup:", cleanupError);
        });
      }
    });

    // Add global error handlers to catch any unhandled session errors
    const handleGlobalWCError = (event: any) => {
      if (
        event.error?.message?.includes("session topic doesn't exist") ||
        event.reason?.includes("session topic doesn't exist")
      ) {
        console.log("Global WalletConnect session error detected, performing cleanup...");
        performComprehensiveCleanup().catch((cleanupError) => {
          console.error("Error during global cleanup:", cleanupError);
        });
      }
    };

    // Add both error and unhandled rejection handlers
    if (typeof window !== "undefined") {
      window.addEventListener("error", handleGlobalWCError);
      window.addEventListener("unhandledrejection", handleGlobalWCError);

      // Store reference for cleanup
      walletConnectProvider._globalErrorHandler = handleGlobalWCError;
    }

    // Connect to wallet
    console.log("Enabling WalletConnect provider...");
    await walletConnectProvider.enable();

    console.log("Creating ethers provider...");
    const provider = new ethers.providers.Web3Provider(walletConnectProvider);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    const network = await provider.getNetwork();

    console.log("WalletConnect connection successful:", address);

    return {
      address,
      balance: ethers.utils.formatEther(balance),
      chainId: network.chainId,
      chainName: CHAIN_INFO[network.chainId] || `Chain ${network.chainId}`,
      isConnected: true,
      walletType: WalletType.WALLETCONNECT,
    };
  } catch (error) {
    console.error("Error connecting to WalletConnect:", error);

    // Clean up provider on error
    if (walletConnectProvider) {
      try {
        await walletConnectProvider.disconnect();
      } catch (e) {
        console.log("Error cleaning up provider:", e);
      }
      walletConnectProvider = null;
    }

    // Clear storage on error as well
    await performComprehensiveCleanup();

    return null;
  }
};

// Disconnect WalletConnect
export const disconnectWalletConnect = async (): Promise<void> => {
  console.log("Starting WalletConnect disconnect process...");

  if (walletConnectProvider) {
    try {
      console.log("Disconnecting WalletConnect provider...");

      // Remove event listeners first to prevent any race conditions
      try {
        if (accountsChangedCallback) {
          walletConnectProvider.removeListener("accountsChanged", accountsChangedCallback);
          accountsChangedCallback = null;
        }
        if (chainChangedCallback) {
          walletConnectProvider.removeListener("chainChanged", chainChangedCallback);
          chainChangedCallback = null;
        }

        // Remove global error handlers if they exist
        if (walletConnectProvider._globalErrorHandler && typeof window !== "undefined") {
          window.removeEventListener("error", walletConnectProvider._globalErrorHandler);
          window.removeEventListener(
            "unhandledrejection",
            walletConnectProvider._globalErrorHandler
          );
          walletConnectProvider._globalErrorHandler = null;
        }

        // Remove all other listeners
        walletConnectProvider.removeAllListeners("connect");
        walletConnectProvider.removeAllListeners("disconnect");
        walletConnectProvider.removeAllListeners("session_update");
        walletConnectProvider.removeAllListeners("session_delete");
        walletConnectProvider.removeAllListeners("display_uri");
        walletConnectProvider.removeAllListeners("session_event");
        walletConnectProvider.removeAllListeners("session_request_sent");
        walletConnectProvider.removeAllListeners("session_ping");
        walletConnectProvider.removeAllListeners("session_proposal");
        walletConnectProvider.removeAllListeners("error");
      } catch (e) {
        console.log(
          "Error removing some listeners (non-critical):",
          (e as Error)?.message || String(e)
        );
      }

      // Try to disconnect gracefully with additional checks
      if (walletConnectProvider.connected && walletConnectProvider.session) {
        console.log("Attempting graceful disconnect of active session...");
        await walletConnectProvider.disconnect();
      } else if (walletConnectProvider.session) {
        console.log("Session exists but not connected, clearing session...");
        // Force cleanup session if it exists but not connected
        try {
          await walletConnectProvider.disconnect();
        } catch (sessionError) {
          console.log("Session cleanup error (continuing):", sessionError);
        }
      }

      // Additional cleanup - reset any internal state
      if (typeof walletConnectProvider.reset === "function") {
        try {
          walletConnectProvider.reset();
        } catch (resetError) {
          console.log("Provider reset error (non-critical):", resetError);
        }
      }
    } catch (error) {
      console.error("Error disconnecting WalletConnect:", error);
      // Continue with cleanup even if disconnect fails
    } finally {
      walletConnectProvider = null;
      console.log("WalletConnect provider cleared");
    }
  }

  // Always clear localStorage when disconnecting - multiple times for reliability
  console.log("Clearing localStorage (first pass)...");
  clearWalletConnectStorage();

  // Wait longer to ensure all cleanup is complete
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log("Clearing localStorage (second pass)...");
  clearWalletConnectStorage();

  // Additional cleanup - clear any WalletConnect related indexedDB or sessionStorage
  try {
    if (typeof window !== "undefined") {
      // Clear sessionStorage WalletConnect data
      Object.keys(window.sessionStorage).forEach((key) => {
        if (key.includes("walletconnect") || key.includes("wc@2")) {
          window.sessionStorage.removeItem(key);
        }
      });
    }
  } catch (storageError) {
    console.log("Additional storage cleanup error (non-critical):", storageError);
  }

  console.log("WalletConnect disconnect process completed");
};

// Get current WalletConnect provider
export const getWalletConnectProvider = () => {
  return walletConnectProvider;
};

// Check if WalletConnect is connected
export const isWalletConnectConnected = (): boolean => {
  return walletConnectProvider && walletConnectProvider.connected === true;
};

// Force reset WalletConnect - useful for troubleshooting
export const forceResetWalletConnect = async (): Promise<void> => {
  console.log("Force resetting WalletConnect...");

  // Disconnect provider if exists
  if (walletConnectProvider) {
    try {
      await walletConnectProvider.disconnect();
    } catch (e) {
      console.log("Error in force disconnect:", e);
    }
    walletConnectProvider = null;
  }

  // Clear all localStorage data
  clearWalletConnectStorage();

  console.log("WalletConnect force reset complete");
};

// General connect function that accepts wallet type
export const connectWallet = async (walletType: WalletType): Promise<WalletInfo | null> => {
  switch (walletType) {
    case WalletType.METAMASK:
      return await connectMetaMask();
    case WalletType.WALLETCONNECT:
      return await connectWalletConnect();
    default:
      throw new Error(`Unsupported wallet type: ${walletType}`);
  }
};

// Get current gas price
export const getGasPrice = async (): Promise<GasPriceInfo> => {
  try {
    let provider: ethers.providers.Web3Provider | null = null;

    // Check WalletConnect first
    const wcProvider = getWalletConnectProvider();
    if (wcProvider) {
      console.log("WalletConnect provider available, connected:", wcProvider.connected);
      // Try to use WalletConnect provider even if connected state is uncertain
      try {
        provider = new ethers.providers.Web3Provider(wcProvider);
        // Test if the provider actually works by trying to get network
        await provider.getNetwork();
        console.log("Using WalletConnect provider for gas price (verified working)");
      } catch (wcError) {
        console.log("WalletConnect provider not working, trying MetaMask:", wcError);
        provider = null;
      }
    }

    // Fall back to MetaMask if WalletConnect doesn't work
    if (!provider && isMetaMaskInstalled() && window.ethereum) {
      console.log("Using MetaMask provider for gas price");
      try {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        // Verify MetaMask is connected
        const accounts = await provider.listAccounts();
        if (accounts.length === 0) {
          throw new Error("MetaMask not connected");
        }
      } catch (mmError) {
        console.log("MetaMask provider not working:", mmError);
        provider = null;
      }
    }

    if (!provider) {
      throw new Error("No wallet provider available or working");
    }

    const gasPrice = await provider.getGasPrice();
    const gasPriceGwei = ethers.utils.formatUnits(gasPrice, "gwei");

    const lastUpdated = new Date().toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    console.log("Gas price fetched successfully:", gasPriceGwei, "gwei");

    return {
      gasPrice: gasPrice.toString(),
      gasPriceGwei: parseFloat(gasPriceGwei).toFixed(2),
      lastUpdated,
      isLoading: false,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching gas price:", error);
    return {
      gasPrice: "0",
      gasPriceGwei: "0",
      lastUpdated: "",
      isLoading: false,
      error: "Failed to fetch gas price: " + (error as Error).message,
    };
  }
};

// Listen for account changes (both MetaMask and WalletConnect)
export const onAccountsChanged = (callback: (accounts: string[]) => void) => {
  // Store the callback for cleanup
  accountsChangedCallback = callback;

  // MetaMask listener
  if (isMetaMaskInstalled()) {
    window.ethereum.on("accountsChanged", callback);
  }

  // WalletConnect listener
  if (walletConnectProvider) {
    walletConnectProvider.on("accountsChanged", callback);
  }
};

// Listen for network changes (both MetaMask and WalletConnect)
export const onChainChanged = (callback: (chainId: string) => void) => {
  // Store the callback for cleanup
  chainChangedCallback = callback;

  // MetaMask listener
  if (isMetaMaskInstalled()) {
    window.ethereum.on("chainChanged", callback);
  }

  // WalletConnect listener
  if (walletConnectProvider) {
    walletConnectProvider.on("chainChanged", callback);
  }
};

// Remove event listeners (both MetaMask and WalletConnect)
export const removeAllListeners = () => {
  // Remove MetaMask listeners
  if (isMetaMaskInstalled()) {
    if (typeof window.ethereum.removeAllListeners === "function") {
      // MetaMask supports removeAllListeners
      window.ethereum.removeAllListeners("accountsChanged");
      window.ethereum.removeAllListeners("chainChanged");
    } else {
      // Fallback for other providers
      if (accountsChangedCallback) {
        window.ethereum.removeListener("accountsChanged", accountsChangedCallback);
      }
      if (chainChangedCallback) {
        window.ethereum.removeListener("chainChanged", chainChangedCallback);
      }
    }
  }

  // Remove WalletConnect listeners - WalletConnect v2 uses 'removeListener' or 'off'
  if (walletConnectProvider) {
    if (accountsChangedCallback) {
      try {
        walletConnectProvider.removeListener("accountsChanged", accountsChangedCallback);
      } catch (e) {
        console.warn("Failed to remove accountsChanged listener:", e);
      }
    }
    if (chainChangedCallback) {
      try {
        walletConnectProvider.removeListener("chainChanged", chainChangedCallback);
      } catch (e) {
        console.warn("Failed to remove chainChanged listener:", e);
      }
    }
  }

  // Clear stored callbacks
  accountsChangedCallback = null;
  chainChangedCallback = null;
};

// Declare global ethereum interface
declare global {
  interface Window {
    ethereum: any;
  }
}
