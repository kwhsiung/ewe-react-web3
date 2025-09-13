import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import { all, fork } from "redux-saga/effects";
import { gasPriceSagas, gasPriceSlice } from "./gasPrice";
import eventListenerSaga from "./sagas/eventListenerSagas";
import { walletSagas, walletSlice } from "./wallet";

// Create saga middleware
const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    wallet: walletSlice.reducer,
    gasPrice: gasPriceSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["@@saga"],
        ignoredActionsPaths: ["meta.arg", "payload.timestamp"],
      },
      thunk: false, // We're using saga, so disable thunk
    }).concat(sagaMiddleware),
});

export default function* rootSaga() {
  yield all([fork(walletSagas), fork(eventListenerSaga), fork(gasPriceSagas)]);
}

// Run the root saga
sagaMiddleware.run(rootSaga);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
