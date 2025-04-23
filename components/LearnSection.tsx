"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Educational topics for new users
const LEARN_TOPICS = [
  {
    id: "blockchain",
    title: "What is a Blockchain?",
    content: "A blockchain is a distributed digital ledger that records transactions across many computers. It's secure, transparent, and resistant to modification. In the context of cryptocurrencies like Solana, the blockchain maintains a record of all transactions and token ownership."
  },
  {
    id: "wallet",
    title: "Understanding Web3 Wallets",
    content: "A Web3 wallet is a digital tool that allows you to interact with blockchain applications. It stores your private keys, which prove your ownership of digital assets. Wallets like Phantom enable you to send, receive, and manage tokens on the Solana blockchain."
  },
  {
    id: "tokens",
    title: "Token Types Explained",
    content: "Tokens on Solana fall into several categories: native SOL (used for transaction fees and staking), SPL tokens (Solana's equivalent to Ethereum's ERC-20), and NFTs. Fungible tokens like SOL and USDC can be exchanged for equal value, while non-fungible tokens (NFTs) are unique digital assets."
  },
  {
    id: "dex",
    title: "Decentralized Exchanges",
    content: "Decentralized exchanges (DEXs) like Jupiter allow you to trade tokens without a central authority. They use liquidity pools and automated market makers to determine prices. When you swap tokens, you're trading directly with a smart contract that holds reserves of various tokens."
  },
  {
    id: "gas",
    title: "Transaction Fees on Solana",
    content: "Transaction fees (or 'gas') on Solana are paid in SOL and are necessary to process transactions on the blockchain. Fees on Solana are typically very low compared to other blockchains, usually fractions of a cent. Always keep some SOL in your wallet to cover these fees."
  }
];

export function LearnSection() {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const toggleTopic = (topicId: string) => {
    if (expandedTopic === topicId) {
      setExpandedTopic(null);
    } else {
      setExpandedTopic(topicId);
    }
  };

  return (
    <div className="w-full mt-8">
      <h2 className="text-2xl font-bold mb-4">Learn About Web3</h2>
      <div className="space-y-3">
        {LEARN_TOPICS.map((topic) => (
          <Card 
            key={topic.id}
            className="cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => toggleTopic(topic.id)}
          >
            <CardHeader className="py-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{topic.title}</CardTitle>
                <div className="text-xl">
                  {expandedTopic === topic.id ? '−' : '+'}
                </div>
              </div>
            </CardHeader>
            {expandedTopic === topic.id && (
              <CardContent>
                <p className="text-muted-foreground">{topic.content}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
