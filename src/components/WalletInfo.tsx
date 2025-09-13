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
  width: 100%;
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

interface Props {
  walletInfo: WalletInfoType;
}

export function WalletInfo({ walletInfo }: Props) {
  return (
    <WalletInfoContainer>
      <InfoRow>
        <Label>Network:</Label>
        <Value>{walletInfo.chainName}</Value>
      </InfoRow>
      <InfoRow>
        <Label>Address:</Label>
        <Value>{walletInfo.address ?? "Not connected"}</Value>
      </InfoRow>
      <InfoRow>
        <Label>Balance:</Label>
        <Value>{walletInfo.balance} ETH</Value>
      </InfoRow>
    </WalletInfoContainer>
  );
}
