import React, { useState, useEffect, useRef } from 'react';
import { Box, Input, Button, VStack, Text, Flex } from '@chakra-ui/react';
import useTransactionDetection from '../hooks/useTransactionDetection';
import TransactionConfirmModal from './TransactionConfirmModal';
import TransactionStatusMessage from './TransactionStatusMessage';
import { detectSolanaAddress } from '../utils/walletAddressUtils';

const AIAssistant = ({ /* ...existing props */ }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  
  const {
    detectTransaction,
    isConfirmModalOpen,
    closeConfirmModal,
    confirmTransaction,
    transactionDetails,
    isProcessing,
    transactionStatus,
    resetTransactionStatus,
  } = useTransactionDetection();

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const newMessage = {
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInput('');
    
    // Try to detect if this is a transaction request
    const isTransaction = detectTransaction(input);
    
    if (!isTransaction) {
      // If not a transaction request, process with regular AI assistant
      
      // Check if the message contains a Solana address
      const address = detectSolanaAddress(input);
      if (address) {
        // Add a message from the assistant about the detected address
        const aiResponse = {
          text: `I've detected a Solana wallet address: ${address}. If you'd like to send funds to this address, just let me know the amount and token (e.g., "Send 1 SOL to this address").`,
          sender: 'ai',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiResponse]);
        return;
      }
      
      // Continue with regular AI processing
      // ...
    }
  };

  return (
    <>
      <VStack spacing={4} align="stretch" h="100%">
        {/* Transaction status message */}
        {transactionStatus && (
          <TransactionStatusMessage
            status={transactionStatus.status}
            message={transactionStatus.message}
            signature={transactionStatus.signature}
            explorerUrl={transactionStatus.explorerUrl}
            onClose={resetTransactionStatus}
          />
        )}
        
        {/* Messages container */}
        <Box 
          flex="1" 
          overflowY="auto" 
          p={4} 
          borderRadius="md"
          bg="gray.800"
        >
          {/* Render messages */}
          {messages.map((message, index) => (
            <Text key={index} color={message.sender === 'user' ? 'white' : 'blue.300'}>
              {message.text}
            </Text>
          ))}
        </Box>
        
        {/* Input area */}
        <Flex>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about crypto..."
            size="lg"
            mr={2}
          />
          <Button 
            onClick={handleSendMessage} 
            colorScheme="blue"
            size="lg"
          >
            Send
          </Button>
        </Flex>
      </VStack>
      
      {/* Transaction confirmation modal */}
      <TransactionConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmModal}
        transactionDetails={transactionDetails}
        onConfirm={confirmTransaction}
        isLoading={isProcessing}
      />
    </>
  );
};

export default AIAssistant;