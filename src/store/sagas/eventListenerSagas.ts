import { type EventChannel, eventChannel, type SagaIterator, type Task } from "redux-saga";
import { call, cancel, cancelled, delay, fork, put, take } from "redux-saga/effects";
import {
  CHAIN_INFO,
  onAccountsChanged,
  onChainChanged,
  removeAllListeners,
} from "../../utils/web3";
import { setChainInfo } from "../wallet";

// Create event channel for accounts changed
function createAccountsChangedChannel(): EventChannel<string[]> {
  return eventChannel((emit) => {
    console.log("Saga Event: Setting up accounts changed listener");
    onAccountsChanged((accounts: string[]) => {
      console.log("Saga Event: Accounts changed:", accounts);
      emit(accounts);
    });

    return () => {
      console.log("Saga Event: Cleaning up accounts changed listener");
      // Cleanup handled in removeAllListeners
    };
  });
}

// Create event channel for chain changed
function createChainChangedChannel(): EventChannel<string> {
  return eventChannel((emit) => {
    console.log("Saga Event: Setting up chain changed listener");
    onChainChanged((chainIdHex: string) => {
      console.log("Saga Event: Chain changed:", chainIdHex);
      emit(chainIdHex);
    });

    return () => {
      console.log("Saga Event: Cleaning up chain changed listener");
      // Cleanup handled in removeAllListeners
    };
  });
}

// Worker Saga: Handle accounts changed events
function* handleAccountsChangedSaga(): SagaIterator {
  const accountsChannel: EventChannel<string[]> = yield call(createAccountsChangedChannel);

  try {
    while (true) {
      const accounts: string[] = yield take(accountsChannel);

      if (accounts.length === 0) {
        yield put({ type: "wallet/disconnectRequest" });
      } else {
        yield put({ type: "wallet/updateInfoRequest", payload: true });
      }
    }
  } finally {
    const isCancelled: boolean = yield cancelled();
    if (isCancelled) {
      console.log("Saga Event: Accounts changed saga cancelled");
      accountsChannel.close();
    }
  }
}

// Worker Saga: Handle chain changed events
function* handleChainChangedSaga(): SagaIterator {
  const chainChannel: EventChannel<string> = yield call(createChainChangedChannel);

  try {
    while (true) {
      const chainIdHex: string = yield take(chainChannel);
      const chainId = parseInt(chainIdHex, 16);

      yield put(
        setChainInfo({
          chainId,
          chainName: CHAIN_INFO[chainId] || `Chain ${chainId}`,
        })
      );

      yield put({ type: "wallet/updateInfoRequest", payload: true });
    }
  } finally {
    const isCancelled: boolean = yield cancelled();
    if (isCancelled) {
      console.log("Saga Event: Chain changed saga cancelled");
      chainChannel.close();
    }
  }
}

// Main event listener saga
function* eventListenerSaga(): SagaIterator {
  console.log("Saga Event: Starting event listeners");

  // Don't auto-reconnect on page load - users should explicitly connect
  // The previous auto-reconnect was causing state persistence issues

  // Start event listeners
  const accountsTask: Task = yield fork(handleAccountsChangedSaga);
  const chainTask: Task = yield fork(handleChainChangedSaga);

  try {
    // Keep running until cancelled
    while (true) {
      yield delay(1000); // Keep the saga alive
    }
  } finally {
    console.log("Saga Event: Cleaning up event listeners");
    yield cancel(accountsTask);
    yield cancel(chainTask);
    yield call(removeAllListeners);
  }
}

export default eventListenerSaga;
