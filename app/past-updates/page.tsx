"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function PastUpdates() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("past");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle scroll effects and parallax
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const scrollY = window.scrollY;
      document.querySelectorAll(".parallax-slow").forEach((el: any) => {
        el.style.transform = `translateY(${scrollY * 0.02}px)`;
      });

      document.querySelectorAll(".parallax-fast").forEach((el: any) => {
        el.style.transform = `translateY(${scrollY * -0.03}px)`;
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Data for past updates
  const pastUpdates = [
    {
      icon: "🧠",
      title: "Wallet command parser implemented",
      description: "Core engine built to understand send/swap/scan instructions",
      date: "Mar 17, 2025 – 14:22 UTC",
      details:
        "Our natural language processing system now recognizes and parses complex wallet commands, enabling seamless interaction through conversational interface.",
      category: "core",
      teamMembers: ["Alex K.", "Maria L.", "John D."],
    },
    {
      icon: "⚡",
      title: "Agent response system optimized",
      description: "Reduced latency for real-time wallet interactions",
      date: "Mar 19, 2025 – 10:45 UTC",
      details:
        "Improved response time by 78% through advanced caching techniques and optimized transaction verification processes.",
      category: "performance",
      teamMembers: ["Sarah T.", "Michael R."],
    },
    {
      icon: "🔐",
      title: "Solana wallet integration live",
      description: "Phantom & Backpack support deployed for seamless connection",
      date: "Mar 21, 2025 – 16:30 UTC",
      details:
        "Users can now connect their existing Phantom and Backpack wallets with a single click, maintaining full custody while using AI assistant features.",
      category: "integration",
      teamMembers: ["David L.", "Anna S.", "Kevin P."],
    },
    {
      icon: "🚀",
      title: "Backend deployed on Render",
      description: "Scalable & fast infrastructure setup for launch",
      date: "Mar 25, 2025 – 19:00 UTC",
      details:
        "Production infrastructure deployed with auto-scaling capabilities, regional redundancy, and comprehensive performance monitoring.",
      category: "infrastructure",
      teamMembers: ["Chris M.", "Laura B."],
    },
    {
      icon: "✅",
      title: "Internal testnet phase completed",
      description: "Over 30 prompt-based executions successfully verified",
      date: "Mar 28, 2025 – 12:16 UTC",
      details:
        "Completed extensive testing of all core functionality, including wallet connections, transfers, swaps, and natural language interactions.",
      category: "testing",
      teamMembers: ["Miguel S.", "Jessica L.", "Robert K."],
    },
  ];

  // Data for ongoing updates
  const ongoingUpdates = [
    {
      icon: "🎯",
      title: "Token metadata being finalized",
      description: "Will unlock token-holder benefits including agent access and alerts",
      date: "In Progress",
      details:
        "Implementing comprehensive token metadata system to enable special features for token holders, including priority access to advanced AI features and customizable alerts.",
      progress: 65,
      category: "feature",
      teamMembers: ["Thomas H.", "Sophia C."],
    },
    {
      icon: "🧬",
      title: "Agent memory layer in testing",
      description: "Persistent history across sessions to personalize prompt responses",
      date: "Coming Soon",
      details:
        "Creating a sophisticated memory system allowing the AI to remember past interactions and user preferences, creating a more personalized experience across multiple sessions.",
      progress: 42,
      category: "ai",
      teamMembers: ["Neil P.", "Elena M.", "James T."],
    },
    {
      icon: "🔄",
      title: "Multi-chain support expansion",
      description: "Adding support for Ethereum, Polygon and Avalanche",
      date: "Est. April 2025",
      details:
        "Expanding wallet capabilities to include Ethereum, Polygon and Avalanche networks, enabling cross-chain asset viewing and management through the same intuitive interface.",
      progress: 28,
      category: "integration",
      teamMembers: ["Daniel F.", "Rebecca S."],
    },
  ];

  // Data for future updates
  const futureUpdates = [
    {
      id: 1,
      icon: "🧠",
      title: "Inteliq V2 Launch",
      description: "Upgraded execution agent with multi-wallet control, voice-command mode, and adaptive logic modules.",
      date: "April 23, 2025",
      progress: 20,
      category: "ai",
      daysRemaining: 18,
      highlight: true,
      dependencies: ["Command Parser", "Voice Recognition"],
    },
    {
      id: 2,
      icon: "📊",
      title: "Advanced Portfolio Analyzer",
      description: "In-depth asset summaries, holding patterns, and actionable alerts based on real-time data.",
      date: "April 29, 2025",
      progress: 35,
      category: "analytics",
      daysRemaining: 24,
      dependencies: ["Data API", "Alert System"],
    },
    {
      id: 3,
      icon: "💬",
      title: "Telegram Command Agent",
      description: "Control wallet via Telegram with secure prompt-based actions.",
      date: "May 3, 2025",
      progress: 15,
      category: "integration",
      daysRemaining: 28,
      dependencies: ["Bot Framework", "Security Layer"],
    },
    {
      id: 4,
      icon: "🖼️",
      title: "NFT Analyzer Module",
      description: "Scan any NFT/token to reveal risk profile, top holders, and contract metadata.",
      date: "May 7, 2025",
      progress: 25,
      category: "analytics",
      daysRemaining: 32,
      dependencies: ["Metadata Scanner", "Risk Algorithm"],
    },
    {
      id: 5,
      icon: "✨",
      title: "Smart Prompt Builder",
      description: "Launchpad UI with one-click pre-built commands for ease of use.",
      date: "May 12, 2025",
      progress: 10,
      category: "feature",
      daysRemaining: 37,
      dependencies: ["Command Library", "UI Framework"],
    },
    {
      id: 6,
      icon: "🔑",
      title: "Token Utility Dashboard",
      description: "View unlockable access tiers, upcoming holder benefits, and real-time token interactions.",
      date: "May 21, 2025",
      progress: 5,
      category: "feature",
      daysRemaining: 46,
      dependencies: ["Token Integration", "Access Management"],
    },
    {
      id: 7,
      icon: "🚀",
      title: "V3 Launch",
      description: "Trading tools, sniper bot integration, App of Inteliq with all tools.",
      date: "June 10, 2025",
      progress: 2,
      category: "release",
      daysRemaining: 66,
      highlight: true,
      dependencies: ["All Previous Features", "Final Testing"],
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } },
  };

  const detailsVariants = {
    hidden: { height: 0, opacity: 0 },
    show: { height: "auto", opacity: 1, transition: { duration: 0.3 } },
  };

  // Helper function to handle the details toggle
  const handleDetailsToggle = (index: number) => {
    setExpandedDetails(expandedDetails === index ? null : index);
  };

  // Category badge colors
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "core":
        return "bg-purple-500/15 text-purple-500";
      case "performance":
        return "bg-amber-500/15 text-amber-500";
      case "integration":
        return "bg-blue-500/15 text-blue-500";
      case "infrastructure":
        return "bg-green-500/15 text-green-500";
      case "testing":
        return "bg-cyan-500/15 text-cyan-500";
      case "feature":
        return "bg-indigo-500/15 text-indigo-500";
      case "ai":
        return "bg-rose-500/15 text-rose-500";
      case "analytics":
        return "bg-emerald-500/15 text-emerald-500";
      case "release":
        return "bg-violet-500/15 text-violet-500";
      default:
        return "bg-primary/15 text-primary";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90" ref={containerRef}>
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5"></div>

        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-accent/10 blur-3xl animate-float-delay"></div>
      </div>

      {/* Header */}
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
              Roadmap
            </NavLink>
            <NavLink href="/past-updates" active={pathname === "/past-updates"}>
              <div className="flex items-center">
                <span className="mr-1.5">Updates</span>
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                  New
                </span>
              </div>
            </NavLink>
            <NavLink href="/twitter-feed" active={pathname === "/twitter-feed"}>
              Twitter
            </NavLink>
          </motion.nav>
        </div>
      </header>

      <main className="container px-4 py-12 mx-auto max-w-7xl">
        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 relative inline-block">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Updates & Challenges</span>
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-full"></div>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Track our progress as we build the future of AI-powered crypto wallets
          </p>
        </motion.div>

        {/* Tab navigation */}
        <motion.div
          className="flex justify-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="inline-flex p-1 rounded-lg bg-card/30 backdrop-blur-sm border border-border/40">
            <button
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "past" ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-card/50"
              }`}
              onClick={() => setActiveTab("past")}
            >
              Past Updates
            </button>
            <button
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "ongoing" ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-card/50"
              }`}
              onClick={() => setActiveTab("ongoing")}
            >
              Ongoing Updates
            </button>
            <button
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "future" ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-card/50"
              }`}
              onClick={() => setActiveTab("future")}
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Future Updates
              </div>
            </button>
          </div>
        </motion.div>

        {/* Update cards container */}
        <AnimatePresence mode="wait">
          {activeTab === "past" && (
            <motion.div
              key="past-updates"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="space-y-6"
            >
              {/* Past Updates */}
              <motion.h2 className="text-2xl font-bold mb-6 flex items-center" variants={itemVariants}>
                <div className="w-1 h-8 bg-gradient-to-b from-primary to-transparent rounded-full mr-3"></div>
                Past Updates <span className="text-muted-foreground ml-2 text-sm font-normal">(Cleaned)</span>
              </motion.h2>

              <div className="grid grid-cols-1 gap-6">
                {pastUpdates.map((update, index) => (
                  <motion.div
                    key={index}
                    variants={cardVariants}
                    className={`rounded-xl border backdrop-blur-sm overflow-hidden ${
                      index % 2 === 0 ? "border-border/40 bg-card/30" : "border-border/30 bg-card/20"
                    } transition-all hover:border-primary/40 hover:bg-card/40 hover:shadow-md`}
                    onMouseEnter={() => setHoverIndex(index)}
                    onMouseLeave={() => setHoverIndex(null)}
                  >
                    <div className="p-5 cursor-pointer" onClick={() => handleDetailsToggle(index)}>
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-1 md:col-span-1">
                          <motion.div
                            className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-background/80 to-card flex items-center justify-center text-2xl shadow-lg"
                            animate={
                              hoverIndex === index
                                ? {
                                    rotateY: [-5, 5, -5],
                                    rotateX: [5, -5, 5],
                                    scale: 1.05,
                                  }
                                : {}
                            }
                            transition={{ duration: 2, repeat: hoverIndex === index ? Infinity : 0 }}
                            style={{ transformStyle: "preserve-3d" }}
                          >
                            <div className="absolute inset-0 rounded-xl border border-white/10"></div>
                            <span className="transform " style={{ transform: "translateZ(8px)" }}>
                              {update.icon}
                            </span>
                            <div
                              className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/20 to-transparent opacity-50"
                              style={{ clipPath: "polygon(0 0, 100% 0, 100% 30%, 0 30%)" }}
                            ></div>
                          </motion.div>
                        </div>

                        <div className="col-span-8 md:col-span-7">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-bold text-base">{update.title}</h3>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full ${getCategoryColor(update.category)}`}>
                              {update.category}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{update.description}</p>
                        </div>

                        <div className="col-span-3 md:col-span-4 text-right">
                          <div className="text-xs text-muted-foreground whitespace-nowrap">{update.date}</div>
                          <motion.div className="flex justify-end mt-2" animate={{ rotate: expandedDetails === index ? 180 : 0 }}>
                            <div className="w-6 h-6 rounded-full bg-card/50 flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedDetails === index && (
                        <motion.div initial="hidden" animate="show" exit="hidden" variants={detailsVariants} className="px-5 pb-5 pt-0">
                          <div className="border-t border-border/30 pt-4 mt-2">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                              <div className="md:col-span-9">
                                <h4 className="text-sm font-medium mb-2 text-primary">Details</h4>
                                <p className="text-sm text-muted-foreground">{update.details}</p>
                              </div>

                              <div className="md:col-span-3">
                                <h4 className="text-sm font-medium mb-2 text-primary">Team</h4>
                                <div className="flex flex-wrap">
                                  {update.teamMembers.map((member, idx) => (
                                    <div key={idx} className="flex items-center mr-4 mb-1">
                                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs mr-1.5">
                                        {member.charAt(0)}
                                      </div>
                                      <span className="text-xs">{member}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "ongoing" && (
            <motion.div
              key="ongoing-updates"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="space-y-6"
            >
              <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center">
                  <div className="w-1 h-8 bg-gradient-to-b from-accent to-transparent rounded-full mr-3"></div>
                  Ongoing Updates
                </h2>

                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse mr-2"></div>
                  <span className="text-sm text-muted-foreground">Live Development</span>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 gap-6">
                {ongoingUpdates.map((update, index) => (
                  <motion.div
                    key={index}
                    variants={cardVariants}
                    className={`rounded-xl border backdrop-blur-sm overflow-hidden ${
                      index % 2 === 0 ? "border-border/40 bg-card/30" : "border-border/30 bg-card/20"
                    } transition-all hover:border-accent/40 hover:bg-card/40 hover:shadow-md`}
                    onMouseEnter={() => setHoverIndex(index + 100)}
                    onMouseLeave={() => setHoverIndex(null)}
                  >
                    <div className="p-5">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-1 md:col-span-1">
                          <motion.div
                            className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-background/80 to-card flex items-center justify-center text-2xl shadow-lg"
                            animate={
                              hoverIndex === index + 100
                                ? {
                                    rotateY: [-5, 5, -5],
                                    rotateX: [5, -5, 5],
                                    scale: 1.05,
                                  }
                                : {}
                            }
                            transition={{ duration: 2, repeat: hoverIndex === index + 100 ? Infinity : 0 }}
                            style={{ transformStyle: "preserve-3d" }}
                          >
                            <div className="absolute inset-0 rounded-xl border border-white/10"></div>
                            <span className="transform" style={{ transform: "translateZ(8px)" }}>
                              {update.icon}
                            </span>
                            <div
                              className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/20 to-transparent opacity-50"
                              style={{ clipPath: "polygon(0 0, 100% 0, 100% 30%, 0 30%)" }}
                            ></div>
                          </motion.div>
                        </div>

                        <div className="col-span-11 md:col-span-7">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-bold text-base">{update.title}</h3>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full ${getCategoryColor(update.category)}`}>
                              {update.category}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{update.description}</p>

                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{update.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-background/50 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-primary/80 to-accent/80 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${update.progress}%` }}
                                transition={{ duration: 0.8, delay: index * 0.2 }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="hidden md:block md:col-span-4 text-right">
                          <div className="text-xs text-muted-foreground whitespace-nowrap">{update.date}</div>

                          <div className="flex justify-end mt-2 gap-2">
                            {update.teamMembers.slice(0, 2).map((member, idx) => (
                              <div key={idx} className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                                {member.charAt(0)}
                              </div>
                            ))}
                            {update.teamMembers.length > 2 && (
                              <div className="w-6 h-6 rounded-full bg-background/50 flex items-center justify-center text-xs">
                                +{update.teamMembers.length - 2}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border/30">
                        <p className="text-sm">{update.details}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "future" && (
            <motion.div
              key="future-updates"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="space-y-6"
            >
              <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center">
                  <div className="w-1 h-8 bg-gradient-to-b from-violet-500 to-transparent rounded-full mr-3"></div>
                  Upcoming Releases
                </h2>

                <div className="flex items-center bg-background/40 border border-border/40 px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse mr-2"></div>
                  <span className="text-muted-foreground">Development Timeline</span>
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="relative h-2 bg-background/50 rounded-full mb-8 overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-primary via-violet-500 to-accent w-1/3 rounded-full"></div>
                {futureUpdates.map((update, index) => (
                  <motion.div
                    key={index}
                    className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-card border border-primary rounded-full"
                    style={{ left: `${Math.min(90, (index + 1) * 13)}%` }}
                    whileHover={{ scale: 1.5 }}
                  />
                ))}
              </motion.div>

              <div className="space-y-5">
                {futureUpdates.map((update, index) => (
                  <motion.div
                    key={index}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                          delay: index * 0.08,
                        },
                      },
                    }}
                    className={`rounded-xl border backdrop-blur-sm overflow-hidden transition-all ${
                      update.highlight
                        ? "border-violet-500/30 bg-violet-950/10"
                        : "border-border/40 bg-card/30"
                    } hover:bg-card/40 hover:shadow-lg`}
                  >
                    <div className="p-5">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-1 md:col-span-1">
                          <motion.div
                            className={`relative w-12 h-12 rounded-xl ${
                              update.highlight ? "bg-violet-900/30" : "bg-gradient-to-br from-background/80 to-card"
                            } flex items-center justify-center text-2xl shadow-lg`}
                            whileHover={{
                              rotateY: [-5, 5, -5],
                              rotateX: [5, -5, 5],
                              scale: 1.05,
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{ transformStyle: "preserve-3d" }}
                          >
                            <div className="absolute inset-0 rounded-xl border border-white/10"></div>
                            <span className="transform" style={{ transform: "translateZ(8px)" }}>
                              {update.icon}
                            </span>
                            <div
                              className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/20 to-transparent opacity-50"
                              style={{ clipPath: "polygon(0 0, 100% 0, 100% 30%, 0 30%)" }}
                            ></div>
                          </motion.div>
                        </div>

                        <div className="col-span-7 md:col-span-8">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h3 className={`font-bold text-base ${update.highlight ? "text-violet-300" : ""}`}>
                              {update.title}
                            </h3>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full ${getCategoryColor(update.category)}`}>
                              {update.category}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{update.description}</p>

                          <div className="flex flex-wrap gap-1.5">
                            {update.dependencies.map((dep, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-background/50 text-muted-foreground border border-border/40"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 013 0m-3-3.5v-2a1.5 1.5 0 00-3 0m0 0V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11"
                                  />
                                </svg>
                                {dep}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="col-span-4 md:col-span-3 text-right">
                          <div className="text-sm font-medium mb-1">Expected</div>
                          <div className={`text-sm font-mono ${update.highlight ? "text-violet-300" : "text-muted-foreground"}`}>
                            {update.date}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1.5">{update.daysRemaining} days remaining</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/30">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="text-muted-foreground">Development Progress</span>
                          <span className="font-medium">{update.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-background/50 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${update.highlight ? "bg-violet-500" : "bg-primary"}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${update.progress}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                variants={itemVariants}
                className="mt-12 p-6 rounded-xl border border-border/40 bg-card/20 backdrop-blur-sm"
              >
                <h3 className="text-lg font-bold mb-4">Release Timeline</h3>
                <div className="relative">
                  <div className="absolute top-0 bottom-0 left-16 w-0.5 bg-border/40"></div>

                  {futureUpdates.map((update, index) => (
                    <div key={index} className="flex mb-5 last:mb-0">
                      <div className="flex-shrink-0 w-16 text-xs text-muted-foreground text-right pr-4 pt-0.5">
                        {update.date.split(" ")[0]}
                      </div>

                      <div
                        className={`flex-shrink-0 w-4 h-4 rounded-full mt-1 mr-3 ${
                          update.highlight ? "bg-violet-500" : "bg-primary/60"
                        } border-2 border-background`}
                      />

                      <div className="flex-grow pt-0.5">
                        <p className="text-sm font-medium">
                          {update.title}
                          <span className="ml-2 text-xs font-normal text-muted-foreground">{update.category}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex justify-center mt-8">
                <Link
                  href="/roadmap"
                  className="flex items-center px-5 py-2.5 rounded-lg bg-violet-500/20 border border-violet-500/40 text-violet-300 hover:bg-violet-500/30 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                  View Full Roadmap
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mt-16 p-6 md:p-8 rounded-xl border border-primary/20 bg-card/30 backdrop-blur-md relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-accent/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="md:max-w-md">
              <h3 className="text-xl font-bold mb-2">Stay Updated</h3>
              <p className="text-sm text-muted-foreground">
                Subscribe to our newsletter to receive the latest updates and announcements directly to your inbox.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 bg-background/60 border border-border/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Subscribe
              </motion.button>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-border/30 bg-background/50 backdrop-blur-md mt-16">
        <div className="container px-4 py-8 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-xs">IQ</span>
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

// NavLink component for consistent navigation styling
function NavLink({ href, children, active = false }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link href={href}>
      <motion.div
        className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          active ? "text-primary" : "text-foreground hover:text-primary"
        }`}
        whileHover={{
          backgroundColor: "",
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
