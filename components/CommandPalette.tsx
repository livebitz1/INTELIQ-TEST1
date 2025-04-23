"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, InfoIcon, Lightbulb, Sparkles, Zap, 
  Rocket, Gift, X, ChevronRight, Heart, Award, 
  TrendingUp, BarChart, ShieldCheck, Users, History
} from "lucide-react";

interface HelpItem {
  id: string;
  name: string;
  description: string;
  content: string;
  icon: React.ReactNode;
  action?: () => void;
  highlight?: boolean;
}

interface HelpCategory {
  name: string;
  icon: React.ReactNode;
  description: string;
  items: HelpItem[];
}

interface AIHelperProps {
  open: boolean;
  onClose: () => void;
  insertCommand: (command: string) => void;
  commandCategories: {
    name: string;
    icon: React.ReactNode;
    commands: {
      id: string;
      name: string;
      description: string;
      icon: React.ReactNode;
      action: () => void;
    }[];
  }[];
}

export function CommandPalette({ 
  open, 
  onClose,
  insertCommand,
  commandCategories 
}: AIHelperProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [activeView, setActiveView] = useState<"main" | "details">("main");
  const [selectedItem, setSelectedItem] = useState<HelpItem | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [recentTopics, setRecentTopics] = useState<string[]>(
    typeof window !== 'undefined' ? 
      JSON.parse(localStorage.getItem('recentHelperTopics') || '[]') : []
  );

  // Define help categories and items
  const helpCategories: HelpCategory[] = [
    {
      name: "What We Offer",
      icon: <Gift className="w-5 h-5" />,
      description: "Discover AI Wallet's unique features",
      items: [
        {
          id: "ai-assistant",
          name: "AI-Powered Assistant",
          description: "Natural language interface for all your crypto needs",
          icon: <Sparkles className="w-4 h-4" />,
          content: "The AI Wallet features a state-of-the-art assistant that understands natural language. Simply type what you want to do with your crypto, and our AI will handle the rest. No more navigating complex DeFi interfaces!",
        },
        {
          id: "non-custodial",
          name: "Full Non-Custodial Security",
          description: "Your keys always remain in your control",
          icon: <ShieldCheck className="w-4 h-4" />,
          content: "We never have access to your private keys. AI Wallet is completely non-custodial, meaning you maintain 100% control over your funds while getting the benefits of an intelligent assistant.",
        },
        {
          id: "multi-chain",
          name: "Multi-Chain Support",
          description: "Seamlessly operate across different blockchains",
          icon: <TrendingUp className="w-4 h-4" />,
          content: "AI Wallet supports multiple blockchains including Solana, Ethereum, and more. Manage all your assets across different chains from a single interface with simple natural language commands.",
          highlight: true,
        }
      ]
    },
    {
      name: "User Benefits",
      icon: <Heart className="w-5 h-5" />,
      description: "How AI Wallet makes crypto easier",
      items: [
        {
          id: "simplicity",
          name: "Simplicity First",
          description: "Use crypto without the technical complexity",
          icon: <Zap className="w-4 h-4" />,
          content: "AI Wallet eliminates the steep learning curve of cryptocurrency. No need to understand complex terms or navigate confusing interfaces. Just tell the AI what you want to do, and it handles the technical details.",
        },
        {
          id: "market-insights",
          name: "Real-time Market Insights",
          description: "Make informed decisions with AI-powered analysis",
          icon: <BarChart className="w-4 h-4" />,
          content: "Get personalized market analysis and insights based on your portfolio. Our AI assistant can track trends, explain market movements, and help you understand the factors affecting your investments.",
        },
        {
          id: "portfolio-management",
          name: "Smart Portfolio Management",
          description: "Optimize your holdings with AI recommendations",
          icon: <Award className="w-4 h-4" />,
          content: "The AI can analyze your portfolio, suggest diversification strategies, and help you optimize for your financial goals. It's like having a crypto financial advisor available 24/7.",
          highlight: true,
        }
      ]
    },
    {
      name: "Future Roadmap",
      icon: <Rocket className="w-5 h-5" />,
      description: "What's coming next for AI Wallet",
      items: [
        {
          id: "defi-integration",
          name: "Advanced DeFi Integration",
          description: "Upcoming yield farming and liquidity pooling features",
          icon: <TrendingUp className="w-4 h-4" />,
          content: "We're working on deeper DeFi integrations that will allow you to participate in yield farming, liquidity pools, and other DeFi opportunities using simple language commands. Let the AI find the best yields for your assets.",
          highlight: true,
        },
        {
          id: "smart-automation",
          name: "Smart Transaction Automation",
          description: "Set up conditional transactions and recurring transfers",
          icon: <Zap className="w-4 h-4" />,
          content: "Soon you'll be able to create automated transactions based on market conditions or schedules. For example, 'Buy $50 of SOL every week' or 'Sell if ETH drops below $1,500'.",
        },
        {
          id: "cross-chain",
          name: "Cross-Chain Bridging",
          description: "Seamlessly move assets between blockchains",
          icon: <Sparkles className="w-4 h-4" />,
          content: "Our upcoming cross-chain feature will allow you to bridge assets between different blockchains with a simple command. No more dealing with complex bridge protocols or worrying about compatibility.",
        }
      ]
    },
    {
      name: "Community",
      icon: <Users className="w-5 h-5" />,
      description: "Join the AI Wallet ecosystem",
      items: [
        {
          id: "governance",
          name: "Community Governance",
          description: "Have your say in the future of AI Wallet",
          icon: <Users className="w-4 h-4" />,
          content: "We're planning to implement a governance system where users can vote on new features, integrations, and the overall direction of AI Wallet. Your voice matters in shaping the future of crypto accessibility.",
        },
        {
          id: "rewards",
          name: "Community Rewards Program",
          description: "Earn benefits for your participation",
          icon: <Gift className="w-4 h-4" />,
          content: "Active community members will soon be able to earn rewards through our upcoming community program. Contribute ideas, help other users, or participate in testing to earn exclusive benefits.",
          highlight: true,
        }
      ]
    },
    {
      name: "Transaction History",
      icon: <History className="w-5 h-5" />,
      description: "View your transaction history",
      items: [
        {
          id: "today-transactions",
          name: "Today's transactions", 
          description: "View transactions from today",
          icon: <History className="w-4 h-4" />,
          content: "View all transactions that occurred today including swaps, transfers and other activities.",
          action: () => {
            handleInsertCommand("Show me my transactions today");
            onClose();
          }
        },
        {
          id: "yesterday-transactions",
          name: "Yesterday's transactions", 
          description: "View transactions from yesterday",
          icon: <History className="w-4 h-4" />,
          content: "View all transactions that occurred yesterday including swaps, transfers and other activities.",
          action: () => {
            handleInsertCommand("Show me my transactions yesterday");
            onClose();
          }
        },
        {
          id: "week-transactions",
          name: "This week's transactions", 
          description: "View transactions from this week",
          icon: <History className="w-4 h-4" />,
          content: "View all transactions that occurred during the current week.",
          action: () => {
            handleInsertCommand("Show me my transactions this week");
            onClose();
          }
        },
        {
          id: "month-transactions",
          name: "This month's transactions", 
          description: "View transactions from this month",
          icon: <History className="w-4 h-4" />,
          content: "View all transactions that occurred during the current month.",
          action: () => {
            handleInsertCommand("Show me my transactions this month");
            onClose();
          }
        }
      ]
    }
  ];

  // Focus input on open
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  // Save recent topics to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && recentTopics.length > 0) {
      localStorage.setItem('recentHelperTopics', JSON.stringify(recentTopics));
    }
  }, [recentTopics]);

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSelectedItemIndex(0);
      setActiveView("main");
      setSelectedItem(null);
    }
  }, [open]);

  // Get all help items
  const getAllItems = () => {
    let allItems: HelpItem[] = [];
    helpCategories.forEach(category => {
      allItems = [...allItems, ...category.items];
    });
    return allItems;
  };

  // Filter items based on search query
  const getFilteredItems = () => {
    if (!searchQuery) return getAllItems();
    
    const query = searchQuery.toLowerCase();
    return getAllItems().filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.description.toLowerCase().includes(query) || 
      item.content.toLowerCase().includes(query)
    );
  };

  // Handle item selection
  const showItemDetails = (item: HelpItem) => {
    setRecentTopics(prev => {
      const filtered = prev.filter(id => id !== item.id);
      return [item.id, ...filtered].slice(0, 5);
    });
    
    setSelectedItem(item);
    setActiveView("details");
    
    if (item.action) item.action();
  };

  // Handle inserting command from an item
  const handleInsertCommand = (command: string) => {
    insertCommand(command);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div 
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-[15%] left-1/2 w-full max-w-2xl -translate-x-1/2 z-50"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border p-4 bg-gradient-to-r from-primary/5 to-background">
                <div className="flex items-center">
                  {activeView === "details" ? (
                    <button 
                      onClick={() => setActiveView("main")}
                      className="mr-3 p-1.5 rounded-md hover:bg-background/80 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                  ) : (
                    <InfoIcon className="w-5 h-5 text-primary mr-3" />
                  )}
                  
                  <h3 className="text-lg font-medium">
                    {activeView === "details" && selectedItem 
                      ? selectedItem.name
                      : "AI Wallet Helper"
                    }
                  </h3>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md hover:bg-background/80 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {activeView === "main" ? (
                <>
                  {/* Search bar */}
                  <div className="p-4 border-b border-border/50">
                    <div className="relative">
                      <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search for features, benefits, and roadmap items..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border border-border/80 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setSelectedItemIndex(0);
                        }}
                      />
                    </div>
                  </div>

                  {/* Main content */}
                  <div className="max-h-[60vh] overflow-y-auto">
                    {searchQuery ? (
                      // Search results
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Search Results</h3>
                        <div className="space-y-2">
                          {getFilteredItems().length > 0 ? (
                            getFilteredItems().map((item, index) => (
                              <div
                                key={item.id}
                                className={`p-3 rounded-lg border ${
                                  item.highlight 
                                    ? 'border-primary/30 bg-primary/5' 
                                    : 'border-border/50 hover:border-border'
                                } cursor-pointer transition-colors`}
                                onClick={() => showItemDetails(item)}
                              >
                                <div className="flex items-start">
                                  <div className={`p-2 rounded-md ${item.highlight ? 'bg-primary/10' : 'bg-muted'} mr-3`}>
                                    {item.icon}
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{item.name}</h4>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                                <Search className="w-6 h-6 text-muted-foreground" />
                              </div>
                              <h3 className="font-medium mb-1">No results found</h3>
                              <p className="text-sm text-muted-foreground">
                                Try searching with different keywords or browse the categories below
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Category view
                      <div className="p-4">
                        {helpCategories.map((category, index) => (
                          <div key={category.name} className="mb-8 last:mb-0">
                            <div className="flex items-center mb-3">
                              <div className="p-1.5 rounded-md bg-muted mr-2">
                                {category.icon}
                              </div>
                              <h3 className="font-medium text-base">{category.name}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 pl-9">
                              {category.description}
                            </p>
                            <div className="space-y-2 pl-9">
                              {category.items.map((item) => (
                                <div
                                  key={item.id}
                                  className={`p-3 rounded-lg border ${
                                    item.highlight 
                                      ? 'border-primary/30 bg-primary/5' 
                                      : 'border-border/50 hover:border-border'
                                  } cursor-pointer transition-colors`}
                                  onClick={() => showItemDetails(item)}
                                >
                                  <div className="flex items-center">
                                    <div className={`p-1.5 rounded-md ${item.highlight ? 'bg-primary/10' : 'bg-muted'} mr-3`}>
                                      {item.icon}
                                    </div>
                                    <div>
                                      <h4 className="font-medium">{item.name}</h4>
                                      <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                    {item.highlight && (
                                      <span className="ml-auto px-2 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary">
                                        Featured
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // Item detail view
                selectedItem && (
                  <div className="max-h-[70vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className={`p-3 rounded-lg ${selectedItem.highlight ? 'bg-primary/10' : 'bg-muted'} mr-3`}>
                          {selectedItem.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">{selectedItem.name}</h3>
                          <p className="text-muted-foreground">{selectedItem.description}</p>
                        </div>
                      </div>
                      
                      <div className="prose prose-sm dark:prose-invert max-w-none mt-6">
                        <p className="text-base leading-relaxed">{selectedItem.content}</p>
                        
                        {selectedItem.id === "ai-assistant" && (
                          <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
                            <h4 className="font-medium mb-2 flex items-center">
                              <Lightbulb className="w-4 h-4 mr-2 text-primary" />
                              Try these commands with the AI assistant:
                            </h4>
                            <div className="space-y-2 mt-3">
                              {[
                                "What's my wallet balance?",
                                "Send 0.1 SOL to [address]",
                                "Swap 10 USDC to SOL",
                                "Show me the latest market trends"
                              ].map((cmd, i) => (
                                <button
                                  key={i}
                                  className="w-full text-left p-2 rounded-md hover:bg-primary/5 text-sm flex justify-between items-center group border border-transparent hover:border-primary/20"
                                  onClick={() => handleInsertCommand(cmd)}
                                >
                                  <span>{cmd}</span>
                                  <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    Try this →
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* Footer */}
              <div className="border-t border-border p-3 bg-muted/30 flex items-center justify-between text-xs">
                <div className="text-muted-foreground">
                  Press <span className="font-medium text-foreground">?</span> anytime to open this helper
                </div>
                <div>
                  <span className="text-primary">AI Wallet</span> - Making crypto intuitive
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
