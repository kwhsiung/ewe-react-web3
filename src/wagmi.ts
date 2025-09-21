import { del, get, set } from "idb-keyval";
import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { metaMask, walletConnect } from "wagmi/connectors";

// biome-ignore lint/correctness/noUnusedVariables: allowed
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const indexedDBStorage = {
  async getItem(name: string) {
    return get(name);
  },
  async setItem(name: string, value: string) {
    await set(name, value);
  },
  async removeItem(name: string) {
    await del(name);
  },
};

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    metaMask(),
    walletConnect({
      projectId: import.meta.env.VITE_WC_PROJECT_ID,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
