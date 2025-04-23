import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, X, Sparkles, Battery, Signal, Wifi, Lock, AlertCircle } from "lucide-react";

interface WaitlistFormPopupProps {
  onClose: () => void;
}

// Regex pattern for Solana address validation (base58 format)
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function WaitlistFormPopup({ onClose }: WaitlistFormPopupProps) {
  const [walletAddress, setWalletAddress] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [currentTime, setCurrentTime] = useState<string>("");
  const [showNotification, setShowNotification] = useState(false);
  const [particles, setParticles] = useState<Array<{ x: number; y: number; size: number; color: string }>>([]);
  const [animationStep, setAnimationStep] = useState(0);

  const [isValidAddress, setIsValidAddress] = useState<boolean | null>(null);
  const [addressFocused, setAddressFocused] = useState(false);

  useEffect(() => {
    if (isSubmitted) {
      const newParticles = Array.from({ length: 40 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 3 + Math.random() * 5,
        color: [
          "#9061f9",
          "#6d28d9",
          "#8b5cf6",
          "#f472b6",
          "#f59e0b",
        ][Math.floor(Math.random() * 5)]
      }));
      setParticles(newParticles);
    }
  }, [isSubmitted]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      setCurrentTime(
        `${hours > 12 ? hours - 12 : hours}:${minutes < 10 ? '0' + minutes : minutes} ${hours >= 12 ? 'PM' : 'AM'}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isSubmitted) {
      const timer = setTimeout(() => {
        setShowNotification(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitted]);

  // Validate Solana address
  const validateAddress = (address: string): boolean => {
    if (!address.trim()) return false;

    // Check if it matches the Solana address pattern
    return SOLANA_ADDRESS_REGEX.test(address);
  };

  // Update validation when address changes
  useEffect(() => {
    if (walletAddress.trim()) {
      setIsValidAddress(validateAddress(walletAddress));
    } else {
      setIsValidAddress(null);
    }
  }, [walletAddress]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Only proceed if the address is valid
    if (walletAddress.trim().length > 0 && isValidAddress) {
      setAnimationStep(1);
      setTimeout(() => setAnimationStep(2), 600);
      setTimeout(() => setAnimationStep(3), 1200);
      setTimeout(() => {
        setIsSubmitted(true);
        setAnimationStep(0);
      }, 1800);
    }
  };

  const handleCopyClick = () => {
    if (inputRef.current) {
      navigator.clipboard.writeText(inputRef.current.value);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.03 },
    tap: { scale: 0.97 }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute right-0 mt-2 w-[320px] rounded-3xl overflow-visible z-50"
    >
      <motion.div 
        className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-3 shadow-2xl border-4 border-gray-700"
        initial={{ rotateY: 15 }}
        animate={{ rotateY: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <motion.div 
          className="absolute -right-1 top-16 w-1.5 h-10 bg-gray-600 rounded-l-md"
          whileHover={{ backgroundColor: "#4B5563" }}
        />
        <motion.div className="absolute -left-1 top-16 w-1.5 h-6 bg-gray-600 rounded-r-md"
          whileHover={{ backgroundColor: "#4B5563" }}
        />
        <motion.div className="absolute -left-1 top-24 w-1.5 h-6 bg-gray-600 rounded-r-md"
          whileHover={{ backgroundColor: "#4B5563" }}
        />
        <motion.div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 w-1/3 h-4 bg-gray-900 rounded-full flex items-center justify-center">
          <div className="w-8 h-1.5 rounded-full bg-gray-800"></div>
        </motion.div>
        <motion.div 
          className="bg-gradient-to-br from-background to-background/90 rounded-2xl overflow-hidden"
          layoutId="phone-screen"
        >
          <div className="flex justify-between items-center px-4 pt-2 pb-1 bg-background/80 backdrop-blur-md border-b border-border/20">
            <span className="text-xs font-medium">{currentTime}</span>
            <div className="flex items-center space-x-1.5">
              <Signal size={12} className="text-foreground/80" />
              <Wifi size={12} className="text-foreground/80" />
              <Battery size={14} className="text-foreground/80" />
            </div>
          </div>
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border/30 hover:bg-muted transition-colors z-10 shadow-sm"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {!isSubmitted ? (
              <motion.div 
                className="p-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="mb-5 relative">
                  <div className="flex items-center space-x-2 mb-1">
                    <motion.div
                      animate={{ 
                        rotate: [0, 15, -15, 10, -10, 5, -5, 0],
                      }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                    >
                      <Sparkles className="h-5 w-5 text-primary" />
                    </motion.div>
                    <h3 className="font-bold text-lg">Join the Waitlist</h3>
                    <AnimatePresence>
                      {showNotification && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-1 -right-1"
                        >
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <motion.p 
                    className="text-sm text-muted-foreground"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Enter your Phantom wallet address to join our exclusive access list
                  </motion.p>
                  <motion.div
                    className="mt-4 p-2.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center space-x-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Lock size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">Secure Submission</p>
                      <p className="text-xs text-muted-foreground">End-to-end encrypted</p>
                    </div>
                  </motion.div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <motion.div 
                    className="relative"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className={`relative border ${
                      isValidAddress === false && addressFocused 
                        ? "border-red-400 ring-1 ring-red-400" 
                        : isValidAddress === true 
                          ? "border-green-400 ring-1 ring-green-400/30" 
                          : "border-border"
                    } rounded-lg overflow-hidden transition-all`}>
                      <input
                        ref={inputRef}
                        type="text"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        onFocus={() => setAddressFocused(true)}
                        onBlur={() => setAddressFocused(false)}
                        placeholder="Phantom Wallet Address"
                        className={`w-full px-3 py-2.5 bg-background/50 focus:outline-none transition-all pr-10 text-sm border-0 ${
                          isValidAddress === false && addressFocused ? "placeholder-red-300" : ""
                        }`}
                      />
                      <motion.button
                        type="button"
                        onClick={handleCopyClick}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </motion.button>
                    </div>
                    
                    <AnimatePresence>
                      {walletAddress.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className={`flex items-center mt-2 text-xs space-x-1 ${
                            isValidAddress === false && addressFocused
                              ? "text-red-400"
                              : isValidAddress === true
                                ? "text-green-400" 
                                : "text-orange-400"
                          }`}
                        >
                          {isValidAddress === false && addressFocused ? (
                            <>
                              <AlertCircle className="h-3 w-3" />
                              <span>Invalid Phantom wallet address</span>
                            </>
                          ) : isValidAddress === true ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Valid Phantom wallet address</span>
                            </>
                          ) : (
                            <>
                              <span>Keep typing your full Phantom address</span>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <AnimatePresence>
                      {addressFocused && walletAddress.length < 5 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 text-xs bg-primary/5 border border-primary/10 rounded-lg p-2"
                        >
                          <p className="text-muted-foreground mb-1">Example of a Phantom address:</p>
                          <p className="font-mono text-primary/80 break-all">5vJAzGNRyTKMRPZQ27SvACXNJGjhG2aR2LNhi2inzLzQ</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <motion.button
                    type="submit"
                    disabled={!walletAddress.trim() || animationStep > 0 || isValidAddress === false}
                    variants={buttonVariants}
                    initial="idle"
                    whileHover="hover"
                    whileTap="tap"
                    className={`w-full px-4 py-2.5 text-primary-foreground rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 ${
                      !walletAddress.trim() || animationStep > 0 || isValidAddress === false 
                        ? "bg-primary/60 opacity-70 cursor-not-allowed" 
                        : "bg-primary hover:bg-primary/90"
                    }`}
                  >
                    {animationStep === 0 && (
                      <>
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          Apply Now
                        </motion.span>
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 1 }}
                        >
                          <Sparkles size={16} />
                        </motion.div>
                      </>
                    )}
                    {animationStep > 0 && (
                      <div className="flex items-center space-x-2">
                        <motion.div 
                          className="h-4 w-4 rounded-full bg-white"
                          animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: animationStep >= 1 ? 1 : 0.5
                          }}
                          transition={{ duration: 0.5, repeat: false }}
                        />
                        <motion.div 
                          className="h-4 w-4 rounded-full bg-white"
                          animate={{ 
                            scale: [1, animationStep >= 2 ? 1.2 : 1, 1],
                            opacity: animationStep >= 2 ? 1 : 0.5
                          }}
                          transition={{ duration: 0.5, repeat: false, delay: 0.2 }}
                        />
                        <motion.div 
                          className="h-4 w-4 rounded-full bg-white"
                          animate={{ 
                            scale: [1, animationStep >= 3 ? 1.2 : 1, 1],
                            opacity: animationStep >= 3 ? 1 : 0.5
                          }}
                          transition={{ duration: 0.5, repeat: false, delay: 0.4 }}
                        />
                      </div>
                    )}
                  </motion.button>
                  
                  {isValidAddress === false && !addressFocused && walletAddress.trim() && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center text-xs text-red-400 mt-2"
                    >
                      Please enter a valid Phantom wallet address
                    </motion.p>
                  )}
                </form>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 flex flex-col items-center text-center relative overflow-hidden"
                style={{ height: '360px' }}
              >
                {particles.map((particle, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    initial={{ 
                      x: `50%`, 
                      y: `50%`, 
                      opacity: 1 
                    }}
                    animate={{ 
                      x: `${particle.x}%`, 
                      y: `${particle.y}%`, 
                      opacity: 0 
                    }}
                    transition={{ 
                      duration: 1 + Math.random() * 2, 
                      ease: "easeOut" 
                    }}
                    style={{
                      width: particle.size,
                      height: particle.size,
                      backgroundColor: particle.color,
                    }}
                  />
                ))}
                <div className="relative mb-6 mt-4">
                  <motion.div 
                    className="absolute inset-0 rounded-full"
                    initial={{ scale: 0, backgroundColor: "rgba(144, 97, 249, 0.2)" }}
                    animate={{ 
                      scale: [0, 2, 0],
                      backgroundColor: ["rgba(144, 97, 249, 0.4)", "rgba(144, 97, 249, 0)", "rgba(144, 97, 249, 0)"]
                    }}
                    transition={{ 
                      repeat: Infinity,
                      duration: 3,
                      ease: "easeOut",
                      times: [0, 0.5, 1]
                    }}
                  />
                  <motion.div 
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center relative z-10"
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: "spring",
                      damping: 10,
                      stiffness: 100,
                      delay: 0.2 
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.5, 1] }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                    >
                      <Check className="h-10 w-10 text-primary drop-shadow-md" />
                    </motion.div>
                  </motion.div>
                  <motion.div
                    className="absolute -top-3 -right-1 w-6 h-6 bg-gradient-to-br from-purple-500 to-primary rounded-full"
                    initial={{ scale: 0, y: 10 }}
                    animate={{ scale: 1, y: [10, -4, 0] }}
                    transition={{ delay: 0.7, duration: 0.8, type: "spring" }}
                  />
                  <motion.div
                    className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-br from-violet-400 to-fuchsia-500 rounded-full"
                    initial={{ scale: 0, y: -10 }}
                    animate={{ scale: 1, y: [-10, 4, 0] }}
                    transition={{ delay: 0.9, duration: 0.8, type: "spring" }}
                  />
                </div>
                <motion.h3 
                  className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-400"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  Successfully Applied!
                </motion.h3>
                <motion.div 
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <p className="text-sm text-muted-foreground mb-2">
                    Thank you for joining our waitlist
                  </p>
                  <p className="text-sm font-medium mb-6">
                    <span className="text-primary">You're #137</span> in line
                  </p>
                  <div className="w-full bg-background/50 rounded-lg p-3 border border-border/30 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-muted-foreground">Status</span>
                      <motion.span 
                        className="text-xs text-primary px-2 py-0.5 bg-primary/10 rounded-full"
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        Active
                      </motion.span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Estimated time</span>
                      <span className="text-xs">~2 weeks</span>
                    </div>
                  </div>
                </motion.div>
                <motion.button
                  onClick={onClose}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors shadow-md"
                >
                  Awesome!
                </motion.button>
              </motion.div>
            )}
            <div className="flex justify-center py-3 bg-background/80 backdrop-blur-sm border-t border-border/10">
              <div className="w-10 h-1 bg-border/50 rounded-full"></div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
