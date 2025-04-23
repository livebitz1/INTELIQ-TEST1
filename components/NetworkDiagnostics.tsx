"use client";

import { FC, useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { clusterApiUrl, Connection } from '@solana/web3.js';

const NetworkDiagnostics: FC = () => {
  const { connection } = useConnection();
  const [networkStatus, setNetworkStatus] = useState<{
    connected: boolean;
    endpoint: string;
    cluster: string;
    latency?: number;
  }>({
    connected: false,
    endpoint: '',
    cluster: 'Unknown',
  });

  useEffect(() => {
    const getNetworkInfo = async () => {
      if (!connection) return;

      try {
        // Check if we can reach the network
        const startTime = performance.now();
        await connection.getVersion();
        const endTime = performance.now();
        
        // Get endpoint info
        const endpoint = connection.rpcEndpoint;
        let cluster = 'Custom';
        
        // Determine cluster based on endpoint
        if (endpoint.includes('devnet')) cluster = 'Devnet';
        if (endpoint.includes('testnet')) cluster = 'Testnet';
        if (endpoint.includes('mainnet')) cluster = 'Mainnet';
        
        setNetworkStatus({
          connected: true,
          endpoint,
          cluster,
          latency: Math.round(endTime - startTime)
        });
      } catch (error) {
        console.error("Network connection error:", error);
        setNetworkStatus({
          connected: false,
          endpoint: connection.rpcEndpoint,
          cluster: 'Error connecting',
        });
      }
    };

    getNetworkInfo();
    const interval = setInterval(getNetworkInfo, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [connection]);

  return (
    <div className="network-diagnostics p-3 mb-4 rounded-lg bg-gray-800 text-sm">
      <div className="flex items-center gap-2">
        <div 
          className={`w-2 h-2 rounded-full ${networkStatus.connected ? 'bg-green-500' : 'bg-red-500'}`}
        />
        <span>Network: {networkStatus.cluster}</span>
      </div>
      {networkStatus.latency && (
        <div className="text-xs text-gray-400 mt-1">
          Latency: {networkStatus.latency}ms
        </div>
      )}
    </div>
  );
};

export default NetworkDiagnostics;
