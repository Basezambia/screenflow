// Dynamic imports for client-side only
import type SimplePeerType from 'simple-peer';

let Peer: typeof SimplePeerType | null = null;
let io: typeof import('socket.io-client').io | null = null;

if (typeof window !== 'undefined') {
  import('simple-peer').then((simplePeerModule) => {
    Peer = simplePeerModule.default;
  });
  
  import('socket.io-client').then((socketModule) => {
    io = socketModule.io;
  });
}

export class WebRTCService {
  private socket: ReturnType<typeof import('socket.io-client').io> | null = null;
  private peers: Map<string, import('simple-peer').Instance> = new Map();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private roomId: string | null = null;
  private userId: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeSocket();
    }
  }

  private async initializeSocket() {
    if (typeof window === 'undefined') return;
    
    try {
      // Check if socket.io server is available
      const response = await fetch('/api/socket');
      const data = await response.json();
      
      if (data.status === 'mock') {
        console.log('Socket.io server not available - running in local mode');
        return;
      }
      
      if (!io) {
        const { io: socketIo } = await import('socket.io-client');
        io = socketIo;
      }
      
      // In production, this would be your actual server URL
      this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true,
        autoConnect: false // Don't auto-connect to prevent errors
      });
      
      this.socket.on('connect', () => {
        console.log('Socket connected successfully');
      });
      
      this.socket.on('connect_error', () => {
        console.warn('Socket connection error - running in local mode');
        this.socket = null; // Disable socket to prevent further errors
      });
      
      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });
      
      this.socket.on('user-joined', this.handleUserJoined.bind(this));
      this.socket.on('user-left', this.handleUserLeft.bind(this));
      this.socket.on('signal', this.handleSignal.bind(this));
      this.socket.on('room-updated', this.handleRoomUpdated.bind(this));
      this.socket.on('chat-message', this.handleChatMessage.bind(this));
      this.socket.on('file-shared', this.handleFileShared.bind(this));

      this.socket.on('presentation-update', this.handlePresentationUpdate.bind(this));
      
      // Try to connect
      this.socket.connect();
      
    } catch {
      console.log('Socket.io not available - running in local mode');
      // Continue without socket.io - the app can still work with local features
    }
  }

  async joinRoom(roomId: string, userId: string, userInfo: { name: string; address: string; avatar?: string }) {
    this.roomId = roomId;
    this.userId = userId;
    
    if (this.socket) {
      this.socket.emit('join-room', { roomId, userId, userInfo });
    }
  }

  leaveRoom() {
    if (this.socket && this.roomId && this.userId) {
      this.socket.emit('leave-room', { roomId: this.roomId, userId: this.userId });
    }
    
    // Clean up peers
    this.peers.forEach(peer => peer.destroy());
    this.peers.clear();
    
    // Stop local streams
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
    
    this.roomId = null;
    this.userId = null;
  }

  async getMediaStream(video: boolean = true, audio: boolean = true): Promise<MediaStream | null> {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      console.error('Media devices not available');
      return null;
    }

    // Validate that at least one of audio or video is requested
    if (!video && !audio) {
      console.error('At least one of audio and video must be requested');
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 1280, height: 720 } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false
      });
      
      this.localStream = stream;
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      return null;
    }
  }

  async getScreenStream(includeAudio: boolean = false): Promise<MediaStream | null> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      console.error('Screen sharing not available');
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: includeAudio
      });
      
      this.screenStream = stream;
      
      // Handle screen share end
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopScreenShare();
      });
      
      return stream;
    } catch (error) {
      console.error('Error accessing screen:', error);
      return null;
    }
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
      
      // Notify peers about screen share stop
      this.peers.forEach(peer => {
        if (this.localStream) {
          peer.replaceTrack(
            peer.streams[0]?.getVideoTracks()[0],
            this.localStream.getVideoTracks()[0],
            peer.streams[0]
          );
        }
      });
      
      if (this.socket && this.roomId && this.userId) {
        this.socket.emit('screen-share-stopped', { 
          roomId: this.roomId, 
          userId: this.userId 
        });
      }
    }
  }

  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled;
      }
    }
    return false;
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return !videoTrack.enabled;
      }
    }
    return false;
  }

  private async handleUserJoined(data: { userId: string, userInfo: { name: string; address: string; avatar?: string } }) {
    if (data.userId === this.userId) return;
    
    if (!Peer) {
      const simplePeerModule = await import('simple-peer');
      Peer = simplePeerModule.default;
    }
    
    if (!Peer) {
      console.error('Peer not available');
      return;
    }
    
    // Create peer connection for new user
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: this.localStream || undefined
    });

    peer.on('signal', (signal: import('simple-peer').SignalData) => {
      if (this.socket) {
        this.socket.emit('signal', {
          to: data.userId,
          from: this.userId,
          signal,
          roomId: this.roomId
        });
      }
    });

    peer.on('stream', (stream: MediaStream) => {
      // Handle incoming stream
      this.onPeerStream?.(data.userId, stream);
    });

    peer.on('error', (error: Error) => {
      console.error('Peer error:', error);
    });

    this.peers.set(data.userId, peer);
  }

  private handleUserLeft(data: { userId: string }) {
    const peer = this.peers.get(data.userId);
    if (peer) {
      peer.destroy();
      this.peers.delete(data.userId);
    }
    
    this.onPeerLeft?.(data.userId);
  }

  private async handleSignal(data: { from: string, signal: import('simple-peer').SignalData }) {
    let peer = this.peers.get(data.from);
    
    if (!peer) {
      if (!Peer) {
        const simplePeerModule = await import('simple-peer');
        Peer = simplePeerModule.default;
      }
      
      if (!Peer) {
        console.error('Peer not available');
        return;
      }
      
      // Create peer connection for incoming signal
      peer = new Peer({
        initiator: false,
        trickle: false,
        stream: this.localStream || undefined
      });

      peer.on('signal', (signal: import('simple-peer').SignalData) => {
        if (this.socket) {
          this.socket.emit('signal', {
            to: data.from,
            from: this.userId,
            signal,
            roomId: this.roomId
          });
        }
      });

      peer.on('stream', (stream: MediaStream) => {
        this.onPeerStream?.(data.from, stream);
      });

      peer.on('error', (error: Error) => {
        console.error('Peer error:', error);
      });

      this.peers.set(data.from, peer);
    }
    
    if (peer) {
      peer.signal(data.signal);
    }
  }

  private handleRoomUpdated(data: unknown) {
    this.onRoomUpdated?.(data);
  }

  private handleChatMessage(data: {id: string, sender: string, message: string, timestamp: Date}) {
    this.onChatMessage?.(data);
  }

  private handleFileShared(data: {id: string, name: string, size: number, type: string, url: string, uploadedBy: string, timestamp: Date}) {
    this.onFileShared?.(data);
  }



  private handlePresentationUpdate(data: {id: string, slide: unknown, timestamp: Date}) {
    this.onPresentationUpdate?.(data);
  }

  // Methods to send collaboration data
  sendChatMessage(message: {id: string, sender: string, message: string, timestamp: Date}) {
    if (this.socket && this.roomId) {
      this.socket.emit('chat-message', { roomId: this.roomId, message });
    }
  }

  shareFile(file: {id: string, name: string, size: number, type: string, url: string, uploadedBy: string, timestamp: Date}) {
    if (this.socket && this.roomId) {
      this.socket.emit('file-shared', { roomId: this.roomId, file });
    }
  }



  updatePresentation(slide: {id: string, slide: unknown, timestamp: Date}) {
    if (this.socket && this.roomId) {
      this.socket.emit('presentation-update', { roomId: this.roomId, slide });
    }
  }

  // Event handlers (to be set by the consuming component)
  onPeerStream?: (userId: string, stream: MediaStream) => void;
  onPeerLeft?: (userId: string) => void;
  onRoomUpdated?: (data: unknown) => void;
  onChatMessage?: (data: {id: string, sender: string, message: string, timestamp: Date}) => void;
  onFileShared?: (data: {id: string, name: string, size: number, type: string, url: string, uploadedBy: string, timestamp: Date}) => void;

  onPresentationUpdate?: (data: {id: string, slide: unknown, timestamp: Date}) => void;

  disconnect() {
    this.leaveRoom();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const webrtcService = new WebRTCService();