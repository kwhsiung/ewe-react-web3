# EWE React Web3

A modern React Web3 application that enables wallet connectivity and real-time gas price monitoring with support for MetaMask and WalletConnect.

## Features

✅ **Wallet Connection**
- Connect button positioned at the top of the screen
- Support for MetaMask and WalletConnect
- Easy wallet selection modal with modern UI
- Automatic connection restoration on page reload

✅ **Wallet Information Display**
- Current blockchain network (Ethereum, Arbitrum, Polygon, etc.)
- Wallet address (truncated for display)
- Real-time wallet balance in ETH
- Support for all EVM-compatible networks

✅ **Gas Price Monitoring**
- Real-time gas price display in gwei
- Auto-refresh every 5 seconds
- Last updated timestamp in Chinese format (zh-TW)
- Manual refresh capability
- Only shown when wallet is connected

## Supported Networks

- **Ethereum Mainnet** (Chain ID: 1)
- **Arbitrum One** (Chain ID: 42161)
- **Polygon** (Chain ID: 137)
- **Optimism** (Chain ID: 10)
- **Base** (Chain ID: 8453)
- **Sepolia Testnet** (Chain ID: 11155111)

## Technology Stack

- **React 18** with TypeScript
- **Ethers.js v5** - Ethereum library for wallet interactions
- **WalletConnect v2** - Multi-wallet connection protocol
- **Styled Components** - CSS-in-JS styling
- **Biome** - Fast linter and formatter
- **Husky** - Git hooks for code quality

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
4. Create a `.env` file in the root directory:

```bash
REACT_APP_WALLETCONNECT_PROJECT_ID=your_project_id_here
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
│   ├── ConnectButton.tsx        # Main connect/disconnect button with wallet selection
│   ├── WalletInfo.tsx           # Wallet information display component
│   └── GasPriceDisplay.tsx      # Gas price monitoring component
├── providers/
│   ├── WalletsProvider.tsx      # Main wallet context provider
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces and types
│   ├── hooks/
│   │   └── useGasPrice.ts       # Gas price fetching and monitoring logic
│   └── wallets/
│       ├── MetaMaskProvider.tsx # MetaMask-specific provider
│       └── WalletConnectProvider.tsx # WalletConnect-specific provider
├── utils/
│   └── hooks.ts                 # Utility hooks (debounced callbacks)
└── App.tsx                      # Main application component
```

## Usage

1. **Connect Wallet**: Click the "Connect" button to open the wallet selection modal
2. **Choose Wallet**: Select between MetaMask (🦊) or WalletConnect (🔗) options
3. **View Information**: Once connected, see your network, address, and balance
4. **Monitor Gas**: Gas prices update automatically every 5 seconds with manual refresh option
5. **Disconnect**: Click "Disconnect" to disconnect your wallet

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run format` - Format code with Biome
- `npm run format:check` - Check code formatting
- `npm run lint` - Lint code with Biome
- `npm run lint:fix` - Fix linting issues
- `npm run check` - Run all checks (format + lint)
- `npm run check:fix` - Fix all issues

## Architecture

### Provider Pattern
The application uses a sophisticated provider pattern with specialized providers for each wallet type:

- **WalletsProvider**: Main context that orchestrates all wallet providers
- **MetaMaskProvider**: Handles MetaMask-specific functionality
- **WalletConnectProvider**: Handles WalletConnect-specific functionality

### State Management
- React Context API for global wallet state
- Specialized hooks for gas price monitoring
- Automatic connection restoration
- Real-time event handling for account/chain changes

### Error Handling
- Comprehensive error handling for connection failures
- User-friendly error messages
- Automatic cleanup on disconnection
- Session validation for WalletConnect

## Requirements Fulfilled

### 1. Connect Button ✅
- Positioned at top of screen with modern gradient styling
- Supports MetaMask and WalletConnect selection
- Clean, modern UI with hover effects and animations
- Loading states and error handling

### 2. Wallet Information Display ✅
- Shows current blockchain network name
- Displays truncated wallet address
- Real-time balance updates in ETH
- Supports all EVM networks with proper chain name mapping

### 3. Gas Price Monitoring ✅
- Displays current gas price in gwei with 2 decimal precision
- Auto-refreshes every 5 seconds
- Shows last update time in Chinese format (zh-TW)
- Manual refresh button with loading states
- Only visible when wallet is connected
- Error handling with retry functionality

## Troubleshooting

### Common Issues

1. **Wallet not connecting**: 
   - Ensure MetaMask is installed and unlocked
   - Check if WalletConnect Project ID is properly configured
   - Try refreshing the page

2. **Gas price not loading**: 
   - Check network connection
   - Try switching networks in your wallet
   - Use the manual refresh button

3. **Build errors**: 
   - Run `npm install --legacy-peer-deps` to resolve dependency conflicts
   - Ensure Node.js version is 16 or higher

4. **WalletConnect issues**:
   - Verify your Project ID is correct
   - Clear browser storage if experiencing persistent issues
   - Check WalletConnect Cloud dashboard for project status

### Network Issues

If you encounter network-related errors:
1. Try switching to a different network in your wallet
2. Check if the network is supported (see supported networks above)
3. Ensure your wallet has some ETH for transaction fees
4. Verify the network is properly configured in your wallet

## Development

### Code Quality
- **Biome** for fast linting and formatting
- **Husky** pre-commit hooks for code quality
- **TypeScript** for type safety
- **Styled Components** for component styling

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run check:fix` to ensure code quality
5. Test thoroughly
6. Submit a pull request

## Demo

![](./assets/Kapture%202025-09-21%20at%2021.19.48.gif)

## Known issues

### Runtime error: `No matching key. session topic doesn't exist`

![](./assets/Kapture%202025-09-21%20at%2021.15.55.gif)

### Connection rejected was unhandled

![](./assets/Kapture%202025-09-21%20at%2021.24.02.gif)

### `Error getting MetaMask wallet info: Error: unknown account #0 (operation="getAddress", code=UNSUPPORTED_OPERATION, version=providers/5.8.0)`

![](./assets/Screenshot%202025-09-21%20at%209.11.36 PM.png)


