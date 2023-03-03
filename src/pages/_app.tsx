import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { configureChains, createClient, WagmiConfig } from 'wagmi'
import { polygon, polygonMumbai } from '@wagmi/chains'
import { EthereumClient, modalConnectors, walletConnectProvider } from '@web3modal/ethereum'
import { Web3Modal } from '@web3modal/react'
import useMount from '@/hooks/useMount'

const PROJECT_ID = '55a46104116b85c198082f61991beb2b'

const chains = [polygon, polygonMumbai]

const { provider } = configureChains(chains, [
  walletConnectProvider({ projectId: PROJECT_ID }),
])

export const wagmiClient = createClient({
  autoConnect: true,
  connectors: modalConnectors({
    projectId: PROJECT_ID,
    version: '2',
    appName: 'web3Modal',
    chains,
  }),
  provider,
})

const ethereumClient = new EthereumClient(wagmiClient, chains)

export default function App({ Component, pageProps }: AppProps) {
  const { isMounted } = useMount()

  return (
    <>
      {isMounted && (
        <WagmiConfig client={wagmiClient}>
          <Component {...pageProps} />
        </WagmiConfig>
      )}

      <Web3Modal projectId={PROJECT_ID} ethereumClient={ethereumClient} />
    </>
  )
}
