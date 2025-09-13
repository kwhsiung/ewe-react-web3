import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import rootSaga from "./sagas";
import gasPriceSlice from "./slices/gasPriceSlice";
import walletSlice from "./slices/walletSlice";

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

// Run the root saga
sagaMiddleware.run(rootSaga);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
