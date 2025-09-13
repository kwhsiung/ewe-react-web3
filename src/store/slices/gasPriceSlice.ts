import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { GasPriceInfo } from "../../utils/web3";

// State interface
interface GasPriceState {
  gasPrice: string;
  gasPriceGwei: string;
  lastUpdated: string;
  isLoading: boolean;
  error: string | null;
  isMonitoring: boolean;
}

// Initial state
const initialState: GasPriceState = {
  gasPrice: "0",
  gasPriceGwei: "0",
  lastUpdated: "",
  isLoading: false,
  error: null,
  isMonitoring: false,
};

// Create the gas price slice
const gasPriceSlice = createSlice({
  name: "gasPrice",
  initialState,
  reducers: {
    fetchRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchSuccess: (state, action: PayloadAction<GasPriceInfo>) => {
      state.gasPrice = action.payload.gasPrice;
      state.gasPriceGwei = action.payload.gasPriceGwei;
      state.lastUpdated = action.payload.lastUpdated;
      state.isLoading = false;
      state.error = null;
    },
    fetchFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    startMonitoring: (state) => {
      state.isMonitoring = true;
    },
    stopMonitoring: (state) => {
      state.isMonitoring = false;
    },
    reset: () => {
      return initialState;
    },
  },
});

// Export actions
export const {
  fetchRequest,
  fetchSuccess,
  fetchFailure,
  setLoading,
  clearError,
  startMonitoring,
  stopMonitoring,
  reset,
} = gasPriceSlice.actions;

export default gasPriceSlice;

// Selectors
export const selectGasPrice = (state: { gasPrice: GasPriceState }) => state.gasPrice;
export const selectGasPriceInfo = (state: { gasPrice: GasPriceState }): GasPriceInfo => ({
  gasPrice: state.gasPrice.gasPrice,
  gasPriceGwei: state.gasPrice.gasPriceGwei,
  lastUpdated: state.gasPrice.lastUpdated,
  isLoading: state.gasPrice.isLoading,
  error: state.gasPrice.error,
});
export const selectGasPriceLoading = (state: { gasPrice: GasPriceState }) =>
  state.gasPrice.isLoading;
export const selectGasPriceError = (state: { gasPrice: GasPriceState }) => state.gasPrice.error;
