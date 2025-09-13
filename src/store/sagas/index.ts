import { all, fork } from "redux-saga/effects";
import eventListenerSaga from "./eventListenerSagas";
import gasPriceSagas from "./gasPriceSagas";
import walletSagas from "./walletSagas";

export default function* rootSaga() {
  yield all([fork(walletSagas), fork(eventListenerSaga), fork(gasPriceSagas)]);
}
