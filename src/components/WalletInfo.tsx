import React from "react";
import styled from "styled-components";
import type { WalletInfo as WalletInfoType } from "../utils/web3";

const WalletInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e1e5e9;
  min-width: 300px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 14px;
`;

const Label = styled.span`
  font-weight: 600;
  color: #666;
`;

const Value = styled.span`
  color: #333;
  font-family: 'Courier New', monospace;
`;

const Address = styled(Value)`
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

interface Props {
  walletInfo: WalletInfoType;
}

export function WalletInfo({ walletInfo }: Props) {
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (balance: string) => {
    return parseFloat(balance).toFixed(4);
  };

  return (
    <WalletInfoContainer>
      <InfoRow>
        <Label>Network:</Label>
        <Value>{walletInfo.chainName}</Value>
      </InfoRow>
      <InfoRow>
        <Label>Address:</Label>
        <Address title={walletInfo.address}>
          {walletInfo.address ? formatAddress(walletInfo.address) : "Not connected"}
        </Address>
      </InfoRow>
      <InfoRow>
        <Label>Balance:</Label>
        <Value>{formatBalance(walletInfo.balance)} ETH</Value>
      </InfoRow>
    </WalletInfoContainer>
  );
}
