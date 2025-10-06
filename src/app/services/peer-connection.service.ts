import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import Peer, { MediaConnection } from 'peerjs';
import { AuthService } from './auth.service';

export interface PeerConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  peerId: string | null;
  status: string;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PeerConnectionService {
  private peer: Peer | null = null;
  private connectionStateSubject = new BehaviorSubject<PeerConnectionState>({
    isConnected: false,
    isConnecting: false,
    peerId: null,
    status: 'Disconnected',
    error: null
  });

  public connectionState$: Observable<PeerConnectionState> = this.connectionStateSubject.asObservable();

  constructor(private authService: AuthService) {}

  /**
   * Get current connection state
   */
  getCurrentState(): PeerConnectionState {
    return this.connectionStateSubject.value;
  }

  /**
   * Get the current peer instance
   */
  getPeer(): Peer | null {
    return this.peer;
  }

  /**
   * Connect to PeerJS server
   */
  async connect(): Promise<void> {
    if (this.peer && !this.peer.destroyed) {
      console.log('🎥 Already connected to peer server');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.updateState({
        isConnected: false,
        isConnecting: false,
        peerId: null,
        status: 'Error',
        error: 'User not authenticated'
      });
      return;
    }

    this.updateState({
      isConnected: false,
      isConnecting: true,
      peerId: null,
      status: 'Connecting...',
      error: null
    });

    try {
      // Create consistent peer ID based on user ID and session
      let sessionId = sessionStorage.getItem('peerSessionId');
      if (!sessionId) {
        sessionId = Date.now().toString().slice(-6);
        sessionStorage.setItem('peerSessionId', sessionId);
      }
      
      const peerId = `${currentUser.id}_${sessionId}`;

      console.log('🎥 Connecting to peer server with ID:', peerId);

      this.peer = new Peer(peerId, {
        host: 'localhost',
        port: 9000,
        path: '/peerjs',
        debug: 2,
        config: {
          'iceServers': [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      this.setupPeerEvents();

    } catch (error) {
      console.error('Failed to connect to peer server:', error);
      this.updateState({
        isConnected: false,
        isConnecting: false,
        peerId: null,
        status: 'Error',
        error: 'Failed to connect to peer server'
      });
    }
  }

  /**
   * Disconnect from PeerJS server
   */
  disconnect(): void {
    if (this.peer) {
      if (!this.peer.destroyed) {
        this.peer.destroy();
      }
      this.peer = null;
    }

    this.updateState({
      isConnected: false,
      isConnecting: false,
      peerId: null,
      status: 'Disconnected',
      error: null
    });

    console.log('🎥 Disconnected from peer server');
  }

  /**
   * Reset peer connection (clear session and reconnect)
   */
  async reset(): Promise<void> {
    console.log('🔄 Resetting peer connection...');
    
    // Disconnect current peer
    this.disconnect();
    
    // Clear session storage to force new peer ID
    sessionStorage.removeItem('peerSessionId');
    
    // Wait a moment before reconnecting
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  /**
   * Copy peer ID to clipboard
   */
  async copyPeerId(): Promise<boolean> {
    const state = this.getCurrentState();
    if (!state.peerId) {
      return false;
    }

    try {
      await navigator.clipboard.writeText(state.peerId);
      console.log('📋 Peer ID copied to clipboard:', state.peerId);
      return true;
    } catch (error) {
      console.error('Failed to copy peer ID:', error);
      return false;
    }
  }

  /**
   * Set up PeerJS event listeners
   */
  private setupPeerEvents(): void {
    if (!this.peer) return;

    this.peer.on('open', (id) => {
      console.log('🎥 Peer connected with ID:', id);
      this.updateState({
        isConnected: true,
        isConnecting: false,
        peerId: id,
        status: 'Connected',
        error: null
      });
    });

    this.peer.on('error', (error) => {
      console.error('Peer error:', error);
      let errorMessage = 'Connection error';
      
      switch (error.type) {
        case 'peer-unavailable':
          errorMessage = 'Peer not available';
          break;
        case 'network':
          errorMessage = 'Network error';
          break;
        case 'server-error':
          errorMessage = 'Server error';
          break;
        case 'socket-error':
          errorMessage = 'Connection failed';
          break;
        case 'socket-closed':
          errorMessage = 'Connection closed';
          break;
        default:
          if (error.message && error.message.includes('ID') && error.message.includes('taken')) {
            // Handle "ID is taken" error by generating a new ID
            console.log('🔄 Peer ID is taken, generating new one...');
            this.handleIdTaken();
            return; // Don't show error message, just retry
          }
          errorMessage = `Connection error: ${error.message}`;
      }
      
      this.updateState({
        isConnected: false,
        isConnecting: false,
        peerId: null,
        status: 'Error',
        error: errorMessage
      });
    });

    this.peer.on('disconnected', () => {
      console.log('🔌 Peer disconnected - attempting to reconnect...');
      this.updateState({
        isConnected: false,
        isConnecting: true,
        peerId: this.getCurrentState().peerId,
        status: 'Reconnecting...',
        error: null
      });
      
      // Attempt to reconnect
      if (this.peer && !this.peer.destroyed) {
        this.peer.reconnect();
      }
    });

    this.peer.on('close', () => {
      console.log('🔌 Peer connection closed');
      this.updateState({
        isConnected: false,
        isConnecting: false,
        peerId: null,
        status: 'Disconnected',
        error: null
      });
    });
  }

  /**
   * Handle the case when the current Peer ID is already taken
   */
  private async handleIdTaken(): Promise<void> {
    console.log('🔄 Handling peer ID conflict...');
    
    // Clean up current peer
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    
    // Generate a new session ID with additional randomness
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;
    
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 8);
    const newSessionId = `${timestamp}_${random}`;
    
    // Update session storage with new ID
    sessionStorage.setItem('peerSessionId', newSessionId);
    
    console.log('🔄 Generated new session ID:', newSessionId);
    
    // Wait a moment before reconnecting
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  /**
   * Update connection state and notify subscribers
   */
  private updateState(newState: Partial<PeerConnectionState>): void {
    const currentState = this.connectionStateSubject.value;
    const updatedState = { ...currentState, ...newState };
    this.connectionStateSubject.next(updatedState);
  }
}
