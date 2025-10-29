import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

interface UseWebSocketOptions {
  userId?: string;
  token?: string;
  isAdmin?: boolean;
  onPspPaymentSubmitted?: (data: any) => void;
  onPspPaymentStatusUpdated?: (data: any) => void;
  onPaymentRequestStatusUpdated?: (data: any) => void;
  onPspVerificationRequested?: (data: any) => void;
  onPspVerificationCompleted?: (data: any) => void;
  onPspSmsResendRequested?: (data: any) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const socketRef = useRef<Socket | null>(null);
  const {
    userId,
    token,
    isAdmin,
    onPspPaymentSubmitted,
    onPspPaymentStatusUpdated,
    onPaymentRequestStatusUpdated,
    onPspVerificationRequested,
    onPspVerificationCompleted,
    onPspSmsResendRequested,
  } = options;

  useEffect(() => {
    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');

      // Join appropriate rooms
      if (userId) {
        socket.emit('join', userId);
      }

      if (isAdmin) {
        socket.emit('join_admin');
      }

      if (token) {
        socket.emit('join_psp_token', token);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Listen for PSP payment events
    if (onPspPaymentSubmitted) {
      socket.on('psp_payment_submitted', onPspPaymentSubmitted);
    }

    if (onPspPaymentStatusUpdated) {
      socket.on('psp_payment_status_updated', onPspPaymentStatusUpdated);
    }

    if (onPaymentRequestStatusUpdated) {
      socket.on('payment_request_status_updated', onPaymentRequestStatusUpdated);
    }

    if (onPspVerificationRequested) {
      socket.on('psp_verification_requested', onPspVerificationRequested);
    }

    if (onPspVerificationCompleted) {
      socket.on('psp_verification_completed', onPspVerificationCompleted);
    }

    if (onPspSmsResendRequested) {
      socket.on('psp_sms_resend_requested', onPspSmsResendRequested);
    }

    // Cleanup on unmount
    return () => {
      socket.off('psp_payment_submitted');
      socket.off('psp_payment_status_updated');
      socket.off('payment_request_status_updated');
      socket.off('psp_verification_requested');
      socket.off('psp_verification_completed');
      socket.off('psp_sms_resend_requested');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, token, isAdmin, onPspPaymentSubmitted, onPspPaymentStatusUpdated, onPaymentRequestStatusUpdated, onPspVerificationRequested, onPspVerificationCompleted, onPspSmsResendRequested]);

  return socketRef.current;
};

