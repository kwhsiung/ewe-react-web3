import { ethers } from "ethers";
import type { SagaIterator } from "redux-saga";
import { call, put, select, takeEvery, takeLatest } from "redux-saga/effects";
import {
  CHAIN_INFO,
  connectWallet as connectWalletService,
  disconnectMetaMask,
  disconnectWalletConnect,
  getWalletConnectProvider,
  performComprehensiveCleanup,
  WalletType,
} from "../../utils/web3";
import type { RootState } from "../index";
import {
  connectFailure,
  connectSuccess,
  disconnectFailure,
  disconnectSuccess,
  updateInfoFailure,
  updateInfoSuccess,
} from "./slice";

// Custom action types for sagas
interface ConnectWalletAction {
  type: "wallet/connectRequest";
  payload: WalletType;
}

interface UpdateWalletInfoAction {
  type: "wallet/updateInfoRequest";
  payload: boolean;
}

// Worker Saga: Connect Wallet
function* connectWalletSaga(action: ConnectWalletAction): SagaIterator {
  try {
    console.log("Saga: Connecting to wallet type:", action.payload);

    // For WalletConnect, perform comprehensive cleanup first if there was a previous error
    if (action.payload === WalletType.WALLETCONNECT) {
      const walletState: RootState["wallet"] = yield select((state: RootState) => state.wallet);
      if (walletState.error && walletState.error.includes("session topic")) {
        console.log(
          "Saga: Previous session error detected, performing cleanup before reconnection"
        );
        try {
          yield call(performComprehensiveCleanup);
          yield call(delay, 1000); // Additional wait after cleanup
        } catch (cleanupError) {
          console.log("Saga: Cleanup error (non-critical):", cleanupError);
        }
      }
    }

    const result: Awaited<ReturnType<typeof connectWalletService>> = yield call(
      connectWalletService,
      action.payload
    );

    if (!result) {
      throw new Error("Failed to connect wallet - no result returned");
    }

    console.log("Saga: Connection successful:", result);
    yield put(connectSuccess(result));
  } catch (error: any) {
    console.error("Saga: Connection error:", error);

    // Special handling for WalletConnect session errors
    const errorMessage = (error as Error)?.message || String(error);
    if (errorMessage.includes("session topic doesn't exist")) {
      console.log("Saga: Session topic error detected, performing cleanup");
      try {
        yield call(performComprehensiveCleanup);
        yield put(
          connectFailure("Connection failed due to stale session. Please try connecting again.")
        );
      } catch (cleanupError) {
        console.error("Saga: Cleanup failed:", cleanupError);
        yield put(connectFailure("Connection failed. Please refresh the page and try again."));
      }
    } else {
      yield put(connectFailure(errorMessage || "Failed to connect wallet"));
    }
  }
}

// Worker Saga: Disconnect Wallet
function* disconnectWalletSaga(): SagaIterator {
  try {
    console.log("Saga: Disconnecting wallet...");

    // Get current wallet state
    const walletState: RootState["wallet"] = yield select((state: RootState) => state.wallet);

    // Disconnect based on wallet type
    if (walletState.walletType === WalletType.WALLETCONNECT) {
      console.log("Saga: Disconnecting WalletConnect provider...");
      yield call(disconnectWalletConnect);

      // Add extra delay to ensure cleanup is complete
      console.log("Saga: Waiting for cleanup to complete...");
      yield call(delay, 1000);

      console.log("Saga: WalletConnect disconnect completed");
    } else if (walletState.walletType === WalletType.METAMASK) {
      console.log("Saga: Disconnecting MetaMask provider...");
      try {
        yield call(disconnectMetaMask);
        console.log("Saga: MetaMask disconnect completed");
      } catch (error) {
        console.log("Saga: MetaMask disconnect failed (non-critical):", error);
        // Continue with the disconnect process even if MetaMask disconnect fails
      }
    }

    console.log("Saga: Wallet disconnected successfully");
    yield put(disconnectSuccess());
  } catch (error: any) {
    console.error("Saga: Error disconnecting wallet:", error);
    const errorMessage = (error as Error)?.message || String(error);
    yield put(disconnectFailure(errorMessage || "Failed to disconnect wallet"));
  }
}

// Worker Saga: Update Wallet Info
function* updateWalletInfoSaga(action: UpdateWalletInfoAction): SagaIterator {
  try {
    const shouldCheckConnectedState = action.payload;
    const walletState: RootState["wallet"] = yield select((state: RootState) => state.wallet);

    let provider: ethers.providers.Web3Provider | null = null;
    let currentWalletType: WalletType | undefined;

    // Check WalletConnect first
    const wcProvider: any = yield call(getWalletConnectProvider);
    if (wcProvider) {
      console.log("Saga: WalletConnect provider available, connected:", wcProvider.connected);
      try {
        provider = new ethers.providers.Web3Provider(wcProvider);
        yield call([provider, provider.getNetwork]);
        currentWalletType = WalletType.WALLETCONNECT;
        console.log("Saga: Using WalletConnect provider for update (verified working)");
      } catch (wcError: any) {
        console.log("Saga: WalletConnect provider not working:", wcError);

        // Check if this is a session topic error
        const errorMessage = (wcError as Error)?.message || String(wcError);
        if (errorMessage.includes("session topic doesn't exist")) {
          console.log("Saga: Stale session detected in update, performing cleanup");
          try {
            yield call(performComprehensiveCleanup);
            // After cleanup, disconnect the wallet since the session is invalid
            yield put({ type: "wallet/disconnectRequest" });
            return; // Exit early to prevent further processing
          } catch (cleanupError) {
            console.log("Saga: Cleanup error during update:", cleanupError);
          }
        }

        provider = null;
      }
    }

    // Fall back to MetaMask if WalletConnect doesn't work
    // BUT only if we're checking for an already connected state (not on startup)
    if (
      !provider &&
      shouldCheckConnectedState &&
      typeof window !== "undefined" &&
      window.ethereum
    ) {
      console.log("Saga: Checking MetaMask provider for already connected accounts");
      try {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts: string[] = yield call([provider, provider.listAccounts]);
        if (accounts.length === 0) {
          throw new Error("MetaMask not connected");
        }
        // Only connect if MetaMask has already authorized accounts
        console.log("Saga: MetaMask has authorized accounts, reconnecting");
        currentWalletType = WalletType.METAMASK;
      } catch (mmError) {
        console.log("Saga: MetaMask provider not working or not authorized:", mmError);
        provider = null;
      }
    } else if (
      !provider &&
      !shouldCheckConnectedState &&
      typeof window !== "undefined" &&
      window.ethereum
    ) {
      console.log(
        "Saga: MetaMask available but not checking connected state - user must explicitly connect"
      );
    }

    if (provider) {
      const accounts: string[] = yield call([provider, provider.listAccounts]);

      if (accounts.length > 0) {
        const signer = provider.getSigner();
        const address: string = yield call([signer, signer.getAddress]);
        const balance: ethers.BigNumber = yield call([provider, provider.getBalance], address);
        const network: ethers.providers.Network = yield call([provider, provider.getNetwork]);

        console.log("Saga: Updating wallet info:", {
          address,
          chainId: network.chainId,
          walletType: currentWalletType,
        });

        const walletInfo = {
          address,
          balance: ethers.utils.formatEther(balance),
          chainId: network.chainId,
          chainName: CHAIN_INFO[network.chainId] || `Chain ${network.chainId}`,
          isConnected: true,
          walletType: currentWalletType,
        };

        yield put(updateInfoSuccess(walletInfo));
      } else {
        console.log("Saga: No accounts found, disconnecting");
        // Dispatch disconnect action - let it be handled by the disconnect saga
        yield put({ type: "wallet/disconnectRequest" });
      }
    } else {
      // No provider available
      if (shouldCheckConnectedState && walletState.isConnected) {
        console.log("Saga: No provider available but wallet was connected, disconnecting");
        yield put({ type: "wallet/disconnectRequest" });
      }
    }
  } catch (error: any) {
    console.error("Saga: Error updating wallet info:", error);

    // Handle WalletConnect session errors
    const errorMessage = (error as Error)?.message || String(error);
    if (errorMessage.includes("session topic doesn't exist")) {
      console.log("Saga: Session topic error in update, performing cleanup and disconnect");
      try {
        yield call(performComprehensiveCleanup);
        yield put({ type: "wallet/disconnectRequest" });
        return; // Exit early after triggering disconnect
      } catch (cleanupError) {
        console.error("Saga: Cleanup error:", cleanupError);
      }
    }

    yield put(updateInfoFailure(errorMessage || "Failed to update wallet info"));
  }
}

// Helper function for delays
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Root Saga
export default function* walletSagas(): SagaIterator {
  yield takeLatest("wallet/connectRequest", connectWalletSaga);
  yield takeLatest("wallet/disconnectRequest", disconnectWalletSaga);
  yield takeEvery("wallet/updateInfoRequest", updateWalletInfoSaga);
}
