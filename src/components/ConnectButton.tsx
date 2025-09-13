import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import {
  selectIsConnecting,
  selectWalletError,
  selectWalletInfo,
} from "../store/slices/walletSlice";
import { WalletType } from "../utils/web3";
import { WalletInfo } from "./WalletInfo";

const ConnectButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin: 20px;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const DisconnectButton = styled(Button)`
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  font-size: 14px;
  padding: 8px 16px;
  min-width: 120px;
`;

const WalletOptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const WalletButtonsRow = styled.div`
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
`;

const BackButton = styled.button`
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f5f5;
    color: #333;
  }
`;

const ErrorMessage = styled.div`
  color: red;
  margin-bottom: 10px;
  font-size: 14px;
`;

const WalletButton = styled(Button)`
  min-width: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const MetaMaskButton = styled(WalletButton)`
  background: linear-gradient(135deg, #f6851b 0%, #e2761b 100%);
  
  &:hover {
    background: linear-gradient(135deg, #e2761b 0%, #cd6116 100%);
  }
`;

const WalletConnectButton = styled(WalletButton)`
  background: linear-gradient(135deg, #3b99fc 0%, #1e74d8 100%);
  
  &:hover {
    background: linear-gradient(135deg, #1e74d8 0%, #1565c0 100%);
  }
`;

export default function ConnectButton() {
  const dispatch = useDispatch();

  const [showWalletOptions, setShowWalletOptions] = useState(false);

  const walletInfo = useSelector(selectWalletInfo);
  const isConnecting = useSelector(selectIsConnecting);
  const error = useSelector(selectWalletError);

  const handleConnectClick = () => {
    setShowWalletOptions(true);
  };

  const handleBackClick = () => {
    setShowWalletOptions(false);
  };

  const handleConnectMetaMask = () => {
    dispatch({ type: "wallet/connectRequest", payload: WalletType.METAMASK });
  };

  const handleConnectWalletConnect = () => {
    dispatch({ type: "wallet/connectRequest", payload: WalletType.WALLETCONNECT });
  };

  const handleDisconnect = () => {
    dispatch({ type: "wallet/disconnectRequest" });
  };

  return (
    <ConnectButtonContainer>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      {!walletInfo.isConnected ? (
        !showWalletOptions ? (
          <Button onClick={handleConnectClick}>Connect</Button>
        ) : (
          <WalletOptionsContainer>
            <BackButton onClick={handleBackClick}>← Back</BackButton>
            <WalletButtonsRow>
              <MetaMaskButton onClick={handleConnectMetaMask} disabled={isConnecting}>
                🦊 {isConnecting ? "Connecting..." : "MetaMask"}
              </MetaMaskButton>
              <WalletConnectButton onClick={handleConnectWalletConnect} disabled={isConnecting}>
                🔗 {isConnecting ? "Connecting..." : "WalletConnect"}
              </WalletConnectButton>
            </WalletButtonsRow>
          </WalletOptionsContainer>
        )
      ) : (
        <DisconnectButton onClick={handleDisconnect}>Disconnect</DisconnectButton>
      )}
    </ConnectButtonContainer>
  );
}
