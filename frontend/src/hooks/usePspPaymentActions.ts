import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pspPaymentService } from '../services/pspPaymentService';

/**
 * Custom hook for PSP payment admin actions
 * Provides mutations for reviewing and managing PSP card payments
 */
export const usePspPaymentActions = () => {
  const queryClient = useQueryClient();

  /**
   * Review PSP payment mutation
   * Used by admins to approve, reject, or request verification for submitted card payments
   */
  const reviewMutation = useMutation({
    mutationFn: async ({ 
      submissionId, 
      decision 
    }: { 
      submissionId: string; 
      decision: 'processed' | 'processed_awaiting_exchange' | 'rejected' | 'insufficient_funds' | 'failed' | 'awaiting_3d_sms' | 'awaiting_3d_push' 
    }) => {
      return pspPaymentService.reviewPspPayment(submissionId, decision);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psp-payments'] });
    },
    onError: (error: any) => {
      console.error('Review PSP payment error:', error);
      throw error;
    },
  });

  const reviewPayment = (
    submissionId: string, 
    decision: 'processed' | 'processed_awaiting_exchange' | 'rejected' | 'insufficient_funds' | 'failed' | 'awaiting_3d_sms' | 'awaiting_3d_push'
  ) => {
    return reviewMutation.mutateAsync({ submissionId, decision });
  };

  return {
    reviewPayment,
    isReviewing: reviewMutation.isPending,
    reviewError: reviewMutation.error,
  };
};

