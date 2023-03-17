import type { AppProps } from "next/app";
import { SnackbarProvider } from "notistack";
import { configureChains, createClient, WagmiConfig } from "wagmi";
import { polygon, polygonMumbai } from "@wagmi/chains";
import {
  EthereumClient,
  modalConnectors,
  walletConnectProvider,
} from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";

import useMount from "hooks/useMount";

import SnackBar from "components/SnackBar";

import "styles/main.scss";

const PROJECT_ID = "55a46104116b85c198082f61991beb2b";

const chains = [polygon, polygonMumbai]; // TODO: удалить polygonMumbai при релизе на продакшн

const { provider } = configureChains(chains, [
  walletConnectProvider({ projectId: PROJECT_ID }),
]);

export const wagmiClient = createClient({
  autoConnect: true,
  connectors: modalConnectors({
    projectId: PROJECT_ID,
    version: "2",
    appName: "web3Modal",
    chains,
  }),
  provider,
});

const ethereumClient = new EthereumClient(wagmiClient, chains);

declare module "notistack" {
  interface VariantOverrides {
    trace: {
      customTitle?: React.ReactNode;
      customMessage?: React.ReactNode;
      type?: "error" | "default";
    };
  }
}

export default function App({ Component, pageProps }: AppProps) {
  const { isMounted } = useMount();

  return (
    <>
      {isMounted && (
        <SnackbarProvider
          Components={{
            trace: SnackBar,
          }}
        >
          <WagmiConfig client={wagmiClient}>
            <Component {...pageProps} />
          </WagmiConfig>
        </SnackbarProvider>
      )}

      <Web3Modal projectId={PROJECT_ID} ethereumClient={ethereumClient} />
    </>
  );
}
