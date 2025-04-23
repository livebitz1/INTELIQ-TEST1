"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, AlertTriangle, X } from "lucide-react";

interface TransactionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isExecuting: boolean;
  transaction: {
    type: string;
    amount: number | string;
    token: string;
    recipient?: string;
    toToken?: string;
  };
}

export function TransactionConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isExecuting,
  transaction
}: TransactionConfirmationModalProps) {
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isExecuting) onClose();
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isExecuting, onClose]);
  
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;
  
  // Format the transaction description based on its type
  const getTransactionDescription = () => {
    if (transaction.type === "swap") {
      return `Swap ${transaction.amount} ${transaction.token} to ${transaction.toToken}`;
    } else if (transaction.type === "transfer") {
      return `Send ${transaction.amount} ${transaction.token} to ${transaction.recipient?.slice(0, 4)}...${transaction.recipient?.slice(-4)}`;
    }
    return `${transaction.type} ${transaction.amount} ${transaction.token}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-background w-full max-w-md rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <span className="p-1 rounded-full bg-amber-500/20">
              <AlertTriangle size={16} className="text-amber-500" />
            </span>
            Confirm Transaction
          </h3>
          <button 
            onClick={onClose} 
            disabled={isExecuting}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          You are about to execute the following transaction:
        </p>
        
        <div className="p-4 mt-2 border rounded-lg bg-muted/30">
          <p className="font-medium text-sm">{getTransactionDescription()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Make sure you trust this transaction before confirming.
          </p>
        </div>
        
        <div className="flex gap-2 justify-end mt-6">
          <Button
            variant="outline" 
            onClick={onClose} 
            disabled={isExecuting}
            className="px-4 py-2 border rounded-md"
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isExecuting}
            className="px-4 py-2 bg-primary text-white rounded-md flex items-center gap-2"
          >
            {isExecuting ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                Processing...
              </>
            ) : (
              <>
                <Check size={16} />
                Confirm
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
