/**
 * Utility functions for handling blockchain transactions gracefully
 */

/**
 * Checks if an error is a user rejection
 */
export function isUserRejection(error: any): boolean {
  const message = error?.message?.toLowerCase() || '';
  return (
    message.includes('user rejected') ||
    message.includes('user denied') ||
    message.includes('user cancelled') ||
    message.includes('rejected by user')
  );
}

/**
 * Gets a user-friendly error message for transaction errors
 */
export function getTransactionErrorMessage(error: any): string {
  if (isUserRejection(error)) {
    return 'Transaction cancelled';
  }

  const message = error?.message?.toLowerCase() || '';

  if (message.includes('insufficient funds')) {
    return 'Insufficient funds for transaction';
  }

  if (message.includes('insufficient allowance')) {
    return 'Please approve tokens first';
  }

  if (message.includes('execution reverted')) {
    return 'Transaction failed. Please try again.';
  }

  if (message.includes('network') || message.includes('timeout')) {
    return 'Network error. Please try again.';
  }

  return 'Transaction failed. Please try again.';
}
