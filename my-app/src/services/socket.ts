import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

class SocketService {
    private socket: Socket | null = null;

    connect(): Socket {
        if (this.socket?.connected) {
            return this.socket;
        }

        this.socket = io(`${SOCKET_URL}/ws`, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
        });

        this.socket.on('connect', () => {
            console.log('✅ Socket.IO connected:', this.socket?.id);
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Socket.IO disconnected');
        });

        this.socket.on('welcome', (data) => {
            console.log('Welcome message:', data);
        });

        return this.socket;
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket(): Socket | null {
        return this.socket;
    }

    // Meeting room methods
    joinMeeting(meetingCode: string): void {
        if (this.socket) {
            this.socket.emit('join_meeting', { meeting_code: meetingCode });
        }
    }

    leaveMeeting(meetingCode: string): void {
        if (this.socket) {
            this.socket.emit('leave_meeting', { meeting_code: meetingCode });
        }
    }

    // Chat methods
    sendMessage(meetingCode: string, message: string): void {
        if (this.socket) {
            this.socket.emit('send_message', { meeting_code: meetingCode, message });
        }
    }

    onNewMessage(callback: (data: { sid: string; message: string }) => void): void {
        if (this.socket) {
            this.socket.on('new_message', callback);
        }
    }

    // WebRTC signaling methods
    sendWebRTCSignal(meetingCode: string, targetSid: string, signal: any): void {
        if (this.socket) {
            this.socket.emit('webrtc_signal', {
                meeting_code: meetingCode,
                target_sid: targetSid,
                signal,
            });
        }
    }

    onWebRTCSignal(callback: (data: { from_sid: string; signal: any }) => void): void {
        if (this.socket) {
            this.socket.on('webrtc_signal', callback);
        }
    }

    // User presence methods
    onUserJoined(callback: (data: { sid: string }) => void): void {
        if (this.socket) {
            this.socket.on('user_joined', callback);
        }
    }

    onUserLeft(callback: (data: { sid: string }) => void): void {
        if (this.socket) {
            this.socket.on('user_left', callback);
        }
    }

    // Generic event listener
    on(event: string, callback: (...args: any[]) => void): void {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    // Remove event listener
    off(event: string, callback?: (...args: any[]) => void): void {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }
}

export const socketService = new SocketService();
export default socketService;
