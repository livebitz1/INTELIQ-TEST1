"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { X, Copy, Check, Sparkles } from "lucide-react";

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CodeModal({ isOpen, onClose }: CodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [copyAnimationComplete, setCopyAnimationComplete] = useState(true);
  const code = "AB12CD3456"; // Example code
  const modalRef = useRef<HTMLDivElement>(null);
  const confettiRef = useRef<HTMLDivElement>(null);
  const codeTextControls = useAnimation();
  const borderControls = useAnimation();
  const glowControls = useAnimation();

  // Animate border and glow effects when modal opens
  useEffect(() => {
    if (isOpen) {
      // Animated border effect
      borderControls.start({
        backgroundPosition: ['0% 0%', '100% 100%'],
        transition: {
          duration: 8,
          ease: "linear",
          repeat: Infinity,
          repeatType: "reverse"
        }
      });

      // Subtle glow pulsing
      glowControls.start({
        opacity: [0.5, 0.8, 0.5],
        scale: [1, 1.02, 1],
        transition: {
          duration: 4,
          ease: "easeInOut",
          repeat: Infinity,
        }
      });
    }
  }, [isOpen, borderControls, glowControls]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent scrolling when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  // Enhanced copy code to clipboard with animations
  const handleCopyCode = async () => {
    try {
      // Don't allow multiple copy animations at once
      if (!copyAnimationComplete) return;

      setCopyAnimationComplete(false);
      await navigator.clipboard.writeText(code);

      // Vibrate for tactile feedback on mobile (if supported)
      if (navigator.vibrate) {
        navigator.vibrate([15, 30, 15]);
      }

      // Highlight code text effect
      await codeTextControls.start({
        scale: [1, 1.05, 1],
        color: ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--primary))"],
        transition: { duration: 0.5 }
      });

      // Show copied state
      setCopied(true);

      // Create confetti effect
      createConfettiEffect();

      // Reset after delay
      setTimeout(() => {
        setCopied(false);
        setCopyAnimationComplete(true);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setCopyAnimationComplete(true);
    }
  };

  // Create confetti particles when code is copied
  const createConfettiEffect = () => {
    if (!confettiRef.current) return;

    const container = confettiRef.current;
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFBE0B', '#FB5607'];

    // Clear any existing confetti
    container.innerHTML = '';

    // Create confetti particles
    for (let i = 0; i < 60; i++) {
      const confetti = document.createElement('div');
      const size = Math.random() * 8 + 4;

      confetti.style.width = `${size}px`;
      confetti.style.height = `${size}px`;
      confetti.style.position = 'absolute';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.borderRadius = '50%';
      confetti.style.opacity = '0';

      // Position confetti around the copy button
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 60 + 20;
      confetti.style.left = '50%';
      confetti.style.top = '50%';

      // Configure animation
      const animationDuration = Math.random() * 1 + 0.5;
      confetti.style.animation = `
        confetti-fade-in 0.2s ease forwards,
        confetti-fall ${animationDuration}s ease-out forwards
      `;
      confetti.style.animationDelay = `${Math.random() * 0.2}s`;

      // Create keyframes for the animation
      const keyframes = `
        @keyframes confetti-fade-in {
          from { opacity: 0; }
          to { opacity: 0.9; }
        }
        @keyframes confetti-fall {
          to {
            transform: translate(
              ${Math.cos(angle) * distance - 50}px,
              ${Math.sin(angle) * distance - 50}px
            );
            opacity: 0;
          }
        }
      `;

      // Add styles to document if they don't exist
      if (!document.getElementById('confetti-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'confetti-styles';
        styleEl.innerHTML = keyframes;
        document.head.appendChild(styleEl);
      }

      container.appendChild(confetti);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ 
            background: 'radial-gradient(circle at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.8) 100%)',
            backdropFilter: "blur(8px)"
          }}
        >
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl opacity-20 animate-float"></div>
            <div className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full bg-accent/10 blur-3xl opacity-20 animate-float-delay"></div>
          </div>
          
          {/* Modal wrapper with animated border */}
          <div className="relative max-w-md w-full">
            {/* Animated glow effect */}
            <motion.div 
              animate={glowControls} 
              className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur-xl"
            />
            
            {/* Animated border container */}
            <motion.div 
              animate={borderControls}
              className="absolute inset-0 rounded-xl border-2 border-transparent"
              style={{
                backgroundImage: 'linear-gradient(var(--card), var(--card)), linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                backgroundSize: '300% 300%'
              }}
            />

            {/* Main card content */}
            <motion.div
              ref={modalRef}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card/95 backdrop-blur-md rounded-xl shadow-2xl w-full overflow-hidden relative z-10"
              role="dialog"
              aria-modal="true"
              aria-labelledby="code-modal-title"
            >
              {/* Enhanced Header with gradient and icon */}
              <div className="relative flex justify-between items-center p-5 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent">
                <motion.div 
                  className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                  animate={{ 
                    opacity: [0.3, 0.8, 0.3],
                    scale: [1, 1.02, 1] 
                  }}
                  transition={{ 
                    duration: 2.5, 
                    repeat: Infinity,
                    repeatType: "reverse" 
                  }}
                />
                
                <div className="flex items-center space-x-3">
                  <div className="relative w-8 h-8 flex items-center justify-center rounded-full bg-primary/20">
                    <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-75"></div>
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 id="code-modal-title" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    CA 
                    </h3>
                    <p className="text-xs text-muted-foreground">INTEIQ</p>
                  </div>
                </div>
                
                <motion.button
                  onClick={onClose}
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="rounded-full p-2 hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              
              {/* Content with enhanced styling */}
              <div className="p-6">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center space-y-1 mb-6"
                >
                  <p className="text-sm text-muted-foreground">
                    This is our exclusive contract address code
                  </p>
                  <div className="w-16 h-1 mx-auto bg-gradient-to-r from-primary/50 to-accent/50 rounded-full mt-2"></div>
                </motion.div>
                
                {/* Code display with enhanced styling */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="relative bg-gradient-to-br from-background/95 to-background/70 border border-primary/20 rounded-lg p-5 mb-6 backdrop-blur-sm"
                >
                  <div className="absolute inset-0 bg-grid-pattern opacity-5 rounded-lg"></div>
                  
                  <div className="flex items-center justify-between">
                    <motion.div 
                      animate={codeTextControls}
                      className="font-mono text-xl font-bold tracking-wider text-primary"
                    >
                      {code}
                    </motion.div>
                    <div className="relative">
                      <div ref={confettiRef} className="absolute inset-0 pointer-events-none overflow-visible" />
                      <motion.button 
                        onClick={handleCopyCode}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-2 rounded-lg transition-all ${
                          copied 
                            ? 'bg-green-500/20 text-green-500 border border-green-500/30' 
                            : 'hover:bg-primary/10 border border-primary/20'
                        }`}
                        aria-label="Copy code"
                        disabled={!copyAnimationComplete}
                      >
                        <AnimatePresence mode="wait">
                          {copied ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0, rotate: -10 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 10 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 10
                              }}
                            >
                              <Check className="w-5 h-5" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="copy"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 10
                              }}
                            >
                              <Copy className="w-5 h-5" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
                
                <AnimatePresence>
                  {copied && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: 10, height: 0 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                      }}
                      className="relative overflow-hidden rounded-lg bg-green-500/10 border border-green-500/20 p-3 mb-6 flex items-center justify-center"
                    >
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        exit={{ width: "0%" }}
                        transition={{ duration: 2 }}
                        className="absolute bottom-0 left-0 h-1 bg-green-500/50"
                      />
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-green-500 text-sm font-medium"
                      >
                        Code copied to clipboard!
                      </motion.span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Enhanced CTA button */}
                <div className="relative">
                  <motion.div
                    animate={{
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary/30 to-accent/30 blur-md"
                  />
                  <motion.button 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: "0 0 15px rgba(var(--primary), 0.5)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="relative w-full py-4 rounded-lg font-semibold bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all z-10"
                  >
                    <span className="relative z-10 flex items-center justify-center space-x-2">
                      <span>BUY NOW</span>
                      <motion.span
                        animate={{ x: [0, 3, 0] }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      >→</motion.span>
                    </span>
                  </motion.button>
                </div>
                
                {/* Enhanced footer text */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-5 flex items-center justify-center space-x-2"
                >
                  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></div>
                  </div>
                 
                </motion.div>
              </div>
              
              {/* Bottom decorative bar */}
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
