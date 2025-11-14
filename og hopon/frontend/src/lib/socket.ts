// frontend/lib/socket.ts
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000';

class SocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.token = token;
    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.io connected');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket.io disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Event listeners
  onNotification(callback: (notification: any) => void) {
    this.socket?.on('notification', callback);
  }

  onEventUpdated(callback: (event: any) => void) {
    this.socket?.on('event_updated', callback);
  }

  onNewMessage(callback: (message: any) => void) {
    this.socket?.on('new_message', callback);
  }

  // Join/leave event rooms
  joinEventRoom(eventId: number) {
    this.socket?.emit('join_event', { event_id: eventId });
  }

  leaveEventRoom(eventId: number) {
    this.socket?.emit('leave_event', { event_id: eventId });
  }

  // Remove listeners
  offNotification() {
    this.socket?.off('notification');
  }

  offEventUpdated() {
    this.socket?.off('event_updated');
  }

  offNewMessage() {
    this.socket?.off('new_message');
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketClient = new SocketClient();
