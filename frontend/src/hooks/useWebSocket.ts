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

    // Cleanup on unmount
    return () => {
      socket.off('psp_payment_submitted');
      socket.off('psp_payment_status_updated');
      socket.off('payment_request_status_updated');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, token, isAdmin, onPspPaymentSubmitted, onPspPaymentStatusUpdated, onPaymentRequestStatusUpdated]);

  return socketRef.current;
};

