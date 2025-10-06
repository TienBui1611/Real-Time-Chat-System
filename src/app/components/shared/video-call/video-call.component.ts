import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Peer, { MediaConnection } from 'peerjs';
import { AuthService } from '../../../services/auth.service';
import { SocketService } from '../../../services/socket.service';
import { PeerConnectionService, PeerConnectionState } from '../../../services/peer-connection.service';

export interface VideoCallUser {
  id: string;
  username: string;
  peerId?: string;
}

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.css']
})
export class VideoCallComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;
  
  @Input() channelId!: string;
  @Input() isVisible = false;
  @Output() callEnded = new EventEmitter<void>();
  @Output() callError = new EventEmitter<string>();

  // Use shared peer connection
  peerConnectionState: PeerConnectionState = {
    isConnected: false,
    isConnecting: false,
    peerId: null,
    status: 'Disconnected',
    error: null
  };

  localStream: MediaStream | null = null;
  remoteStream: MediaStream | null = null;
  currentCall: MediaConnection | null = null;
  
  isInitiating = false;
  isConnected = false;
  isVideoEnabled = true;
  errorMessage: string = '';
  
  // Call participants
  targetPeerId: string = '';

  constructor(
    private authService: AuthService,
    private socketService: SocketService,
    public peerConnectionService: PeerConnectionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to peer connection state
    this.peerConnectionService.connectionState$.subscribe(
      (state: PeerConnectionState) => {
        this.peerConnectionState = state;
        this.cdr.detectChanges();
      }
    );

    if (this.isVisible) {
      this.startLocalStream();
      this.setupPeerCallListeners();
    }
  }

  ngOnChanges(): void {
    if (this.isVisible && this.peerConnectionState.isConnected) {
      this.startLocalStream();
      this.setupPeerCallListeners();
    } else if (!this.isVisible) {
      this.softCleanup();
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  /**
   * Set up call listeners on the shared peer
   */
  private setupPeerCallListeners(): void {
    const peer = this.peerConnectionService.getPeer();
    if (!peer) {
      console.warn('No peer available for video call');
      return;
    }

    // Listen for incoming calls
    peer.on('call', (call) => {
      console.log('📞 Incoming call from:', call.peer);
      this.handleIncomingCall(call);
    });
  }

  /**
   * Start local video stream
   */
  async startLocalStream(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true // Keep audio for the call, just don't show mic toggle
      });

      if (this.localVideo && this.localVideo.nativeElement) {
        this.localVideo.nativeElement.srcObject = this.localStream;
        this.localVideo.nativeElement.muted = true; // Prevent echo
      }

      console.log('📹 Local stream started');
    } catch (error) {
      console.error('Failed to get local stream:', error);
      this.callError.emit('Failed to access camera/microphone');
    }
  }

  /**
   * Initiate a video call
   */
  async initiateCall(targetPeerId: string): Promise<void> {
    const peer = this.peerConnectionService.getPeer();
    if (!peer || !targetPeerId) {
      this.errorMessage = 'No peer connection available or invalid target';
      return;
    }

    // Clean the target peer ID (remove any whitespace)
    targetPeerId = targetPeerId.trim();
    
    if (!targetPeerId) {
      this.errorMessage = 'Please enter a valid Peer ID';
      return;
    }

    console.log('🔄 Attempting to call peer:', targetPeerId);
    console.log('🔄 My peer ID:', this.peerConnectionState.peerId);

    try {
      this.isInitiating = true;
      this.errorMessage = ''; // Clear any previous errors

      // Ensure we have local stream
      if (!this.localStream) {
        console.log('🎥 Starting local stream for call...');
        await this.startLocalStream();
      }

      if (!this.localStream) {
        throw new Error('Failed to get local media stream');
      }

      console.log('📞 Making call to:', targetPeerId);
      
      // Make the call
      this.currentCall = peer.call(targetPeerId, this.localStream);
      
      if (!this.currentCall) {
        throw new Error('Failed to create call');
      }

      this.setupCallEvents(this.currentCall);

      // Set a timeout for the call attempt
      setTimeout(() => {
        if (this.isInitiating && !this.isConnected) {
          this.errorMessage = 'Call timeout. The other user may not be available or may have closed their video call window.';
          this.isInitiating = false;
        }
      }, 15000); // 15 second timeout

    } catch (error) {
      console.error('Failed to initiate call:', error);
      this.errorMessage = `Failed to start call: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.isInitiating = false;
    }
  }

  /**
   * Handle incoming call
   */
  private async handleIncomingCall(call: MediaConnection): Promise<void> {
    try {
      // Start local stream if not already started
      if (!this.localStream) {
        await this.startLocalStream();
      }

      // Answer the call
      call.answer(this.localStream!);
      this.currentCall = call;
      this.setupCallEvents(call);

      console.log('📞 Answered call from:', call.peer);

    } catch (error) {
      console.error('Failed to answer call:', error);
      this.callError.emit('Failed to answer call');
    }
  }

  /**
   * Set up call event listeners
   */
  private setupCallEvents(call: MediaConnection): void {
    call.on('stream', (remoteStream) => {
      console.log('📺 Received remote stream');
      this.remoteStream = remoteStream;
      
      if (this.remoteVideo && this.remoteVideo.nativeElement) {
        this.remoteVideo.nativeElement.srcObject = remoteStream;
      }
      
      this.isConnected = true;
      this.isInitiating = false;
    });

    call.on('close', () => {
      console.log('📞 Call ended');
      this.endCall();
    });

    call.on('error', (error) => {
      console.error('Call error:', error);
      this.callError.emit(`Call error: ${error.message}`);
      this.endCall();
    });
  }

  /**
   * Toggle video on/off
   */
  toggleVideo(): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.isVideoEnabled = videoTrack.enabled;
      }
    }
  }

  /**
   * End the current call
   */
  endCall(): void {
    this.isConnected = false;
    this.isInitiating = false;

    // Close the current call
    if (this.currentCall) {
      this.currentCall.close();
      this.currentCall = null;
    }

    // Stop remote stream
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    // Clear remote video
    if (this.remoteVideo && this.remoteVideo.nativeElement) {
      this.remoteVideo.nativeElement.srcObject = null;
    }

    this.callEnded.emit();
    console.log('📞 Call ended');
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorMessage = '';
  }

  /**
   * Close video call modal and cleanup
   */
  closeVideoCall(): void {
    this.softCleanup();
    this.callEnded.emit();
  }

  /**
   * Soft cleanup - stops streams and calls but keeps peer alive
   */
  private softCleanup(): void {
    console.log('🧹 Soft cleanup - keeping peer alive...');
    
    // Clear error messages
    this.errorMessage = '';
    
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log('🎥 Stopped local track:', track.kind);
      });
      this.localStream = null;
    }

    // Stop remote stream
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => {
        track.stop();
        console.log('📺 Stopped remote track:', track.kind);
      });
      this.remoteStream = null;
    }

    // Close current call
    if (this.currentCall) {
      this.currentCall.close();
      this.currentCall = null;
      console.log('📞 Closed current call');
    }

    // Reset state
    this.isConnected = false;
    this.isInitiating = false;
    
    console.log('✅ Soft cleanup completed - peer kept alive');
  }

  /**
   * Cleanup all resources
   */
  private cleanup(): void {
    console.log('🧹 Cleaning up video call resources...');
    
    this.softCleanup();
    
    console.log('✅ Cleanup completed');
  }
}
