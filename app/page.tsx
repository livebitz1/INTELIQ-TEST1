"use client";

import { useState, useEffect, useRef } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { TransactionHistory } from "@/components/TransactionHistory";
import { WalletButton } from "@/components/WalletButton";
import { TokenDisplay } from "@/components/TokenDisplay";
import { MarketTrends } from "@/components/MarketTrends";
import { HeroSection } from "@/components/HeroSection";
import { FeatureShowcase } from "@/components/FeatureShowcase";
import { SubscriptionCards } from "@/components/SubscriptionCards";
import { SplashScreen } from "@/components/SplashScreen";
import { QuickCommandBar } from "@/components/QuickCommandBar";
import { CommandPalette } from "@/components/CommandPalette";
import ContactFormPopup  from "@/components/ContactFormPopup";
import { WaitlistFormPopup } from "@/components/WaitlistFormPopup"; // Import the new component
import { CodeModal } from "@/components/CodeModal";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletStore } from "@/lib/wallet-store";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Command, ArrowRight, Zap, Send, Wallet, ArrowLeftRight,
  Repeat, History, HelpCircle, DollarSign, Settings, BarChart2,
  PieChart, Loader, Info, AlertCircle, X, ChevronRight, Mail,
  Copy, Check, FileText, Map, RefreshCw, Twitter, Sparkles // Add Sparkles icon
} from "lucide-react";

export default function Home() {
  const { publicKey, connected } = useWallet();
  const { walletData } = useWalletStore();
  const [scrolled, setScrolled] = useState(false);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [commandHover, setCommandHover] = useState(false);
  const pathname = usePathname();
  
  // States for splash screen
  const [showSplash, setShowSplash] = useState(true);

  // Enhanced Command Palette states
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const [recentCommands, setRecentCommands] = useState<string[]>(
    typeof window !== 'undefined' ? 
      JSON.parse(localStorage.getItem('recentCommands') || '[]') : []
  );

  // Add state to control robot visibility
  const [showRobot, setShowRobot] = useState(true);

  // Add state for waitlist form
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);

  // Command categories and commands
  const commandCategories = [
    {
      name: "Wallet Operations",
      icon: <Wallet className="w-5 h-5" />,
      commands: [
        { 
          id: "check-balance", 
          name: "Check balance", 
          description: "View your current token holdings", 
          icon: <DollarSign className="w-4 h-4" />,
          action: () => {
            insertCommand("What's my balance?");
            closeCommandPalette();
          }
        },
        { 
          id: "send-sol", 
          name: "Send SOL", 
          description: "Transfer SOL to another wallet", 
          icon: <Send className="w-4 h-4" />,
          action: () => {
            insertCommand("Send 0.1 SOL to ");
            closeCommandPalette();
          }
        },
        { 
          id: "swap-tokens", 
          name: "Swap tokens", 
          description: "Convert between different tokens", 
          icon: <ArrowLeftRight className="w-4 h-4" />,
          action: () => {
            insertCommand("Swap 0.5 SOL to USDC");
            closeCommandPalette();
          }
        },
      ]
    },
    {
      name: "Market Info",
      icon: <BarChart2 className="w-5 h-5" />,
      commands: [
        { 
          id: "token-price", 
          name: "Check token price", 
          description: "Get current price of any token", 
          icon: <BarChart2 className="w-4 h-4" />,
          action: () => {
            insertCommand("What's the price of ");
            closeCommandPalette();
          }
        },
        { 
          id: "market-trends", 
          name: "Market trends", 
          description: "Get overall crypto market analysis", 
          icon: <PieChart className="w-4 h-4" />,
          action: () => {
            insertCommand("Show me market trends");
            closeCommandPalette();
          }
        },
        { 
          id: "token-info", 
          name: "Token information", 
          description: "Get detailed info about a specific token", 
          icon: <Info className="w-4 h-4" />,
          action: () => {
            insertCommand("Tell me about ");
            closeCommandPalette();
          }
        },
      ]
    },
    {
      name: "History & Analytics",
      icon: <History className="w-5 h-5" />,
      commands: [
        { 
          id: "transaction-history", 
          name: "Transaction history", 
          description: "View your recent transactions", 
          icon: <History className="w-4 h-4" />,
          action: () => {
            insertCommand("Show my transaction history");
            closeCommandPalette();
          }
        },
        { 
          id: "portfolio-performance", 
          name: "Portfolio performance", 
          description: "Analyze your portfolio growth", 
          icon: <BarChart2 className="w-4 h-4" />,
          action: () => {
            insertCommand("How is my portfolio performing?");
            closeCommandPalette();
          }
        },
      ]
    },
    {
      name: "Help & Settings",
      icon: <HelpCircle className="w-5 h-5" />,
      commands: [
        { 
          id: "help", 
          name: "Get help", 
          description: "Learn how to use the AI assistant", 
          icon: <HelpCircle className="w-4 h-4" />,
          action: () => {
            insertCommand("How do I use this wallet?");
            closeCommandPalette();
          }
        },
        { 
          id: "settings", 
          name: "Settings", 
          description: "Configure wallet preferences", 
          icon: <Settings className="w-4 h-4" />,
          action: () => {
            closeCommandPalette();
          }
        },
        { 
          id: "security-tips", 
          name: "Security tips", 
          description: "Best practices for wallet security", 
          icon: <AlertCircle className="w-4 h-4" />,
          action: () => {
            insertCommand("Give me security tips for crypto wallets");
            closeCommandPalette();
          }
        },
      ]
    }
  ];

  // Keyboard shortcuts for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }

      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }

      if (commandPaletteOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedCommandIndex(prev => 
            Math.min(prev + 1, getFilteredCommands().length - 1)
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedCommandIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && selectedCommandIndex >= 0) {
          e.preventDefault();
          const commands = getFilteredCommands();
          if (commands[selectedCommandIndex]) {
            executeCommand(commands[selectedCommandIndex]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, selectedCommandIndex, commandSearch]);

  useEffect(() => {
    if (commandPaletteOpen && commandInputRef.current) {
      commandInputRef.current.focus();
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined' && recentCommands.length > 0) {
      localStorage.setItem('recentCommands', JSON.stringify(recentCommands));
    }
  }, [recentCommands]);

  const getAllCommands = () => {
    let allCommands: any[] = [];
    commandCategories.forEach(category => {
      allCommands = [...allCommands, ...category.commands];
    });
    return allCommands;
  };

  const getFilteredCommands = () => {
    if (!commandSearch) return getAllCommands();
    
    return getAllCommands().filter(command => 
      command.name.toLowerCase().includes(commandSearch.toLowerCase()) ||
      command.description.toLowerCase().includes(commandSearch.toLowerCase())
    );
  };

  const insertCommand = (command: string) => {
    const chatInput = document.querySelector('textarea[placeholder*="Ask"]') as HTMLTextAreaElement;
    if (chatInput) {
      chatInput.value = command;
      chatInput.focus();
      
      const event = new Event('input', { bubbles: true });
      chatInput.dispatchEvent(event);
    }
  };

  const executeCommand = (command: any) => {
    setRecentCommands(prev => {
      const filtered = prev.filter(item => item !== command.id);
      return [command.id, ...filtered].slice(0, 5);
    });
    
    if (command.action) command.action();
  };

  const closeCommandPalette = () => {
    setCommandPaletteOpen(false);
    setCommandSearch('');
    setSelectedCommandIndex(0);
  };

  useEffect(() => {
    if (!commandPaletteOpen) {
      setCommandSearch('');
      setSelectedCommandIndex(0);
    }
  }, [commandPaletteOpen]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      sectionRefs.current.forEach((ref) => {
        if (!ref) return;

        const rect = ref.getBoundingClientRect();
        const isInView = rect.top <= window.innerHeight * 0.75;

        if (isInView) {
          ref.classList.add("animate-appear");
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [showContactForm, setShowContactForm] = useState(false);
  const contactButtonRef = useRef<HTMLDivElement>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90">
      
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5"></div>

        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-accent/10 blur-3xl animate-float-delay"></div>

        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <header
        className={`sticky top-0 z-50 w-full border-b backdrop-blur-md transition-all duration-300 ${
          scrolled ? "border-border/60 bg-background/70" : "border-transparent bg-transparent"
        }`}
      >
        <div className="container flex items-center justify-between h-16 px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-2"
          >
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 bg-primary/30 rounded-full animate-pulse"></div>
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Image 
                    src="/logo.webp" 
                    alt="INTELIQ Logo" 
                    width={32} 
                    height={32} 
                    className="rounded-full object-cover z-10"
                  />
                </motion.div>
              </div>
              <h1 className="text-xl font-bold tracking-tight">
                <span className="text-primary">INTEL</span>IQ
              </h1>
            </Link>
          </motion.div>

          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden md:flex items-center space-x-1 mx-4"
          >
            <NavLink href="/" active={pathname === "/"}>
              Home
            </NavLink>
            <NavLink href="/roadmap" active={pathname === "/roadmap"}>
              <div className="flex items-center">
                <Map className="mr-1.5 w-4 h-4" />
                <span>Roadmap</span>
              </div>
            </NavLink>
            <NavLink href="/past-updates" active={pathname === "/past-updates"}>
              <div className="flex items-center">
                <RefreshCw className="mr-1.5 w-4 h-4" />
                <span>Updates</span>
              </div>
            </NavLink>
            <NavLink href="/twitter-feed" active={pathname === "/twitter-feed"}>
              <div className="flex items-center">
                <Twitter className="mr-1.5 w-4 h-4" />
                <span>Twitter</span>
              </div>
            </NavLink>
            
            {/* Add Waitlist NavLink */}
            <div className="relative">
              <div onClick={() => setShowWaitlistForm(true)}>
                <NavLink href="#" active={false}>
                  <div className="flex items-center">
                    <Sparkles className="mr-1.5 w-4 h-4" />
                    <span>Waitlist</span>
                  </div>
                </NavLink>
              </div>
              
              {/* Waitlist form popup */}
              <AnimatePresence>
                {showWaitlistForm && (
                  <WaitlistFormPopup onClose={() => setShowWaitlistForm(false)} />
                )}
              </AnimatePresence>
            </div>
            
            {/* Get Code NavLink */}
            <div className="relative">
              <div onClick={() => setShowCodeModal(true)}>
                <NavLink href="#" active={false}>
                  <div className="flex items-center">
                    <FileText className="mr-1.5 w-4 h-4" />
                    <span>CA</span>
                  </div>
                </NavLink>
              </div>
            </div>
            
            {/* Contact form popup */}
            <div className="relative" ref={contactButtonRef}>
            
              
              <AnimatePresence>
                {showContactForm && (
                  <ContactFormPopup 
                    isOpen={showContactForm} 
                    onClose={() => setShowContactForm(false)} 
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.nav>

          <div className="md:hidden flex items-center">
            <Link
              href="/roadmap"
              className="mr-4 px-3 py-1 text-sm rounded-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Roadmap
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center"
          >
            <WalletButton />
          </motion.div>
        </div>
      </header>

      <main className="container px-4 py-6 mx-auto max-w-7xl">
        <HeroSection
          ref={(el: HTMLDivElement | null) => {
            if (el) sectionRefs.current[0] = el;
          }}
          walletConnected={connected}
        />

        <div className="my-12 grid grid-cols-12 gap-4 min-h-[600px]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-full"
            ref={(el: HTMLDivElement | null) => {
              if (el) sectionRefs.current[1] = el;
            }}
          >
            {connected && publicKey ? (
              <div className="h-1/3 mb-4">
                <TokenDisplay />
              </div>
            ) : (
              <div className="h-1/3 mb-4 rounded-xl border border-border/40 bg-card p-4 text-center shadow-lg transition-all hover:shadow-xl hover:border-primary/20 flex flex-col items-center justify-center backdrop-blur-sm">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping-slow"></div>
                  <div className="absolute inset-3 bg-primary/40 rounded-full animate-ping-slow animation-delay-300"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-primary"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3 7L12 13L21 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="text-lg font-bold mb-2">Connect Wallet</h2>
                <p className="text-sm text-muted-foreground mb-4">Connect to see your tokens</p>
                <WalletButton />
              </div>
            )}

            <div className="h-2/3">
              <MarketTrends />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="col-span-12 lg:col-span-6 flex flex-col h-full"
            ref={(el: HTMLDivElement | null) => {
              if (el) sectionRefs.current[2] = el;
            }}
          >
            <div className="chat-interface h-full">
              <ChatInterface />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="col-span-12 lg:col-span-3 h-full"
            ref={(el: HTMLDivElement | null) => {
              if (el) sectionRefs.current[3] = el;
            }}
          >
            {connected && publicKey ? (
              <TransactionHistory />
            ) : (
              <div className="rounded-xl border border-border/40 bg-card p-4 text-center shadow-lg transition-all hover:shadow-xl hover:border-primary/20 h-full flex flex-col items-center justify-center backdrop-blur-sm">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping-slow"></div>
                  <div className="absolute inset-3 bg-accent/40 rounded-full animate-ping-slow animation-delay-300"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-accent"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M12 7V12L15 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="text-lg font-bold mb-2">Transaction History</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect to view your activity
                </p>
                <WalletButton />
              </div>
            )}
          </motion.div>
        </div>

        <QuickCommandBar />

        <FeatureShowcase ref={(el: HTMLDivElement | null) => {
          if (el) sectionRefs.current[4] = el;
        }} />

        <section
          className="py-12 my-12 border-t border-b border-border/30"
          ref={(el: HTMLDivElement | null) => {
            if (el) sectionRefs.current[5] = el;
          }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 gradient-text">
              Security You Can Trust
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Your security is our priority. Our AI assistant handles your
              instructions while keeping your keys safely in your wallet.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Non-Custodial",
                description:
                  "Your keys always stay safely in your wallet. We never have access to your funds.",
                icon: "🔐",
              },
              {
                title: "AI-Powered Safety",
                description:
                  "Our AI verifies transactions match your intent and prevents malicious actions.",
                icon: "🛡️",
              },
              {
                title: "Transaction Preview",
                description:
                  "Always see what you're sending before signing any transaction.",
                icon: "👁️",
              },
            ].map((item, i) => (
              <div key={i} className="security-feature">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="py-16 my-12 text-center"
          ref={(el: HTMLDivElement | null) => {
            if (el) sectionRefs.current[6] = el;
          }}
        >
          <div className="max-w-3xl mx-auto relative overflow-hidden rounded-2xl border border-primary/20 p-8 backdrop-blur-sm">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/30 rounded-full blur-3xl"></div>
            <h2 className="text-3xl font-bold mb-4 gradient-text">
              Experience the Future of Crypto
            </h2>
            <p className="text-xl mb-8 text-muted-foreground">
              Interact with your wallet through natural language. No more
              complex interfaces.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              {!connected && <WalletButton />}
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className="px-6 py-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
                onClick={() =>
                  document
                    .querySelector(".chat-interface")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Try the AI Assistant
              </motion.button>
            </div>
          </div>
        </section>

        <div className="mt-8"></div>
      </main>

      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
      >
        <motion.button
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCommandPaletteOpen(true)}
          aria-label="Open command palette"
        >
          <Command className="h-5 w-5" />
        </motion.button>
      </motion.div>

      <CommandPalette 
        open={commandPaletteOpen}
        onClose={closeCommandPalette}
        commandCategories={commandCategories}
        insertCommand={insertCommand}
      />

      <CodeModal isOpen={showCodeModal} onClose={() => setShowCodeModal(false)} />

      <section className="py-16 my-8">
        <SubscriptionCards />
      </section>

      <footer className="border-t border-border/30 bg-background/50 backdrop-blur-sm">
        <div className="container px-4 py-8 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="relative w-6 h-6">
                <motion.div 
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.7 }}
                >
                  <Image 
                    src="/logo.webp" 
                    alt="INTELIQ Logo" 
                    width={24} 
                    height={24} 
                    className="rounded-full object-cover"
                  />
                </motion.div>
              </div>
              <p className="text-sm">© 2023 INTELIQ. All rights reserved.</p>
            </div>

            <div className="flex space-x-6">
              {["Twitter", "", "", ""].map(
                (item, i) => (
                  <a
                    key={i}
                    href="https://x.com/inteliq_xyz"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item}
                  </a>
                )
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({
  href,
  children,
  active = false,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link href={href}>
      <motion.div
        className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          active ? "text-primary" : "text-foreground hover:text-primary"
        }`}
        whileHover={{
          backgroundColor: "rgba(144, 97, 249, 0.08)",
        }}
      >
        {children}
        {active && (
          <motion.div
            layoutId="activeNavIndicator"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary mx-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>
    </Link>
  );
}