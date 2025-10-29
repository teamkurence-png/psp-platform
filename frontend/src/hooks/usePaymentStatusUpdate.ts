import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentRequestService } from '../services';
import { PaymentRequestStatus } from '../types';

/**
 * Custom hook for updating payment request status
 * Provides mutations for admins to update status of any payment request
 */
export const usePaymentStatusUpdate = () => {
  const queryClient = useQueryClient();

  /**
   * Update payment request status mutation
   * Used for bank wire payments and pending PSP payment rejections
   */
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PaymentRequestStatus }) => {
      return paymentRequestService.updateStatus(id, status);
    },
    onSuccess: (_, variables) => {
      // Invalidate both PSP and bank payment queries since this is generic
      queryClient.invalidateQueries({ queryKey: ['psp-payments'] });
      queryClient.invalidateQueries({ queryKey: ['bank-payment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['payment-request', variables.id] });
    },
    onError: (error: any) => {
      console.error('Update payment status error:', error);
      throw error;
    },
  });

  const updateStatus = (id: string, status: PaymentRequestStatus) => {
    return updateStatusMutation.mutateAsync({ id, status });
  };

  return {
    updateStatus,
    isUpdating: updateStatusMutation.isPending,
    updateError: updateStatusMutation.error,
  };
};

