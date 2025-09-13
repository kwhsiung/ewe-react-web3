import { Provider, useSelector } from "react-redux";
import styled from "styled-components";
import ConnectButton from "./components/ConnectButton";
import GasPriceDisplay from "./components/GasPriceDisplay";
import { WalletInfo } from "./components/WalletInfo";
import { store } from "./store";
import { selectWalletInfo } from "./store/wallet";

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: #333;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 1.1rem;
  margin: 0;
`;

const MainContent = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
`;

function AppContent() {
  const walletInfo = useSelector(selectWalletInfo);

  return (
    <AppContainer>
      <Header>
        <Title>EWE React Web3</Title>
        <Subtitle>Connect your wallet and monitor gas prices in real-time</Subtitle>
      </Header>

      <MainContent>
        <ConnectButton />
        {walletInfo.isConnected ? (
          <>
            <WalletInfo walletInfo={walletInfo} />
            <GasPriceDisplay />
          </>
        ) : null}
      </MainContent>
    </AppContainer>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
