# EWE React Web3

A modern React Web3 application that enables wallet connectivity and real-time gas price monitoring.

## Features

✅ **Wallet Connection**
- Connect button positioned at the top of the screen
- Support for MetaMask and WalletConnect
- Easy wallet selection modal

✅ **Wallet Information Display**
- Current blockchain network (Ethereum, Arbitrum, Polygon, etc.)
- Wallet address (truncated for display)
- Real-time wallet balance
- Support for all EVM-compatible wallets

✅ **Gas Price Monitoring**
- Real-time gas price display in gwei
- Auto-refresh every 5 seconds
- Last updated timestamp in Chinese format
- Only shown when wallet is connected

## Supported Networks

- Ethereum Mainnet
- Arbitrum One
- Polygon
- Optimism
- Base
- Sepolia Testnet

## Technology Stack

- **React 18** with TypeScript
- **Wagmi** - React hooks for Ethereum
- **Viem** - TypeScript interface for Ethereum
- **Web3Modal** - Wallet connection interface
- **Styled Components** - CSS-in-JS styling
- **TanStack Query** - Data fetching and caching

## Prerequisites

- Node.js 16+ 
- npm or yarn
- MetaMask browser extension or WalletConnect compatible wallet

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd ewe-react-web3
npm install --legacy-peer-deps
```

### 2. Configure WalletConnect Project ID

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Create a new project
3. Copy your Project ID
4. Update `src/config/web3Config.ts`:

```typescript
const projectId = 'YOUR_PROJECT_ID' // Replace with your actual project ID
```

### 3. Start Development Server

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── components/
│   ├── ConnectWallet/
│   │   ├── ConnectButton.tsx    # Main connect/disconnect button
│   │   ├── WalletInfo.tsx       # Wallet info display
│   │   └── index.ts
│   └── GasPrice/
│       ├── GasPriceDisplay.tsx  # Gas price monitor
│       └── index.ts
├── hooks/
│   ├── useGasPrice.ts           # Gas price fetching logic
│   └── useInterval.ts           # Interval hook utility
├── config/
│   └── web3Config.ts            # Web3Modal and Wagmi config
├── types/
│   └── wallet.ts                # TypeScript interfaces
└── App.tsx                      # Main application component
```

## Usage

1. **Connect Wallet**: Click the "Connect Wallet" button to open the wallet selection modal
2. **Choose Wallet**: Select between MetaMask or WalletConnect options
3. **View Information**: Once connected, see your network, address, and balance
4. **Monitor Gas**: Gas prices update automatically every 5 seconds
5. **Disconnect**: Click "Disconnect" to disconnect your wallet

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Requirements Fulfilled

### 1. Connect Button ✅
- Positioned at top of screen
- Supports MetaMask and WalletConnect selection
- Clean, modern UI with hover effects

### 2. Wallet Information Display ✅
- Shows current blockchain network name
- Displays truncated wallet address
- Real-time balance updates
- Supports all EVM networks

### 3. Gas Price Monitoring ✅
- Displays current gas price in gwei
- Auto-refreshes every 5 seconds
- Shows last update time in Chinese format
- Only visible when wallet is connected

## Troubleshooting

### Common Issues

1. **Wallet not connecting**: Ensure MetaMask is installed and unlocked
2. **Gas price not loading**: Check network connection and try switching networks
3. **Build errors**: Run `npm install --legacy-peer-deps` to resolve dependency conflicts

### Network Issues

If you encounter network-related errors:
1. Try switching to a different network in your wallet
2. Check if the network is supported (see supported networks above)
3. Ensure your wallet has some ETH for transaction fees

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details