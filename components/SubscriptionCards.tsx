"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface SubscriptionCardProps {
  title: string;
  description: string;
  price: string;
  features: { name: string; available: boolean }[];
  popular?: boolean;
  accessCondition: string;
}

const SubscriptionCard = ({
  title,
  description,
  price,
  features,
  popular = false,
  accessCondition,
}: SubscriptionCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`relative h-full rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
        popular
          ? "border-primary/40 bg-primary/5"
          : "border-border/40 bg-card/80"
      } ${
        isHovered ? "shadow-xl shadow-primary/10 scale-[1.01]" : "shadow-lg"
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-3 py-1 rounded-full text-xs font-medium text-primary-foreground shadow-lg">
          Recommended
        </div>
      )}

      <div className="p-6">
        <h3 className={`text-2xl font-bold mb-2 ${popular ? "text-primary" : ""}`}>
          {title}
        </h3>
        <p className="text-muted-foreground text-sm mb-6">{description}</p>

        <div className="mb-6">
          <div className="text-3xl font-bold">{price}</div>
          <div className="text-muted-foreground text-sm mt-1">
            {popular ? "For premium users" : "Basic access"}
          </div>
        </div>

        <div className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <div
                className={`mt-0.5 flex-shrink-0 rounded-full p-1 ${
                  feature.available
                    ? "bg-green-500/20 text-green-500"
                    : "bg-red-500/20 text-red-500"
                }`}
              >
                {feature.available ? (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${!feature.available ? "text-muted-foreground" : ""}`}>
                {feature.name}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-auto">
          <div className="text-xs text-muted-foreground mb-3 pb-4 border-b border-border/40">
            {accessCondition}
          </div>
          <motion.button
            className={`w-full py-2.5 rounded-lg font-medium transition-all ${
              popular
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-card border border-border hover:bg-muted"
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {popular ? "Upgrade to Premium" : "Continue with Free"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export const SubscriptionCards = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4 gradient-text">Choose Your Plan</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select the plan that best suits your needs. Upgrade anytime to unlock premium features.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Free Plan */}
        <SubscriptionCard
          title="Free Plan"
          description="Perfect for beginners exploring the world of crypto"
          price="$0"
          features={[
            { name: "AI-powered wallet interactions", available: true },
            { name: "Basic token information", available: true },
            { name: "Transaction history", available: true },
            { name: "Session memory", available: false },
            { name: "Portfolio analysis", available: false },
            { name: "Deep token scanner", available: false },
            { name: "NFT analyzer", available: false },
            { name: "Telegram integration", available: false },
            { name: "Smart prompt suggestions", available: false },
          ]}
          accessCondition="Access condition: Wallet connect only"
        />

        {/* Premium Plan */}
        <SubscriptionCard
          title="Premium Plan"
          description="Advanced features for serious crypto enthusiasts"
          price="Lifetime Access"
          features={[
            { name: "AI-powered wallet interactions", available: true },
            { name: "Basic token information", available: true },
            { name: "Transaction history", available: true },
            { name: "Session memory", available: true },
            { name: "Portfolio analysis", available: true },
            { name: "Deep token scanner", available: true },
            { name: "NFT analyzer", available: true },
            { name: "Telegram integration", available: true },
            { name: "Smart prompt suggestions", available: true },
          ]}
          popular={true}
          accessCondition="Hold $50+ in $INTELIQ tokens or pay $50 one-time (lifetime)"
        />
      </div>
    </div>
  );
};
