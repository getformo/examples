'use client'

import { ReactNode, useEffect } from 'react'
import { useConnectWallet, useSetChain } from '@web3-onboard/react'
import { useFormo } from '@formo/analytics'

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [{ wallet, connecting }] = useConnectWallet()
  const analytics = useFormo()

  // Identify user when wallet connects (SDK will auto-track wallet events)
  useEffect(() => {
    if (wallet && !connecting) {
      analytics.identify({
        address: wallet.accounts[0].address,
        providerName: wallet.label,
      })
    }
  }, [wallet, connecting, analytics])

  // Chain changes are automatically tracked by Formo SDK

  return <>{children}</>
}

// Hook to provide Web3 Onboard functionality with analytics
export function useWeb3Analytics() {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet()
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain()
  const analytics = useFormo()

  const connectWallet = async () => {
    try {
      await connect()
    } catch (error) {
      console.error('Error connecting wallet:', error)
    }
  }

  const disconnectWallet = async () => {
    if (wallet) {
      // SDK will automatically track wallet disconnect
      await disconnect(wallet)
    }
  }

  const switchChain = async (chainId: string) => {
    try {
      await setChain({ chainId })
    } catch (error) {
      console.error('Error switching chain:', error)
    }
  }

  const signMessage = async (message: string) => {
    if (!wallet) return null

    try {
      const provider = wallet.provider
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, wallet.accounts[0].address]
      })
      
      // SDK will automatically track signature events
      return signature
    } catch (error) {
      console.error('Error signing message:', error)
      throw error
    }
  }

  const sendTransaction = async (to: string, value: string) => {
    if (!wallet) return null

    try {
      const provider = wallet.provider
      
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: wallet.accounts[0].address,
          to,
          value: value,
        }]
      })

      // SDK will automatically track transaction events
      return { hash: txHash }
    } catch (error) {
      console.error('Error sending transaction:', error)
      throw error
    }
  }

  return {
    wallet,
    connecting,
    connectedChain,
    settingChain,
    chains,
    connectWallet,
    disconnectWallet,
    switchChain,
    signMessage,
    sendTransaction,
  }
}
