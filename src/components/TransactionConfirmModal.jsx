import React from 'react';
import { 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalFooter, 
  ModalBody, 
  ModalCloseButton,
  Button, 
  Text, 
  VStack, 
  HStack, 
  Flex, 
  Divider,
  useToast 
} from '@chakra-ui/react';
import { isValidSolanaAddress } from '../utils/walletAddressUtils';

const TransactionConfirmModal = ({ 
  isOpen, 
  onClose, 
  transactionDetails, 
  onConfirm, 
  isLoading 
}) => {
  const toast = useToast();
  
  if (!transactionDetails) return null;
  
  const { address, amount, token, balance } = transactionDetails;
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const isValid = isValidSolanaAddress(address);
  const hasEnoughBalance = balance >= amount;

  const handleConfirm = () => {
    if (!isValid) {
      toast({
        title: "Invalid address",
        description: "The wallet address is not valid",
        status: "error",
        duration: 5000,
      });
      return;
    }

    if (!hasEnoughBalance) {
      toast({
        title: "Insufficient balance",
        description: `You need at least ${amount} ${token} but have ${balance.toFixed(4)}`,
        status: "error",
        duration: 5000,
      });
      return;
    }

    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent borderRadius="xl" bg="gray.800" color="white">
        <ModalHeader borderBottomWidth="1px" borderColor="gray.700">
          Confirm Transaction
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody py={6}>
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between">
              <Text color="gray.400">Sending</Text>
              <Text fontWeight="bold" fontSize="xl">
                {amount} {token}
              </Text>
            </Flex>
            
            <Divider borderColor="gray.700" />
            
            <Flex justify="space-between">
              <Text color="gray.400">To</Text>
              <Text 
                maxWidth="200px" 
                overflow="hidden" 
                textOverflow="ellipsis" 
                title={address}
              >
                {shortAddress}
              </Text>
            </Flex>
            
            <Divider borderColor="gray.700" />
            
            <Flex justify="space-between">
              <Text color="gray.400">Your balance</Text>
              <Text color={hasEnoughBalance ? "green.400" : "red.400"}>
                {balance?.toFixed(4) || '0'} {token}
              </Text>
            </Flex>
            
            {!hasEnoughBalance && (
              <Text color="red.400" fontSize="sm">
                Insufficient balance for this transaction
              </Text>
            )}
            
            {!isValid && (
              <Text color="red.400" fontSize="sm">
                Invalid wallet address
              </Text>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor="gray.700">
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleConfirm}
            isLoading={isLoading}
            loadingText="Processing"
            isDisabled={!isValid || !hasEnoughBalance}
          >
            Confirm & Send
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TransactionConfirmModal;
