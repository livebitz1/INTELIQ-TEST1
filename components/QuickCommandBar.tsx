"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Command, Search, History, 
  X, ChevronRight, ArrowRight, 
  Check, Copy, Sparkles, 
  ArrowRightLeft, DollarSign, 
  BarChart, List
} from "lucide-react";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";

// Custom keyboard hook to replace react-hotkeys-hook
function useKeyboardShortcut(
  keys: string | string[],
  callback: (e: KeyboardEvent) => void,
  options: { 
    enableOnFormTags?: boolean,
    enabled?: boolean
  } = {}
) {
  const { enableOnFormTags = false, enabled = true } = options;
  const keysToWatch = Array.isArray(keys) ? keys : [keys];
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    // Skip if target is form input and enableOnFormTags is false
    if (!enableOnFormTags) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
    }
    
    const key = e.key.toLowerCase();
    
    // Handle modifier key combinations
    if (keysToWatch.some(k => {
      if (k.includes('+')) {
        const parts = k.toLowerCase().split('+');
        const modifiers = {
          ctrl: e.ctrlKey,
          alt: e.altKey,
          shift: e.shiftKey,
          meta: e.metaKey
        };
        
        const mainKey = parts[parts.length - 1];
        const requiredMods = parts.slice(0, -1);
        
        const modifiersMatch = requiredMods.every(mod => {
          if (mod === 'ctrl') return modifiers.ctrl;
          if (mod === 'alt') return modifiers.alt;
          if (mod === 'shift') return modifiers.shift;
          if (mod === 'meta') return modifiers.meta;
          return false;
        });
        
        return modifiersMatch && mainKey === key;
      }
      
      // Simple key match
      return k.toLowerCase() === key;
    })) {
      callback(e);
    }
  }, [keysToWatch, callback, enableOnFormTags, enabled]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

interface CommandItem {
  name: string;
  icon: React.ReactNode;
  command: string;
  description?: string;
  category: string;
  color: string;
  hotkey?: string;
  premium?: boolean;
}

interface QuickCommandBarProps {
  insertCommand?: (command: string) => void;
}

export function QuickCommandBar({ insertCommand }: QuickCommandBarProps) {
  // State management
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const commandsContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch recent commands from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRecents = localStorage.getItem('quickCommandBarRecents');
      if (savedRecents) {
        try {
          setRecentCommands(JSON.parse(savedRecents).slice(0, 3));
        } catch (e) {
          console.error("Error parsing recent commands:", e);
        }
      }
    }
  }, []);

  // Save recent commands to localStorage when updated
  useEffect(() => {
    if (recentCommands.length > 0) {
      localStorage.setItem('quickCommandBarRecents', JSON.stringify(recentCommands));
    }
  }, [recentCommands]);

  // Focus search input when search is shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Define categories
  const categories = [
    { id: "wallet", name: "Wallet", icon: <DollarSign className="w-4 h-4" /> },
    { id: "trading", name: "Trading", icon: <ArrowRightLeft className="w-4 h-4" /> },
    { id: "analytics", name: "Analytics", icon: <BarChart className="w-4 h-4" /> },
  ];

  // Define commands
  const allCommands: CommandItem[] = [
    { 
      name: "Check balance", 
      icon: <DollarSign className="w-5 h-5" />, 
      command: "What's my balance?", 
      description: "View your current holdings and balances",
      category: "wallet", 
      color: "from-blue-500/30 to-cyan-500/30",
    },
    { 
      name: "Send SOL", 
      icon: <ArrowRight className="w-5 h-5" />, 
      command: "Send 0.1 SOL to ", 
      description: "Transfer SOL to another wallet address",
      category: "wallet", 
      color: "from-purple-500/30 to-pink-500/30" 
    },
    { 
      name: "Swap tokens", 
      icon: <ArrowRightLeft className="w-5 h-5" />, 
      command: "Swap 0.5 SOL to USDC", 
      description: "Exchange between different tokens",
      category: "trading", 
      color: "from-green-500/30 to-emerald-500/30" 
    },
    { 
      name: "BTC price", 
      icon: <BarChart className="w-5 h-5" strokeWidth={1.5} />, 
      command: "Show me the current BTC price", 
      description: "Get the latest market movement overview",
      category: "analytics", 
      color: "from-orange-500/30 to-amber-500/30" 
    },
    { 
      name: "Transaction ", 
      icon: <History className="w-5 h-5" strokeWidth={1.5} />, 
      command: "Show my transaction history", 
      description: "View your recent wallet transactions",
      category: "wallet", 
      color: "from-indigo-500/30 to-violet-500/30",
    },
    { 
      name: "Portfolio", 
      icon: <Sparkles className="w-5 h-5" strokeWidth={1.5} />, 
      command: "How is my portfolio performing?", 
      description: "Get detailed portfolio performance stats",
      category: "analytics", 
      color: "from-rose-500/30 to-red-500/30",
      premium: true 
    },
  ];

  // Filter commands based on search query and selected category
  const filteredCommands = useMemo(() => {
    let filtered = allCommands;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        cmd => cmd.name.toLowerCase().includes(query) || 
               cmd.command.toLowerCase().includes(query) ||
               (cmd.description?.toLowerCase().includes(query))
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(cmd => cmd.category === selectedCategory);
    }
    
    return filtered;
  }, [allCommands, searchQuery, selectedCategory]);

  // Handle keyboard navigation using our custom hook
  useKeyboardShortcut('ctrl+k', (e) => {
    e.preventDefault();
    setShowSearch(prev => !prev);
  }, { enableOnFormTags: true });

  useKeyboardShortcut('escape', () => {
    if (showSearch) {
      setShowSearch(false);
      setSearchQuery("");
    } else if (expanded) {
      setExpanded(false);
    }
  }, { enableOnFormTags: true });

  useKeyboardShortcut('', () => {
    handleInsertCommand(allCommands.find(cmd => cmd.name === "Check balance")?.command || "");
  }, { enableOnFormTags: false });

  useKeyboardShortcut('', () => {
    handleInsertCommand(allCommands.find(cmd => cmd.name === "Transaction history")?.command || "");
  }, { enableOnFormTags: false });

  useKeyboardShortcut(['arrowup', 'arrowdown'], (e) => {
    if (!filteredCommands.length || activeIndex === null) return;
    
    e.preventDefault();
    if (e.key.toLowerCase() === 'arrowup') {
      setActiveIndex((prev) => (prev === null || prev <= 0) ? filteredCommands.length - 1 : prev - 1);
    } else {
      setActiveIndex((prev) => (prev === null || prev >= filteredCommands.length - 1) ? 0 : prev + 1);
    }
  }, { 
    enableOnFormTags: true, 
    enabled: showSearch || expanded 
  });

  useKeyboardShortcut('enter', () => {
    if (activeIndex !== null && filteredCommands[activeIndex]) {
      handleInsertCommand(filteredCommands[activeIndex].command);
      setShowSearch(false);
    }
  }, { 
    enableOnFormTags: true, 
    enabled: showSearch && activeIndex !== null 
  });

  // Scroll active command into view
  useEffect(() => {
    if (activeIndex !== null && commandsContainerRef.current) {
      const activeElement = commandsContainerRef.current.children[activeIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [activeIndex]);

  // Handle command insertion
  const handleInsertCommand = (command: string) => {
    // Add to recent commands
    setRecentCommands(prev => {
      const newRecents = [command, ...prev.filter(cmd => cmd !== command)].slice(0, 5);
      return newRecents;
    });

    // If insertCommand prop is provided, use it
    if (insertCommand) {
      insertCommand(command);
      return;
    }
    
    // Otherwise use the default implementation
    const chatInput = document.querySelector('textarea[placeholder*="Ask"]') as HTMLTextAreaElement;
    if (chatInput) {
      chatInput.value = command;
      chatInput.focus();
      
      const event = new Event('input', { bubbles: true });
      chatInput.dispatchEvent(event);
      
      // Scroll to chat interface
      document.querySelector(".chat-interface")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle copy command
  const handleCopy = (command: string, index: number) => {
    navigator.clipboard.writeText(command);
    setCopiedIndex(index);
    
    // Reset the copied state after 1.5 seconds
    setTimeout(() => {
      setCopiedIndex(null);
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full mt-6 mb-12 relative"
    >
      {/* Glass background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-background/80 to-primary/5 rounded-xl backdrop-blur-[2px] border border-border/40 shadow-lg"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          {/* Header with title */}
          <div className="flex items-center gap-2">
            <Command className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium">AI Commands</h3>
            <div className="hidden md:flex items-center ml-4">
              <kbd className="px-1.5 py-0.5 rounded bg-muted/70 border border-border/50 text-xs font-mono">Ctrl+K</kbd>
              <span className="text-xs text-muted-foreground ml-1.5">to search</span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-1.5 rounded-md hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Search commands"
            >
              <Search className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-md hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
              aria-label={expanded ? "Show less" : "Show more"}
            >
              {expanded ? <X className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Search panel */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-b border-border/30"
            >
              <div className="p-4 bg-muted/30">
                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search commands..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-md bg-background/70 border border-border/40 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                </div>
                
                {/* Search results */}
                <div 
                  ref={commandsContainerRef}
                  className="mt-3 max-h-[300px] overflow-y-auto custom-scrollbar"
                >
                  {filteredCommands.length > 0 ? (
                    filteredCommands.map((cmd, i) => (
                      <div
                        key={cmd.name}
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors mb-1 ${
                          activeIndex === i ? 'bg-primary/10' : 'hover:bg-muted/70'
                        }`}
                        onClick={() => handleInsertCommand(cmd.command)}
                        onMouseEnter={() => setActiveIndex(i)}
                      >
                        <div className={`w-8 h-8 flex items-center justify-center rounded-md bg-gradient-to-br ${cmd.color}`}>
                          {cmd.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium flex items-center">
                            {cmd.name}
                            {cmd.premium && (
                              <span className="ml-2 px-1.5 py-0.5 text-[10px] uppercase font-semibold rounded-sm bg-primary/20 text-primary">
                                Pro
                              </span>
                            )}
                          </div>
                          {cmd.description && (
                            <div className="text-xs text-muted-foreground truncate">{cmd.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {cmd.hotkey && (
                            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-muted-foreground/20 text-xs hidden md:inline-block">
                              {cmd.hotkey}
                            </kbd>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(cmd.command, i);
                            }}
                            className="p-1 rounded hover:bg-muted transition-colors"
                            aria-label="Copy command"
                          >
                            {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <div className="mb-2">No commands found</div>
                      <div className="text-sm">Try a different search term</div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category filter tabs */}
        <div className={`${expanded ? 'border-b border-border/30' : ''}`}>
          <div className="px-4 pt-3 pb-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-2.5 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
                selectedCategory === null 
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              All commands
            </button>
            
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(prev => prev === category.id ? null : category.id)}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-primary/15 text-primary font-medium'
                    : 'hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                {category.icon}
                {category.name}
              </button>
            ))}

            {recentCommands.length > 0 && (
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setExpanded(true);
                }}
                className="px-2.5 py-1 text-xs rounded-full transition-colors flex items-center gap-1.5 hover:bg-muted/80 text-muted-foreground whitespace-nowrap ml-auto"
              >
                <History className="w-3.5 h-3.5" />
                Recent
              </button>
            )}
          </div>
        </div>
        
        {/* Commands carousel/grid */}
        <AnimatePresence>
          <motion.div 
            initial={false}
            animate={{ 
              height: expanded ? 'auto' : 'auto', 
              opacity: 1 
            }}
            className={`overflow-hidden`}
          >
            {expanded ? (
              // Grid layout when expanded
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredCommands.map((cmd, i) => (
                  <CommandCard
                    key={cmd.name}
                    command={cmd}
                    index={i}
                    copiedIndex={copiedIndex}
                    handleInsertCommand={handleInsertCommand}
                    handleCopy={handleCopy}
                  />
                ))}
                
                {/* Recent commands section when expanded */}
                {recentCommands.length > 0 && selectedCategory === null && (
                  <div className="col-span-full mt-4">
                    <div className="flex items-center mb-3">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                        <History className="w-3.5 h-3.5 mr-1.5" />
                        Recent Commands
                      </h4>
                      <div className="ml-auto">
                        <button 
                          onClick={() => {
                            setRecentCommands([]);
                            localStorage.removeItem('quickCommandBarRecents');
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Clear history
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {recentCommands.map((cmd, i) => {
                        const foundCommand = allCommands.find(c => c.command === cmd);
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted/60 cursor-pointer transition-colors"
                            onClick={() => handleInsertCommand(cmd)}
                          >
                            <div className="flex items-center gap-2">
                              <History className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-sm">
                                {foundCommand?.name || cmd}
                              </span>
                            </div>
                            <div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(cmd, i + 100); // Offset index to avoid collision
                                }}
                                className="p-1 rounded hover:bg-muted transition-colors"
                              >
                                {copiedIndex === i + 100 ? 
                                  <Check className="w-3.5 h-3.5 text-green-500" /> : 
                                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                }
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Horizontal carousel when collapsed
              <div className="p-4 overflow-x-auto no-scrollbar">
                <div className="flex gap-3 pb-2">
                  {filteredCommands.map((cmd, i) => (
                    <CommandCard
                      key={cmd.name}
                      command={cmd}
                      index={i}
                      copiedIndex={copiedIndex}
                      handleInsertCommand={handleInsertCommand}
                      handleCopy={handleCopy}
                      carousel={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        
        {/* Footer with helpful info */}
        <div className="px-6 py-3 text-xs text-muted-foreground border-t border-border/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
            <span>Click to use • Hover to copy • Press </span>
            <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-xs inline-flex items-center justify-center min-w-[20px]">↓</kbd>
            <span>to expand</span>
          </div>
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {expanded ? "Show less" : "Show more"}
              <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Extracted Command Card component for reusability
function CommandCard({ 
  command, 
  index, 
  copiedIndex, 
  handleInsertCommand, 
  handleCopy, 
  carousel = false 
}: { 
  command: CommandItem; 
  index: number; 
  copiedIndex: number | null; 
  handleInsertCommand: (command: string) => void; 
  handleCopy: (command: string, index: number) => void;
  carousel?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: carousel ? 1.02 : 1.01, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={`rounded-lg border border-border/40 bg-gradient-to-br ${command.color} backdrop-blur-sm 
        relative overflow-hidden group cursor-pointer ${carousel ? 'flex-shrink-0 w-[180px] h-[100px]' : ''}`}
      onClick={() => handleInsertCommand(command.command)}
      tabIndex={0}
      role="button"
      aria-label={`Execute command: ${command.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleInsertCommand(command.command);
        }
      }}
    >
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="flex items-center justify-center w-8 h-8 rounded-md bg-muted/30 backdrop-blur-sm">
              {command.icon}
            </span>
            <h4 className="font-medium text-sm mt-2 flex items-center gap-1">
              {command.name}
              {command.premium && (
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-primary/30">
                  <Sparkles className="w-2 h-2 text-primary" /> 
                </span>
              )}
            </h4>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <motion.button
              initial={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
              className="p-1.5 rounded-full bg-muted/30 backdrop-blur-sm hover:bg-muted/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(command.command, index);
              }}
              aria-label="Copy command"
            >
              {copiedIndex === index ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </motion.button>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground line-clamp-1 group-hover:line-clamp-none transition-all bg-background/60 backdrop-blur-sm px-2 py-1 rounded-sm">
          {command.command}
        </div>
        
        {/* Hotkey tooltip that appears on hover */}
        {command.hotkey && (
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] bg-muted/70 backdrop-blur-sm px-1.5 py-0.5 rounded">
              {command.hotkey}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Add this CSS to your globals.css file
/*
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(var(--muted-foreground), 0.3);
  border-radius: 100px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(var(--muted-foreground), 0.5);
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
*/
