"use client";

import { FC, ReactNode, useMemo, useState, useEffect } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import dynamic from "next/dynamic";
import { connectionManager } from "@/lib/connection-manager";

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

// Dynamically import WalletModalProvider with SSR disabled
const WalletModalProviderDynamic = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletModalProvider),
  { ssr: false }
);

export const Providers: FC<{ children: ReactNode }> = ({ children }) => {
  // Can be set to 'mainnet-beta', 'testnet', or 'devnet'
  const network = WalletAdapterNetwork.Devnet;
  
  // Track client-side rendering
  const [mounted, setMounted] = useState(false);

  // Set mounted after component mounts on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use endpoint from our connection manager
  const endpoint = useMemo(() => {
    return connectionManager.getConnection().rpcEndpoint;
  }, []);

  // Only include wallets that are supported
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);

  // Use a consistent key for WalletProvider to avoid re-renders
  const walletProviderKey = useMemo(() => 'wallet-provider', []);

  return (
    <ConnectionProvider 
      endpoint={endpoint} 
      config={{ 
        commitment: 'confirmed',
        wsEndpoint: undefined, // Disable WebSocket for better stability
      }}
    >
      <WalletProvider key={walletProviderKey} wallets={wallets} autoConnect={mounted}>
        <WalletModalProviderDynamic>
          {/* If we're on client, render children; otherwise render nothing until hydrated */}
          {mounted ? children : null}
        </WalletModalProviderDynamic>
      </WalletProvider>
    </ConnectionProvider>
  );
};
