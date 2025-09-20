import type EthereumProvider from "@walletconnect/ethereum-provider";
import { ethers } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GasPriceInfo } from "../types";

interface UseGasPriceOptions {
  provider: ethers.providers.Web3Provider | EthereumProvider | null;
  isWalletConnected: boolean;
  refreshInterval?: number; // in milliseconds, default 5000
}

interface UseGasPriceReturn {
  gasPriceInfo: GasPriceInfo;
  refreshGasPrice: () => Promise<void>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

export const useGasPrice = ({
  provider,
  isWalletConnected,
  refreshInterval = 5000,
}: UseGasPriceOptions): UseGasPriceReturn => {
  // Gas price state
  const [gasPriceInfo, setGasPriceInfo] = useState<GasPriceInfo>({
    gasPrice: "0",
    gasPriceGwei: "0",
    lastUpdated: "",
    isLoading: false,
    error: null,
  });

  // Refs for cleanup
  const gasPriceInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch gas price
  const fetchGasPrice = useCallback(async (): Promise<GasPriceInfo> => {
    try {
      if (!provider) {
        throw new Error("No wallet provider available");
      }

      // Handle both Web3Provider and EthereumProvider
      let gasPrice: ethers.BigNumber;
      if ("getGasPrice" in provider) {
        // Web3Provider
        gasPrice = await provider.getGasPrice();
      } else {
        // EthereumProvider - use request method
        const result = await provider.request({
          method: "eth_gasPrice",
          params: [],
        });
        gasPrice = ethers.BigNumber.from(result);
      }

      const gasPriceGwei = ethers.utils.formatUnits(gasPrice, "gwei");

      const lastUpdated = new Date().toLocaleString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

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
        error: `Failed to fetch gas price: ${(error as Error).message}`,
      };
    }
  }, [provider]);

  // Refresh gas price
  const refreshGasPrice = useCallback(async () => {
    setGasPriceInfo((prev) => ({ ...prev, isLoading: true, error: null }));
    const newGasPriceInfo = await fetchGasPrice();
    setGasPriceInfo(newGasPriceInfo);
  }, [fetchGasPrice]);

  // Start monitoring gas price
  const startMonitoring = useCallback(() => {
    if (gasPriceInterval.current) {
      clearInterval(gasPriceInterval.current);
    }

    // Fetch immediately
    refreshGasPrice();

    // Set up interval
    gasPriceInterval.current = setInterval(() => {
      refreshGasPrice();
    }, refreshInterval);
  }, [refreshGasPrice, refreshInterval]);

  // Stop monitoring gas price
  const stopMonitoring = useCallback(() => {
    if (gasPriceInterval.current) {
      clearInterval(gasPriceInterval.current);
      gasPriceInterval.current = null;
    }

    // Reset gas price info
    setGasPriceInfo({
      gasPrice: "0",
      gasPriceGwei: "0",
      lastUpdated: "",
      isLoading: false,
      error: null,
    });
  }, []);

  // Auto start/stop monitoring based on wallet connection
  useEffect(() => {
    if (isWalletConnected) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
      if (gasPriceInterval.current) {
        clearInterval(gasPriceInterval.current);
      }
    };
  }, [isWalletConnected, startMonitoring, stopMonitoring]);

  return {
    gasPriceInfo,
    refreshGasPrice,
    startMonitoring,
    stopMonitoring,
  };
};
