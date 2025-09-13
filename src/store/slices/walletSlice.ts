import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { WalletInfo, WalletType } from "../../utils/web3";

// State interface
interface WalletState {
  address: string;
  balance: string;
  chainId: number;
  chainName: string;
  isConnected: boolean;
  walletType?: WalletType;
  isConnecting: boolean;
  error: string | null;
}

// Initial state
const initialState: WalletState = {
  address: "",
  balance: "0",
  chainId: 0,
  chainName: "",
  isConnected: false,
  walletType: undefined,
  isConnecting: false,
  error: null,
};

// Create the wallet slice
const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    // Synchronous actions
    connectRequest: (state) => {
      state.isConnecting = true;
      state.error = null;
    },
    connectSuccess: (state, action: PayloadAction<WalletInfo>) => {
      state.isConnecting = false;
      state.address = action.payload.address;
      state.balance = action.payload.balance;
      state.chainId = action.payload.chainId;
      state.chainName = action.payload.chainName;
      state.isConnected = action.payload.isConnected;
      state.walletType = action.payload.walletType;
      state.error = null;
    },
    connectFailure: (state, action: PayloadAction<string>) => {
      state.isConnecting = false;
      state.error = action.payload;
    },
    disconnectSuccess: () => {
      return initialState;
    },
    disconnectFailure: (state, action: PayloadAction<string>) => {
      // Reset to initial state but keep error
      return {
        ...initialState,
        error: action.payload,
      };
    },
    updateInfoSuccess: (state, action: PayloadAction<WalletInfo>) => {
      state.address = action.payload.address;
      state.balance = action.payload.balance;
      state.chainId = action.payload.chainId;
      state.chainName = action.payload.chainName;
      state.isConnected = action.payload.isConnected;
      state.walletType = action.payload.walletType;
      state.error = null;
    },
    updateInfoFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setChainInfo: (state, action: PayloadAction<{ chainId: number; chainName: string }>) => {
      state.chainId = action.payload.chainId;
      state.chainName = action.payload.chainName;
    },
  },
});

// Export actions
export const {
  connectRequest,
  connectSuccess,
  connectFailure,
  disconnectSuccess,
  disconnectFailure,
  updateInfoSuccess,
  updateInfoFailure,
  setError,
  clearError,
  setChainInfo,
} = walletSlice.actions;

export default walletSlice;

// Selectors
export const selectWallet = (state: { wallet: WalletState }) => state.wallet;
export const selectWalletInfo = (state: { wallet: WalletState }): WalletInfo => ({
  address: state.wallet.address,
  balance: state.wallet.balance,
  chainId: state.wallet.chainId,
  chainName: state.wallet.chainName,
  isConnected: state.wallet.isConnected,
  walletType: state.wallet.walletType,
});
export const selectIsConnecting = (state: { wallet: WalletState }) => state.wallet.isConnecting;
export const selectWalletError = (state: { wallet: WalletState }) => state.wallet.error;
