"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image"; // Added Image import
import { 
  ArrowRight, Calendar, ExternalLink, Twitter,
  Rocket, BarChart3, MessageSquare, Image as ImageIcon, Sparkles, Key, 
  Shield, Layers, Cpu
} from "lucide-react";

// Updated roadmap data with INTELIQ branding
const roadmapItems = [
  {
    title: "Inteliq V2",
    description: "Enterprise-grade multi-wallet agent control system with voice command capabilities and adaptive execution protocols for seamless portfolio management.",
    date: "May 20, 2025",
    icon: "🚀",
    color: "from-blue-600/20 to-indigo-700/20",
    status: "planning", // planning, development, beta, completed
    completion: 10
  },
  {
    title: "Advanced Portfolio Analyzer",
    description: "Comprehensive asset summary with AI-driven sentiment analysis, risk assessment metrics, and personalized notification system for market movements.",
    date: "May 23, 2025",
    icon: "📊",
    color: "from-emerald-600/20 to-teal-700/20",
    status: "planning",
    completion: 5
  },
  {
    title: "Telegram Command Agent",
    description: "Secure remote wallet interaction via encrypted Telegram interface with multi-factor authentication and granular permission controls for enterprise security.",
    date: "May 25, 2025",
    icon: "💬",
    color: "from-sky-600/20 to-blue-700/20",
    status: "planning",
    completion: 3
  },
  {
    title: "NFT Analyzer Module",
    description: "Full-spectrum NFT analytics platform featuring holder distribution mapping, volatility risk modeling, and comprehensive metadata classification system.",
    date: "May 27, 2025",
    icon: "🖼️",
    color: "from-fuchsia-600/20 to-purple-700/20",
    status: "concept",
    completion: 0
  },
  {
    title: "Smart Prompt Builder",
    description: "Context-aware action suggestion interface with machine learning optimization for complex transaction sequences and natural language processing enhancements.",
    date: "May 30, 2025",
    icon: "✨",
    color: "from-amber-600/20 to-orange-700/20",
    status: "concept",
    completion: 0
  },
  {
    title: "Token Utility Dashboard",
    description: "Comprehensive token-gated service platform for accessing premium features, institutional-grade analysis tools, and exclusive market insights.",
    date: "June 1, 2025",
    icon: "🔑",
    color: "from-yellow-600/20 to-amber-700/20",
    status: "concept",
    completion: 0
  }
];

// Function to get status display information
const getStatusInfo = (status: string) => {
  switch(status) {
    case "planning":
      return { color: "bg-blue-500", label: "Planning" };
    case "development":
      return { color: "bg-amber-500", label: "Development" };
    case "beta":
      return { color: "bg-purple-500", label: "Beta" };
    case "completed":
      return { color: "bg-emerald-500", label: "Completed" };
    default:
      return { color: "bg-slate-500", label: "Concept" };
  }
};

// Custom Icon components for more professional presentation
const IconBackground = ({ children, color = "from-blue-500/20 to-indigo-600/20", pulse = false }) => (
  <div className="relative">
    <div className={`absolute inset-[-5px] bg-gradient-to-br ${color} rounded-xl blur-lg ${pulse ? 'animate-pulse-slow' : ''} opacity-70`}></div>
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 dark:from-white/5 dark:to-black/5 rounded-lg backdrop-blur-md"></div>
    <div className="relative z-10 flex items-center justify-center h-full w-full">
      {children}
    </div>
  </div>
);

// Map icons to professional Lucide components
const getIconComponent = (iconKey: string) => {
  switch(iconKey) {
    case "🚀": 
      return { 
        icon: <Rocket strokeWidth={1.5} className="text-blue-500 w-8 h-8" />, 
        color: "from-blue-500/30 to-indigo-600/30",
        bgClass: "bg-gradient-to-br from-blue-500/10 to-indigo-600/10",
        secondaryIcons: [<Shield key="1" className="w-3.5 h-3.5 text-blue-400/70" />, <Cpu key="2" className="w-3.5 h-3.5 text-indigo-400/70" />]
      };
    case "📊": 
      return { 
        icon: <BarChart3 strokeWidth={1.5} className="text-emerald-500 w-8 h-8" />, 
        color: "from-emerald-500/30 to-teal-600/30",
        bgClass: "bg-gradient-to-br from-emerald-500/10 to-teal-600/10",
        secondaryIcons: [<Layers key="1" className="w-3.5 h-3.5 text-emerald-400/70" />]
      };
    case "💬": 
      return { 
        icon: <MessageSquare strokeWidth={1.5} className="text-sky-500 w-8 h-8" />, 
        color: "from-sky-500/30 to-blue-600/30",
        bgClass: "bg-gradient-to-br from-sky-500/10 to-blue-600/10",
        secondaryIcons: [<Shield key="1" className="w-3.5 h-3.5 text-sky-400/70" />]
      };
    case "🖼️": 
      return { 
        icon: <ImageIcon strokeWidth={1.5} className="text-fuchsia-500 w-8 h-8" />, 
        color: "from-fuchsia-500/30 to-purple-600/30",
        bgClass: "bg-gradient-to-br from-fuchsia-500/10 to-purple-600/10",
        secondaryIcons: [<Layers key="1" className="w-3.5 h-3.5 text-fuchsia-400/70" />]
      };
    case "✨": 
      return { 
        icon: <Sparkles strokeWidth={1.5} className="text-amber-500 w-8 h-8" />, 
        color: "from-amber-500/30 to-orange-600/30",
        bgClass: "bg-gradient-to-br from-amber-500/10 to-orange-600/10",
        secondaryIcons: [<Cpu key="1" className="w-3.5 h-3.5 text-amber-400/70" />]
      };
    case "🔑": 
      return { 
        icon: <Key strokeWidth={1.5} className="text-yellow-500 w-8 h-8" />, 
        color: "from-yellow-500/30 to-amber-600/30",
        bgClass: "bg-gradient-to-br from-yellow-500/10 to-amber-600/10",
        secondaryIcons: [<Shield key="1" className="w-3.5 h-3.5 text-yellow-400/70" />]
      };
    default: 
      return { 
        icon: <Cpu strokeWidth={1.5} className="text-gray-500 w-8 h-8" />,
        color: "from-gray-500/30 to-slate-600/30",
        bgClass: "bg-gradient-to-br from-gray-500/10 to-slate-600/10",
        secondaryIcons: []
      };
  }
};

export default function Roadmap() {
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background">
      {/* Subtle professional background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.03),transparent_50%)] opacity-70"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/5 to-accent/5 blur-[120px] opacity-80"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-accent/5 to-primary/5 blur-[120px] opacity-80"></div>
      </div>

      {/* Header with animated reveal */}
      <header
        className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
          scrolled ? "border-border/60 bg-background/80 backdrop-blur-md" : "border-transparent bg-transparent"
        }`}
      >
        <div className="container flex items-center justify-between h-16 px-4 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center space-x-2"
          >
            <Link href="/" className="group relative flex items-center space-x-2">
              <div className="relative w-9 h-9 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-indigo-600 to-violet-600 rounded-lg opacity-90 shadow-lg group-hover:animate-pulse transition-all duration-500"></div>
                <div className="absolute inset-[2px] bg-gradient-to-br from-background to-background/90 rounded-md flex items-center justify-center backdrop-blur-sm">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Image 
                      src="/logo.webp" 
                      alt="INTELIQ Logo" 
                      width={28} 
                      height={28} 
                      className="rounded-md object-cover"
                    />
                  </motion.div>
                </div>
              </div>
              <h1 className="text-xl font-bold tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">INTEL</span>IQ
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-300"></span>
              </h1>
            </Link>
          </motion.div>

          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-center space-x-8"
          >
            <Link href="/" className="text-sm font-medium relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-primary/40 after:to-primary hover:after:w-full after:transition-all after:duration-300">
              Home
            </Link>
            <Link href="/roadmap" className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-gradient-to-r after:from-primary after:to-accent">
              Roadmap
            </Link>
            <Link href="/past-updates" className="text-sm font-medium relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-primary/40 after:to-primary hover:after:w-full after:transition-all after:duration-300">
              Updates
            </Link>
            <Link href="/twitter-feed" className="text-sm font-medium relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-primary/40 after:to-primary hover:after:w-full after:transition-all after:duration-300">
              Twitter
            </Link>
          </motion.nav>
        </div>
      </header>

      <main className="container px-4 py-12 mx-auto max-w-7xl">
        {/* Hero section with enhanced design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-32"
        >
          {/* Enhanced decorative elements */}
          <div className="absolute top-40 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-[100px] -z-10"></div>
          <div className="absolute top-60 right-1/4 w-60 h-60 bg-accent/5 rounded-full blur-[100px] -z-10"></div>
          
          {/* Professional rocket icon with enhanced animations */}
          <div className="inline-block mb-8 relative">
            <div className="relative w-28 h-28 mx-auto">
              <div className="absolute inset-0 bg-gradient-conic from-primary via-accent to-primary rounded-full blur-xl opacity-70 animate-slow-spin"></div>
              <div className="absolute inset-[3px] bg-gradient-to-br from-background to-background/80 rounded-full flex items-center justify-center backdrop-blur-sm">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  {/* Animated particles around icon */}
                  {[...Array(5)].map((_, i) => (
                    <motion.div 
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full bg-primary/60"
                      initial={{ 
                        x: 0, 
                        y: 0,
                        opacity: 0.4,
                      }}
                      animate={{ 
                        x: Math.sin(i * Math.PI * 2 / 5) * 15, 
                        y: Math.cos(i * Math.PI * 2 / 5) * 15,
                        opacity: [0.4, 0.8, 0.4],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        duration: 3 + i * 0.2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                  
                  {/* Main rocket icon with animations */}
                  <motion.div 
                    initial={{ scale: 0.95, rotateZ: -5 }}
                    animate={{ 
                      scale: [0.95, 1.05, 0.95],
                      rotateZ: [-5, 5, -5],
                      y: [-2, 2, -2] 
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="relative z-10"
                  >
                    <div className="relative">
                      {/* Rocket exhaust effect */}
                      <motion.div 
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-to-t from-primary/80 via-accent/40 to-transparent rounded-full blur-md"
                        animate={{
                          height: ["24px", "32px", "24px"],
                          opacity: [0.6, 0.8, 0.6],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      
                      {/* Rocket icon */}
                      <Rocket 
                        strokeWidth={1.5} 
                        className="w-12 h-12 text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" 
                        fill="rgba(var(--primary-rgb),0.1)"
                      />
                      
                      {/* Highlight effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full opacity-80"></div>
                    </div>
                  </motion.div>
                </div>
              </div>
              
              {/* Orbit effect */}
              <div className="absolute inset-[-15px] border border-primary/20 rounded-full animate-slow-spin-reverse"></div>
              <div className="absolute inset-[-8px] border border-primary/10 rounded-full animate-slow-spin"></div>
            </div>
          </div>
          
          {/* Main heading with gradient effect */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold mb-6 tracking-tight"
          >
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-accent">
                Product Roadmap
              </span>
              <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-indigo-400/50 to-accent/50 blur-sm"></span>
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary via-indigo-400 to-accent"></span>
            </span>
          </motion.h1>
          
          {/* Enhanced subtitle with animated reveal */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground/90 max-w-3xl mx-auto leading-relaxed font-light"
          >
            Our meticulously planned vision for INTELIQ's evolution. Discover the future of cryptocurrency 
            management powered by cutting-edge artificial intelligence and blockchain technology.
          </motion.p>
          
          {/* Decorative separator */}
          <div className="mt-16 max-w-md mx-auto">
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
            <div className="flex justify-center -mt-2">
              <div className="bg-background px-4">
                <motion.div 
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-4 h-4 rounded-full border-2 border-primary/50 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Premium linear timeline design replacing cards */}
        <div className="relative py-24">
          {/* Central timeline line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/10 via-primary/30 to-primary/10"></div>
          
          {roadmapItems.map((item, index) => {
            const isEven = index % 2 === 0;
            const statusInfo = getStatusInfo(item.status);
            
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={`flex items-center mb-32 last:mb-0 ${isEven ? 'justify-end' : 'flex-row-reverse justify-end'}`}
              >
                {/* Timeline node */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-5 h-5 rounded-full">
                  <div className="absolute inset-0 bg-background border-2 border-primary/60 rounded-full z-10"></div>
                  <div className="absolute inset-[-4px] bg-gradient-to-r from-primary/30 to-accent/30 rounded-full blur-sm"></div>
                </div>
                
                {/* Content section */}
                <div className={`w-[45%] relative group ${isEven ? 'text-right pr-10' : 'text-left pl-10'}`}>
                  {/* Connecting line */}
                  <div className={`absolute top-[30px] ${isEven ? 'right-0 left-auto' : 'left-0 right-auto'} w-10 h-[2px] bg-gradient-to-${isEven ? 'l' : 'r'} from-primary/10 to-primary/60`}></div>
                  
                  {/* Date */}
                  <div className="inline-flex items-center space-x-2 mb-3 px-4 py-1.5 bg-gradient-to-r from-background to-background/70 border border-primary/20 rounded-full backdrop-blur-md shadow-sm">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm font-medium text-foreground/80">{item.date}</span>
                  </div>
                  
                  {/* Main content */}
                  <div className={`relative overflow-hidden rounded-2xl backdrop-blur-sm transition-all duration-500 border border-border/30 shadow-xl group-hover:shadow-2xl group-hover:shadow-primary/5 ${item.color.replace('from-', 'from-opacity-10 to-opacity-5 from-').replace('to-', 'to-')}`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-background/90 to-background/70"></div>
                    
                    {/* Animated gradient highlight */}
                    <div className={`absolute ${isEven ? '-right-40' : '-left-40'} -top-40 w-80 h-80 bg-gradient-radial from-primary/10 to-transparent opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-700 ease-out`}></div>
                    
                    {/* Content wrapper */}
                    <div className="relative p-8">
                      {/* Enhanced professional icon and title row */}
                      <div className="flex items-center mb-6 gap-5">
                        {/* Professional icon implementation */}
                        <div className={`relative ${isEven ? 'order-last' : ''}`}>
                          {/* Get icon details */}
                          {(() => {
                            const iconDetails = getIconComponent(item.icon);
                            
                            return (
                              <motion.div 
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                className="relative"
                              >
                                {/* Main icon container with enhanced effects */}
                                <div className="relative w-20 h-20">
                                  {/* Background glow effect */}
                                  <div className={`absolute inset-0 rounded-xl ${iconDetails.color} blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-300`}></div>
                                  
                                  {/* Main icon container with glass effect */}
                                  <div className="absolute inset-0 border border-border/40 rounded-xl overflow-hidden backdrop-blur-md shadow-2xl">
                                    {/* Animated gradient overlay */}
                                    <div className={`absolute inset-0 ${iconDetails.bgClass} opacity-80`}></div>
                                    
                                    {/* Grid pattern */}
                                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                                    
                                    {/* Icon with pulse animation */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <motion.div
                                        initial={{ opacity: 0.8, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ 
                                          yoyo: Infinity, 
                                          duration: 2,
                                          ease: "easeInOut"
                                        }}
                                      >
                                        {iconDetails.icon}
                                      </motion.div>
                                    </div>
                                    
                                    {/* Secondary mini-icons */}
                                    <div className="absolute bottom-2 right-2 flex space-x-1">
                                      {iconDetails.secondaryIcons.map((icon, idx) => (
                                        <div key={idx} className="bg-background/40 rounded-full p-1">
                                          {icon}
                                        </div>
                                      ))}
                                    </div>
                                    
                                    {/* Reflection effect */}
                                    <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent opacity-50"></div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })()}
                        </div>
                        
                        {/* Title and status section */}
                        <div className={`flex-1 ${isEven ? 'text-right pr-4' : 'text-left pl-4'}`}>
                          {/* Enhanced title with gradient animation */}
                          <h3 className="text-2xl font-bold mb-2 relative group-hover:translate-x-0 transition-all duration-300">
                            <span className="relative inline-block">
                              <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80">
                                {item.title}
                              </span>
                              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-500"></span>
                            </span>
                          </h3>
                          
                          {/* Enhanced status pill */}
                          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-border/40 backdrop-blur-sm bg-background/40">
                            <div className={`w-2 h-2 rounded-full ${statusInfo.color} animate-pulse-slow`}></div>
                            <span className="text-xs uppercase tracking-wider font-medium text-foreground/70">
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className={`text-muted-foreground leading-relaxed mb-6 ${isEven ? 'text-right' : 'text-left'}`}>
                        {item.description}
                      </p>
                      
                      {/* Progress bar */}
                      <div className="mt-1">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-muted-foreground font-medium">Progress</span>
                          <span className="font-bold text-primary">{item.completion}%</span>
                        </div>
                        <div className="relative h-2 w-full bg-background/80 rounded-full overflow-hidden border border-border/30">
                          <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${item.completion}%` }}
                          ></div>
                          
                          {/* Progress glow */}
                          <div 
                            className="absolute top-0 left-0 h-full bg-primary blur-sm rounded-full opacity-60 transition-all duration-1000 ease-out"
                            style={{ width: `${item.completion}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Dynamic feature tags */}
                      <div className={`flex flex-wrap gap-2 mt-6 ${isEven ? 'justify-end' : 'justify-start'}`}>
                        {["AI", "Blockchain", "Security"].map((tag, i) => (
                          <div key={i} className="px-3 py-1 text-xs rounded-full border border-primary/20 text-foreground/70 bg-background/40">
                            {tag}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          
          {/* Timeline end indicator */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-r from-primary to-accent blur-sm"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-primary"></div>
        </div>
        
        {/* Future vision section with enhanced design */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mt-40 mb-20"
        >
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-background/95 to-background/80 p-14 backdrop-blur-sm shadow-xl">
            {/* Abstract background elements */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-radial from-primary/10 to-transparent blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-radial from-accent/10 to-transparent blur-3xl"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(var(--primary-rgb),0.05),transparent_70%)] opacity-70"></div>
            
            {/* Decorative lines */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-accent">
                Our Vision Beyond 2025
              </h2>
              <p className="text-lg mb-10 text-center text-foreground/80 leading-relaxed max-w-3xl mx-auto">
                INTELIQ is building the foundation for the next generation of financial intelligence. 
                Our roadmap is just the beginning of a journey toward completely reimagining how individuals and institutions 
                interact with digital assets in an AI-first world.
              </p>
              <div className="flex justify-center">
                <motion.a
                  href="https://twitter.com/inteliq"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.03, boxShadow: "0 20px 40px -15px rgba(var(--primary-rgb), 0.5)" }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative inline-flex items-center space-x-4 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg transition-all duration-300"
                >
                  {/* Animated background */}
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-primary overflow-hidden">
                    <span className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%] group-hover:animate-shimmer"></span>
                  </span>
                  
                  <Twitter className="w-5 h-5 relative z-10" />
                  <span className="font-medium relative z-10">
  <a href="https://x.com/inteliq_xyz" target="_blank" rel="noopener noreferrer">
    Follow Our Journey
  </a>
</span>                  <ExternalLink className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform duration-300 relative z-10" />
                </motion.a>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
