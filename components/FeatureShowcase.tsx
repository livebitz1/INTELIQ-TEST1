"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

export const FeatureShowcase = forwardRef<HTMLElement>((props, ref) => {
  const features = [
    {
      title: "Natural Language Swaps",
      description: "Simply tell the AI what tokens you want to swap. No more complex interfaces.",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M17 7L7 17M17 7V17M17 7H7M7 17V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: "Intelligent Portfolio Insights",
      description: "Ask about your holdings, balances, and transaction history in plain English.",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M16 8V16M12 10V16M8 12V16M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: "Crypto Education",
      description: "Learn about any token, protocol, or crypto concept by simply asking.",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: "Market Analysis",
      description: "Get real-time information on token prices, trends, and market movements.",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M7 12L10 9M10 9L13 12M10 9V17M21 16V8C21 6.89543 20.1046 6 19 6H10M3 8V16C3 17.1046 3.89543 18 5 18H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
  ];

  return (
    <section ref={ref} className="py-16 overflow-hidden">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4 gradient-text">Powerful AI Features</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experience the power of artificial intelligence combined with Web3 functionality
        </p>
      </div>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        {features.map((feature, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className="feature-card border border-border/40 bg-card rounded-xl p-6 shadow-md hover:shadow-lg transition-all hover:border-primary/20 relative overflow-hidden"
          >
            {/* Background gradient effect */}
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
            
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 relative z-10">
              {feature.icon}
            </div>
            
            <h3 className="text-xl font-medium mb-2 relative z-10">{feature.title}</h3>
            <p className="text-muted-foreground relative z-10">{feature.description}</p>
            
            {/* Interactive hover effect */}
            <div className="feature-hover-effect"></div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
});

FeatureShowcase.displayName = "FeatureShowcase";
