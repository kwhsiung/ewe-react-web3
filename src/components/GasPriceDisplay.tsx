import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { selectGasPriceInfo } from "../store/gasPrice";
import { selectWalletInfo } from "../store/wallet";
import { useDebounce } from "../utils/hooks";

const GasPriceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin: 20px;
  min-width: 400px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`;

const GasPriceValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
`;

const LastUpdated = styled.div`
  font-size: 12px;
  opacity: 0.8;
  font-style: italic;
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  color: #ffcccb;
  font-size: 14px;
  text-align: center;
`;

const RefreshButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function GasPriceDisplay() {
  const dispatch = useDispatch();

  const walletInfo = useSelector(selectWalletInfo);
  const { gasPriceGwei, lastUpdated, isLoading, error } = useSelector(selectGasPriceInfo);

  const handleRefresh = useDebounce(
    () => {
      if (walletInfo.isConnected) {
        dispatch({ type: "gasPrice/fetchRequest" });
      }
    },
    500,
    [dispatch, walletInfo.isConnected]
  );

  return (
    <GasPriceContainer>
      <Title>Current Gas Price</Title>

      {error ? (
        <ErrorMessage>
          {error}
          <RefreshButton onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Retry"}
          </RefreshButton>
        </ErrorMessage>
      ) : (
        <>
          <GasPriceValue>{isLoading ? <LoadingSpinner /> : `${gasPriceGwei} gwei`}</GasPriceValue>

          {lastUpdated ? <LastUpdated>上次更新：{lastUpdated}</LastUpdated> : null}

          <RefreshButton onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </RefreshButton>
        </>
      )}
    </GasPriceContainer>
  );
}
