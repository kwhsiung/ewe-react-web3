import type { SagaIterator, Task } from "redux-saga";
import { call, cancel, delay, fork, put, select, take } from "redux-saga/effects";
import { getGasPrice } from "../../utils/web3";
import type { RootState } from "../index";
import { fetchFailure, fetchSuccess, reset, setLoading } from "./slice";

// Worker Saga: Fetch gas price
function* fetchGasPriceSaga(): SagaIterator {
  try {
    console.log("Saga: Fetching gas price...");

    // Check if wallet is connected
    const walletState: RootState["wallet"] = yield select((state: RootState) => state.wallet);
    if (!walletState.isConnected) {
      console.log("Saga: Wallet not connected, skipping gas price fetch");
      return;
    }

    yield put(setLoading(true));

    const gasPriceInfo: Awaited<ReturnType<typeof getGasPrice>> = yield call(getGasPrice);

    console.log("Saga: Gas price fetched successfully:", gasPriceInfo.gasPriceGwei, "gwei");
    yield put(fetchSuccess(gasPriceInfo));
  } catch (error: any) {
    console.error("Saga: Error fetching gas price:", error);
    yield put(fetchFailure(error.message || "Failed to fetch gas price"));
  }
}

// Worker Saga: Gas price monitoring with 5-second interval
function* gasPriceMonitoringSaga(): SagaIterator {
  try {
    console.log("Saga: Starting gas price monitoring...");

    // Fetch immediately
    yield fork(fetchGasPriceSaga);

    // Then fetch every 5 seconds
    while (true) {
      yield delay(5000); // 5 second delay

      // Check if wallet is still connected before fetching
      const walletState: RootState["wallet"] = yield select((state: RootState) => state.wallet);
      if (walletState.isConnected) {
        yield fork(fetchGasPriceSaga);
      } else {
        console.log("Saga: Wallet disconnected, stopping gas price monitoring");
        break;
      }
    }
  } catch (error: any) {
    console.error("Saga: Gas price monitoring error:", error);
  } finally {
    console.log("Saga: Gas price monitoring stopped");
  }
}

// Watcher Saga: Handle manual gas price fetch requests
function* watchFetchGasPrice(): SagaIterator {
  while (true) {
    yield take("gasPrice/fetchRequest");
    yield fork(fetchGasPriceSaga);
  }
}

// Watcher Saga: Handle gas price monitoring start/stop
function* watchGasPriceMonitoring(): SagaIterator {
  let monitoringTask: Task | null = null;

  while (true) {
    const action: any = yield take([
      "gasPrice/startMonitoring",
      "gasPrice/stopMonitoring",
      "wallet/connectSuccess", // Auto-start on wallet connect
      "wallet/disconnectSuccess", // Auto-stop on wallet disconnect
    ]);

    if (action.type === "gasPrice/startMonitoring" || action.type === "wallet/connectSuccess") {
      // Cancel existing monitoring if any
      if (monitoringTask) {
        yield cancel(monitoringTask);
      }

      // Start new monitoring
      monitoringTask = yield fork(gasPriceMonitoringSaga);
    } else if (
      action.type === "gasPrice/stopMonitoring" ||
      action.type === "wallet/disconnectSuccess"
    ) {
      // Stop monitoring
      if (monitoringTask) {
        yield cancel(monitoringTask);
        monitoringTask = null;
      }

      // Reset gas price state when wallet disconnects
      if (action.type === "wallet/disconnectSuccess") {
        yield put(reset());
      }
    }
  }
}

// Root gas price saga
export default function* gasPriceSagas(): SagaIterator {
  yield fork(watchFetchGasPrice);
  yield fork(watchGasPriceMonitoring);
}
