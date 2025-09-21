import { useState, useEffect } from 'react'
import { formatEther } from 'viem'
import { 
  useAccount, 
  useConnect, 
  useDisconnect, 
  useBalance,
  useEstimateFeesPerGas
} from 'wagmi'

function App() {
  const [showWalletOptions, setShowWalletOptions] = useState(false)
  const [lastGasUpdate, setLastGasUpdate] = useState<Date | null>(null)
  
  const account = useAccount()
  const { connectors, connect, status, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({ address: account.address })
  const { data: feeData, refetch: refetchFeeData } = useEstimateFeesPerGas()

  // Update last gas update time when fee data changes
  useEffect(() => {
    if (feeData) {
      setLastGasUpdate(new Date())
    }
  }, [feeData])

  // Set up polling for gas price every 5 seconds when connected
  useEffect(() => {
    if (account.status === 'connected') {
      const interval = setInterval(() => {
        refetchFeeData()
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [account.status, refetchFeeData])


  const formatGasPrice = (feeData: any) => {
    if (!feeData) return 'N/A'
    
    // For EIP-1559, use maxFeePerGas, for legacy use gasPrice
    const gasPrice = feeData.gasPrice || feeData.maxFeePerGas
    if (!gasPrice) return 'N/A'
    
    // Convert from wei to gwei (divide by 10^9)
    const gwei = Number(gasPrice) / 1e9
    return `${gwei.toFixed(2)} gwei`
  }

  const formatLastUpdate = (date: Date) => {
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Web3 Wallet App</h1>
      
      {account.status === 'connected' ? (
        <div>
          <h2>Wallet Connected</h2>
          <div style={{ marginBottom: '20px' }}>
            <p><strong>Chain ID:</strong> {account.chainId}</p>
            <p><strong>Account Address:</strong> {account.address}</p>
            <p><strong>Balance:</strong> {balance ? `${formatEther(balance.value)} ${balance.symbol}` : 'Loading...'}</p>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <p><strong>Gas Price:</strong> {formatGasPrice(feeData)}</p>
            {lastGasUpdate && (
              <p style={{ fontSize: '14px', color: '#666' }}>
                上次更新: {formatLastUpdate(lastGasUpdate)}
              </p>
            )}
          </div>
          
          <button 
            type="button" 
            onClick={() => disconnect()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div>
          {!showWalletOptions ? (
            <div>
              <button 
                type="button" 
                onClick={() => setShowWalletOptions(true)}
                style={{
                  padding: '15px 30px',
                  fontSize: '16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Connect
              </button>
            </div>
          ) : (
            <div>
              <h2>Choose Wallet</h2>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    type="button"
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {connector.name}
                  </button>
                ))}
              </div>
              <button 
                type="button" 
                onClick={() => setShowWalletOptions(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
            </div>
          )}
          
          {status && (
            <div style={{ marginTop: '10px', color: '#007bff' }}>
              {status}
            </div>
          )}
          
          {error && (
            <div style={{ marginTop: '10px', color: '#dc3545' }}>
              Error: {error.message}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
