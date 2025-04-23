"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { WalletButton } from "@/components/WalletButton";
import { useWallet } from "@solana/wallet-adapter-react";
import SpaceButton from "./SpaceButton";
import Card from "./Card"; // Import the Card component

// Dynamic import Three.js to prevent server-side rendering issues
let THREE: any;
if (typeof window !== "undefined") {
  THREE = require("three");
}

interface HeroSectionProps {
  walletConnected: boolean;
}

export const HeroSection = forwardRef<HTMLDivElement, HeroSectionProps>(
  ({ walletConnected }, ref) => {
    const controls = useAnimation();
    const { publicKey } = useWallet();
    const canvasRef = useRef<HTMLDivElement>(null);
    const [threeLoaded, setThreeLoaded] = useState(false);

    useEffect(() => {
      controls.start({ opacity: 1, y: 0 });

      // Check if Three.js is available
      if (typeof THREE === "undefined") {
        console.warn("Three.js not loaded yet");
        return;
      }

      setThreeLoaded(true);

      // Only initialize 3D graphics if we have a container and Three.js is loaded
      if (!canvasRef.current || !THREE) return;

      // Basic Three.js setup for wallet visualization
      const container = canvasRef.current;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      );
      camera.position.z = 5;

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);

      // Create a stylized wallet
      const walletGroup = new THREE.Group();

      // Wallet body
      const walletGeometry = new THREE.BoxGeometry(3, 2, 0.2);
      const walletMaterial = new THREE.MeshPhongMaterial({
        color: 0x5a1e96, // Purple color matching the theme
        shininess: 100,
      });
      const wallet = new THREE.Mesh(walletGeometry, walletMaterial);
      walletGroup.add(wallet);

      // Wallet edge highlight
      const edgeGeometry = new THREE.BoxGeometry(3.1, 2.1, 0.1);
      const edgeMaterial = new THREE.MeshPhongMaterial({
        color: 0x9a4dff,
        shininess: 100,
        transparent: true,
        opacity: 0.7,
      });
      const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
      edge.position.z = -0.1;
      walletGroup.add(edge);

      // Add digital circuit pattern - create a fallback if texture loading fails
      const circuitGeometry = new THREE.PlaneGeometry(2.8, 1.8);
      let circuitMaterial;

      try {
        const circuitTexture = new THREE.TextureLoader().load(
          "/circuit-pattern.png",
          // Success callback
          undefined,
          // Progress callback
          undefined,
          // Error callback - use a procedural texture pattern instead
          () => {
            const canvas = document.createElement("canvas");
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.fillStyle = "#1a1a2e";
              ctx.fillRect(0, 0, 256, 256);
              ctx.strokeStyle = "#5a1e96";
              ctx.lineWidth = 1;

              // Draw circuit-like pattern
              for (let i = 0; i < 30; i++) {
                const x = Math.random() * 256;
                const y = Math.random() * 256;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.random() * 50, y);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + Math.random() * 50);
                ctx.stroke();
              }

              // Create texture from canvas
              const fallbackTexture = new THREE.CanvasTexture(canvas);
              circuitMaterial.map = fallbackTexture;
              circuitMaterial.needsUpdate = true;
            }
          }
        );

        circuitMaterial = new THREE.MeshBasicMaterial({
          map: circuitTexture,
          transparent: true,
          opacity: 0.2,
        });
      } catch (e) {
        // Create a basic material if texture loading fails
        circuitMaterial = new THREE.MeshBasicMaterial({
          color: 0x2a0944,
          transparent: true,
          opacity: 0.2,
          wireframe: true,
        });
      }

      const circuit = new THREE.Mesh(circuitGeometry, circuitMaterial);
      circuit.position.z = 0.11;
      walletGroup.add(circuit);

      // Add solana logo
      const solanaGeometry = new THREE.CircleGeometry(0.4, 32);
      const solanaMaterial = new THREE.MeshBasicMaterial({
        color: 0xfc66e2,
        transparent: true,
        opacity: 0.8,
      });
      const solanaLogo = new THREE.Mesh(solanaGeometry, solanaMaterial);
      solanaLogo.position.set(0, 0, 0.12);
      walletGroup.add(solanaLogo);

      // Add smaller inner circle
      const innerGeometry = new THREE.CircleGeometry(0.2, 32);
      const innerMaterial = new THREE.MeshBasicMaterial({
        color: 0x5a1e96,
      });
      const innerCircle = new THREE.Mesh(innerGeometry, innerMaterial);
      innerCircle.position.set(0, 0, 0.13);
      walletGroup.add(innerCircle);

      // Add floating particles
      const particlesGeometry = new THREE.BufferGeometry();
      const particleCount = 100;
      const posArray = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 5;
      }

      particlesGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(posArray, 3)
      );

      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.02,
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
      });

      const particlesMesh = new THREE.Points(
        particlesGeometry,
        particlesMaterial
      );
      scene.add(particlesMesh);

      scene.add(walletGroup);

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const pointLight = new THREE.PointLight(0xffffff, 0.8);
      pointLight.position.set(5, 3, 5);
      scene.add(pointLight);

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);

        // Wallet subtle floating animation
        walletGroup.rotation.y = Math.sin(Date.now() * 0.001) * 0.2;
        walletGroup.rotation.x = Math.sin(Date.now() * 0.0008) * 0.1;
        walletGroup.position.y = Math.sin(Date.now() * 0.0015) * 0.1;

        // Particles movement
        particlesMesh.rotation.x += 0.0002;
        particlesMesh.rotation.y += 0.0005;

        renderer.render(scene, camera);
      };

      animate();

      // Handle resize
      const handleResize = () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      };

      window.addEventListener("resize", handleResize);

      // Cleanup on unmount
      return () => {
        window.removeEventListener("resize", handleResize);
        if (container && renderer.domElement) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    }, [controls]);

    return (
      <section
        ref={ref}
        className="relative py-16 md:py-24 overflow-hidden border-b border-border/40"
      >
        {/* Command Card - positioned absolutely */}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={controls}
            transition={{ duration: 0.7 }}
            className="flex flex-col max-w-lg"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <SpaceButton text="INTELIQ" />
            </motion.div>

            <div className="relative">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                <span className="gradient-text">Speak</span> to Your{" "}
                <span className="gradient-text">Crypto</span>
              </h1>
              
              <div className="absolute right-[-550px] top-[-130px] md:right-[-550px] md:top-[-130px] lg:right-[-600px] lg:top-[-120px] transform scale-115 md:scale-130 lg:scale-150">
                <Card />
              </div>
            </div>

            <p className="text-lg text-muted-foreground mb-8">
              Experience a natural language interface to your Solana wallet. No
              more complex DEX interfaces or crypto jargon—just tell the AI
              what you want to do.
            </p>
                

            <div className="flex flex-col sm:flex-row gap-4">
              {!walletConnected ? (
                <WalletButton />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-6 py-3 rounded-lg bg-primary text-primary-foreground"
                >
                  Connected: {publicKey?.toString().slice(0, 4)}...
                  {publicKey?.toString().slice(-4)}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                onClick={() =>
                  document
                    .getElementById("chat")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Try the AI Assistant
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative aspect-square max-w-md mx-auto"
          >
            {/* 3D Wallet Visualization or Fallback */}
            {!threeLoaded ? (
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <div className="wallet-fallback-animation">
                  <div className="wallet-outer"></div>
                  <div className="wallet-inner"></div>
                  <div className="wallet-logo"></div>
                </div>
              </div>
            ) : (
              <div ref={canvasRef} className="w-full h-full"></div>
            )}
          </motion.div>
        </div>

        {/* Circular highlight behind the 3D element */}
        <div className="absolute right-1/4 top-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10"></div>
      </section>
    );
  }
);

HeroSection.displayName = "HeroSection";
