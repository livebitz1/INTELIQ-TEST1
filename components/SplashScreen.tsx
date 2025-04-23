"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  
  // Set up video playback and fallback timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (videoRef.current) {
      // Force reload the video with cache-busting query param to ensure it plays every time
      const timestamp = Date.now();
      videoRef.current.src = `/logo video.mp4?t=${timestamp}`;
      
      // Attempt to play the video
      videoRef.current.play().catch((error) => {
        console.error("Video autoplay failed:", error);
        setIsVideoEnded(true);
      });
      
      // Safety timeout in case video fails to load or play
      timeoutId = setTimeout(() => {
        setIsVideoEnded(true);
      }, 5000); // 5 second fallback
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);
  
  // Trigger the onComplete callback when the animation finishes
  useEffect(() => {
    if (isVideoEnded) {
      // Small delay to allow the exit animation to play
      const animationDelay = setTimeout(() => {
        onComplete();
      }, 500);
      
      return () => clearTimeout(animationDelay);
    }
  }, [isVideoEnded, onComplete]);
  
  // Handle video end event
  const handleVideoEnded = () => {
    setIsVideoEnded(true);
  };

  return (
    <AnimatePresence>
      {!isVideoEnded && (
        <motion.div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center w-screen h-screen"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.5, ease: "easeInOut" }
          }}
        >
          {/* Video element */}
          <video
            ref={videoRef}
            className="w-full h-full"
            muted
            playsInline
            onEnded={handleVideoEnded}
            style={{ objectFit: "cover" }}
          />
          
          {/* Optional: Add a subtle brand overlay or logo */}
          <div className="absolute bottom-8 right-8 opacity-60">
            <div className="text-white text-xl font-bold tracking-wider">
              <span className="text-primary">AI</span> Wallet
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
