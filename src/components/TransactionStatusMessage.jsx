import React from 'react';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  Link,
  Box,
  Text
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';

const TransactionStatusMessage = ({ 
  status, 
  message, 
  signature, 
  explorerUrl,
  onClose
}) => {
  if (!status) return null;

  return (
    <Alert
      status={status}
      variant="solid"
      borderRadius="md"
      mb={4}
    >
      <AlertIcon />
      <Box flex="1">
        <AlertTitle>{status === 'success' ? 'Transaction Complete' : 'Transaction Failed'}</AlertTitle>
        <AlertDescription display="block">
          {message}
          
          {signature && explorerUrl && (
            <Link 
              href={explorerUrl} 
              isExternal 
              color="white" 
              textDecoration="underline"
              display="flex"
              alignItems="center"
              mt={2}
            >
              <Text fontSize="sm">View on Solana Explorer</Text>
              <ExternalLinkIcon mx={1} />
            </Link>
          )}
        </AlertDescription>
      </Box>
      <CloseButton 
        position="absolute" 
        right="8px" 
        top="8px" 
        onClick={onClose} 
      />
    </Alert>
  );
};

export default TransactionStatusMessage;
